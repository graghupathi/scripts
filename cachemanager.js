/****
Author: Rohit Chaudhri
Creation Date: Jan 5th 2017
****/

console.log("Loading CacheManager.js");

MapManager.GeoDBCache = function(cachedDB) {
  var geoDBMap = {};
  var vtpkTag = "Atlantis";
  var vectorBaseMapName = "Atlantis_24OCT2016.vtpk";
  var baseMapLoaded = false;

  this.mapCacheAPI = null;
  var omm = null;

  if (BRMAP.isTestHarness) {
    omm = RCMHarness;
    this.mapCacheAPI = RCMHarness;
  } else {
    this.mapCacheAPI = MapCache;
    omm = OMM;
    omm.initOfflineMaps();
  }  

  this.initialzeCache = function(data) {
    /*reset cache*/
    geoDBMap = {};
    for (var i = 0; i < data.length; i++) {
      var fileKey = data[i].file;
      if (data[i].type !== 'vtpk') {
        fileKey = fileKey.substring(0, 5);
      }

      if (data[i].type === 'vtpk' && data[i].file === vectorBaseMapName && data[i].status.toUpperCase() === 'SUCCESS') {
        baseMapLoaded = true;
      }

      var gDB = geoDBMap[fileKey];
      if (gDB) {
        gDB.setTableStatus(data[i].file, data[i].type, data[i].tableName, data[i].status);
      } else {
        gDB = new MapManager.GeoDB(fileKey);
        gDB.setTableStatus(data[i].file, data[i].type, data[i].tableName, data[i].status);
        geoDBMap[fileKey] = gDB;
      }
      console.log("Existing Map layer: " + JSON.stringify(data[i]));
      console.log("Existing Map layer GeoDB Obj: " + gDB);
    }
    /*check for status of each table and set the primary and secondary file status*/
    for (var k in geoDBMap) {
      if (geoDBMap.hasOwnProperty(k)) {
        var gDB = geoDBMap[k];
        gDB.resolveCacheStatus();
        console.log("Existing Map layer GeoDB Obj After Resolve: " + gDB);
      }
    }

  };

  this.getGeoDBMap = function(region) {
    if (region) {
      return this.getDB(region);
    }
    return geoDBMap;
  };  

  this.setBCUListAndPreCacheMapData = function(bcuList, hide, rslv) {
    /*iterate through BCUList and get Map data*/
    var regions = [];

    for (var i = 0; i < bcuList.length; i++) {
      /*Don't invoke this.getCacheStatus. The cache was refreshed just before this method was invoked.
			this.getCacheStatus will query device and re-establish cache status. Its not needed at this time.
			*/
      if (bcuList[i]) {
        console.log("Checking Cache Status of: " + bcuList[i].region);
        if (!this.getDB(bcuList[i].region) || !this.getDB(bcuList[i].region).getFileStatus()) {
          var gDB = new MapManager.GeoDB(bcuList[i].region);
          this.setDB(gDB);
          if ($.inArray(bcuList[i].region, regions) === -1) {
            regions.push(bcuList[i].region);
          }
        }
      }    
    }

    var vtpkBasemaps = [];
    vtpkBasemaps.push(vtpkTag);
    console.log("regions to precache:" + JSON.stringify(regions));

    var _this = this;
    this.configPortalCensus().then(function() {
      _this.precacheVTPKBasemap(vtpkBasemaps).then(function() {
        _this.precacheCensusReqion(regions).then(function() {
          console.log("BCU Data Cached for:\n" + "Vector Tile Cached: " + JSON.stringify(vtpkBasemaps) + "\nRegions  Cached: " + JSON.stringify(regions));
          if (rslv){
            rslv();
          }
        });
      });
    });
  };  

  this.precacheCensusReqion = function(regionArray) {
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      if (regionArray && regionArray.length > 0) {
        _this.mapCacheAPI.precacheByTag({
          tags: regionArray,
          cacheType: "ALL"
        }, function(data) {
          console.log("precacheCensusrReqion - Got data: " + JSON.stringify(data));
          if (data) {
            for (var i = 0; data.length > i; i++) {
              var fileKey = data[i].file;
              fileKey = fileKey.substring(0, 5);
              gDB = _this.getDB(fileKey);
              gDB.setFileStatus(data[i].file, data[i].status, data[i].type);
            }
            resolve("Data Received");
          } else {
            reject("Data NOT Received");
          }
        });
      } else {
        resolve(null);
      }
    });
    return promise;
  };  

  this.precacheVTPKBasemap = function(vtpkTags) {
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      if (!_this.isBaseMapPreCached()) {
        _this.mapCacheAPI.precacheByTag({
          tags: vtpkTags,
          cacheType: "VECTOR_TILES"
        }, function(data) {
          console.log("vtpkCallback - Got data: " + JSON.stringify(data));
          resolve("Data Received");
        });
      } else {
        resolve(null);
      }
    });
    return promise;
  };

  this.configPortalCensus = function() {
    this.mapCacheAPI.configurePortal({
      url: "http://ditd012arcgisd.boc.ad.census.gov/arcgis"
    });
    return Promise.resolve(null);
  };  

  this.setDB = function(gDB) {
    geoDBMap[gDB.getID()] = gDB;
  };

  this.getDB = function(id) {
    return geoDBMap[id];
  };

  this.isBaseMapPreCached = function() {
    return baseMapLoaded;
  };

  this.getCacheStatus = function(region) {
    var existingGeoDB = geoDBMap[region];
    var _this = this;

    var promise = new Promise(function(resolve, reject) {
      if (existingGeoDB) {
        /*check if file was previously cached when the map was initialized.*/
        if (existingGeoDB.getCacheStatus()) {
          /*well it was there when the map was initialized. Lets ensure its still there ie wasn't deleted intentionally or by accident. 
					Also reinitialize geoDBMap*/
          MapManager.CensusMap.listCachedFiles().then(function(mapdata) {
            _this.initialzeCache(mapdata);
            var geoDB = geoDBMap[region];
            resolve(geoDB && geoDB.getCacheStatus() && baseMapLoaded);
          });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
    return promise;
  };

  this.toString = function() {
    var str = "geoDBMap:" + JSON.stringify(geoDBMap) + "\n";
    str += "vectorBaseMapName:" + vectorBaseMapName + "\n";
    return str;
  };

  this.initialzeCache(cachedDB);

};

MapManager.GeoDB = function(region) {
  var omm = null;
  if (BRMAP.isTestHarness) {
    omm = null;
  } else {
    omm = window.launchbox.OfflineMapEsri;
  }

  var dbID = region;
  var type = null;
  var primaryFile = null;
  var primaryStatus = false;
  var secondaryFile = null;
  var secondaryStatus = false;
  var secondaryTableStatus = {};
  var primaryTableStatus = {};


  this.toString = function() {
    var str = "dbID:" + dbID + "\n";
    str += "type:" + type + "\n";
    str += "primaryFile:" + primaryFile + "\n";
    str += "primary tables:" + JSON.stringify(primaryTableStatus) + "\n";
    str += "primaryStatus:" + primaryStatus + "\n\n";
    str += "secondaryFile:" + secondaryFile + "\n";
    str += "secondary tables:" + JSON.stringify(secondaryTableStatus) + "\n";
    str += "secondaryStatus:" + secondaryStatus + "\n";
    return str;
  };


  this.getID = function() {
    return dbID;
  };

  this.getType = function() {
    return type;
  };

  this.constructLayerConfig = function() {
    var lyrs = [];

    if (type === "geodatabase" && primaryStatus === "SUCCESS" && secondaryStatus === "SUCCESS") {
      var layer;
      var layer = {
        file: primaryFile,
        type: type
      };
      lyrs.push(layer);

      layer = {
        file: secondaryFile,
        type: type
      };
      lyrs.push(layer);
    }
    return lyrs;
  };

  this.setTableStatus = function(fname, typ, tableName, status) {
    status = status.toUpperCase();
    if (typ === 'geodatabase') {
      if (fname.indexOf("secondary") > 0) {
        secondaryFile = fname;
        secondaryTableStatus[tableName] = status;
      } else {
        primaryFile = fname;
        primaryTableStatus[tableName] = status;
      }
    } else {
      primaryFile = fname;
      primaryStatus = status;
    }
    type = typ;
  };

  /*when we precache we only get filestatus and type is not acccurate either
	when we call listCached files we get table level status and accurate type
	*/
  this.setFileStatus = function(fname, status, tp) {
    status = status.toUpperCase();

    if (fname.indexOf("secondary") > 0) {
      secondaryFile = fname;
      secondaryStatus = status;
    } else {
      primaryFile = fname;
      primaryStatus = status;
    }
    type = tp;

  };

  this.getFileStatus = function() {
    return (primaryStatus === "SUCCESS" && secondaryStatus === "SUCCESS");
  };

  this.resolveCacheStatus = function() {

    var tmpSecStatus = true;
    if (type === 'geodatabase') {
      secondaryStatus = "";
      primaryStatus = "";


      for (var sk in secondaryTableStatus) {
        if (secondaryTableStatus.hasOwnProperty(sk)) {
          var status = secondaryTableStatus[sk];
          if (status !== "SUCCESS") {
            tmpSecStatus = false;
          }
        }
      }
      if (tmpSecStatus && sk) {
        secondaryStatus = "SUCCESS";
      } else {
        secondaryStatus = "";
      }

      var tmpPrStatus = true;
      for (var pk in primaryTableStatus) {
        if (primaryTableStatus.hasOwnProperty(pk)) {
          var status = primaryTableStatus[pk];
          if (status !== "SUCCESS") {
            tmpPrStatus = false;
          }
        }
      }

      if (tmpPrStatus && pk) {
        primaryStatus = "SUCCESS";
      } else {
        primaryStatus = "";
      }
    }
  };

  this.getCacheStatus = function() {
    /*this method is invoked after cache is initialized and resolveCacheStatus is called.
		The method getFileStatus seems to do exactly the same thing but thats miss leading as the heavy lifting is done
		by resolveCacheStatus.
		Note: at the time files are precached we don't get table level status hence this convoluted code is needed.
		*/
    return (primaryStatus === "SUCCESS" && secondaryStatus === "SUCCESS");
  };


  /*
	-	Each file has a set of feature tables. 
	-	The layers are set to visualize at different zoom levels, and there Local roads (GEN) are in both but different local roads.
	-	The geoDBs are built from Feature Services, and the current services are deployed at two endpoints.
	-	In future we should be able to have just one file.

	Primary Operational Layer:
		TRACT_90_SYNC
		ROADS_PRI_SYNC
		ROADS_SEC_SYNC
		ROADS_GEN_SYNC

	Secondary Operational Layer:
		TRACT_90_SYNC
		BCU_90_SYNC
		ROADS_GEN_SYNC

	 */
};

MapManager.deviceCachedFiles = {};
MapManager.CacheMapFiles = function() {
  try {
    console.log("Caching: MapManager.CacheMapFiles invoked");
    /* alert("MapManager.CacheMapFiles called"); */
    console.log("Caching: calling MapManager.CensusMap.listCachedFiles");
    MapManager.CensusMap.listCachedFiles().then(MapManager.CachingFinished);
  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }
};

MapManager.CachingFinished = function(data) {
  console.log("Caching: ALMCB_mapIntegration->CachingFinished invoked");
  var mapConfig = {
    mapTitle: "Precache",
    mapType: gblMapType,
    reset: true,
  };

  console.log("Caching: checkiing Network Status");
  MapCache.refreshNetworkStatus();
  if (MapCache.networkStatus === "ONLINE" ) 
  {
    try {
      ALMCB_PrecacheMapData(data, true, mapConfig).then(function(){
        MapManager.CensusMap.listCachedFiles().then(MapManager.CacheMapFileList);
      }, 
                                                        function (d){
        console.log("Caching: no data received " + d ); 
        ClickToContinue();
      }
                                                       );
    } catch (e) {
      MapManager.CacheMapFileList(data);
      console.error("CachingFinished Error : " + e.message + "\n" + e.stack); 
    }
  } else {
    console.debug("MobileMapSyncPrecacheMaps: OFFLINE" ); 
    MapManager.CacheMapFileList(data);
  }

};

MapManager.CacheMapFileList = function(fileList) {
  try {
    console.log("filelist on device: " + JSON.stringify(fileList));
    /*reset cache*/
    /* todo : remove/externalize the hardcoded values */
    var mapExt = ".geodatabase";
    var mapExtSecondary = "_secondary.geodatabase";
    MapManager.deviceCachedFiles = {};
    for (var i = 0; i < fileList.length; i++) {
      try {
        var fileName = fileList[i].file;
        if (!MapManager.deviceCachedFiles.hasOwnProperty(fileName) )
          MapManager.deviceCachedFiles[fileName] = true;
        if (fileList[i].type !== 'vtpk') {
          var key = fileName.substring(0, 5);
          if (MapManager.deviceCachedFiles.hasOwnProperty(key+mapExt) )
            if (MapManager.deviceCachedFiles.hasOwnProperty(key+mapExtSecondary) )
              if (!MapManager.deviceCachedFiles.hasOwnProperty(key) )
                MapManager.deviceCachedFiles[key] = true;
        }
      }
      catch (err) {}
    }
    console.log("filelist on device: " + JSON.stringify(MapManager.deviceCachedFiles));
    ClickToContinue();
  }
  catch (err)  { ClickToContinue();}
};

MapManager.CheckCacheStatus = function(region) {
  try {
    console.log("1 CheckCacheStatus on  device:  region " + region);
    if (MapManager.deviceCachedFiles.hasOwnProperty(region) ){
      console.log("2 CheckCacheStatus on  device:  region found!");
      return true;
    }
    else
    {
      console.log("3 CheckCacheStatus on  device:  region not found");
      return false;
    }
  }
  catch (err) { 
    console.error("error device: " + err);
    return false; 
  }
};