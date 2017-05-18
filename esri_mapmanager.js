/****
Author: Rohit Chaudhri
Creation Date: Nov 3rd 2016
****/

console.log("Loading ESRI_MapMaanger.js");

var ESRIMap = ESRIMap || {};

var MapManager = MapManager || {};

/* Default the census HQ Lat/Long */
ESRIMap.censusHQ = {
	lat: 38.846455,
	lon: -76.930446,
	zoom: 14
};

/* Default the Puerto Rico Lat/Long */
ESRIMap.PR = {
	lat: 18.4663338,
	lon: -66.1087774,
	zoom: 14
};

ESRIMap.USCenter = {
	lat: 39.8333333,
	lon: -98.585522,
	zoom: 4
};

ESRIMap.Atlantis = {
	lat: 39.2890281,
	lon: -73.0817794,
	zoom: 4
}

/*todo: (0) @CR remove rslv*/
MapManager.Map = function(cfg, rslv) {
	console.log("ESRI_MapManager->MapManager.Map: invoked");
	var config = cfg;
	ESRIMap.ptWrpMgr = null;
	var ptrMgrInstance = new ESRIMap.GenericPointManagerChild(config.mapTitle);
	ESRIMap.ptWrpMgr = ptrMgrInstance;
	/*todo: (0) @CM rename mapInstance to mapInterface as its not an object*/
	var mapInstance = null;
	
    this.configureMap = function(rslv) {
      try {
          switch (config.mapType) {
              case "testharness":
              case "browser":
                  console.log("ESRI_MapManager->MapManager.Map->cstr: " + "Configure me a browser map");
                  mapInstance = ESRIMap.configureEmptyMap(config, rslv);
                  mapInstance = globalMap;
                  break;
              default:
                  console.log("ESRI_MapManager->MapManager.Map->cstr: " + "Configure me a mobile map");
                  mapInstance = ESRIMap.configureAtlantis(config,rslv);
                  mapInstance = globalMap;

          }
      } catch (e) {
          console.log(e.message + "\n" + e.stack);
          throw e;
      }
    }

	this.getPointManager = function() {
		console.log("ESRI_MapManager->getPointManager: invoked");
		if (!ptrMgrInstance) {
			ptrMgrInstance = new ESRIMap.GenericPointManagerChild(config.mapTitle);
			console.log("ESRI_MapManager->getPointManager: " + "New point Manager instance created");
		}
		/*todo: remove ESRIMap.ptWrpMgr; pointmanager should know its map*/
		if (ESRIMap.ptWrpMgr) ESRIMap.ptWrpMgr.removePoints();
		ESRIMap.ptWrpMgr = ptrMgrInstance;
		return ptrMgrInstance;
	};

	this.show = function() {
		try {
			console.log("ESRI_MapManager->show: " + "Configure me a browser map");
			var bcu = CChlpr.findPage("pyWorkPage.BCU");
			var bcuid = CChlpr.getPageProperty(bcu, "BCUID");
			console.log("Currently selected BCUID:" + bcuid);
			if (this.selectBCU) this.selectBCU(bcuid);
			globalMap.show();
		} catch (e) {
			console.log(e.message + "\n" + e.stack);
			throw e;
		}

	};

	this.hide = function() {
		console.log("ESRI_MapManager->hide: invoked");
		mapInstance.hide();
	};

	this.setTitle = function(title) {
		console.log("ESRI_MapManager->setTitle: invoked");
		var logTitle = title;
		logTitle = logTitle.replace(new RegExp("<br/>", "g"), "\n");
		console.log("ESRI_MapManager->setTitle: " + "old title:\n" + config.mapTitle + "\nwill change to:\n" + logTitle);
		mapInstance.setTitle(title);
	};

	this.presentAllPoints = function() {
		mapInstance.presentAllPoints();
	};

	this.centerAt = function(pw) {
		if (pw && pw.isValid()) {
			mapInstance.centerAt(ESRIMap.convertToZoomPoint(pw));
		}
	};

	this.getMappingModule = function() {
		return mapInstance;
	};

	this.getSpatialUtils = function() {
		if (BRMAP.isTestHarness) {
			return RCMHarness;
		} else {
			return SpatialUtils;
		}
	}
};