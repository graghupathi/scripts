/****
Author: Rohit Chaudhri
Creation Date: Dec 27th 2016
****/

console.log("Loading CensusMap.js");

/*todo: (0) @CR*/
MapManager.CensusMap = function(cachedDB, mapConfig, rslv) {
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

  /*all bcu object indexed by bcuid*/
  var bcuMap = {};
  /*all bcu points are managed by bcuPtMgr. To override base methods look at BCUPointManager.configure*/
  var bcuPtMgr = null;
  /*all block map points are managed by addressListPtMge. To override base methods look at ??.configure*/
  var addressListPtMgr = null;
  /*all mapspot points are managed by mapSpotPtMgr. To override base methods look at ??.configure*/
  var mapSpotPtMgr = null;
  /*currently selected bcu object if any*/
  var selectedBCU = null;

  /*todo: (0) @CM call sequence to point manager is not correct fix as part of tech story*/
  MapManager.Map.call(this, mapConfig, rslv);

  this.getBCU = function(bcuid) {
    return bcuMap[bcuid];
  };

  this.toString = function() {
    var str = "mapConfig:" + JSON.stringify(mapConfig) + "\n";
    str += "bcuMap:" + JSON.stringify(bcuMap) + "\n";
    return str;
  };

  /*todo: (0) @CR almcb_dbCache remove global variable*/
  this.getCacheStatus = function(region) {
    return almcb_dbCache.getCacheStatus(region);
  };


  this.collectAllBCUGeomerty = function() {
    for (var k in bcuMap) {
      if (bcuMap.hasOwnProperty(k)) {
        this.selectBCU(k);
      }
    }
  };

  this.selectBCU = function(bcuID) {
    var pr = null;
    var bcu = bcuMap[bcuID];
    if (bcu) {
      if (bcuPtMgr) bcuPtMgr.setBCU(bcu);
      if (addressListPtMgr) addressListPtMgr.setBCU(bcu);
      if (mapSpotPtMgr) mapSpotPtMgr.setBCU(bcu);
      selectedBCU = bcu;
      pr = bcu.select();
      return pr;
    } else {
      console.log("WARNING BCUID: " + bcuID + "not found in CensusMap Object");
    }
  };

  this.getSelectedBCU = function() {
    return selectedBCU;
  }

  this.removePoints = function() {
    if (bcuPtMgr) bcuPtMgr.removePoints();
    if (addressListPtMgr) addressListPtMgr.removePoints();
    if (mapSpotPtMgr) mapSpotPtMgr.removePoints();
  };

  this.show = function() {
    try {
      console.log("ESRI_MapManager->show: " + "Configure me a browser map");
      var bcu = CChlpr.findPage("pyWorkPage.BCU");
      var bcuid = CChlpr.getPageProperty(bcu, "BCUID");
      console.log("Currently selected BCUID:" + bcuid);
      var pr = null;
      if (this.selectBCU) {
        pr = this.selectBCU(bcuid);
      }
      globalMap.show();
      return pr;
    } catch (e) {
      console.log(e.message + "\n" + e.stack);
      throw e;
    }

  };

  this.showALPoints = function() {
    /*User may click on any address on address list grid
      SelectedUnit is changed to the address user clicks on but SelectedUnitPage is not updated.
      Lets update SelectedUnitPage
    */
    var selectedUnit = CChlpr.getPageProperty("pyWorkPage.BCU", "SelectedUnit");
    if (selectedUnit && selectedUnit !=="" && selectedUnit !=="None") {
      ProcessUnit(selectedUnit);  
    }
    this.removePoints();
    if (!addressListPtMgr) {
      addressListPtMgr = new ESRIMap.GenericPointManagerChild("Block Map");
      if (selectedBCU) addressListPtMgr.setBCU(selectedBCU);
    }
    ALMAddressListInit.configure(addressListPtMgr);
    this.show();
    addressListPtMgr.setupPoints();
    addressListPtMgr.plot();
    addressListPtMgr.onShow();
    ESRIMap.ptWrpMgr = addressListPtMgr;
  };

  this.showMSPoints = function() {
    this.removePoints();
    if (!mapSpotPtMgr) {
      mapSpotPtMgr = new ESRIMap.GenericPointManagerChild("Collect a MapSpot");
      if (selectedBCU) mapSpotPtMgr.setBCU(selectedBCU);
    }
    ALMMapSpotInit.configure(mapSpotPtMgr);
    _this = this;
    this.show().then(function(dtS) {
      mapSpotPtMgr.setupPoints();
      mapSpotPtMgr.plot();
      mapSpotPtMgr.onShow();
      _this.presentAllPoints();
      /*_this.centerAt(mapSpotPtMgr.getSelectedPointWrapper());*/
    });
    ESRIMap.ptWrpMgr = mapSpotPtMgr;
  };

  this.showBCUPointsWithYahi = function() {
    this.removePoints();
    if (!bcuPtMgr) {
      bcuPtMgr = new ESRIMap.GenericPointManagerChild("Case View");
      if (selectedBCU) bcuPtMgr.setBCU(selectedBCU);
    }
    BCUPointManager.configure(bcuPtMgr);
    _this = this;
    bcuPtMgr.getLocation().then(function(location) {
      _this.show();
      bcuPtMgr.setupPoints(bcuMap);

      var InfoTitleBarHeader, InfoHTMLTxt;

      InfoTitleBarHeader = "YAHI";
      InfoHTMLTxt = "<b>You are located here.</b>";

      var pointConfig = {
        type: "Mapspot",
        pointID: "YAHI",
        title: "YAHI",
        lat: location.latitude,
        lon: location.longitude,
        userPlottedPoint: false,
        popupTitle: InfoTitleBarHeader,
        popupContent: InfoHTMLTxt,
        selected: false
      }
      var yahiPW = bcuPtMgr.createPointWrapper(pointConfig);
      bcuPtMgr.addPointWrp(yahiPW);
      bcuPtMgr.plot();
      bcuPtMgr.onShow();
      _this.presentAllPoints();
      ESRIMap.ptWrpMgr = bcuPtMgr;
    }, function(errorMessage) {
      /*fail, errorMessage is the string you passed to reject*/
      console.error("get location async method failed");
      throw Error("get location async method failed");
    });
  };


  this.setBCUListAndPreCacheMapData = function(bcuList, hide, rslv) {
    /*iterate through BCUList and get Map data*/
    var regions = [];

    for (var i = 0; i < bcuList.length; i++) {
      /*initialize bcu objects*/
      var bcu = new MapManager.BCU(this);
      bcu.setAttributes(bcuList[i]);
      bcuMap[bcuList[i].bcuID] = bcu;

    }
    this.addMapLayers();
    if (rslv) rslv();

  };

  this.addMapLayers = function() {
    var allLayersArray = [];
    if (almcb_dbCache) {
      var geodbMap = almcb_dbCache.getGeoDBMap();

      for (var k in geodbMap) {
        if (geodbMap.hasOwnProperty(k)) {
          console.log(k);
          var db = geodbMap[k];
          console.log("" + db);
          var lyrArray = db.constructLayerConfig();
          for (var i = 0; i < lyrArray.length; i++) {
            allLayersArray.push(lyrArray[i]);
          }
        }
      }
      console.log("Layer to add:" + JSON.stringify(allLayersArray));
      var _this = this;
      omm.addLayers(allLayersArray).then(function() {
        console.log("layers added setup renderers");
        /*it seems the promise returns prematurely; layers are not; moving setupRenderers to map menu */
        /*_this.setupRenderers();*/
      },function(e){
        console.error("layers not loaded: " + JSON.stringify(allLayersArray) + "; error: " +e);
      });
    } else {
      console.warn("Cache is not initialized; map layers are not loaded");
    }
  };

  this.setupRenderers = function() {
    var renderers = [
      {
        layerName: "ROADS_PRI_SYNC",
        renderer: {
          "symbol": {
            "color": [255, 101, 33, 0],
            "outline": {
              "color": [255, 0, 0, 10],
              "style": "esriSLSDashDot",
              "type": "esriSLS",
              "width": 1.5
            },
            "style": "esriSFSSolid",
            "type": "esriSFS"
          },
          "type": "simple"
        },
        selectionColor: "#FF4D0F0F",
        selectionWidth: 4
      }, {
        layerName: "ROADS_SEC_SYNC",
        renderer: {
          "symbol": {
            "color": [255, 101, 33, 0],
            "outline": {
              "color": [255, 0, 0, 10],
              "style": "esriSLSDashDot",
              "type": "esriSLS",
              "width": 1.5
            },
            "style": "esriSFSSolid",
            "type": "esriSFS"
          },
          "type": "simple"
        },
        selectionColor: "#FF4D0F0F",
        selectionWidth: 4
      }, {
        layerName: "ROADS_GEN_SYNC",
        renderer: {
          "symbol": {
            "color": [255, 101, 33, 0],
            "outline": {
              "color": [255, 0, 0, 10],
              "style": "esriSLSDashDot",
              "type": "esriSLS",
              "width": 1.5
            },
            "style": "esriSFSSolid",
            "type": "esriSFS"
          },
          "type": "simple"
        },
        selectionColor: "#FF4D0F0F",
        selectionWidth: 4
      }
    ];
    window.launchbox.OfflineMapEsri.overrideRenderers(renderers);    
  };

};

MapManager.CensusMap.prototype = Object.create(MapManager.Map.prototype);
MapManager.CensusMap.prototype.constructor = CensusMap;



MapManager.CensusMap.listCachedFiles = function() {
  var omm = null;
  if (BRMAP.isTestHarness) {
    omm = RCMHarness;
  } else {
    omm = OMM;
    omm.initOfflineMaps();
  }
  var promise = new Promise(function(resolve, reject) {
    omm.listCachedFilesAsync(function(d) {
      console.log("Data Received: " + JSON.stringify(d));
    }).then(function(data) {
      if (data) {
        resolve(data);
      } else {
        console.error("listCachedFiles: No Data Received");
        reject(Error("listCachedFiles: No Data Received"));
      }
    });

    console.log("get cached files");
  });
  return promise;
};

MapManager.CensusMap.synchrnizedGetWorkItem = function(caseWorkId, caseKeyId) {
  var promise = new Promise(function(resolve, reject) {
    /* do a thing, possibly async, then…*/
      pega.offline.clientstorehelper.getWorkItem(
        caseWorkId,
        function(result) {
          console.debug("AdCan: new work item retrieved.");
          console.log("work item data for caseID:" + caseWorkId + "\n" + JSON.stringify(result));
          MobileTestData.collect(caseWorkId, JSON.stringify(result));
          var localData = result.pyData;
          var bcuData;
          if (localData) {
            var BCUPage = localData.BCU;
            if (BCUPage) {
              bcuData = {
                caseID: caseWorkId,
                bcuID: BCUPage.BCUID,
                tract: BCUPage.Tract,
                region: BCUPage.State + BCUPage.County,
                county: BCUPage.County,
                state: BCUPage.State,
                latitude: BCUPage.Latitude,
                longitude: BCUPage.Longitude,
                wrkStatus: BCUPage.Status,
                pzInsKey: localData.pzInsKey,
                pzInsKeyCase: caseKeyId

              };
            }
          }
          resolve(bcuData);
        },
        function(d) {
          console.error("getWorkItem: unable to retrieve caseWorkId:" + caseWorkId + ";error:"  +d);
	      bcuData = {
                caseID: caseWorkId,
                error: d
          };
          resolve(bcuData);
        });
  });
  return promise;
};

MapManager.CensusMap.getCaseData = function() {
  var promise = new Promise(function(resolve, reject) {

    var caseList = CChlpr.findPage("D_pyUserWorkList.pxResults");
    MobileTestData.collect("D_pyUserWorkList", JSON.stringify(caseList));

    /*var caseList = CChlpr.findPage("D_UserWorkListByType.pxResults");
    if (!caseList) {
      caseList = CChlpr.findPage("D_pyUserWorkList.pxResults");
      MobileTestData.collect("D_pyUserWorkList", JSON.stringify(caseList));
    } else {
      MobileTestData.collect("D_UserWorkListByType", JSON.stringify(caseList));
    }*/

    var BCUList = [];
    var countOfCases = 0;
    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var caseWorkId = "";
      var caseKeyId = "";
      while (caseIterator.hasNext()) {
        casePage = caseIterator.next();
        countOfCases += 1;
        console.log(casePage.getJSON());
        if (casePage) {
          caseWorkId = CChlpr.getPageProperty(casePage, "pxRefObjectKey");
          caseKeyId = CChlpr.getPageProperty(casePage, "pzInsKey");
          MapManager.CensusMap.synchrnizedGetWorkItem(caseWorkId, caseKeyId).then(function(data) {
            BCUList.push(data);
            if (BCUList.length >= countOfCases) {
              var BCUListAdCan = [];
              for (var k in BCUList) {
			  	if (BCUList[k] && BCUList[k].caseID && BCUList[k].caseID.indexOf("ADCAN")>0 && !BCUList[k].error) {
                  BCUListAdCan.push(BCUList[k]);
                }
              }
              resolve(BCUListAdCan);
            }
          }, function(data) {
            /*this code will never be invoke. In synchrnizedGetWorkItem even on reject we resolve so we don't fail when getWorkItem doesn't return data
            There may still be cases that can be worked upon.
            */
            console.error("getWorkItems failed for caseid:" + caseWorkId);
            reject(new Error("getWorkItems failed for caseid:" + caseWorkId));
          });
        }
      }
    } else {
      console.error("no case data");
      reject(new Error("no case data"));
    }
  });
  return promise;
};

/*
Before calling ALMCB_GetOfflineData listCachedFiles is invoked synchronously which returns all the files already cached on device.

ALMCB_GetOfflineData invokes getCaseData (synchronously) to gets BCUList {caseID,bcuID,tract,region,county,state,latitude,longitude,wrkStatus} from the py_UserWorkList and getWorkItem

After getCaseData completes, setBCUListAndPreCacheMapData is invoked to initialize BCU for the CensusMap. It also determines which regions are not cached and caches it by invoking 

precacheVTPKBasemap followed by precacheCensusReqion, both are invoked synchronously one after the other. Once precacheCensusReqion completes map is shown or hidden based on "hide" parameter

passed to ALMCB_GetOfflineData

 */
var almcb_dbCache = null;

function ALMCB_PrecacheMapData(cachedFiles, hide, mapConfig) {
  try {
    var promise = new Promise(function(resolve, reject) {
      almcb_dbCache = new MapManager.GeoDBCache(cachedFiles);
      MapManager.CensusMap.getCaseData().then(function(data) {
        almcb_dbCache.setBCUListAndPreCacheMapData(data, hide, resolve);
      }, function(data) {
        console.error("ALMCB_PrecacheMapData: No Case Data Received");
        alert("Unable to retrieve Case Data. Please contact your System Administrator");
        reject(new Error("Unable to retrieve Case Data. Please contact your System Administrator"));
      });
    });
    return promise;
  } catch (e) {
    console.log(e);
    throw (e);
  }
}


function ALMCB_GetOfflineData(cachedFiles, hide, mapConfig) {
  try {
    var promise = new Promise(function(resolve, reject) {
      new MapManager.getMapInstance(cachedFiles, hide, mapConfig).then(
        function(dtS) {
          MapManager.CensusMap.getCaseData().then(function(data) {
            cbGlbMap.setBCUListAndPreCacheMapData(data, hide, resolve);
          }, function(data) {
            console.error("ALMCB_GetOfflineData: No Case Data Received");
            alert("Unable to retrieve Case Data. Please contact your System Administrator");
            reject(new Error("Unable to retrieve Case Data. Please contact your System Administrator"));
          });
        },
        function(dtR) {
          console.log("Handle map instantiation issues here");
        });
    });
    return promise;
  } catch (e) {
    console.log(e);
    throw (e);
  }
}

MapManager.getMapInstance = function(cachedFiles, hide, mapConfig) {
  var promise = new Promise(function(resolve, reject) {
    if (mapConfig.reset || !cbGlbMap) {
      if (cbGlbMap) {
        cbGlbMap.removePoints();
      }
      cbGlbMap = new MapManager.CensusMap(cachedFiles, mapConfig, resolve);
      cbGlbMap.configureMap(resolve);
    } else {
      resolve();
    }
  });

  return promise;
}

function ALMCB_HowToCheckCacheStatus(region) {
  console.log("CensusMap->ALMCB_HowToCheckCacheStatus : region is " + region);
  try {
    if (!region) {
      region = "88008";
    }
    /*todo: (0) @CR  */
    cbGlbMap.getCacheStatus(region).then(function(data) {
      console.log("Cache Status for region(" + region + ") is : " + data);
      if (data) {
        console.log("Allow users to work on the block.");
        cached = true;
      } else {
        console.log("Don't allow users to work on the block");
      }
    });
    return data;
  }
  catch (err)
  {
    return false;
  }
}

var MobileTestData = MobileTestData || {};

MobileTestData.Collector = function() {
  this.cfg = {
    createNewFile: true,
  };
  this.buffer = {};
  this.fs = null;
  this.fileName = "MobileTestData.js";


  this.initFS = function() {
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      requestFileSystem(window.LocalFileSystem.EXTERNAL, 1024 * 1024, function(filesystem) {
        _this.fs = filesystem;
        if (_this.cfg.createNewFile) {
          _this.createFile();
        }
        resolve(_this);
      }, function(e) {
        _this.errorHandler(e);
        reject(new Error("unable to access device file system"));
      });

    });
    return promise;
  };

};

MobileTestData.Collector.prototype.errorHandler = function(e) {
  var msg = '';
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      console.log(JSON.stringify(e));
      msg = e.name;
      break;
  }
  console.log('Error: ' + msg);
};



MobileTestData.Collector.prototype.createFile = function() {
  if (this.cfg.createNewFile) {
    this.fs.root.getFile(this.fileName, {
      'create': true
    }, function(fileEntry) {
      console.log("Created " + fileEntry.name + " file.");
    }, this.errorHandler);
  }
  this.cfg.createNewFile = false;
};

MobileTestData.Collector.prototype.cache = function(key, value) {
  /*key = key.substring(key.lastIndexOf(" ")+1);*/
  console.log("storing in cache:" + key);
  if (this.buffer[key]) {
    key += key + "_" + ESRIMap.genrateGUID();
  }
  this.buffer[key] = JSON.parse(value);
};

MobileTestData.Collector.prototype.flush = function() {
  _this = this;
  this.fs.root.getFile(this.fileName, {
    'create': false
  }, function(fileEntry) {
    var writer = fileEntry.createWriter();
    console.log("writer.length: " + writer.length + "writer.queueOperations:" + writer.queueOperations);
    /*
		overwrite the case don't reposition
		writer.seek(writer.length);*/
    writer.queueOperations = true;
    console.log("flushing cache");
    writer.write(JSON.stringify(_this.buffer));
    writer.onwriteend = function(event) {
      console.log("jsonTestData written");
    };
    writer.onerror = function(event) {
      console.log("jsonTestData not persisted. An error occured.");
    };
  }, this.errorHandler);
};

MobileTestData.Collector.prototype.store = function(key, value) {
  this.fs.root.getFile(this.fileName, {
    'create': false
  }, function(fileEntry) {
    var writer = fileEntry.createWriter();
    console.log("writer.length: " + writer.length + "writer.queueOperations:" + writer.queueOperations);
    writer.seek(writer.length);
    writer.queueOperations = true;
    console.log("writting to file: " + key);
    writer.write("jsonTestData['" + key + "'] = '" + value + "'; \n");
    writer.onwriteend = function(event) {
      console.log("jsonTestData written");
    };
    writer.onerror = function(event) {
      console.log("jsonTestData not persisted. An error occured.");
    };
  }, this.errorHandler);
};

MobileTestData.Collector.prototype.readFile = function() {
  this.fs.root.getFile(this.fileName, {}, function(entry) {
    entry.file(function(fd) {
      var reader = new FileReader();
      reader.onload = function(event) {
        console.log("Read: " + reader.result);
      };
      reader.onerror = function(event) {
        console.log("Error occured.");
      };
      reader.readAsText(fd);
    }, this.errorHandler);
  }, this.errorHandler);
};

MobileTestData.Collector.prototype.deleteFile = function() {
  this.fs.root.getFile(this.fileName, {
    'create': false
  }, function(fileEntry) {
    fileEntry.remove(function() {
      console.log("File removed.");
    }, this.errorHandler);
  }, this.errorHandler);
};


MobileTestData.Collector.prototype.createDir = function() {
  this.fs.root.getDirectory("fooDir", {
    'create': true
  }, function(dirEntry) {
    console.log("Created " + dirEntry.name + " dir.");
  }, this.errorHandler);
};

MobileTestData.Collector.prototype.lookupFiles = function() {
  var dirReader = this.fs.root.createReader();
  dirReader.readEntries(function(entries) {
    if (!entries.length) {
      console.log('Filesystem is empty.');
    } else {
      console.log(JSON.stringify(entries));
    }
    /*_this.initFS();*/
  }, false);
};

MobileTestData.Collector.prototype.removeDir = function() {
  this.fs.root.getDirectory('fooDir', {}, function(dirEntry) {
    dirEntry.removeRecursively(function() {
      console.log('Directory successfully removed.');
    }, this.errorHandler);
  }, this.errorHandler);
};

MobileTestData.de = null;
MobileTestData.collectData = false;

/*How to use this feature
1. Call MobileTestData.enableDataCollection() from console after launching and signing into the app
2. Bring up any Map view
3. Call MobileTestData.enableDataCollection() again
4. Optional: Check what's cached, place MobileTestData.de in console an hit enter; examine the object in console. You should see BCUs, Cases and D_pyUserWorkList
5. Invoke MobileTestData.de.flush() from console to save the data in [device root]\MobileTestData.js
6. Toggle USB file transfer and get the MobileTestData.js on your desktop
7. Open MobileTestData.js copy the string into http://www.freeformatter.com/javascript-escape.html to convert to JS friendly escaped JSON
8. Copy the escaped string and set the variable masterJSON in the RCHarness.js
*/
MobileTestData.enableDataCollection = function() {
  MobileTestData.collectData = true;
  if (cbGlbMap) {
    cbGlbMap.collectAllBCUGeomerty();
  }
}

MobileTestData.collect = function(key, data) {

  /*function wait(ms) {
	  console.log("Waiting for data collector");
	  var deferred = $.Deferred();
	  setTimeout(function() {
	    if (!MobileTestData.de) {
	      wait(ms);
	    } else {
	      deferred.resolve;
	    }
	  }, ms);
	  return deferred.promise();
	};*/
  if (MobileTestData.collectData) {
    if (!MobileTestData.de) {
      MobileTestData.de = new MobileTestData.Collector();
      MobileTestData.de.initFS();
      MobileTestData.de.cache(key, data);
    } else {
      MobileTestData.de.cache(key, data);
      /*MobileTestData.de.store(key, data);*/
    }
  }
}