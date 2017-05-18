/****
Author: Rohit Chaudhri
Creation Date: Jan 4th 2017
****/


console.log("Loading BCUManager.js");
/*No need of a BCU manager yet just defining BCU object*/


MapManager.BCU = function(parent) {

  var mapCacheAPI = null;
  var omm = null;
  var spaUtils = null;
  if (BRMAP.isTestHarness) {
    mapCacheAPI = RCMHarness;
    omm = RCMHarness;
    spaUtils = RCMHarness;
  } else {
    mapCacheAPI = MapCache;
    omm = OMM;
    omm.initOfflineMaps();
    spaUtils = SpatialUtils;
  }

  var censusMapObject = parent;
  var state;
  var county;
  var region; /*(calculated State + County)*/
  var bcuID;
  var tract;
  var workStatus;
  var latitude;
  var longitude;
  var pzInsKey;
  var pzInsKeyCase;

  var bcuGeoData = null;

  var bcuObjID = null;
  var bcuGeometry = null;
  var bcuFringeGeometry = null;

  var tableName = "BCU_90_SYNC";

  this.toString = function() {
    var str = "bcuID:" + bcuID + "\n";
    str += "state:" + state + "\n";
    str += "county:" + county + "\n";
    str += "region:" + region + "\n";
    str += "tract:" + tract + "\n";
    str += "workStatus:" + workStatus + "\n";
    str += "latitude:" + latitude + "\n";
    str += "longitude:" + longitude + "\n";
    str += "pzInsKey:" + pzInsKey + "\n";
    str += "pzInsKeyCase:" + pzInsKeyCase + "\n";   
    str += "bcuGeoData:" + JSON.stringify(bcuGeoData) + "\n";
    return str;
  };

  this.setAttributes = function(bcuAttrib) {
    state = bcuAttrib.state;
    county = bcuAttrib.county;
    region = bcuAttrib.region;
    bcuID = bcuAttrib.bcuID;
    tract = bcuAttrib.tract;
    workStatus = bcuAttrib.wrkStatus;
    latitude = parseFloat(bcuAttrib.latitude);
    longitude = parseFloat(bcuAttrib.longitude);
    pzInsKey = bcuAttrib.pzInsKey;
    pzInsKeyCase = bcuAttrib.pzInsKeyCase;

  };

  getRandomInRange = function() {
    /**
		 * Generates number of random geolocation points given a center and a radius.
		 * @param  {Object} center A JS object with lat and lng attributes.
		 * @param  {number} radius Radius in meters.
		 * @param {number} count Number of points to generate.
		 * @return {array} Array of Objects with lat and lng attributes.
		 */
    generateRandomPoints = function(center, radius, count) {
      var points = [];
      for (var i = 0; i < count; i++) {
        points.push(generateRandomPoint(center, radius));
      }
      return points;
    };


    /**
		 * Generates number of random geolocation points given a center and a radius.
		 * Reference URL: http://goo.gl/KWcPE.
		 * @param  {Object} center A JS object with lat and lng attributes.
		 * @param  {number} radius Radius in meters.
		 * @return {Object} The generated random points as JS object with lat and lng attributes.
		 */
    generateRandomPoint = function(center, radius) {
      var x0 = center.lng;
      var y0 = center.lat;
      /* Convert Radius from meters to degrees.*/
      var rd = radius / 111300;

      var u = Math.random();
      var v = Math.random();

      var w = rd * Math.sqrt(u);
      var t = 2 * Math.PI * v;
      var x = w * Math.cos(t);
      var y = w * Math.sin(t);

      var xp = x / Math.cos(y0);

      /* Resulting point.*/
      return {
        'lat': y + y0,
        'lng': xp + x0
      };
    };

    var randomGeoPoints = null;
    var index = 0;

    this.getGeo = function() {
      /* Generates 100 points that is in a 1km radius from the given lat and lng point.*/
      if (!randomGeoPoints) {
        randomGeoPoints = generateRandomPoints({
          'lat': ESRIMap.Atlantis.lat,
          'lng': ESRIMap.Atlantis.lon
        }, 1000, 100); /*100 miles = approx 160k meters*/
      }
      return (randomGeoPoints[index++]);
    };
  }

  var randomGeo = new getRandomInRange();
  var currGeo = null;

  this.getLatitude = function() {
    /*currGeo = randomGeo.getGeo();
		return currGeo.lat;*/
    return latitude;
  };

  this.getLongitude = function() {
    /*return currGeo.lng;*/
    return longitude;
  };

  this.getBCUID = function() {
    return bcuID;
  };

  this.getWorkStatus = function() {
    return workStatus;
  };

  this.isPointWithinBCU = function(pointData) {
    var newPt = pointData.geometry;
    var bcuGeo = bcuGeometry;
    var promise = new Promise(function(resolve, reject) {
      spaUtils.containsProject(bcuGeometry, newPt, function(data) {
        console.log("bcuContainsCallback:" + data);
        if (data.contains == true) {
          console.log("Point INSIDE the BCU");
          resolve(data);
        } else if (data.contains == false) {
          console.log("Point OUTSIDE the BCU");
          reject(data);
        }
      });
    });
    return promise;
  };

  this.setBCUData = function(data) {
    console.log("bcuid: " + bcuID + "data received feature array length: " + data.features.length);
    MobileTestData.collect(bcuID, JSON.stringify(data));
    if (data.features.length > 0) {
      bcuGeoData = data;
      bcuObjID = bcuGeoData.features[0].attributes[bcuGeoData.objectIdFieldName];
      bcuGeometry = bcuGeoData.features[0].geometry;
      console.log("bcuObjID:" + JSON.stringify(bcuObjID));
    } else {
      console.log("Incompleted data received:" + JSON.stringify(data));
    }
  };

  this.getBCUGeoData = function() {
    return bcuGeoData;
  };

  this.getBCUGeometry = function() {
    return bcuGeometry;
  };

  this.getBCUFringeGeometry = function() {
    return bcuFringeGeometry;
  };

  this.getpzInsKey = function() {
    return pzInsKey;
  };

    this.getpzInsKeyCase = function() {
    return pzInsKeyCase;
  };


  this.select = function() {
    var _this = this;
    var promise = new Promise(function(resolve,reject) {
      if (bcuGeoData === null) {

        _this.getBCUData().then(function(data) {
          console.log("BCU Data Received for bcuID: " + bcuID + "\n" + JSON.stringify(data));
          _this.setBCUData(data);
          _this.toggleSelection(resolve);
        }, function(d) {
          console.log("No data received for BCU:" + bcuID);
          alert("No data is available for BCUID: " + bcuID + "\n" + "Please contact your System Administrator");
          reject(new Error("No data is available for BCUID: " + bcuID + "\n" + "Please contact your System Administrator"));
        });
      } else {
        MobileTestData.collect(bcuID, JSON.stringify(bcuGeoData));
        _this.toggleSelection(resolve);
      }
    });
    return promise;        

  };

  this.toggleSelection = function(rslv) {
    console.log("bcuGeometry: " + JSON.stringify(bcuGeometry));
    if (bcuGeometry && bcuGeometry.rings.length > 0) {
      var polygon = {
        polygonID: "bcu_border_" + bcuID,
        /*geometry: bcuFringeGeometry,*/
        geometry: bcuGeometry,
        fillColor: '#33FDCCF6',
        /*#AB0635',*/
        borderColor: '#FFF70088'
      };
      censusMapObject.getMappingModule().setPolygonsEmpty();
      /*omm.selectFeatureById(bcuObjID, "BCU_90_SYNC");*/
      censusMapObject.getMappingModule().addPolygon(polygon);
      censusMapObject.getMappingModule().zoomToGeometry(bcuGeometry,rslv);
    } else {
      alert("No BCU Geometry for BCUID: " + bcuID);
    }
  };

  this.getBCUData = function() {
    console.log("CensusMap.getBCUData: " + "BCU = '" + bcuID + "' AND COUNTY = '" + county + "'");
    /*Until cache manager is smarter we need to determine where to query based on BCU->REGION*/
    var fileReference = region + "_secondary.geodatabase";

    var layer = {
      file: fileReference,
      tableName: "BCU_90_SYNC",
      type: "geodatabase"
    };
    console.log(JSON.stringify(layer));

    mapCacheAPI._init();
    return mapCacheAPI.query(layer, "BCU = '" + bcuID + "' AND COUNTY = '" + county + "'", null, null, this.bcuQueryResultHandler);
  };

  this.bcuQueryResultHandler = function(data) {
    console.log("bcuQueryResultHandler");
    console.log(JSON.stringify(data));
    bcuGeoData = data;
    bcuGeometry = bcuGeoData.features[0].geometry;

    SpatialUtils.buffer(bcuGeometry, 150, function(data) {
      console.log("Buffer complete");
      console.log(JSON.stringify(data));
      bcuFringeGeometry = data;
    });
  };

};