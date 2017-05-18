/**
 MAP CACHE FACADE
 */

var MapCache = MapCache || {
    _initialized: false,
    _module: null,
    networkStatus: "OFFLINE",
    portalConnected: false,
    portal: null
};

MapCache._init = function() {
    this._module = window.launchbox.OfflineMapEsri;
};

MapCache.configurePortal = function(portalConf) {
    this._init();
    if (portalConf !== null) {
        this.portal = portalConf;
    }
    console.log("MapCache.configurePortal: " + JSON.stringify(portalConf));
};

MapCache.connectPortal = function() {
    this._init();
    this.refreshNetworkStatus();
    if (this.networkStatus === "ONLINE" && this.portal !== null) {

        if (this.portalConnected) {
            console.log("MapCache.configurePortal: already connected to portal, returning");
            return;
        }

        console.log("MapCache.configurePortal: connecting to Portal");
        this._module.configurePortal(this.portal).then(function() {
            console.log("MapCache.configurePortal: Portal Loaded");
            MapCache.portalConnected = true;
        });
    } else {
        console.log("MapCache.configurePortal: cannot connect to portal, no mobile data");
    }
};

MapCache.precacheByTag = function(settings, callback) {
    this._init();

    console.log("MapCache.precacheByTag called");
    if (settings !== null && settings.tags !== null && settings.cacheType !== null) {
        MapCache.connectPortal();


        var timeStamp = Date.now();
        var timeTaken;
        var precacheCB = {
            onSuccess: function(data) {
                timeTaken = (Date.now() - timeStamp) / 1000;
                console.log("Got data: " + JSON.stringify(data) + " in " + timeTaken);
                if (typeof callback !== 'undefined' && typeof callback === "function") {
                    console.debug("Calling precacheByTag callback");
                    callback(data);
                }
            },
            onProgress: function(data) {
                timeTaken = (Date.now() - timeStamp) / 1000;
                console.log("onProgress: " + timeTaken);
            },
            onFailure: function(data) {
                timeTaken = (Date.now() - timeStamp) / 1000;
                console.log("Caching failed in " + timeTaken + " seconds with error " +
                    JSON.stringify(data));
            }
        };
        this._module.precache(settings, precacheCB);
    } else {
        console.error("MapCache.precacheByTag: null parameters passed in");
    }
};


MapCache.refreshNetworkStatus = function() {
    if (window.pega.offline.NetworkStatus.isDataNetworkAvailable()) {
        this.networkStatus = "ONLINE";
    } else {
        this.networkStatus = "OFFLINE";
    }
};


/**
 * Executes a query on a feature layer
 * @method query
 * @param layerConfig {object} a LayerConfig
 * @param [whereClause] {string} a where clause, optional
 * @param [searchGeometry] {object}, a geometry for the spatial relationship, optional
 * @param [spatialRel] {string}, string representing one of the spatial relationships in an enum, optional
 *        esriSpatialRelIntersects | esriSpatialRelContains | esriSpatialRelCrosses |
 *        esriSpatialRelEnvelopeIntersects | esriSpatialRelIndexIntersects | esriSpatialRelOverlaps |
 *        esriSpatialRelTouches | esriSpatialRelWithin | esriSpatialRelRelate | esriSpatialRelEquals |
 *        esriSpatialRelDisjoint
 * @param queryCallback {function} callback to handle the results. with the ID of the feature under the 'objectid' key and geometry JSON under
 * 'geometry'.
 */
MapCache.queryOLD = function(layerConfig, whereClause, searchGeometry, spatialRel, queryCallback) {
    this._init();

    this._module.query(layerConfig, whereClause, searchGeometry, spatialRel).then(function(data) {
        console.log(data);
        if (typeof queryCallback !== 'undefined' && typeof queryCallback === "function") {
            console.debug("Calling queryCallback callback");
            queryCallback(data);
        }
    });
    console.log("MapCache.query called");
};

MapCache.query = function(layerConfig, whereClause, searchGeometry, spatialRel) {
    this._init();
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
        _this._module.query(layerConfig, whereClause, searchGeometry, spatialRel).then(function(data) {
            console.log(data);
            if (data) {
                resolve(data);
            } else{
                reject(Error("No Data Received"));
            }
        }, function(data){
           console.log("Request Rejected: " + data);
           reject(new Error(data));
        });
        console.log("MapCache.query called");
    });
    return promise;
};


MapCache.checkForLocalFile = function(fileName) {
    this._init();
    console.log("Checking for local file by name: " + fileName);

    this._module.listCachedFiles().then(function(data) {
        var len = data.length;
        for (var i = 0; len > i; i++) {
            console.log("File: " + data[i].file);
            if (fileName == data[i].file) {
                console.log("FOUND");
                return true;
            }
        }
        console.log("Not found");
        return false;
    });
};


MapCache.getDeviceCacheUX = function() {
    this.getDeviceCache();
    pega.u.d.refreshSection("MobileMapsConfig");
};

MapCache.getDeviceCache = function() {
    this._init();
    this.clearDeviceCache();
    pega.ui.ClientCache.find("D_MapCacheFiles").put("pxResults", [{
        "pxObjClass": "OfflineMap-Data-DeviceCache"
    }]);
    this._module.listCachedFiles().then(function(data) {
        console.log("getDeviceCache: " + data);
        var cachePg = pega.ui.ClientCache.find("D_MapCacheFiles");

        var newCache = {};
        var lastFile = "";
        var len = data.length;
        for (var i = 0; len > i; i++) {

            console.log("Start to D_MapCacheFiles: " + data[i].file + " - " + data[i].tableName);
            var tableNames = "";
            if (lastFile != data[i].file) {
                newCache = cachePg.get("pxResults").add();
            } else {
                tableNames = newCache.get("TableNames").getValue();
            }

            if (data[i].tableName !== "") {
                tableNames += data[i].tableName + "||";
                newCache.put("TableNames", tableNames);
            }

            newCache.put("CacheType", data[i].type);
            newCache.put("PreLoaded", false);
            newCache.put("FileName", data[i].file);
            newCache.put("FileSize", MapCache.formatBytes(data[i].fileSize));
            lastFile = data[i].file;
            console.log("Added to D_MapCacheFiles: " + data[i].file);
        }
        console.log("Done");
    });
};

MapCache.clearDeviceCacheUX = function() {
    this.clearDeviceCache();
    pega.u.d.refreshSection("MobileMapsConfig");
};

MapCache.clearDeviceCache = function() {
    pega.ui.ClientCache.find("D_MapCacheFiles").put("pxResults", [{
        "pxObjClass": "OfflineMap-Data-DeviceCache"
    }]);
};



MapCache.formatBytes = function(bytes, decimals) {
    if (bytes === 0) return '0 Byte';
    var k = 1000; /* or 1024 for binary */
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};