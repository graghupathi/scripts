/**
 MAP SPATIAL Utilities
 Set of methods for calculating distance and geometries

 */


var SpatialUtils = SpatialUtils || {
        _module: null
    };

SpatialUtils._init = function () {
    this._module = window.launchbox.OfflineMapEsri;
}


/**
 * Buffers a geometry
 * @method buffer
 * @param geometry {object} a json geometry ex:
 * polygon = {
 *  "rings" : [
 *             [[-97.06138,32.837], [-97.06133,32.836], [-97.06124,32.834], [-97.06127,32.832], [-97.06138,32.837]],
 *             [[-97.06326,32.759], [-97.06298,32.755], [-97.06153,32.749], [-97.06326,32.759]]
 *            ],
 *  "spatialReference" : {"wkid" : 4326}
 * };
 * @param distance {number} distance in the same units as the spatialReference of the geometry
 * @param callback {function} callback function
 */
SpatialUtils.buffer = function (geometry, distance, callback) {
    this._init();
    this._module.buffer(geometry, distance).then(function (data) {
        console.log(data);
        if (typeof callback !== 'undefined' && typeof callback === "function") {
            console.debug("Calling buffer callback");
            callback(data);
        }
    });
    console.log("SpatialUtils.buffer called");
}


/**
 * Get if one geometry contains another
 * @method contains
 * @param geometryContainer {object} a JSON geometry for the container of GeometryWithin
 * @param geometryWithin {object} a JSON geometry to test for inside of geometryContainer
 * @param containCallback {function} callback to call post add
 */
SpatialUtils.containsOLD = function (geometryContainer, geometryWithin, containCallback) {
    this._init();
    console.log("CONTAINS");
    this._module.contains(geometryContainer, geometryWithin).then(function (data) {
        console.log(data);
        if (typeof containCallback !== 'undefined' && typeof containCallback === "function") {
            console.debug("Calling contains callback");
            containCallback(data);
        }
    });
    console.log("SpatialUtils.contains called");
}

/**
 * Get if one geometry contains another
 * @method contains
 * @param geometryContainer {object} a JSON geometry for the container of GeometryWithin
 * @param geometryWithin {object} a JSON geometry to test for inside of geometryContainer
 * @param containCallback {function} callback to call post add
 */
SpatialUtils.contains = function (geometryContainer, geometryWithin, containCallback) {
    this._init();
    this._module.contains(geometryContainer, geometryWithin).then(function (data) {
        var payload = {
            contains: data,
            geometry: geometryWithin,
            geometryProjection: null
        }
        console.log(payload);
        if (typeof containCallback !== 'undefined' && typeof containCallback === "function") {
            console.debug("Calling contains callback");
            containCallback(payload);
        }
    });
    console.log("SpatialUtils.contains called");
}

/**
 * Get if one geometry contains another while Projecting
 * @method contains
 * @param geometryContainer {object} a JSON geometry for the container of GeometryWithin
 * @param geometryWithin {object} a JSON geometry to test for inside of geometryContainer
 * @param containCallback {function} callback to call post add
 */
SpatialUtils.containsProject = function (geometryContainer, geometryWithin, containCallback) {
    this._init();

    var ref = geometryContainer.spatialReference;

    this._module.project(geometryWithin, ref).then(function (geom) {
        console.log("Projection complete");
        SpatialUtils._module.contains(geometryContainer, geom).then(function (data) {
            var payload = {
                contains: data,
                geometry: geometryWithin,
                geometryProjection: geom
            }

            console.log(payload);

            if (typeof containCallback !== 'undefined' && typeof containCallback === "function") {
                console.debug("Calling contains callback");
                containCallback(payload);
            }
        })
    });

    console.log("SpatialUtils.contains called");
}

/**
 * Projects a geometry to a different spatial reference.
 * @method project
 * @param geometry {object} a JSON geometry to be projected
 * @param spatialReference {object} a JSON of the spatialReference
 * @return {Promise} A promise resolved with the new geometry.
 */
SpatialUtils.project = function (geometry, spatialReference, projectCallback) {
    this._init();
    this._module.project(geometry, spatialReference).then(function (data) {
        console.log(data);
        if (typeof projectCallback !== 'undefined' && typeof projectCallback === "function") {
            console.debug("Calling project callback");
            projectCallback(data);
        }
    });
    console.log("SpatialUtils.project called");
}



/**
 * Get a geometry representing the difference between two geometries
 * @method difference
 * @param geometry1 {object} a JSON geometry
 * @param geometry2 {object} a JSON geometry
 * @param diffCallback {function} callback with results
 */
SpatialUtils.difference = function (geometry1, geometry2, diffCallback) {
    this._init();
    this._module.difference(geometry1, geometry2).then(function (data) {
        console.log(data);
        if (typeof callback !== 'undefined' && typeof callback === "function") {
            console.debug("Calling difference callback");
            diffCallback(data);
        }
    });
    console.log("SpatialUtils.difference called");
}





/**
 *  DISTANCE CALCULATION METHODS
 */

/**
 * getDistanceFromLatLonInM - Calculate the distance between two coordinate pairs
 * @param lat1 - Point 1 Latitude
 * @param lon1 - Point 1 Longitude
 * @param lat2 - Point 2 Latitude
 * @param lon2 - Point 2 Longitude
 * @param scale - Scale for the distance (meter|feet), meter is default
 * @returns {number} - Distance between the two points
 */
SpatialUtils.getDistanceBetweenPoints = function (lat1, lon1, lat2, lon2, scale) {

    var R = 6371000; /* Radius of the earth in m */
    if (scale !== 'undefined' && scale === "feet") {
        R = 20902230.9; /* Radius of the earth in ft */
    }

    var dLat = this.deg2rad(lat2 - lat1);  /* deg2rad below */
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; /* Distance in m*/
    return d;
}



/*{"x":-73.01369854145426,"y":39.36976096468522,"spatialReference":{"wkid":4326}
-8127847.7425681325,4774775.909439422
-8127847.742568269, 4747667.4535205*/

SpatialUtils.deg2rad = function (deg) {
    return deg * (Math.PI / 180);
}

SpatialUtils.projectPointCensus = function(pointGeo){
    var pX = pointGeo.x;
    var pY = pointGeo.y;

    var newMerc = SpatialUtils.merc(pX,pY);

    pointGeo.x = newMerc[0];
    pointGeo.y = newMerc[1];
    pointGeo.spatialReference = {"wkid":102100,"latestWkid":3857};
    return pointGeo;
}


SpatialUtils.deg_rad = function(ang) {
    return ang * (Math.PI/180.0)
}
SpatialUtils.merc_x= function(lon) {
    var r_major = 6378137.000;
    return r_major * SpatialUtils.deg_rad(lon);
}
SpatialUtils.merc_y= function(lat) {
    if (lat > 89.5)
        lat = 89.5;
    if (lat < -89.5)
        lat = -89.5;
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var phi = SpatialUtils.deg_rad(lat);
    var sinphi = Math.sin(phi);
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow((1.0-con)/(1.0+con), com);
    var ts = Math.tan(.5 * (Math.PI*0.5 - phi))/con;
    var y = 0 - r_major * Math.log(ts);
    return y;
}

SpatialUtils.merc= function(x,y) {
    return [SpatialUtils.merc_x(x),SpatialUtils.merc_y(y)];
}