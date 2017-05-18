/**
 * Offline Maps Base API / Offline Mapping Module (OMM)
 * Provides the base methods for the Mapping Module (Esri)
 * Methods in alphabetical order
 **/

var OMM = OMM || {};

/* Handle to the Module object */
OMM.OfflineMaps = {};

/* Map local variables for tracking state */
OMM.mapState = {
    center: {},
    userLocation: {},
    lockOrientation: false,
    showUserLocation: false,
    currentBasemap: "",
    visibleLayers: [],
    points: [],
    polygons: [],
    lastPolygonGeo: {},
    lastPointGeo: {},


    events: {},
    config: {},
    menuConfig: {},
    mapMBR: {},
    zoomGeo: {},
    featureQueryResult: {},
    defaultMarkerIcon: "",
    icons: {},
    mapTitle: ""
}


/**
 * Init the OfflineMaps object
 */
OMM.initOfflineMaps = function() {
    this.OfflineMaps = window.launchbox.OfflineMapEsri;
}

/**
 * Add layers to the map
 * @method addLayers
 * @param layerConfigs {object} Array of layer configs
 * @param layerConfigs[].displayName {string} Name of the layer for display purposes
 * @param layerConfigs[].file {string} File name of offline file to load. file, url or itemId attribute is exclusive.
 * @param layerConfigs[].url {string} Url of the feature, dynamic, tiled, or vector tile layer. Must be used with type. File, url or itemId attribute is exclusive.
 * @param layerConfigs[].type {string} Type of the online layer being added
 * @param layerConfigs[].itemId {string} Item id of the portal item to be added, if a feature layer must have layerId also. File, url or itemId attribute is exclusive.
 * @param layerConfigs[].layerId {string} Layer id of the feature layer of a portal item to be added to the map
 * @return {Promise} A promise resolved with no value.
 */
OMM.addLayers = function(layerConfigs) {
    var pr = this.OfflineMaps.addLayers(layerConfigs);
    console.log("OfflineMaps.addLayers called");
  	return pr;
};

/**
 * Adds a feature layer to the map.
 * @method addFeatureLayer
 * @param name {string} Name of the layer.
 * @param url {string} URL to online feature service.
 */
OMM.addFeatureLayer = function(name, url) {
    this.OfflineMaps.addFeatureLayer(name, url);
    console.log("OfflineMaps.addFeatureLayer called, no renderer");
}

/**
 * Adds a feature layer to the map.
 * @method addFeatureLayer
 * @param layerName {string} Name of the layer.
 * @param url {string} URL to online feature service.
 * @param [renderer] {object} Overrides the rendering settings for the layer.
 * @param [renderer.fillStyle] {string} Styling of the features' interiors.
 * @param [renderer.fillColor] {string} Hexadecimal ARGB format of the fill color starting with #.
 * @param [renderer.borderStyle] {object} Style of the features' borders.
 * @param [renderer.borderColor] {string} Hexadecimal ARGB format of the fill color starting with #.
 * @param [renderer.borderWidth] {number} Thickness of the features' borders.
 * @param [renderer.selectionColor] {string} Hexadecimal ARGB format of the fill color starting with #.
 * @param [renderer.selectionWidth] {number} Thickness of the features' selection.
 * @return {Promise} A promise resolved with no value.
 */

OMM.addFeatureLayer = function(name, url, renderer) {
    this.OfflineMaps.addFeatureLayer(name, url, renderer);
    console.log("OfflineMaps.addFeatureLayer called, with renderer");
}


/**
 * Adds a point to the map.
 * @method addPoint
 * @param point {object} A point object with following fields:
 * @param point.pointID {string} ID of the point.
 * @param [point.title] {string} Title for the point annotation.
 * @param [point.subtitle] {string} Subtext for the point annotation.
 * @param [point.label] {object} Label shown below the point's marker with following fields:
 * @param point.label.text {object} Text of the label.
 * @param [point.label.size] {number} Size of the label font.
 * @param [point.label.color] {string} Hexadecimal ARGB format of the text color starting with #.
 * @param [point.label.verticalAlignment] {number} Vertical alignment of the label with the anchor point.
 *          One of the options from LabelAlignment - it aligns the TOP, BOTTOM, or MIDDLE edge of the label.
 * @param [point.label.horizontalAlignment] {number} Horizontal alignment of the label with the anchor point.
 *          One of the options from LabelAlignment - it aligns the LEFT, RIGHT, or CENTER edge of the label.
 * @param point.location {object} Coordinates of the point with following fields:
 * @param point.location.lat {number} Latitude of the point.
 * @param point.location.lon {number} Longitude of the point.
 * @param [point.iconName] {string} Icon name to use as the point's marker.
 *        Must be one set by #setIcons.
 * @param [point.actions] {object} Array of actions with following fields:
 * @param point.actions.displayName {string} Name of the action to be shown in the menu.
 * @param point.actions.actionID {string} ID of the action for use with #setActionListener.
 * @param pointCallback {function} callback to call post add
 */
OMM.addPoint = function(point, pointCallback) {
    this.OfflineMaps.addPoint(point).then(function(data) {
        console.log("addPoint promise:" + data);

        OMM.mapState.points.push(point);

        if (typeof pointCallback !== 'undefined') {
            console.debug("Calling addPoint callback");
            OMM.assertIsFunction(pointCallback);
            pointCallback(data);
        }
    });
    console.log("OfflineMap.addPoint called");
}

OMM.addPoint = function (point) {
  console.log("OfflineMapsBaseAPI->OMM.addPoint: invoked");
  this.OfflineMaps.addPoint(point).then(function (data) {
    console.log("OfflineMapsBaseAPI->OMM.addPoint: " + "addPoint promise:" + data);

    OMM.mapState.points.push(point);

  });
  console.log("OfflineMapsBaseAPI->OMM.addPoint: " + "OfflineMap.addPoint called");
};


/**
 * Adds a polygon to the map.
 * @method addPolygon
 * @param polygon {object} A polygon object with following fields:
 * @param polygon.polygonID {string} ID of the polygon.
 * @param polygon.vertexList {object} Array of vertices of the polygon with following fields:
 * @param polygon.vertexList.lat {number} Latitude of the vertex.
 * @param polygon.vertexList.lon {number} Longitude of the vertex.
 * @param [polygon.fillColor] {string} Hexadecimal ARGB format of the fill color starting with #.
 * @param [polygon.borderColor] {string} Hexadecimal ARGB format of the border color starting with #.
 * @param polygonCallback {function} callback to call post add
 */
OMM.addPolygon = function(polygon, polygonCallback) {
    this.OfflineMaps.addPolygon(polygon).then(function(data) {
        console.log("addPolygon promise:" + data);
        OMM.mapState.polygons.push(polygon);

        if (typeof polygonCallback !== 'undefined') {
            console.debug("Calling addPolygon callback");
            OMM.assertIsFunction(polygonCallback);
            polygonCallback(data);
        }
    });
    console.log("OfflineMap.addPolygon called");
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
OMM.buffer = function(geometry, distance, callback) {

    this.OfflineMaps.buffer(geometry, distance).then(function(data) {
        console.log(data);
        if (typeof callback !== 'undefined') {
            console.debug("Calling buffer callback");
            OMM.assertIsFunction(callback);
            callback(data);
        }
    });
    console.log("OfflineMap.buffer called");
}


/**
 * Pans and zooms to given point and zoom.
 * @method centerAt
 * @param newCenter {object} Point used for map centering with following fields:
 * @param newCenter.lat {number} Latitude of the center.
 * @param newCenter.lon {number} Longitude of the center.
 * @param newCenter.zoom {number} Zoom level of the center, must be an integer in a valid rangefor a given map style.
 */
OMM.centerAt = function(newCenter) {
    this.mapState.center = newCenter;
    this.OfflineMaps.centerAt(newCenter);
    console.log("Offlinemap.centerAt called:" + newCenter.lat + "," + newCenter.lon);
}

/**
 * Centers the map on user location if available.
 * @method centerUserLocation
 * @param [zoom] {number} Zoom level to set.
 *        Uses maximum available zoom if not present.
 * @return sets the userLocation value
 */
OMM.centerUserLocation = function(zoom) {

    if (typeof zoom === "undefined") {
        zoom = 15;
    }

    this.OfflineMaps.centerUserLocation(zoom).then(function(data) {
            console.log("Center User location success:" + data);
            OMM.mapState.userLocation = data;
        })
        .catch(function(error) {
            console.error("Center user location error: " + error);
        });
    console.log("OfflineMap.centerUserLocation called");
}

/**
 * Change icon for a point
 * @method changeIcon
 * @param pointID {string} Point ID to update
 * @param iconName {string} New icon name for the point
 */
OMM.changeIcon = function(pointID, iconName) {
    var point = this.findPoint(pointID);
    if (point !== null) {
        point.iconName = iconName;
        this.OfflineMaps.modifyPoint(pointID, point);
    }
    console.log("changeIcon called");
}


/**
 * Clears the given listener.
 * @method clearEventListeners
 * @param callback {object} Object with callbacks that was used in #setEventListeners
 */
OMM.clearEventListeners = function(callback) {
    this.OfflineMaps.clearEventListeners(callback);
    console.log("OfflineMap.clearEventListeners called");
}


/**
 * Sets up the map for use.
 * @method configure
 * @param config {object} Container for following map properties:
 * @param [config.activeStyle] {object} Active map style.
 * @param [config.activeStyle.displayName] {string} Style's name for display in the list.
 * @param [config.activeStyle.source] {string} Style type or an url to a map service.
 * @param [config.styles] {object} Array of map styles available for change. Includes objects
 *        defined like config.activeStyle.
 * @param [config.lockOrientation] {object} Sets whether the rotation should be locked to top-north.
 *        Defaults to false.
 * @param [config.showUserLocation] {object} Sets whether user location should be shown on the map.
 *        Defaults to false.
 * @param [config.title] {string} Text to display on the TitleBar.
 * @param [config.backButtonText] {string} Text to display as the back button.
 * @param [config.disableTitleBar] {boolean} Sets whether the TitleBar should be displayed.
 *        Defaults to false. If true, each map has to provide a separate way to hide it.
 */
OMM.configure = function(config, center) {
    if (center) {
        this.mapState.center = center;
    }
    this.OfflineMaps.configure(config);
    console.log("OfflineMap.configure called");
    /*console.log("load Atlantis layers for case " + pyID + " created by:" + creator);
	try {
		console.log("OfflineMap.configure loading Atlantis_24OCT2016.vtpk");
		this.OfflineMaps.addVectorTilePackage("Atlantis_24OCT2016.vtpk");

		console.log("OfflineMap.configure loading Atlantis_BCU.geodatabase");
		this.OfflineMaps.addOfflineFeatureLayer("Atlantis_BCU.geodatabase");

		console.log("OfflineMap.configure loading Atlantis_Tract.geodatabase");
		this.OfflineMaps.addOfflineFeatureLayer("Atlantis_Tract.geodatabase");
	} catch (e) {
		console.log(e.message);
		console.log("silently ignoring this error for the time-being as it only affect atlantis data");
	}*/

}


OMM.addATlantisLayers = function() {
    console.log("loading Atlantis layers");
    try {
        console.log("OfflineMap.configure loading Atlantis_24OCT2016.vtpk");
        this.OfflineMaps.addVectorTilePackage("Atlantis_24OCT2016.vtpk");

        console.log("OfflineMap.configure loading Atlantis_BCU.geodatabase");
        this.OfflineMaps.addOfflineFeatureLayer("Atlantis_BCU.geodatabase");

        console.log("OfflineMap.configure loading Atlantis_Tract.geodatabase");
        this.OfflineMaps.addOfflineFeatureLayer("Atlantis_Tract.geodatabase");
    } catch (e) {
        console.log(e.message);
        console.log("silently ignoring this error for the time-being as it only affect atlantis data");
    }
}

/**
 * Sets up actions that appear after clicking on the button on the right side of the TitleBar.
 * @method configureMenu
 * @param actions {object} Array of actions with following fields:
 * @param actions.displayName {string} Name of the action to be shown in the menu.
 * @param actions.actionID {string} ID of the action for use with #setActionListener.
 */
OMM.configureMenu = function(actions) {
    this.OfflineMaps.configureMenu(actions);
    console.log("OfflineMap.configureMenu called");
}

/**
 * Initalizes a portal to be used for layers or precache items from a poral instance.
 * @method configurePortal
 * @param portalConfig {object} Specification of the portal instance
 * @param portalConfig.url {string} Url of the portal instance
 * @param [portalConfig.username] {string} optional username for the portal instance
 * @param [portalConfig.password] {string} optional password for the portal instance
 */
OMM.configurePortal = function(portalConfig) {
    this.OfflineMaps.configurePortal(portalConfig);
    console.log("OfflineMap.configurePortal called");
}


/**
 * Get if one geometry contains another
 * @method contains
 * @param geometryContainer {object} a JSON geometry for the container of GeometryWithin
 * @param geometryWithin {object} a JSON geometry to test for inside of geometryContainer
 * @param containCallback {function} callback to call post add
 */
OMM.contains = function(geometryContainer, geometryWithin, containCallback) {
    this.OfflineMaps.contains(geometryContainer, geometryWithin).then(function(data) {
        console.log(data);
        if (typeof containCallback !== 'undefined') {
            console.debug("Calling contains callback");
            OMM.assertIsFunction(containCallback);
            containCallback(data);
        }
    });
    console.log("OfflineMap.contains called");
}


/**
 * Clears all of the cached files if no arguments are passed,
 * removes only the specified ones otherwise.
 * @method deleteCacheFiles
 * @param [files] {object} Array of file names to be deleted.
 */
OMM.deleteCacheFiles = function(files) {
    this.OfflineMaps.deleteCacheFiles(files);
    console.log("OfflineMap.deleteCacheFiles called");
}

/**
 * Deselects a feature with given id.
 * @method deselectFeatureById
 * @param featureId {number} Id of the feature to be deselected.
 * @param layerName {string} Name of the layer containing the feature.
 */
OMM.deselectFeatureById = function(featureID, layerName) {
    this.OfflineMaps.deselectFeatureById(featureID, layerName);
    console.log("OfflineMap.deselectFeatureById called");
}

/**
 * Resets the map to pre-configure state.
 * @method destroy
 */
OMM.destroy = function() {
    this.OfflineMaps.destroy();
    console.log("OfflineMap.destroy called");
}

/**
 * Get a geometry representing the difference between two geometries
 * @method difference
 * @param geometry1 {object} a JSON geometry
 * @param geometry2 {object} a JSON geometry
 * @param diffCallback {function} callback with results
 */
OMM.difference = function(geometry1, geometry2, diffCallback) {

    this.OfflineMaps.difference(geometry1, geometry2).then(function(data) {
        console.log(data);
        if (typeof diffCallback !== 'undefined') {
            console.debug("Calling difference callback");
            OMM.assertIsFunction(diffCallback);
            diffCallback(data);
        }
    });
    console.log("OfflineMap.difference called");
}


/**
 * Hides displayed map callout.
 * @method dismissCallout
 */
OMM.dismissCallout = function() {
    this.OfflineMaps.dismissCallout();
    console.log("OfflineMap.dismissCallout called");
}

/**
 * Downloads the specified vector tile for offline use
 * @method downloadPortalItem
 * @param itemId {String} ItemID to download
 * @param [callbacks] {object} Container object for cache callbacks.
 * @param [callbacks.onSuccess] {function} Function to call when download is finished.
 * @param [callbacks.onProgress] {function} Function to call when download progressed.
 * @param [callbacks.onFailure] {function} Function to call when download has failed.
 */
OMM.downloadPortalItem = function(itemId, callbacks) {
    this.OfflineMaps.downloadPortalItem(itemId, callbacks);
    console.log("OfflineMap.downloadPortalItem called");
}


/**
 * Find a point by ID
 * @param pointID {string} Point ID to get from the current points
 * @return Point {object}  
 */

OMM.findPoint = function(pointID) {
    for (var item in this.mapState.points) {
        if (this.mapState.points[item].pointID === pointID) {
            console.log("Point located");
            return this.mapState.points[item];
        }
    }
    console.log("findPoint called");
}

/**
 * Hides the map and returns to the webview.
 * @method hide
 */
OMM.hide = function() {
    this.OfflineMaps.hide();
    console.log("OfflineMap.hide called");
}

/**
 * Returns a list of the files and GDB table names that are currently cached on the device
 * @method listCachedFiles
 * @param listCallback {function} callback with results
 */
OMM.listCachedFiles = function(listCallback) {
    this.OfflineMaps.listCachedFiles().then(function(data) {
        console.log(data);
        if (typeof listCallback !== 'undefined') {
            console.debug("Calling listCachedFiles callback");
            OMM.assertIsFunction(listCallback);
            listCallback(data);
        }
    });
    console.log("OfflineMap.listCachedFiles called");
}

/**
 * Returns a list of the files and GDB table names that are currently cached on the device
 * @method listCachedFiles
 * @param listCallback {function} callback with results
 */
OMM.listCachedFilesAsync = function(listCallback) {
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
        _this.OfflineMaps.listCachedFiles().then(function(data) {
            console.log(data);
            if (typeof listCallback !== 'undefined') {
                console.debug("Calling listCachedFiles callback");
                OMM.assertIsFunction(listCallback);
                listCallback(data);
                if (data) {
                    resolve(data);
                } else {
                    reject(Error("No Data Received"));
                }
            }
        });
        console.log("get cached files");
    });
    return promise;

    console.log("OfflineMap.listCachedFiles called");
}



/**
 *  Toggles the map orientation should be locked top - north.
 *  Multiple calls will toggle the true/false
 *  @method lockOrientation
 */
OMM.lockOrientation = function() {
    this.mapState.lockOrientation = !this.mapState.lockOrientation;
    this.OfflineMaps.lockOrientation(this.mapState.lockOrientation);
    console.log("OfflineMaps.lockOrientation called - toggle mode");
}

/**
 * Sets whether the map's orientation should be locked top - north.
 * @method lockOrientation
 * @param lock {boolean} 
 */
OMM.lockOrientation = function(lockFlag) {
    this.mapState.lockOrientation = lockFlag;
    this.OfflineMaps.lockOrientation(lockFlag);
    console.log("OfflineMaps.lockOrientation called - explicit set");
}

/**
 * Changes the data attached to a given point.
 * @method modifyPoint
 * @param pointID {string} ID of the point to modify.
 * @param newPoint {object} New data, specified in the same way as in #addPoint.
 *        Modifying the pointID is possible with this method.
 * @param modCallback {function} callback with results
 */
OMM.modifyPoint = function(pointID, newPoint, modCallback) {
    this.OfflineMaps.modifyPoint(pointID, newPoint).then(function(data) {
        console.log(data);
        if (typeof modCallback !== 'undefined') {
            console.debug("Calling modifyPoint callback");
            OMM.assertIsFunction(modCallback);
            modCallback(data);
        }
    });
    console.log("OfflineMap.modifyPoint called");
}

/**
 * Changes the data attached to a given polygon.
 * @method modifyPolygon
 * @param polygonID {string} ID of the polygon to modify.
 * @param newPolygon {object} New data, specified in the same way as in #addPolygon.
 * @return Sets the lastPolygonGeo with the polygon geometry JSON.
 * @param modCallback {function} callback with results
 */
OMM.modifyPolygon = function(polygonID, newPolygon, modCallback) {
    this.OfflineMaps.modifyPolygon(polygonID, newPolygon).then(function(data) {
        console.log(data);
        if (typeof modCallback !== 'undefined') {
            console.debug("Calling modifyPolygon callback");
            OMM.assertIsFunction(modCallback);
            modCallback(data);
        }
    });
    console.log("OfflineMap.modifyPolygon called");
}

/**
 * Rotates the map to be oriented top - north.
 * @method pointNorth
 */
OMM.pointNorth = function() {
    this.OfflineMaps.pointNorth();
    console.log("OfflineMaps.pointNorth called");
}

/**
 * Downloads the specified region for offline use.
 * @method precache
 * @param cacheSettings {object} Specification of the region to cache with following fields:
 * @param cacheSettings.tags {object} Array of GEOID values of the regions to be downloaded.
 * @param cacheSettings.cacheType {string} Type of objects to cache: ALL, TILE_PACKAGES, GEODATABASE, VECTOR_TILES
 * @param [callbacks] {object} Container object for cache callbacks.
 * @param [callbacks.onSuccess] {function} Function to call when caching is finished.
 * @param [callbacks.onProgress] {function} Function to call when caching progressed.
 * @param [callbacks.onFailure] {function} Function to call when caching has failed.
 */
OMM.precache = function(cacheSettings, callbacks) {
    this.OfflineMaps.precache(cacheSettings, callbacks);
    console.log("OfflineMap.precache called");
}

/**
 * Pans and zooms to the minimum bounds containing all points currently added to the map.
 * @method presentAllPoints
 * @return Sets the mapMBR with the northEast and southWest points bounding the area 
 */
OMM.presentAllPoints = function() {
    this.OfflineMaps.presentAllPoints().then(function(data) {
        OMM.mapState.mapMBR = data;
        /*console.log("Points are bounded with: NE = " + data.northEast.lat + ", " + data.northEast.lon +
            " SW = " + data.southWest.lat + ", " + data.southWest.lon);*/
    });
    console.log("OfflineMap.presentAllPoints called");
}


/**
 * Prints the mapStatus object to console
 * @method printMapStatus
 */
OMM.printMapStatus = function() {
    console.log(this.mapState);
}

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
OMM.query = function(layerConfig, whereClause, searchGeometry, spatialRel, queryCallback) {
    this.OfflineMaps.query(layerConfig, whereClause, searchGeometry, spatialRel).then(function(data) {
        console.log(data);
        if (typeof queryCallback !== 'undefined') {
            console.debug("Calling queryCallback callback");
            OMM.assertIsFunction(queryCallback);
            queryCallback(data);
        }
    });
    console.log("OfflineMap.query called");
}


/**
 * Queries a feature layer. ONLINE/URL BASED LAYERS
 * @method queryFeatureLayer
 * @param whereClause {string} Where clause of the query.
 * @param layerName {string} Name of the layer containing the feature.
 * @param queryCallback {function} callback to handle the results. with the ID of the feature under the 'objectid' key and geometry JSON under
 * 'geometry'.
 */
OMM.queryFeatureLayer = function(whereClause, layerName, queryCallback) {
    this.OfflineMaps.queryFeatureLayer(whereClause, layerName).then(function(data) {
        console.log(data);
        if (typeof queryCallback !== 'undefined') {
            console.debug("Calling queryCallback callback");
            OMM.assertIsFunction(queryCallback);
            queryCallback(data);
        }
    });
    console.log("OfflineMap.queryFeatureLayer called");
}

/**
 * Removes a feature layer from the map.
 * @method removeFeatureLayer
 * @param name {string} Name of the layer.
 */
OMM.removeFeatureLayer = function(name) {
    this.OfflineMaps.removeFeatureLayer(name);
    console.log("OfflineMaps.removeFeatureLayer called");
}

/**
 * Removes a given point from the map.
 * @method removePoint
 * @param pointID {string} ID of the point to remove from map.
 */
OMM.removePoint = function(pointID) {
    this.OfflineMaps.removePoint(pointID);
    console.log("OfflineMap.removePoint called");
}

/**
 * Removes a given polygon from the map.
 * @method removePolygon
 * @param polygonID {string} ID of the polygon to remove from map.
 */
OMM.removePolygon = function(polygonID) {
    this.OfflineMaps.removePolygon(polygonID);
    console.log("OfflineMap.removePolygon called");
}

/**
 * Selects a feature with given id.
 * @method selectFeatureById
 * @param featureId {number} Id of the feature to be selected.
 * @param layerName {string} Name of the layer containing the feature.
 */
OMM.selectFeatureById = function(featureId, layerName) {
    this.OfflineMaps.selectFeatureById(featureId, layerName);
    console.log("OfflineMaps.selectFeatureById called");
}

/**
 * Sets the default icon for locations added by #setPoints.
 * @method setDefaultLocationMarker
 * @param iconName {string} Icon name to use as a default marker. Must be one set by #setIcons.
 */
OMM.setDefaultLocationMarker = function(iconID) {
    this.OfflineMaps.setDefaultLocationMarker(iconID);
    console.log("OfflineMap.setDefaultLocationMarker called");
}

/**
 * Registers a listener for map events.
 * @method setEventListeners
 * @param callbacks {object} Container for event callbacks with following optional fields:
 * @param [callbacks.onAction] {function(data)} called when an action is performed from the menu.
 *        The data argument contains the actionID field.
 * @param [callbacks.onPointAction] {function(data)} called when an action is performed on a point.
 *        The data argument contains the pointID and actionID fields.
 * @param [callbacks.onShow] {function} invoked after the map was shown.
 * @param [callbacks.onHide] {function} invoked after the map was hidden.
 * @param [callbacks.onPointCreated] {function(data)} invoked when a new point was added.
 *        The data argument contains a generated pointID of point-timestamp and location
 *        with lat and lon properties.
 * @param [callbacks.onPointSelected] {function(data)} invoked when a point was selected.
 *        The data argument contains the pointID.
 * @param [callbacks.onLongPress] {function(data)} invoked after a longpress on the map.
 *        The data argument contains the location with lat and lon properties
 * @param [callbacks.onTap] {function(data)} invoked after a tap on the map ('JS' identification mode)
 *        The data argument contains an array of identification results
 * @param [callbacks.onViewpointChanged] {function(data)} invoked when the viewpoint changes.
 *        The data argument contains the new viewpoint's location with lat and lon properties.
 * @param [callbacks.onMapLoaded] {function} invoked when map is ready.
 */
OMM.setEventListeners = function(callbacks) {
    /* Clear the current events */
    this.clearEventListeners();
    this.OfflineMaps.setEventListeners(callbacks);
    console.log("OfflineMap.setEventListeners called");
}

/**
 * Sets feature identification mode
 * @method setFeatureIdentificationMode
 * @param identificationMode {string} desired identification mode from FeatureIdentificationMode - DISABLED/NATIVE/JS
 */
OMM.setFeatureIdentificationMode = function(identificationMode) {
    this.OfflineMaps.setFeatureIdentificationMode(identificationMode);
    console.log("OfflineMap.setEventListeners called");
}

/**
 * Sets the map icon names and their base64-encoded representation for use
 * as the point markers.
 * @method setIcons
 * @param iconMap {object} Map with icon names as keys
 * @param iconMap.<name> {string} Name of the icon
 * @param iconMap.<name>.image {string} Base64-encoded image
 * @param [iconMap.<name>.description] {string} Description of the icon, used by showLegend, if missing,
 *          the icon will not appear in the legend.
 * @param [iconMap.<name>.offset] {object} Array containing the center offset of the marker
 */
OMM.setIcons = function(iconMap) {
    this.OfflineMaps.setIcons(iconMap);
    console.log("OfflineMap.setIcons called");
}

/**
 * Sets the locations which should be displayed on the map.
 * Removes any previously existing points.
 * @method setPoints
 * @param pointsIn {object} An array of points as specified in #addPoint.
 * @param setCallback {function} A callback for results with a map of pointIDs and their geometries.
 */
OMM.setPoints = function(pointsIn, setCallback) {
    this.OfflineMaps.setPoints(pointsIn).then(function(data) {
        console.log(data);
        if (typeof setCallback !== 'undefined') {
            console.debug("Calling setPoints callback");
            OMM.assertIsFunction(setCallback);
            setCallback(data);
        }
    });
    console.log("OfflineMap.setPoints called");
}

/**
 * Adds a batch of polygons to the map.
 * Removes any previously existing polygons.
 * @method setPolygons
 * @param polyIn {object} An array of points as specified in #addPolygon.
 * @param setCallback {function} A callback for results with a map of polygonIDs and their geometries.
 */
OMM.setPolygons = function(polyIn, setCallback) {
    this.OfflineMaps.setPolygons(polyIn).then(function(data) {
        console.log(data);
        if (typeof setCallback !== 'undefined') {
            console.debug("Calling setPolygons callback");
            OMM.assertIsFunction(setCallback);
            setCallback(data);
        }
    });
    console.log("OfflineMap.setPolygons called");
}

/**
 * Removes any previously existing points.
 * @method setPointsEmpty
 */
OMM.setPointsEmpty = function() {
        this.OfflineMaps.setPoints([]);
        console.log("OfflineMap.setPointsEmpty called");
    }
    /**
     * Removes any previously existing polygons.
     * @method setPolygonsEmpty
     */
OMM.setPolygonsEmpty = function() {
    this.OfflineMaps.setPolygons([]);
    console.log("OfflineMap.setPolygonsEmpty called");
}


/**
 * Sets whether the user location should be visible on the map.
 * @method setShowUserLocation
 * @param shouldShow {boolean} Defaults to true.
 */
OMM.setShowUserLocation = function(shouldShow) {
    if (shouldShow === undefined) {
        shouldShow = true;
    }
    this.OfflineMaps.setShowUserLocation(shouldShow);
    console.log("OfflineMap.setShowUserLocation called - set");
}

/**
 * Changes the TitleBar title.
 * @method setTitle
 * @param title {string} Title displayed in the center of the TitleBar.
 */
OMM.setTitle = function(title) {
    title = title.replace(new RegExp("<br/>", "g"), "\n");
    title = title.replace(new RegExp("<br>", "g"), "\n");
    this.OfflineMaps.setTitle(title);
    console.log("OfflineMaps.setTitle called");
}

/**
 * Shows the map in fullscreen.
 * All arguments are mutually exclusive (except for cashedRegion),
 * with priority in order of the arguments definition.
 * If no arguments are passed, the map restores the previous camera position
 * (if called after hide) or starts at the map origin.
 * @method show
 * @param [center] {object} Point used for map centering with following fields:
 * @param center.lat {number} Latitude of the center.
 * @param center.lon {number} Longitude of the center.
 * @param center.zoom {number} Zoom level of the center, must be an integer in a valid range
 * for a given map style.
 * @param [userLocation] {boolean} Centers the map on user location.
 * @param [presentAllPoints] {boolean} Pans and zooms to the minimum bounds containing
 *        all points currently added to the map.
 */
OMM.show = function() {
    this.OfflineMaps.show().then(function() {
            console.log("OfflineMap.show promise");
            /*var filenames = [];
            filenames.push({
                file: "88008.geodatabase"
            });
            OMM.addLayers(filenames);*/

        })
        .catch(function(error) {
            alert(error);
        });
    console.log("OfflineMap.show called");
}

/**
 * Shows the map in fullscreen. Centering on the previously set Center point.
 * @method showCenter
 */
OMM.showCenter = function() {
    console.log("OfflineMap.showCenter: " + this.mapState.center);
    this.OfflineMaps.show(this.mapState.center).then(function() {
            console.log("OfflineMap.show promise");
        })
        .catch(function(error) {
            alert(error);
        });
    console.log("OfflineMap.showCenter called");
}


/**
 * Shows the map in fullscreen. Showing all points
 * @method showAllPoints
 */
OMM.showAllPoints = function() {
    this.OfflineMaps.show(this.mapState.center, false, true, false).then(function() {
            console.log("OfflineMap.show promise");
        })
        .catch(function(error) {
            alert(error);
        });
    console.log("OfflineMap.showAllPoints called");
}


/**
 * Displays a dialog containing set icons with their descriptions.
 * @method showLegend
 */
OMM.showLegend = function() {
    this.OfflineMaps.showLegend();
    console.log("OfflineMap.showLegend called");
}


/**
 * Displays an action sheet with actions for given point.
 * @method showPointActionSheet
 * @param pointID {string} ID of the point which actions should be presented.
 */
OMM.showPointActionSheet = function(pointID) {
    this.OfflineMaps.showPointActionSheet(pointID);
    console.log("OfflineMap.showPointActionSheet called");
}

/**
 * Displays a map callout for given point.
 * @method showPointCallout
 * @param pointID {string} ID of the point for which callout should be presented.
 * @param [onCalloutTapped] {function} Function to call when accessory button is tapped.
 */
OMM.showPointCallout = function(pointID, onCalloutTapped) {
    this.OfflineMaps.showPointCallout(pointID, onCalloutTapped);
    console.log("OfflineMap.showPointCallout called");
}

/**
 * Shows a dialog containing basemaps to choose.
 * @method switchBasemap
 * @return sets the currentBasemap value
 */
OMM.switchBasemap = function() {
    this.OfflineMaps.switchBasemap().then(function(basemapName) {
        OMM.mapState.currentBasemap = basemapName;
        console.log("Basemap changed to " + basemapName);
    });
    console.log("OfflineMaps.switchBasemap called");
}

/**
 * Lists available layers with the ability to toggle their visibility.
 * @method switchLayers
 * @return sets the VisibleLayers array
 */
OMM.switchLayers = function() {
    this.OfflineMaps.switchLayers().then(function(layers) {
        OMM.mapState.visibleLayers = layers;
        console.log("Visible layers: " + layers.join(', '));
    });
    console.log("OfflineMaps.switchLayers called");
}

/**
 * Pans and zooms to a given geometry.
 * @method zoomToGeometry
 * @param geometry {string} JSON representing the geometry
 */
OMM.zoomToGeometry = function(geometry) {
    this.OfflineMaps.zoomToGeometry(geometry);
    console.log("OfflineMap.zoomToGeometry called");
}

/**
 * Pans and zooms to a given geometry.
 * @method zoomToGeometry
 * @param geometry {string} JSON representing the geometry
 */
OMM.zoomToGeometry = function(geometry,rslv) {
    this.OfflineMaps.zoomToGeometry(geometry).then(function(dtS){
      console.log("OfflineMap.zoomToGeometry failed: " + JSON.stringify(dtS));  
      if (rslv) rslv(dtS);
    },function(dtF){
    	console.log("OfflineMap.zoomToGeometry failed: " + JSON.stringify(dtF));  
    });
}


/**
 *  Utility Methods for API
 */

OMM.assertIsFunction = function(functionName) {
    if (typeof functionName !== "function") {
        throw "Provided argument is not a fuction.";
    }
}

/**
 *
 *  Cache Management & Storage Methods
 *
 */

function getDeviceCache() {
    /*OMM.initOfflineMaps();*/
    clearDeviceCache();
    OMM.OfflineMaps.listCachedFiles().then(function(data) {
        console.log("getDeviceCache: " + data);
        var cachePg = pega.ui.ClientCache.find("D_MapCacheFiles");

        var newCache = {};
        var lastFile = "";
        var len = data.length;
        for (var i = 0; len > i; i++) {

            console.log("Start to D_MapCacheFiles: " + data[i].file);
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
            newCache.put("FileSize", formatBytes(data[i].fileSize));
            lastFile = data[i].file;
            console.log("Added to D_MapCacheFiles: " + data[i].file);
        }
        console.log("Reloading");
        pega.u.d.refreshSection("MobileMapsConfig");

    });
}

function clearDeviceCache() {
    var dMaps = null;
    try {
        dMaps = pega.ui.ClientCache.find("D_MapCacheFiles");
        console.log("check dMaps");
        console.log(dMaps);
        if (dMAps !== null) {
            dMAps.put("pxResults", [{
                "pxObjClass": "OfflineMap-Data-DeviceCache"
            }]);
        }
    } catch (e) {
        console.log(e);
    }

    try {
        pega.u.d.refreshSection("MobileMapsConfig");
    } catch (ee) {
        console.log(ee);
    }

    console.log("leaving clearDeviceCache");
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Byte';
    var k = 1000; /* or 1024 for binary*/
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
* Presents a box with hint over the map view.
* @method showHint
* @param hint {object} Specification of hint to display
* @param [hint.title] {string} Message title.
* @param hint.message {string} Message text.
* @param hint.titleColor {string} Hexadecimal ARGB format of the title text color starting with #.
* @param hint.messageColor {string} Hexadecimal ARGB format of the message text color starting with #.
* @param hint.backgroundColor {string} Hexadecimal ARGB format of the box background color starting with #.
* @param hint.position {number} Determines hint position on device screen. One of the options from HintPosition.
* @param hint.duration {number} Box presentation time. 0 means no timeout.
* @param hint.hideOnSwipe {boolean} Enables swipe geasture for hiding the box.
* @param hint.hideOnTap {boolean} Enables swipe geasture for hiding the box.
* @return {Promise} A promise resolved with no value.
*/
OMM.showHint = function(hint ) {
    this.OfflineMaps.showHint(hint);
    console.log("OfflineMap.showHint called");
}


/** EOF */