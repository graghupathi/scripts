/**** Author: Rohit Chaudhri
Creation Date: Sept 29th 2016
****/

/***

TODO: Remove grobal variable ESRIMap.ptWrpMgr
TODO: Encapsulate global map variable in TestHarnessMaps.js
TODO: ESRIMap.PointManagers review logic

***/
/*todo: rename testharnessmaps to ESRIMapInterface.js*/
console.log("Loading ESRIMapInterface.js");

var ESRIMap = ESRIMap || {};

/**Client Cache Helper**/
var CChlpr = CChlpr || {};

/**
TODO: OMM global variable
*/
var globalMap = null;

/* Track the configuration state */

ESRIMap.eventListeners = {
  onAction: function(data) {
    console.log("ESRIMapInterface->ESRIMap.eventListeners: invoked");
    console.log("Action " + data.actionID + " called");
    
    if (data.actionID === "userLocation") {
      globalMap.centerUserLocation(10);
    }
    if (data.actionID === "centerCensus") {
      globalMap.centerAt(ESRIMap.censusHQ);
    }
    if (data.actionID === "centerPR") {
      globalMap.centerAt(ESRIMap.PR);
    }
    if (data.actionID === "idfeatures") {
      cbGlbMap.setupRenderers();
    }
    if (data.actionID === "legend") {
      globalMap.showLegend();
    }
    if (data.actionID === "basemaps") {
      globalMap.switchBasemap();
    }
    if (data.actionID === "layers") {
      globalMap.switchLayers();
    }
    if (data.actionID === "hideMap") {
      globalMap.hide();
    }
  },
  onPointAction: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onPointAction: invoked");
    console.log("ESRIMapInterface->ESRIMap.onPointAction: " + "Action " + data.actionID + " called from point " + data.pointID);
    if (data.actionID === "hideMap") {
      globalMap.hide();
    }
    if (data.actionID === "verify") {
      globalMap.changeIcon(data.pointID, "complete");
    }
    if (data.actionID === "delete") {
      globalMap.changeIcon(data.pointID, "delete");
    }
    if (data.actionID === "userLocation") {
      globalMap.centerUserLocation(10);
    }

    try {
      if (ESRIMap.ptWrpMgr) {
        if (ESRIMap.ptWrpMgr.onPointAction) {
          ESRIMap.ptWrpMgr.onPointAction(data);
        } else {
          Console.log("ESRIMapInterface->ESRIMap.onPointAction: " + "WARNING: onPointAction not defined");
        }
      }
    } catch (e) {
      console.log(e.message);
      throw e;
    }

  },
  onShow: function() {
    console.log("ESRIMapInterface->ESRIMap.onShow: invoked");
    console.log("ESRIMapInterface->ESRIMap.onShow: " + "onShow called from callback");
    ESRIMap.onShow();
  },
  onHide: function() {
    console.log("ESRIMapInterface->ESRIMap.onHide: invoked");
    console.log("ESRIMapInterface->ESRIMap.onHide: " + "onHide called");
    if (ESRIMap.ptWrpMgr.onHide) ESRIMap.ptWrpMgr.onHide();
  },
  onPointCreated: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onPointCreated: invoked");
    console.log("ESRIMapInterface->ESRIMap.onPointCreated: " + "onPointCreated called " + data.pointID +
      " at: " + data.location.lat + ", " + data.location.lon);
  },
  onPointSelected: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onPointSelected: invoked");
    console.log("ESRIMapInterface->ESRIMap.onPointSelected: " + "onPointSelected invoked for pointID: " + data.pointID);
    if (ESRIMap.ptWrpMgr) {
      if (ESRIMap.ptWrpMgr.onPointSelected) {
        ESRIMap.ptWrpMgr.onPointSelected(data);
      } else {
        console.log("onPointSelected not implemented by PointManager");
      }
    }
  },
  onLongPress: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onLongPress: invoked");
    console.log("ESRIMapInterface->ESRIMap.onLongPress: " + "longPress at " + data.location.lat + ", " + data.location.lon);
    if (ESRIMap.ptWrpMgr) {
      if (ESRIMap.ptWrpMgr.onLongPress) {
        ESRIMap.ptWrpMgr.onLongPress(data);
      } else {
        console.log("onLongPress not implemented by: " + ESRIMap.ptWrpMgr.screenName);
      }
    }
  },
  onViewpointChanged: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onViewpointChanged: invoked");
    console.log("ESRIMapInterface->ESRIMap.onViewpointChanged: " + "data: " + data);
  },
  onMapLoaded: function() {
    console.log("ESRIMapInterface->ESRIMap.onMapLoaded: " + "Map is ready");
  },
  onMouseMove: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onMouseMove: invoked");
    if (ESRIMap.ptWrpMgr) {
      ESRIMap.ptWrpMgr.onMouseMove(data);
    } else {
      console.log("ESRIMapInterface->ESRIMap.onMouseMove: " + "onMouseMove not implemented by PointManager");
    }
  },
  onTap: function(data) {
    console.log("ESRIMapInterface->ESRIMap.onTap: invoked" + JSON.stringify(data));
    navigator.notification.confirm(
    	'You are the winner!', /* message*/
    	 onConfirm,            /* callback to invoke with index of button pressed*/
    	'Game Over',           /* title */
   	  ['Restart','Exit']     /* buttonLabels*/
    );
    if (ESRIMap.ptWrpMgr) {}
    if (cbGlbMap) {
      /*cbGlbMap.selectBCU("00013600");*/
    }
    console.log("ESRIMapInterface->ESRIMap.onTap: " + "onTap not implemented by PointManager");

  }
};

ESRIMap.configureEmptyMap = function(cfg, rslv) {
  console.log("ESRIMapInterface->ESRIMap.configureEmptyMap: invoked");
  try {
    console.log("ESRIMapInterface->ESRIMap.configureEmptyMap: " + "Map is not configured, calling configure");
    var myCenter = this.USCenter;
    var config = {
      activeStyle: {
        displayName: "Streets",
        source: "STREETS"
      },
      styles: [{
        displayName: "Streets",
        source: "STREETS"
      }, {
        displayName: "MAF/TIGER",
        source: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer"
      }],
      title: (cfg.mapTitle) || "Map Title",
      disableNavBar: false,
      backButtonText: "\uE00F  "
    };

    console.log("ESRIMapInterface->ESRIMap.configureEmptyMap: " + "Make me a browser map");
    globalMap = new BRMAP.Map(config, myCenter, rslv);
    globalMap.setEventListeners(this.eventListeners);
    globalMap.configureMenu(this.menuActions);
    globalMap.setIcons(CensusMap.icons);
    globalMap.setShowUserLocation(true);
    globalMap.lockOrientation(true);
    try {
      globalMap.addFeatureLayer("States", "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2");
    } catch (e) {
      console.log("ESRIMapInterface->ESRIMap.configureEmptyMap: " + "error: " + e.message);
    }
    globalMap.showCenter();
    globalMap.printMapStatus();
    this.mapConfigured = true;
  } catch (e) {
    console.log("ESRIMapInterface->ESRIMap.configureEmptyMap: " + "error: " + e.message + "\n" + e.stack);
    throw e;
  }
};

ESRIMap.queryTest = function() {

  var layer = {
    file: "88008.geodatabase",
    tableName: "BCU_90_SYNC",
    type: "geodatabase"
  };

  OMM.query(layer, "BCU = '00015900'", null, null, ESRIMap.queryResultHandler);
};

ESRIMap.queryResultHandler = function(data) {
  console.log("ESRIMapInterface->ESRIMap.queryResultHandler: invoked");
  console.log("ESRIMapInterface->ESRIMap.queryResultHandler: " + data);
  var objID = data.features[0].attributes.OBJECTID;
  console.log("ESRIMapInterface->ESRIMap.queryResultHandler: " + "objID: " + objID);
  OMM.selectFeatureById(objID, "BCU_90_SYNC");


  var objGeo = data.features[0].geometry;
  console.log("ESRIMapInterface->ESRIMap.queryResultHandler: " + "Geo: " + JSON.stringify(objGeo));
  OMM.buffer(objGeo, 10, function(data) {
    console.log("ESRIMapInterface->ESRIMap.queryResultHandler: " + "Buffer: " + JSON.stringify(data));

    OMM.zoomToGeometry(JSON.stringify(data));
  });
};

ESRIMap.addOfflineLayersAtlantis = function() {
  console.log("ESRIMapInterface->ESRIMap.addOfflineLayersAtlantis: invoked");
  var filenames = [];
  filenames.push({
    file: "88008.geodatabase"
  });
  OMM.addLayers(filenames);
  console.log("ESRIMapInterface->ESRIMap.addOfflineLayersAtlantis: " + "OfflineMap.addLayers called");
};

ESRIMap.configureAtlantis = function(cfg, rslv) {
  console.log("ESRIMapInterface->ESRIMap.configureAtlantis: invoked");
  try {
    console.log("ESRIMapInterface->ESRIMap.configureAtlantis: " + "Map is not configured, calling configure");
    var myCenter = this.USCenter;
    var config = {

      activeBasemap: "Census (Atlantis)",
      basemapConfigs: [{
        name: "Census (Atlantis)",
        layers: [{
          displayName: "Atlantis Vector",
          file: "Atlantis_24OCT2016.vtpk"
        }]
      }],
      portal: {
        url: "http://ditd012arcgisd.boc.ad.census.gov/arcgis"
      },
      title: (cfg.mapTitle) || "Atlantis",
      disableNavBar: false,
      backButtonText: "\uE00F  ",
      canIdentify: true,
      idConfig: [{
        layerName: "ROADS_PRI_SYNC",
        labelField: "BASENAME",
        displayAttributes: ["BASENAME"]
      }, {
        layerName: "ROADS_SEC_SYNC",
        labelField: "BASENAME",
        displayAttributes: ["BASENAME"]
      }, {
        layerName: "ROADS_GEN_SYNC",
        labelField: "BASENAME",
        displayAttributes: ["BASENAME"]
      }, /*{
        layerName: "BCU_90_SYNC",
        labelField: "BCU",
        remove this displayAttributes: ["BCU", "ACO", "TRACT", "COUNTY", "STATE"]
        displayAttributes: ["*"]
      }, {
        layerName: "TRACT_90_SYNC",
        labelField: "NAME",
        displayAttributes: ["NAME", "COUNTY", "STATE"]
      }*/],
      idMode: "JS"
    };
    globalMap = OMM;
    globalMap.initOfflineMaps();
    globalMap.configure(config);

    globalMap.setEventListeners(this.eventListeners);
    globalMap.configureMenu(this.menuActions);
    globalMap.setIcons(CensusMap.icons);

    globalMap.centerAt(ESRIMap.USCenter);

    globalMap.lockOrientation(true);
    globalMap.setShowUserLocation(true);

    OMM.OfflineMaps.show().then(function() {
      globalMap.showCenter();
      this.mapConfigured = true;
    });
    if (rslv) rslv();
  } catch (e) {
    console.log("ESRIMapInterface->ESRIMap.configureAtlantis: " + "error: " + e.message + "\n" + e.stack);
    throw e;
  }
};

ESRIMap.ReportingUnit = function(rptID) {
  console.log("ESRIMapInterface->ESRIMap.ReportingUnit: invoked");
  this.reportingUnitID = rptID.trim();
  this.addressStatus = null;
  this.addressSelected = false;
  this.locationAddress = null;
  this.isValidRptUnit = false;
  var structureType = null;
  var address = null;
  var unitPointFlag = false;
  var newAddress = false;

  this.setStructureType = function(strType) {
    structureType = strType;
  };
  this.getStructureType = function() {
    return structureType;
  };


  this.setAddress = function(straddr) {
    address = straddr;
  };
  this.getAddress = function() {
    return address;
  };

  this.setNewAddress = function(newaddr) {
    newAddress = newaddr;
  };
  this.getNewAddress = function() {
    return newAddress;
  };
  
  this.setUnitPointFlag = function(unitPtFlg) {
    unitPointFlag = unitPtFlg;
  };
  this.getUnitPointFlag = function() {
    return unitPointFlag;
  };


  this.isValid = function() {
    console.log("ESRIMapInterface->ESRIMap.ReportingUnit: " + "isValid invoked for RptID:" + this.reportingUnitID + "; validation status is:" + this.isValidRptUnit);
    return this.isValidRptUnit;
  };
  this.getStatus = function() {
    return this.addressStatus;
  };
  this.setStatus = function(st) {
    this.addressStatus = st;
  };
  this.getSelected = function() {
    return this.addressSelected;
  };
  this.setSelected = function(flag) {
    this.addressSelected = flag;
  };
  this.isSelected = function() {
    return this.addressSelected;
  };
  this.getReportingUnitID = function() {
    return this.reportingUnitID;
  };
  if (this.reportingUnitID.length == 0) {
    this.isValidRptUnit = false;
  } else {
    this.isValidRptUnit = true;
  }
};

/*todo: remove ESRIMap.iconSelected*/
ESRIMap.iconSelected = "incomplete";

/*todo: remove ESRIMap.resetSelectedIcon*/
ESRIMap.resetSelectedIcon = function() {
  console.log("ESRIMapInterface->ESRIMap.resetSelectedIcon: invoked");
  if (this.iconSelected == "default_onFocus") {
    this.iconSelected = "incomplete";
  } else {
    this.iconSelected = "default_onFocus";
  }
};

ESRIMap.PointWrapper = function(pptMgr) {
  console.log("ESRIMapInterface->ESRIMap.PointWrapper: invoked");
  var wrkedListingStatus = "Worked";
  var iconSelected = ESRIMap.iconSelected;
  var iconDefault = "default";
  var iconCompleted = "complete";
  var zoom = 14;
  var point = {}; /*OMM Point*/
  var infoTemplate = null; /*OMM InfoTemplate: {header: 'what you want to see in the title bar',htmlText: 'other info you want to display'}*/
  var plotted = false;
  var selected = false;
  var newPoint = false; /*Did the point came from the case or was it plotted by a user. newPoint==true when plotted by user*/
  var pointIDGen = false; /*track if point ID was generated*/
  var type = "MapSpot";
  var mapTitle = "";
  var postCreateState = null;
  var ptMgr = pptMgr;

  this.unitList = new Array(); /*list of ReportingUnit*/
  this.validPoint = false;
  this.listingStatus = "";
  this.isUnitPoint = false;

  var pointPostCreateState = function() {
    var title = "";
    var subTitle = "";
    var actions = "";

    this.setTitle = function(tlt) {
      title = tlt;
    };

    this.getTitle = function() {
      return title;
    };

    this.setSubTitle = function(stlt) {
      subTitle = stlt;
    };

    this.getSubTitle = function() {
      return subTitle;
    };

    this.setActions = function(a) {
      actions = a;
    };

    this.getActions = function() {
      return actions;
    };
  };
  
  this.isPointIDGenerated = function() {
    return pointIDGen;
  };

  this.setPointIDGenerated = function() {
    pointIDGen = true;
  };
  
  this.generatePointID = function() {
    pointIDGen = true;
    var tmpID = ESRIMap.genrateGUID();
    return tmpID;
  };

  this.menuAction = {
    actionID: null
  };

  this.userInput = {
    accepted: false,
    manual: {
      lat: null,
      lon: null
    },
    gps: {
      lat: null,
      lon: null
    }
  };

  this.getMapTitle = function() {
    return mapTitle;
  };
  this.setMapTitle = function(mTitle) {
    mapTitle = mTitle;
  };

  this.setListingStatus = function(status) {
    if (status == wrkedListingStatus) {
      this.listingStatus = status;
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.setListingStatus: " + "todo: Listing status is not being set");
    }
  };

  this.setDefaultIcon = function(iconName) {
    iconDefault = iconName;
  }

  /*todo: delegate icon setup for example Michael had to add the CFS icon here*/
  this.setType = function(typ) {
    type = typ;
    switch (type) {
      case "Lister":
        point.iconName = "Lister";
        iconDefault = "Lister";
        break;
      case "Enumerator":
        point.iconName = "Enumerator";
        iconDefault = "Enumerator";
        break;
      case "CFS":
        point.iconName = "CFS";
        iconDefault = "CFS";
        break;
      case "SelectedEnum":
        point.iconName = "SelectedEnum";
        iconDefault = "SelectedEnum";
        break;
      default:
        point.iconName = "default";
        iconDefault = "default";
    }
  };

  this.setIcon = function(iconCallBack) {
    if (iconCallBack) {
      point.iconName = iconCallBack(this);
      iconDefault = point.iconName;
    } else {
      this.setType();
    }
  }

  this.toString = function() {
    var thisObjValues = "" +
      "pointID:" + this.getPointID() + "\n" +
      "Listing Status:" + this.listingStatus + "\n" +
      ";private point.title:" + point.title + "\n" +
      ";pw.menuAction.actionID: " + this.menuAction.actionID + "\n" +
      ";pw.userInput.accepted:" + this.userInput.accepted + "\n" +
      ";pw.userInput.manual.lat:" + this.userInput.manual.lat + "\n" +
      ";pw.userInput.manual.lon:" + this.userInput.manual.lon + "\n" +
      ";pw.userInput.gps.lat:" + this.userInput.gps.lat + "\n" +
      ";pw.userInput.gps.lon:" + this.userInput.gps.lon + "\n" +
      ";private point.location.lat:" + point.location.lat + "\n" +
      ";private point.location.lon:" + point.location.lon;
    return thisObjValues;
  };
  this.isNew = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.isNew: " + this.getPointID() + " is new: " + newPoint);
    return newPoint;
  };

  this.setNewPoint = function(flag) {
    newPoint = flag;
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.isNew: " + this.getPointID() + " is new: " + newPoint);
  };

  this.isValid = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.isValid: " + "isValid called for pointID: " + point.pointID + ";validation status:" + this.validPoint);
    return this.validPoint;

  };

  this.toggleSelected = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.toggleSelected: invoked");
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.toggleSelected: " + "toggleSelected called for pointID: " + point.pointID);
    /**
		TODO: OMM.OfflineMaps && OMM.OfflineMaps.dismissCallout
		*/
    if (OMM && OMM.OfflineMaps && OMM.OfflineMaps.dismissCallout) {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.toggleSelected: " + "dismissCallout any callout");
      OMM.OfflineMaps.dismissCallout();
    }
    if (plotted) {
      /*Possible BUG IN ESRI - i shouldn't need to remove a point. Some how with change icon stale menu is maintained*/
      globalMap.removePoint(point.pointID);
      this.toggleIcon();
      globalMap.addPoint(point, infoTemplate);
      /*this.toggleIcon();
			globalMap.changeIcon(point.pointID, point.iconName);*/
    }
  };
  
  this.getPointIconToUse =function (){
      if (selected) {
        point.iconName = iconSelected;
      } else {
        /*did ay child define a method named getDangerous*/
        if (this.getDangerous) {
          if (!this.getDangerous() && this.listingStatus == wrkedListingStatus) {
            point.iconName = iconCompleted;
          } else {
            point.iconName = iconDefault;
          }
        } else {
          if (this.listingStatus == wrkedListingStatus) {
            point.iconName = iconCompleted;
          } else {
            point.iconName = iconDefault;
          }
        }
      }
  };
  
  this.addPoint = function(show) {
    try {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addPoint: invoked");
      this.getPointIconToUse();
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addPoint: " + "icon set to " + point.iconName);

      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addPoint: " + "PointID:" + this.getPointID() + ";show:" + show + ";selected:" + this.getSelected() + ";plotted:" + this.getPlotted());
      if (show) {
        globalMap.addPoint(point, infoTemplate);
        this.setPlotted(true);
      } else {
        if (this.getPlotted()) globalMap.removePoint(point.pointID);
      }
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addPoint: " + "PointID:" + this.getPointID() + ";show:" + show + ";selected:" + this.getSelected() + ";plotted:" + this.getPlotted());
      return {
        show: show,
        selected: this.getSelected()
      };
    } catch (e) {
      console.log(e.message + "\n" + e.stack);
      throw e;
    }
  };
  this.toggleIcon = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.toggleIcon: " + "toggleIcon called for pointID: " + point.pointID);
    selected = !selected;
	this.getPointIconToUse();
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.toggleIcon: " + "toggleIcon, icon set to " + point.iconName);
  };
  this.removePlot = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.removePlot: " + "toggleIcon called for pointID: " + point.pointID);
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.removePlot: " + "removePlot called for pointID: " + point.pointID);
    if (OMM && OMM.OfflineMaps && OMM.OfflineMaps.dismissCallout) {
      OMM.OfflineMaps.dismissCallout();
    }    
    point.iconName = iconDefault;
    if (plotted) globalMap.removePoint(point.pointID);
    plotted = false;
    selected = false;
  };

  this.setSubTitle = function(subtitle) {
    point.subtitle = subtitle;
  };

  this.setPointActions = function(acts) {
    point.actions = acts;
  };

  this.setPointTitle = function(ttl) {
    point.title = ttl;
  };

  this.resetState = function() {
    if (postCreateState) {
      this.setPointTitle(postCreateState.getTitle());
      this.setPointActions(postCreateState.getActions());
      this.setSubTitle(postCreateState.getSubTitle());
    }
  };


  this.postCreateSetup = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "invoked");
    if (!postCreateState) postCreateState = new pointPostCreateState();

    if (ptMgr.buildPointTitle) {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "calling buildPointTitle");
      /*todo: removed global ref to pointmanager*/
      var pttitle = ptMgr.buildPointTitle(this);
      if (pttitle) {
        this.setPointTitle(pttitle);
        postCreateState.setTitle(pttitle);
        console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "Title for point id: " + this.getPointID() + " is:" + pttitle);
      }
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "WARNING: buildPointTitle not defined by Point Manager, actions provided when point wrapper was created will be used");
    }


    if (ptMgr.buildPointActions) {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "calling buildPointActions");
      /*todo: removed global ref to pointmanager*/
      var acts = ptMgr.buildPointActions(this);
      if (acts) {
        this.setPointActions(acts);
        postCreateState.setActions(acts);
        console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "Action for point id: " + this.getPointID() + " is:" + acts);
      }
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "WARNING: buildPointActions not defined by Point Manager, actions provided when point wrapper was created will be used");
    }


    if (ptMgr.buildPointSubTitle) {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "calling buildPointSubTitle");
      /*todo: removed global ref to pointmanager*/
      var sbt = ptMgr.buildPointSubTitle(this);
      if (sbt) {
        this.setSubTitle(sbt);
        postCreateState.setSubTitle(sbt);
        console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "Subtitle for point id: " + this.getPointID() + " is:" + sbt);
      }
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.postCreateSetup: " + "WARNING: buildPointSubTitle not defined by Point Manager, subTitle provided when point wrapper was created will be used");
    }

  };

  this.plot = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.plot: " + "PointWrapper plot");
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.plot: " + "Plotting PointID:" + this.getPointID());
    this.postCreateSetup();
    return this.addPoint(true);
  };
  this.getPlotted = function() {
    return plotted;
  };
  this.setPlotted = function(flag) {
    plotted = flag;
  };
  this.getSelected = function() {
    return selected;
  };
  this.setSelected = function(flag) {
    selected = flag;
  };
  /*when setSelected is overridden and the child needs to set the provate selected variable*/
  this.setSelectedParent = function(flag) {
    selected = flag;
  };
  this.getPointID = function() {
    return point.pointID;
  };
  this.getLat = function() {
    return point.location.lat;
  };
  this.getLon = function() {
    return point.location.lon;
  };
  this.getZoom = function() {
    return zoom;
  };
  this.getPoint = function() {
    return point;
  };

  this.getPointGeometry = function() {
    var pt = {};
    /*pt.geometry 
        point;*/
    pt.geometry = {
      spatialReference: {
        wkid: 4326
      },
      x: point.location.lon,
      y: point.location.lat
    };
    return pt;
  }

  /*Specialize for Browser*/
  this.addReportingUnit = function(unit) {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.addReportingUnit: " + "invoked");
    var bReplaced = false;
    /* check for valid reporting unit id */
    if (unit.isValid()) {
      /* check for duplicate reporting unit id */
      /* TODO: make into a reusable function */
      for (var i = 0; i < this.unitList.length; i++) {
        if (unit.getReportingUnitID() == this.unitList[i].getReportingUnitID()) {
          console.log("ESRIMapInterface->ESRIMap.PointWrapper.addReportingUnit: " + "Replacing ReportingUnit:" + unit.getReportingUnitID());
          this.unitList[i] = unit;
          bReplaced = true;
        }
      }
      /* add only if new reporting unit point */
      if (bReplaced == false) {
        console.log("ESRIMapInterface->ESRIMap.PointWrapper.addReportingUnit: " + "Adding ReportingUnit:" + unit.getReportingUnitID());
        this.unitList.push(unit);
      }
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addReportingUnit: " + "After replace or push; unitList.length: " + this.unitList.length + " " + this.getPointID() + " " + this.unitList[this.unitList.length - 1].getReportingUnitID() + " " + this.unitList[this.unitList.length - 1].getStatus());
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.addReportingUnit: " + "***********************ReportingUnit:" + unit.getReportingUnitID() + "is not valid; NOT ADDED to PointID: " + this.getPointID() + "***********************");
    }
  };
  /*Specialize for Browser*/
  this.getReportingUnitList = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.getReportingUnitList: " + " invoked");
    var rptList = new Array();
    for (var i = 0; i < this.unitList.length; i++) {
      var unit = this.unitList[i];
      rptList.push(unit.getReportingUnitID());
    }
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.getReportingUnitList: " + " returning list:" + rptList);
    return rptList;
  };
  /*Specialize for Browser*/
  this.getReportingUnitObjects = function() {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.getReportingUnitObjects: " + " invoked");
    var rptList = new Array();
    for (var i = 0; i < this.unitList.length; i++) {
      var unit = this.unitList[i];
      rptList.push(unit);
    }
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.getReportingUnitList: " + "getReportingUnitObjects invoked. returning object array of length:" + rptList.length);
    return rptList;
  };

  this.createPoint = function(ptCfg) {
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.createPoint: " + " invoked");
    console.log("ESRIMapInterface->ESRIMap.PointWrapper.createPoint: " + "createPoint invoked for point type: " + ptCfg.type + " pointID: " + ptCfg.pointID);

    /*check for mandatory attributes*/
    var vLatLon = true;
    var regValidatorLatLon = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

    if (ptCfg.pointID) {
      ptCfg.pointID = ptCfg.pointID.trim();
    }

    if (!regValidatorLatLon.test(ptCfg.lat + "," + ptCfg.lon)) {
      vLatLon = false;
    }

    if (ptCfg.pointID.length == 0 || !vLatLon) {
      this.validPoint = false;
    } else {
      this.validPoint = true;
    }

    if (ptCfg.pointID.length === 0) {
      /*generate a guid for pointID*/
      ptCfg.pointID = this.generatePointID();
      ptCfg.popupTitle = "Point ID: " + ptCfg.pointID;
    }

    if (ptCfg.userPlottedPoint == true) {
      newPoint = true;
    }

    infoTemplate = {
      header: ptCfg.popupTitle,
      htmlText: ptCfg.popupContent
    };
    var subTitle = "";
    if (ptMgr.pointMenu.subtitle === undefined || ptMgr.pointMenu.subtitle.trim().length == 0) {
      subTitle = "Latitude:" + ptCfg.lat + "/Longitude: " + ptCfg.lon;
    } else {
      subTitle = ptMgr.pointMenu.subtitle.trim();
    }

    if ((ptCfg.listingStatus) && ptCfg.listingStatus == wrkedListingStatus) {
      this.listingStatus = ptCfg.listingStatus;
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.createPoint: " + "todo: Listing status is not set");
    }

    if ((ptCfg.isUnitPoint)) {
      this.isUnitPoint = ptCfg.isUnitPoint;
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointWrapper.createPoint: " + "isUnitPoint is not set");
    }

    mapTitle = ptCfg.title + "(" + ptCfg.pointID + ")";

    if (!postCreateState) postCreateState = new pointPostCreateState();

    postCreateState.setSubTitle(subTitle);
    postCreateState.setTitle(mapTitle);
    postCreateState.setActions(ptMgr.pointMenu.actions);

    point = {
      pointID: ptCfg.pointID,

      title: mapTitle,
      subtitle: subTitle,
      actions: ptMgr.pointMenu.actions,
      location: {
        lat: ptCfg.lat,
        lon: ptCfg.lon
      },
      iconName: "defaultPin",
      editable: true
    };
    type = ptCfg.type;
    if (selected) selected = ptCfg.selected;

    /*todo: delegate icon setup for example Michael had to add the CFS icon here. Look at line :324*/
    switch (ptCfg.type) {
      case "Lister":
        point.iconName = "Lister";
        iconDefault = "Lister";
        break;
      case "Enumerator":
        point.iconName = "Enumerator";
        iconDefault = "Enumerator";
        break;
      case "CFS":
        point.iconName = "CFS";
        iconDefault = "CFS";
        break;
      case "SelectedEnum":
        point.iconName = "SelectedEnum";
        iconDefault = "SelectedEnum";
        break;
      default:
        point.iconName = "default";
        iconDefault = "default";
    }

  };
};

ESRIMap.BrowserPointWrapper = function(pptMgr) {
  ESRIMap.PointWrapper.call(this, pptMgr);
};

ESRIMap.BrowserPointWrapper.prototype = Object.create(ESRIMap.PointWrapper.prototype);
ESRIMap.BrowserPointWrapper.prototype.constructor = ESRIMap.BrowserPointWrapper;

ESRIMap.ALMPointWrapper = function(pptMgr) {
  console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper: " + " invoked");
  ESRIMap.PointWrapper.call(this, pptMgr);
  var dangerous = false;
  /*todo: fix the name for setupForAttach*/
  var setupForAttach = false;

  this.getForAttach = function() {
    return setupForAttach;
  };
  this.setForAttach = function(flag) {
    setupForAttach = flag;
  };

  this.setDangerous = function(flag) {
    dangerous = flag;
  };

  this.getDangerous = function() {
    return dangerous;
  };
  
  
  this.setIcon = function() {
    if (dangerous) {
      var point = this.getPoint();
      point.iconName = "Dangerous";
      this.setDefaultIcon(point.iconName);
    } else {
      this.setType();
    }
  };

  this.plot = function() {
    var show = true;
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.plot: " + "ALMPointWrapper plot");
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.plot: " + "Plotting PointID:" + this.getPointID());
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.plot: " + "iterating unitList of length: " + this.unitList.length);
    for (var i = 0; i < this.unitList.length; i++) {
      var unit = this.unitList[i];
      var addrStatus = unit.getStatus();
      console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.plot: " + "PointID:" + this.getPointID() + ";ReportingUnitID:" + unit.getReportingUnitID() + ";Unit Status:" + unit.getStatus() + ";isSelected:" + unit.isSelected());
      /*
      US-2470 requires UTW to be shown
      if (addrStatus == SetLALiterals.addressStatus_DNE || addrStatus == SetLALiterals.addressStatus_UTW) {
      */
      if (addrStatus == SetLALiterals.addressStatus_DNE) {
        show = false;
      }
      if (unit.isSelected()) {
        this.setSelected(true);
      }
    }

    this.postCreateSetup();
    return this.addPoint(show);
  };

  this.setSelected = function(flag) {
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.setSelected: " + " invoked");
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.setSelected: " + "ALMPointWrapper.setSelected invoked for pointID: " + this.getPointID() + " setting selection state to: " + flag);
    console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.setSelected: " + "setSelected iterating unitList of length: " + this.unitList.length);
    for (var i = 0; i < this.unitList.length; i++) {
      var unit = this.unitList[i];
      console.log("ESRIMapInterface->ESRIMap.ALMPointWrapper.setSelected: " + "ALMPointWrapper setSelected for pointID: " + this.getPointID() + ";reportingUnitID: " + unit.reportingUnitID + ";Selected state:" + unit.getSelected());
      unit.setSelected(flag);
    }
    this.setSelectedParent(flag);
  };

};

ESRIMap.ALMPointWrapper.prototype = Object.create(ESRIMap.PointWrapper.prototype);
ESRIMap.ALMPointWrapper.prototype.constructor = ESRIMap.ALMPointWrapper;

ESRIMap.GenericPointWrapperChild = function(ptCfg, pptMgr) {
  switch (ptCfg.type) {
    case "Lister":
    case "Enumerator":
      /*todo: (0) @PM test passing of pptMgr to BrowserPointWrapper*/
      ESRIMap.BrowserPointWrapper.call(this, pptMgr);
      ESRIMap.GenericPointWrapperChild.prototype = Object.create(ESRIMap.BrowserPointWrapper.prototype);
      break;
    default:
      ESRIMap.ALMPointWrapper.call(this, pptMgr);
      ESRIMap.GenericPointWrapperChild.prototype = Object.create(ESRIMap.ALMPointWrapper.prototype);
  }
  this.createPoint(ptCfg);
};

ESRIMap.GenericPointWrapperChild.prototype.constructor = ESRIMap.GenericPointWrapperChild;

ESRIMap.PointManager = function(scrnType) {
  console.log("ESRIMapInterface->ESRIMap.PointManager: " + " invoked");
  this.screenName = scrnType;
  this.pointWrpMap = {};
  this.pointWrpMapLength = 0;
  this.currentSelectedPointID = null;
  this.originalSelectedPointID = null;
  this.lastPlottedPoint = null; /*No point may be selected when the data is loaded, this is used to remove the last point if none is selected*/
  this.pointMenu = {};
  var removeSelectedOrLastPoint = false;
  var pointsAttached = false;

  this.hasPoints = function() {
    if (this.pointWrpMapLength > 0) {
      return true;
    } else {
      return false;
    }
  };
  this.removePoints = function() {
    console.log("ESRIMapInterface->ESRIMap.PointManager.removePoints: " + " invoked");
    console.log("ESRIMapInterface->ESRIMap.PointManager.removePoints: " + "Point Manager removing All points");
    this.clearAllPlots();
    this.pointWrpMap = {};
    this.pointWrpMapLength = 0;
  };

  this.getPointsAttached = function() {
    return pointsAttached;
  };
  this.setPointsAttached = function(flag) {
    pointsAttached = flag;
  };


  /*TO DO - specialize for browser*/
  this.addPointWrp = function(pw) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + " invoked");
    console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "addPointWrp invoked for point id: " + pw.getPointID());
    if (pw.isValid()) {
      if (this.isPointAdded(pw.getPointID()) == true) {
        console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "point id: " + pw.getPointID() + " already managed by PointManager. This point is a UnitPoint:" + pw.isUnitPoint);
        if (pw.isUnitPoint) {
          console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "Checking if previously managed point is a UnitPoint");
          if (this.pointWrpMap[pw.getPointID()].isUnitPoint) {
            console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "Existing/previously managed point is a UnitPoint");
          } else {
            console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "Existing/previously managed point is NOT a UnitPoint. Update Lat/Lon from UnitPoint");
            var existingPW = this.pointWrpMap[pw.getPointID()];
            existingPW.getPoint().location.lat = pw.getPoint().location.lat;
            existingPW.getPoint().location.lon = pw.getPoint().location.lon;
            /*
						JS passes complex type by reference hence the following is not needed.
						this.pointWrpMap[pw.getPointID()] = existingPW;
						*/
          }
        }
        var expw = this.pointWrpMap[pw.getPointID()];
        var rptList = pw.getReportingUnitObjects();
        console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "size of ReportingUnit List send in to method addPointWrp:" + rptList.length);
        /*if (rptList.length==0) {console.log("No reporting unit associated with this point. Please check code");}*/
        if (rptList.length == 1) {
          console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "addPointWrp; Adding ReportingUnitID: " + rptList[0].getReportingUnitID() + " for managed pointID: " + pw.getPointID());
          expw.addReportingUnit(rptList[0]);
        }
        /*if (rptList.length=>1) {console.log("At this point there should only be one reporting unit; something is wrong please check the code");}*/
      } else {
        console.log("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "point id: " + pw.getPointID() + " is not managed by PointManager; adding to PointManager");
        this.pointWrpMap[pw.getPointID()] = pw;
        this.pointWrpMapLength += 1;
      }
    } else {
      console.error("ESRIMapInterface->ESRIMap.PointManager.addPointWrp: " + "**************point id: " + pw.getPointID() + " is not VALID point. THIS WON'T BE PLOTTED***************************");
      this.pointWrpMap[pw.getPointID()] = pw;
      this.pointWrpMapLength += 1;

    }

  };

  this.setupPointMenu = function(pointMenu) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.setupPointMenu: " + " invoked");
    if (!pointMenu) {
      console.log("ESRIMapInterface->ESRIMap.PointManager.setupPointMenu: " + "Point menu is not defined; No menu will appear for this point");
    }
    if (pointMenu && pointMenu.actions) {
      for (var index in pointMenu.actions) {
        if (pointMenu.actions.hasOwnProperty(index)) {
          if (!pointMenu.actions[index].displayName || !pointMenu.actions[index].actionID) {
            console.log("ESRIMapInterface->ESRIMap.PointManager.setupPointMenu: " + "Menu for point not defined correctly; action.displayName and action.actionID are mandatory");
            throw ("Menu for point not defined correctly; action.displayName and action.actionID are mandatory");
          }
        }
      }
      if (!pointMenu.subtitle) {
        console.log("ESRIMapInterface->ESRIMap.PointManager.setupPointMenu: " + "Point subtitle is not defined; No subtitle will appear for this point");
      }
      this.pointMenu = pointMenu;
    }
  };

  this.setupDefaultPointMenu = function() {
    console.log("ESRIMapInterface->ESRIMap.PointManager.setupDefaultPointMenu: " + " invoked");
    this.pointMenu = {
      subtitle: "<b>Click to open Menu for:</b><br><i>PointID: $pointID$</i>",
      actions: [{
        displayName: "Verified",
        actionID: "verify"
      }, {
        displayName: "Edit",
        actionID: "actionID12"
      }, {
        displayName: "Delete",
        actionID: "delete"
      }, {
        displayName: "Cancel",
        actionID: "actionID14"
      }]
    };
  };

  this.isPointAdded = function(pointID) {
    if (this.pointWrpMap[pointID]) {
      return true;
    }
    return false;
  };
  this.centerAt = function(pointID) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.centerAt: " + " invoked");
    console.log("ESRIMapInterface->ESRIMap.PointManager.centerAt: " + "Point Manager centerAt invoked for pointID: " + pointID);
    var pw = this.pointWrpMap[pointID];
    if (pw) {
      console.log("ESRIMapInterface->ESRIMap.PointManager.centerAt: " + "zoom level: " + pw.getZoom());
      globalMap.centerAt(ESRIMap.convertToZoomPoint(pw));
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointManager.centerAt: " + "Error, " + pointID + " pointID doesn't exist");
    }

  };

  this.userException = function(message) {
    this.message = message;
    this.name = "Point Manager Exception";
    this.toString = function() {
      return name + " Exception: " + message;
    };
  };

  /*this.setSelectedPoint = function(pointID) {
		var k = null;
		var pw = null;
		for (k in this.pointWrpMap) {
      if (this.pointWrpMap.hasOwnProperty(k)) {
			pw = this.pointWrpMap[k];
			console.log("In setSelectedPoint PointID to select: " + pointID);
			console.log("In setSelectedPoint PointID: " + k + " point state: " + pw.getSelected());
			this.currentSelectedPointID = pointID;
			if (k !== pointID) {
				pw.setSelected(false);
			} else {
				pw.setSelected(true);
			}
		}
    }
		pw = this.pointWrpMap[pointID];
		console.log("exiting setSelectedPoint PointID: " + pointID + " point state: " + pw.getSelected());
	}*/

  this.getSelectedPointWrapper = function() {
    return this.pointWrpMap[this.currentSelectedPointID];
  };

  this.setSelectedPoint = function(pointID) {
    var k = null;
    var pw = null;
    for (k in this.pointWrpMap) {
      if (this.pointWrpMap.hasOwnProperty(k)) {
        pw = this.pointWrpMap[k];
        console.log("ESRIMapInterface->ESRIMap.PointManager.setSelectedPoint: " + "In setSelectedPoint PointID to select: " + pointID);
        console.log("ESRIMapInterface->ESRIMap.PointManager.setSelectedPoint: " + "In setSelectedPoint PointID: " + k + " point state: " + pw.getSelected());
        this.currentSelectedPointID = pointID;
        /*
			(k!==pointID && pw.getSelected())
			Can't use the above logic as a point could be selected at create time but the user could have selected another point 
			by clicking on the point, however at that time unit(s) associated the the previously selected point are not reset to
			not selected, this is because there may be many units associated with the point and the operation may become time consuming
			*/
        if (k !== pointID) {
          pw.setSelected(false);
        }

        if (k === pointID && !pw.getSelected()) {
          pw.setSelected(true);
        }
      }
    }
    pw = this.pointWrpMap[pointID];
    console.log("ESRIMapInterface->ESRIMap.PointManager.setSelectedPoint: " + "exiting setSelectedPoint PointID: " + pointID + " point state: " + pw.getSelected());
  };

  /*Note: when no_zoomFlag == true zoom won't be invoked*/
  this.plot = function(no_zoomFlag) {
    /*THIS METHOD DOESNOT CATER FOR MULTIPLE SELECTED POINTS*/
    /*For allow multiple selected points modify the foreach loop below and also think through how you would manage the unitList loop in PointWrapper.plot*/
    try {
      console.log("ESRIMapInterface->ESRIMap.PointManager.plot: " + "Point Manager plot invoked. Number of points to plot: " + this.pointWrpMapLength);
      var pw = null;
      var plottedPoints = 0;
      for (var k in this.pointWrpMap) {
        if (this.pointWrpMap.hasOwnProperty(k)) {
          console.log("ESRIMapInterface->ESRIMap.PointManager.plot: " + "Plotting PointID: " + k);
          pw = this.pointWrpMap[k];
          if (pw.isValid()) {
            var pointState = pw.plot();
            plottedPoints++;
            /* if no points are selected then set the first point as selected */
            if (pointState.selected) {
              this.currentSelectedPointID = pw.getPointID();
              currSel = this.currentSelectedPointID;
              console.log("Currently Selected Point: " + currSel);
            }
            if (!this.lastPlottedPoint) {
              this.lastPlottedPoint = pw.getPointID();
            }
          }
        }
      }
      if (plottedPoints !== this.pointWrpMapLength) {
        console.warn(plottedPoints + " points plotted out of " + this.pointWrpMapLength);
      } else {
        console.log(plottedPoints + " points plotted out of " + this.pointWrpMapLength);
      }
      pw = null;
      if (this.currentSelectedPointID) {
        pw = this.pointWrpMap[this.currentSelectedPointID];
      } else {
        pw = this.pointWrpMap[this.lastPlottedPoint];
      }
      /*if there are no valid point pw will be nu;; or undefined*/
      /*Note: when no_zoomFlag == true zoom won't be invoked*/
      /*
      if (pw) {
        globalMap.presentAllPoints();
        
        if (no_zoomFlag) {
          globalMap.centerAt(ESRIMap.convertToZoomPoint(pw), no_zoomFlag);
        } else {
          globalMap.centerAt(ESRIMap.convertToZoomPoint(pw));
        }
      }*/

      /*
			This can be changed to onPlotComplete to invoke additional functionality after plotting is done
			this.onShow();*/
    } catch (e) {
      console.log("ESRIMapInterface->ESRIMap.PointManager.plot: " + "error: " + e.message);
      console.log("ESRIMapInterface->ESRIMap.PointManager.plot: " + "error stack: " + e.stack);
      throw e;
    }

  };
  this.clearAllPlots = function() {
    console.log("ESRIMapInterface->ESRIMap.PointManager.clearAllPlots: " + " invoked");
    try {
      for (var k in this.pointWrpMap) {
        if (this.pointWrpMap.hasOwnProperty(k)) {
          console.log("ESRIMapInterface->ESRIMap.PointManager.clearAllPlots: " + "Clearing Plot for Point: " + k);
          var pw = this.pointWrpMap[k];
          pw.removePlot();
        }
      }
      this.currentSelectedPointID = null;
      this.lastPlottedPoint = null;
    } catch (e) {
      console.log("ESRIMapInterface->ESRIMap.PointManager.clearAllPlots: " + "error: " + e.message);
      throw e;
    }
  };
  this.toggleSelected = function(pointID) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.toggleSelected: " + " invoked");
    var pw = null;
    console.log("ESRIMapInterface->ESRIMap.PointManager.toggleSelected: " + "Currently Selected Point: " + this.currentSelectedPointID);
    /*are we moving from point to point*/
    if (this.currentSelectedPointID != null && this.currentSelectedPointID != pointID) {
      /*user moved from previous point, so toggle it*/
      console.log("ESRIMapInterface->ESRIMap.PointManager.toggleSelected: " + "Toggle previous point: " + this.currentSelectedPointID);
      pw = this.pointWrpMap[this.currentSelectedPointID];
      pw.toggleSelected();
    }
    if (this.currentSelectedPointID == null) {
      /*There was no selected point previously*/
      pw = this.pointWrpMap[pointID];
      if (!pw.getSelected()) {
        pw.toggleSelected();
      }
      this.currentSelectedPointID = pw.getPointID();
    }
    if (this.currentSelectedPointID != pointID) {
      /*toggle the new location too*/
      console.log("ESRIMapInterface->ESRIMap.PointManager.toggleSelected: " + "Toggle new point: " + pointID);
      pw = this.pointWrpMap[pointID];
      if (!pw.getSelected()) {
        pw.toggleSelected();
      }
      this.currentSelectedPointID = pw.getPointID();
    }

    /*this.getSelectedMapSpotReportingUnit();*/
  };
  this.getSelectedMapSpotReportingUnit = function() {
    console.log("ESRIMapInterface->ESRIMap.PointManager.getSelectedMapSpotReportingUnit: " + " invoked");
    var rptList = new Array();
    if (this.currentSelectedPointID != null) {
      var pw = this.pointWrpMap[this.currentSelectedPointID];
      rptList = pw.getReportingUnitList();
    }
    console.log("ESRIMapInterface->ESRIMap.PointManager.getSelectedMapSpotReportingUnit: " + "Selected Map Spot Reporting Units: " + rptList);
    return rptList;
  };

  var ptMenuDeffered = $.Deferred();
  var success = function(position) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.success: " + " invoked");
    /*resolve the ptMenuDeffered with your object as the data*/
    ptMenuDeffered.resolve({
      longitude: position.coords.longitude,
      latitude: position.coords.latitude
    });
    console.log("ESRIMapInterface->ESRIMap.PointManager.getSelectedMapSpotReportingUnit: " + "success:::lon/lat:" + position.coords.longitude + "," + position.coords.latitude);

  };

  var fail = function() {
    console.log("ESRIMapInterface->ESRIMap.PointManager.fail: " + " invoked");
    /*reject the ptMenuDeffered with an error message*/
    console.log("ESRIMapInterface->ESRIMap.PointManager.getSelectedMapSpotReportingUnit: " + "async method failed");
    ptMenuDeffered.reject('failed!');
  };

  this.getLocation = function() {
    navigator.geolocation.getCurrentPosition(success, fail, {
      enableHighAccuracy: true,
      timeout: 10 * 1000 * 1000,
      maximumAge: 0
    });

    setTimeout(function working() {
      if (ptMenuDeffered.state() === "pending") {
        ptMenuDeffered.notify("working... ");
        setTimeout(working, 500);
      }
    }, 1);

    return ptMenuDeffered.promise();
  };
  this.setRemoveLastOrSelectedPoint = function(flag) {
    removeSelectedOrLastPoint = flag;
  };
  this.getSelectedOrLastPoint = function() {
    return removeSelectedOrLastPoint;
  };


  /*Init here*/
};

ESRIMap.PointManager.prototype.createPointWrapper = function(ptCfg) {
  return new ESRIMap.GenericPointWrapperChild(ptCfg, this);
};

ESRIMap.PointManager.prototype.setupDummyData = function() {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.setupDummyData: " + " invoked");
  latLonList = [{
    lat: 18.42745,
    lon: -67.15407,
    addr: '1 Yellow Brook'
  }, {
    lat: 18.4663338,
    lon: -66.1087774,
    addr: '2 Yellow Brook'
  }, {
    lat: 18.01108,
    lon: -66.61406,
    addr: '3 Yellow Brook'
  }, {
    lat: 17.98413,
    lon: -66.11378,
    addr: '4 Yellow Brook'
  }];
  for (var i = 0; i < latLonList.length; i++) {
    var geo = latLonList[i];
    var pointConfig = {
      type: "MapSpot",
      /*change to Enumerator to see Enumerator icon*/
      pointID: "Point " + i,
      title: geo.addr,
      lat: geo.lat,
      lon: geo.lon,
      userPlottedPoint: false,
      popupTitle: "Point " + i,
      popupContent: geo.addr
    };

    var pw = this.createPointWrapper(pointConfig);

    for (var x = 0; x <= 3; x++) {
      var rptUnit = new ESRIMap.ReportingUnit("ReportUnitID-" + i + "/" + x);
      if (i == 3) {
        rptUnit.setStatus(SetLALiterals.addressStatus_DNE);
      } else {
        rptUnit.setStatus(SetLALiterals.addressStatus_GQ);
      }
      if (i == 2) {
        /*assume this is the selected point*/
        /*set the second address as the selected address*/
        if (x == 1) rptUnit.setSelected(true);
      }
      pw.addReportingUnit(rptUnit);
      console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.setupDummyData: " + pw.getPointID() + " " + rptUnit.getReportingUnitID() + " " + rptUnit.getStatus() + " isSelected:" + rptUnit.isSelected());
    }
    this.addPointWrp(pw);
  }
};

ESRIMap.PointManager.prototype.getNewlyPlottedPoints = function() {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.getNewlyPlottedPoints: " + " invoked");
  try {
    var newPoints = {};
    for (var k in ESRIMap.ptWrpMgr.pointWrpMap) {
      if (this.pointWrpMap.hasOwnProperty(k)) {
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.getNewlyPlottedPoints: " + "introspecting PointID: " + k);
        var pw = ESRIMap.ptWrpMgr.pointWrpMap[k];
        if (pw.isNew()) {
          newPoints[pw.getPointID()] = pw;
        }
      }
    }
    return newPoints;
  } catch (e) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.getNewlyPlottedPoints: " + "error: " + e.message);
    throw e;
  }

};

ESRIMap.PointManager.prototype.onPointAction = function(data) {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + " invoked");

  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "PointManager onPointAction Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);

  try {

    this.getLocation().then(
      function(location) {
        var gpsCords = null;
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "getLocation invoked");
        var point = {
          lat: location.latitude,
          lon: location.longitude
        };
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "lon/lat:" + point.lon + "," + point.lat);
        gpsCords = {
          lon: point.lon,
          lat: point.lat
        };

        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "gpsCords.lat:" + gpsCords.lat + ";gpsCords.lon:" + gpsCords.lon);
        var pw = ESRIMap.ptWrpMgr.pointWrpMap[data.pointID];
        if (pw) {
          var pt = pw.getPoint();
          pw.menuAction = data;
          pw.userInput.manual.lat = pt.location.lat || null;
          pw.userInput.manual.lon = pt.location.lon || null;
          pw.userInput.gps.lat = gpsCords.lat;
          pw.userInput.gps.lon = gpsCords.lon;
          ESRIMap.ptWrpMgr.pointWrpMap[data.pointID] = pw;

          console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "actionID: " + pw.menuAction.actionID +
            "pointID:" + pw.getPointID() +
            ";pw.userInput.accepted:" + pw.userInput.accepted +
            ";pw.userInput.manual.lat:" + pw.userInput.manual.lat +
            ";pw.userInput.manual.lon:" + pw.userInput.manual.lon +
            ";pw.userInput.gps.lat:" + pw.userInput.gps.lat +
            ";pw.userInput.gps.lon:" + pw.userInput.gps.lon
          );

          /*alert("PointID: " + pw.getPointID() + "\n\n" +
					    "Accepted: " + pw.userInput.accepted + "\n\n" +
					    "Manual Lat: " + pw.userInput.manual.lat + "\n" +
					    "Manual Lon: " + pw.userInput.manual.lon + "\n\n" +
					    "GPS Lat: " + pw.userInput.gps.lat + "\n" +
					    "GPS Lon: " + pw.userInput.gps.lon + "\n\n\n"
					    );*/

          if (ESRIMap.ptWrpMgr.processPointMenuAction) {
            ESRIMap.ptWrpMgr.processPointMenuAction(pw);
          } else {
            console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointAction: " + "WARNING: onPointMenuClick not defined");
          }
        } else {
          throw "point wrapper not found for pointID: " + data.pointID;
        }

      },
      function(errorMessage) {
        /*fail, errorMessage is the string you passed to reject*/
        console.log("get location async method failed");
        alert("failed");
      });
  } catch (e) {
    console.log(e.message);
    throw e;
  }

};

ESRIMap.PointManager.prototype.onPointSelected = function(data) {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointSelected: " + " invoked");
  console.log("PointManager onPointSelected Invoked for pointID: " + data.pointID);
  try {
    ESRIMap.ptWrpMgr.toggleSelected(data.pointID);
    if (ESRIMap.ptWrpMgr.processPointSelected) {
      ESRIMap.ptWrpMgr.processPointSelected(ESRIMap.ptWrpMgr.pointWrpMap[data.pointID]);
    } else {
      console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onPointSelected: " + "WARNING: onPointMenuClick not defined");
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }

};

ESRIMap.PointManager.prototype.onMouseMove = function(data) {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onMouseMove: " + " invoked");

  try {
    ESRIMap.ptWrpMgr.processMouseMove(ESRIMap.ptWrpMgr.pointWrpMap[data.attributes.id]);

  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

ESRIMap.PointManager.prototype.showCallout = function(pointID, hidePointCalloutOnClick) {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.showCallout: " + " invoked");
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.showCallout: " + "PointManager showCallout Invoked for pointID: " + pointID);
  try {
    var data = {
      pointID: pointID,
      dissmissCallot: hidePointCalloutOnClick
    };
    /**
		  TODO: OMM.OfflineMaps && OMM.OfflineMaps.showPointCallout
		*/

    if (OMM && OMM.OfflineMaps && OMM.OfflineMaps.showPointCallout) {
      OMM.OfflineMaps.showPointCallout(data.pointID, function(data) {
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.showCallout: " + "onAccessoryButtonTapped callback called, hide menu:" + data.dissmissCallot);
        if (data.dissmissCallot) {
          OMM.OfflineMaps.dismissCallout();
        }
        OMM.OfflineMaps.showPointActionSheet(data.pointID);
      });
    } else {
      globalMap.setMenuForPoint(this.pointWrpMap[data.pointID].getPoint());
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

ESRIMap.checkPointwithinBCU = function(data) {
  var newPt = data.geometry;
  var bcu = CChlpr.findPage("pyWorkPage.BCU");
  var bcuid = CChlpr.getPageProperty(bcu, "BCUID");
  var bcu = cbGlbMap.getBCU(bcuid);

  /*require(["esri/geometry/geometryEngine"], function(geometryEngine) {
    var newPt = data.geometry;
    var bcu = CChlpr.findPage("pyWorkPage.BCU");
    var bcuid = CChlpr.getPageProperty(bcu, "BCUID");
    var bcu = cbGlbMap.getBCU(bcuid);
      
      var conatined = geometryEngine.contains(bcu.getBCUGeometry(),newPt);

  });*/


  SpatialUtils.containsProject(bcu.getBCUGeometry(), newPt, function(data) {
    console.log("bcuContainsCallback:" + data);
    if (data.contains == true) {

      var newPt = data.geometry;
      console.log(JSON.stringify(newPt));

      var newIcon = {
        pointID: "Point_" + ("" + Math.random()).substring(2, 7),
        title: "Geo",
        subtitle: "New",
        geometry: newPt,
        iconName: "default",
        editable: false
      };

      globalMap.addPoint(newIcon);

      globalMap.showHint({
        title: "Unit captured",
        message: "Unit location updated",
        titleColor: "#FFFFFFFF",
        messageColor: "#FFdedfe0",
        backgroundColor: "#FF4aa564",
        duration: 6,
        position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
        hideOnTap: true,
        hideOnSwipe: true
      });
      globalMap.showPointActionSheet(newIcon.pointID);

    } else if (data.contains == false) {
      consloe.log("Point OUTSIDE the BCU, BAD");

      globalMap.showHint({
        title: "Unit outside the BCU",
        message: "You clicked outside the BCU boundary\nPlease Click again",
        titleColor: "#FFFFFFFF",
        messageColor: "#FFdedfe0",
        backgroundColor: "#FFcd2026",
        duration: 6,
        position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
        hideOnTap: true,
        hideOnSwipe: true
      });
    }
  });

};

/*todo: (1) @CM setBCU should be ALM specific*/
ESRIMap.PointManager.prototype.setBCU = function(bcu) {
  this.bcu = bcu;
};

ESRIMap.PointManager.prototype.onLongPress = function(pointData) {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + " invoked");
  _this = this;
  if (this.screenName === "Collect a MapSpot") {
    if (this.bcu) {
      this.bcu.isPointWithinBCU(pointData).then(function(data) {
        console.log("Point within bcu complete longPress");
        _this.longPressWrappper(pointData);
        globalMap.showHint({
          title: "Mapspot added",
          message: "",
          titleColor: "#FFFFFFFF",
          messageColor: "#FFdedfe0",
          backgroundColor: "#FF4aa564",
          duration: 4,
          position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
          hideOnTap: true,
          hideOnSwipe: true
        });
      }, function(data) {
        console.log("Point not within bcu show hint");
        globalMap.showHint({
          title: "The mapspot must be placed inside the block",
          message: "",
          titleColor: "#FFFFFFFF",
          messageColor: "#FFdedfe0",
          backgroundColor: "#FFcd2026",
          duration: 4,
          position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
          hideOnTap: true,
          hideOnSwipe: true
        });
      });
    } else {
      this.longPressWrappper(pointData);
    }
  }

};

ESRIMap.PointManager.prototype.longPressWrappper = function(data) {
  console.log("longPressWrappper on long press Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);
  try {
    var _this = this;
    this.getLocation().then(
      function(location) {
        var gpsCords = null;
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "getLocation invoked");
        var point = {
          lat: location.latitude,
          lon: location.longitude
        };
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "lon/lat:" + point.lon + "," + point.lat);
        gpsCords = {
          lon: point.lon,
          lat: point.lat
        };
        console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "gpsCords.lat:" + gpsCords.lat + ";gpsCords.lon:" + gpsCords.lon);
        var pwManaged = null;
        if (_this.pointWrpMap) {

          var orgSelectedPW = _this.pointWrpMap[_this.originalSelectedPointID];
          if (orgSelectedPW) {
            /*Is a point plotted for this point - then remove the old plot as a new point is being plotted. However retain the properties*/
            if (orgSelectedPW.getPlotted() && orgSelectedPW.unitList !== 0) {
              if (orgSelectedPW.unitList.length === 1) {
                /*Its a single unit point, remove the plot*/
                orgSelectedPW.removePlot();
                orgSelectedPW.getPoint().location.lat = data.location.lat;
                orgSelectedPW.getPoint().location.lon = data.location.lon;
                orgSelectedPW.setNewPoint(true);
                orgSelectedPW.plot();
                _this.toggleSelected(orgSelectedPW.getPointID());
                pwManaged = orgSelectedPW;
              } else {
                /*The pw is associated with multiple units, de-tach and create a new map spot for this unit*/
                var selectedRptID = CChlpr.getPageProperty("pyWorkPage.BCU.SelectedUnitPage", "ReportingUnitID");
                var unitToSegregate = null;
                var segregateUnitList = [];
                var newunitList = [];
                for (var i = 0; i < orgSelectedPW.unitList.length; i++) {
                  console.log(selectedRptID + " vs " + orgSelectedPW.unitList[i].getReportingUnitID());
                  if (selectedRptID === orgSelectedPW.unitList[i].getReportingUnitID()) {
                    unitToSegregate = orgSelectedPW.unitList[i];
                    segregateUnitList.push(unitToSegregate);
                  } else {
                    newunitList.push(orgSelectedPW.unitList[i]);
                  }

                }
                orgSelectedPW.unitList = newunitList;
				
                /*if there is no point ID its generated in createPoint */
                var pointConfig = {
                  type: "Mapspot",
                  pointID: "",
                  listingStatus: orgSelectedPW.listingStatus,
                  title: unitToSegregate.getAddress(),
                  lat: data.location.lat,
                  lon: data.location.lon,
                  userPlottedPoint: true,
                  popupTitle: "",
                  popupContent: unitToSegregate.getAddress(),
                  isUnitPoint: unitToSegregate.getUnitPointFlag()
                };

                var newPW = _this.createPointWrapper(pointConfig);
                newPW.unitList = segregateUnitList;
                _this.addPointWrp(newPW);
                newPW.plot();
                _this.toggleSelected(newPW.getPointID());
                _this.originalSelectedPointID = newPW.getPointID();
                pwManaged = newPW;
              }
            } else {
              /*point was not plotted as at creation time there was no valid lat/lon */
              orgSelectedPW.getPoint().location.lat = data.location.lat;
              orgSelectedPW.getPoint().location.lon = data.location.lon;
              orgSelectedPW.setNewPoint(true);  
              orgSelectedPW.plot();
              _this.toggleSelected(orgSelectedPW.getPointID());
              pwManaged = orgSelectedPW;
            }

          }

          pwManaged.userInput.accepted = false;
          pwManaged.userInput.manual.lat = data.location.lat || null;
          pwManaged.userInput.manual.lon = data.location.lon || null;
          pwManaged.userInput.gps.lat = gpsCords.lat; /*gpsPt.lat || null;*/
          pwManaged.userInput.gps.lon = gpsCords.lon; /*gpsPt.lon || null;*/
          console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "pointID:" + pwManaged.getPointID() +
            ";pwManaged.userInput.accepted:" + pwManaged.userInput.accepted +
            ";pwManaged.userInput.manual.lat:" + pwManaged.userInput.manual.lat +
            ";pwManaged.userInput.manual.lon:" + pwManaged.userInput.manual.lon +
            ";pwManaged.userInput.gps.lat:" + pwManaged.userInput.gps.lat +
            ";pwManaged.userInput.gps.lon:" + pwManaged.userInput.gps.lon
          );

          if (_this.processLongPress) {
            _this.processLongPress(pwManaged);
          } else {
            console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "WARNING: processLongPress not defined");
          }
          if (_this.processDoubleClick) {
            _this.processDoubleClick(pwManaged);
          } else {
            console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onLongPress: " + "WARNING: processDoubleClick not defined");
          }
        }
      },
      function(errorMessage) {
        /*fail, errorMessage is the string you passed to reject*/
        alert("Can't collect GPS - failure");
      });
  } catch (e) {
    console.log(e.message);
    throw e;
  }
};

ESRIMap.PointManager.prototype.onHide = function() {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onHide: " + " invoked");
  console.log("onhide Invoked");
  /**
	TODO: OMM.OfflineMaps && OMM.OfflineMaps.dismissCallout
	*/
  if (OMM && OMM.OfflineMaps && OMM.OfflineMaps.dismissCallout) {
    console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onHide: " + "dismissCallout any callout");
    OMM.OfflineMaps.dismissCallout();
  }

  if (this.processHide) {
    var newPoints = this.getNewlyPlottedPoints();
    ESRIMap.ptWrpMgr.processHide(newPoints);
    ESRIMap.ptWrpMgr.removePoints();
  } else {
    console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onHide: " + "WARNING: processHide not defined");
  }

};

ESRIMap.PointManager.prototype.onShow = function() {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onShow: " + " invoked");
  console.log("PointManager onShow Invoked");
  if (ESRIMap.ptWrpMgr.processShow) {
    ESRIMap.ptWrpMgr.processShow();
  } else {
    console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onShow: " + "WARNING: processHide not defined");
  }

};

ESRIMap.PointManager.prototype.parentSetupPoints = function() {
  console.log("ESRIMapInterface->ESRIMap.PointManager.prototype.onShow: " + " invoked");
  console.log("GenericPointManagerChild setupPoints invoked");
  try {
    var addresslist = [];
    var selectedUnit = CChlpr.getPageProperty("pyWorkPage.BCU", "SelectedUnit");
    console.log("selectedUnit : " + selectedUnit);
 
    var unitList = CChlpr.findPage("pyWorkPage.BCU.UnitList");
    /* loop each unit to get Unique ID, Lat, Lon and Address Info */
    if (unitList) {
      console.log("unitList length:" + unitList.length);
      var ULiterator = unitList.iterator();
      while (ULiterator.hasNext()) {
        var reportingUnit = ULiterator.next();
        var latVal = null;
        var lonVal = null;
        var newAddress = false;
 
        /* MAF Structure Point ID  */
        var mafStrPtIDVal = CChlpr.getPageProperty(reportingUnit, "MAFStructurePointID");
        var mafStrPtIDInd = CChlpr.getPageProperty(reportingUnit, "MAFStructurePointIDInd");
        console.log("mafStrPtIDVal: " + mafStrPtIDVal + "is new flag (MAFStructurePointIDInd):" + mafStrPtIDInd);
 
        /* Reporting Unit ID */
        var reportingUnitIDVal = CChlpr.getPageProperty(reportingUnit, "ReportingUnitID");
        console.log("reportingUnitIDVal: " + reportingUnitIDVal);
        if (reportingUnitIDVal === "") {
          /*This address was created by user by clicking the Add button. Genrate the reporting unit ID GUID*/
          reportingUnitIDVal = ESRIMap.genrateGUID();
          newAddress = true;
        }
        var ru = new ESRIMap.ReportingUnit(reportingUnitIDVal);
 
        /* Location Address struct & Lat / Lon values */
        var locationAddress = reportingUnit.get("LocationAddress");
 
        /*determine where to get lat long from*/
        var unitPoint = reportingUnit.get("UnitPoint");
        var isUnitPt = false;
        if (unitPoint) {
          console.log("Get Lat/Lon from unitPoint page");
          latVal = CChlpr.getPageProperty(unitPoint, "MarkerLatitude");
          lonVal = CChlpr.getPageProperty(unitPoint, "MarkerLongitude");
          var upMAFStructurePointID = CChlpr.getPageProperty(unitPoint, "PointID");
          console.log("unit Point mafStrPtIDVal: " + upMAFStructurePointID);
          /*use unitpoint MAFStructurePointID*/
          if (upMAFStructurePointID !== "") {
            mafStrPtIDVal = upMAFStructurePointID;
            
          }
 
          /**
           * [isUnitPt: Point Manager will use this to ensure it uses this reporting unit lat/lon. This is specially important when mutliple reporting unit have the same MAFStructurePointID]
           * @type {Boolean}
           */
          isUnitPt = true;
        } else {
          console.log("Get Lat/Lon from locationAddress page");
          latVal = CChlpr.getPageProperty(locationAddress, "OFLAT");
          lonVal = CChlpr.getPageProperty(locationAddress, "OFLON");
        }
 
        if ($.isNumeric(latVal)) latVal = parseFloat(latVal);
        console.log("latVal: " + latVal);
 
        if ($.isNumeric(lonVal)) lonVal = parseFloat(lonVal);
        console.log("lonVal: " + lonVal);
 
 
        var addressStatusVal = null;
        var structureType = null;
        var address = null;
        var dangerous = null;
        var lstStatusVal = null;
        var selectedPoint = false;
 
 
        /* PageIndex  ID */
        var pageIndexVal = CChlpr.getPageProperty(reportingUnit, "PageIndex");
 
        console.log("pageIndexVal: " + pageIndexVal);
        if (selectedUnit === pageIndexVal) {
          console.log("selectedUnit === pageIndexVal : " + pageIndexVal);
 
          selectedPoint = true;
 
          var selectedUnitPage = CChlpr.findPage("pyWorkPage.BCU.SelectedUnitPage");
 		  locationAddress = CChlpr.findPage("pyWorkPage.BCU.SelectedUnitPage.LocationAddress");
          
          addressStatusVal = CChlpr.getPageProperty(selectedUnitPage, "AddressStatus");
          structureType = CChlpr.getPageProperty(selectedUnitPage, "StructureType");
          address = CChlpr.getPageProperty(locationAddress, "FullAddress");
          dangerous = CChlpr.getPageProperty(selectedUnitPage, "DangerousAddress");
          lstStatusVal = CChlpr.getPageProperty(selectedUnitPage, "ListingStatus");
 
          ru.setSelected(true);
        } else {
          addressStatusVal = CChlpr.getPageProperty(reportingUnit, "AddressStatus");
          structureType = CChlpr.getPageProperty(reportingUnit, "StructureType");
          address = CChlpr.getPageProperty(locationAddress, "FullAddress");
          dangerous = CChlpr.getPageProperty(reportingUnit, "DangerousAddress");
          lstStatusVal = CChlpr.getPageProperty(reportingUnit, "ListingStatus");
        }
 
        if (!addressStatusVal) addressStatusVal = "UNKNOWN";
 
        console.log("addressStatusVal:" + addressStatusVal);
        console.log("structureType:" + structureType);
        console.log("address:" + address);
        console.log("dangerous:" + dangerous);
        console.log("lstStatusVal:" + lstStatusVal);
 
        /*address = address.replace(new RegExp("<br>", "g"),"\n");*/
 
        var pointConfig = {
          type: "Mapspot",
          pointID: mafStrPtIDVal,
          listingStatus: lstStatusVal,
          title: address,
          lat: latVal,
          lon: lonVal,
          userPlottedPoint: false,
          popupTitle: "Point ID: " + mafStrPtIDVal,
          popupContent: address,
          isUnitPoint: isUnitPt
        };
 
        /*if mafStrPtIDVal doesn't have a value a guid is assigned to point during the following call*/
        var pw = this.createPointWrapper(pointConfig);
        /*it may be a previously worked upon temp id*/
        if (mafStrPtIDInd === "N") {
          pw.setPointIDGenerated();
        }
        if (selectedPoint) {
          this.originalSelectedPointID = pw.getPointID();
        }        
        ru.setNewAddress(newAddress);
        ru.setStatus(addressStatusVal);
        ru.setStructureType(structureType);
        /*following is needed when we de-tach*/
        ru.setAddress(address);
        ru.setUnitPointFlag(isUnitPt);
        if (dangerous === "true" || dangerous === true) {
          pw.setDangerous(true);
        }
        pw.setIcon();
        

 
        pw.addReportingUnit(ru);
        this.addPointWrp(pw);
      }
    }
  } catch (e) {
    console.log(e.message + "\n" + e.stack);
    throw e;
  }
 
  return true;
};



ESRIMap.AddressListPointManager = function() {

  ESRIMap.PointManager.call(this, ESRIMap.ScreenName.addrLst);

  /*Initialize AddressListPointManager specific properties here*/

};

ESRIMap.AddressListPointManager.prototype = Object.create(ESRIMap.PointManager.prototype);

ESRIMap.AddressListPointManager.prototype.constructor = ESRIMap.AddressListPointManager;

ESRIMap.AddressListPointManager.prototype.setupPointMenu = function() {
  console.log("ESRIMapInterface->ESRIMap.AddressListPointManager.prototype.setupPointMenu: Invoked");
  console.log("setupPointMenu invoked for: " + this.screenName);
  this.pointMenu = {
    subtitle: "<b>Address List Screen</b>",
    actions: [{
      displayName: "Some Action",
      actionID: this.screenName + "_verified_yes"
    }, {
      displayName: "Another Choice",
      actionID: this.screenName + "_verified_no"
    }]
  };
  console.log("setupPointMenu invoked actions set: " + this.pointMenu.actions[0].displayName);
};

ESRIMap.AddressListPointManager.prototype.onShow = function() {
  return true;
};

ESRIMap.AddressListPointManager.prototype.onPointAction = function(data) {
  console.log("ESRIMapInterface->ESRIMap.AddressListPointManager.prototype.onPointAction: Invoked");
  console.log("AddressListPointManager onPoint Action Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);
};

ESRIMap.AddressListPointManager.prototype.onHide = function() {
  console.log("ESRIMapInterface->ESRIMap.AddressListPointManager.prototype.onHide: Invoked");
  console.log("Selected Map Spot Reporting Units:" + ESRIMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
  /*alert("Selected Map Spot Reporting Units:" + ESRIMap.ptWrpMgr.getSelectedMapSpotReportingUnit());*/
  SelectedAddressListUnit(ESRIMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
};

ESRIMap.GenericPointManagerChild = function(name) {

  ESRIMap.PointManager.call(this, name);

  /*Initialize GenericPointManagerChild specific properties here*/

};
ESRIMap.GenericPointManagerChild.prototype = Object.create(ESRIMap.PointManager.prototype);

ESRIMap.GenericPointManagerChild.prototype.constructor = ESRIMap.GenericPointManagerChild;

ESRIMap.PointManagers = {
  /*mapSpotMgr: new ESRIMap.MapSpotPointManager(),
	addrLstMgr: new ESRIMap.AddressListPointManager(),*/
};

ESRIMap.ptWrpMgr = null;

ESRIMap.switchPointMgr = function(scrName, show) {
  console.log("ESRIMapInterface->ESRIMap.switchPointMgr: Invoked");
  console.log("Previous Point Mgr Name: " + ESRIMap.ptWrpMgr.screenName);
  try {
    ESRIMap.ptWrpMgr.removePoints();
    switch (scrName) {
      case ESRIMap.ScreenName.mapSpot:
        ESRIMap.ptWrpMgr = ESRIMap.PointManagers.mapSpotMgr;
        break;
      case ESRIMap.ScreenName.addrLst:
        ESRIMap.ptWrpMgr = ESRIMap.PointManagers.addrLstMgr;
        break;
      default:
        throw scrName + " screen name doesn't exist";
    }
    console.log("Current Point Mgr Name: " + ESRIMap.ptWrpMgr.screenName);
    ESRIMap.ptWrpMgr.clearAllPlots();
    if (show) ESRIMap.onShow();
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

ESRIMap.switchPointMgr = function(scrName) {
  console.log("ESRIMapInterface->ESRIMap.switchPointMgr: Invoked");
  console.log("Previous Point Mgr Name: " + ESRIMap.ptWrpMgr.screenName);
  try {
    ESRIMap.ptWrpMgr.removePoints();
    switch (scrName) {
      case ESRIMap.ScreenName.mapSpot:
        ESRIMap.ptWrpMgr = ESRIMap.PointManagers.mapSpotMgr;
        break;
      case ESRIMap.ScreenName.addrLst:
        ESRIMap.ptWrpMgr = ESRIMap.PointManagers.addrLstMgr;
        break;
      default:
        throw scrName + " screen name doesn't exist";
    }
    console.log("Current Point Mgr Name: " + ESRIMap.ptWrpMgr.screenName);
    ESRIMap.ptWrpMgr.clearAllPlots();
    ESRIMap.onShow();
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

ESRIMap.convertToZoomPoint = function(pointWrp) {
  var zoomPoint = {};
  if (pointWrp) {
    zoomPoint.lat = pointWrp.getLat();
    zoomPoint.lon = pointWrp.getLon();
    zoomPoint.zoom = pointWrp.getZoom();
  }
  return zoomPoint;
};

ESRIMap.onShow = function(no_zoomFlag) {

  console.log("ESRIMapInterface->ESRIMap.onShow: Invoked");
  console.log("ESRIMap.onShow");

  /*keeping the following code for backward compatibility with BrowserMap/OCS*/
  if (!cbGlbMap && ESRIMap.ptWrpMgr) {
    ESRIMap.ptWrpMgr.clearAllPlots();
    ESRIMap.ptWrpMgr.setupPoints();
    ESRIMap.ptWrpMgr.plot(no_zoomFlag);
    ESRIMap.ptWrpMgr.onShow();
  }
};

ESRIMap.onHide = function() {
  if (ESRIMap.ptWrpMgr) {
    ESRIMap.ptWrpMgr.onHide();
  }
};


ESRIMap.genrateGUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


/*THINK - review following methods again aand decide what's there faith*/
ESRIMap.ScreenName = {
  mapSpot: "MapSpot",
  addrLst: "AddressList"
};

function configureESRIMap() {
  ESRIMap.configureEmptyMap();
}

ESRIMap.selectStateFeature = function() {
  /* Maryland FeatureID = 31*/
  globalMap.selectFeatureById(31, "States");

};

ESRIMap.deselectStateFeature = function() {
  /* Maryland FeatureID = 31*/
  globalMap.deselectFeatureById(31, "States");

};

/*todo: @Refactoring precacheAtlantis*/
ESRIMap.precacheAtlantis = function() {
  console.log("ESRIMapInterface->ESRIMap.precacheAtlantis: Invoked");
  /*Run the device cache to get the Storage Perms -- TEMP FIX*/
  getDeviceCache();
  var settings = {
    tags: [
      /*"88008"*/
      /*,"88009","89012"*/
      "Atlantis"
    ],
    cacheType: "VECTOR_TILES" /* valid values: ALL, TILE_PACKAGES, GEODATABASE, VECTOR_TILES*/

    /*Census block in PR*/
    ,
    northEast: {
      lat: 40.747509,
      lon: -73.968290
    },
    /*holland tunnel*/
    southWest: {
      lat: 40.726070,
      lon: -74.010990
    },
    maxZoom: 18,
    minZoom: 0
  };

  var timeStamp = Date.now();
  var timeTaken;
  var callback = {
    onSuccess: function(data) {
      timeTaken = (Date.now() - timeStamp) / 1000;

      console.log("Got data: " + JSON.stringify(data));
    },
    onProgress: function(data) {},
    onFailure: function(data) {
      timeTaken = (Date.now() - timeStamp) / 1000;
      console.log(data.tags + " caching failed in " + timeTaken + " seconds with error " +
        JSON.stringify(data));
    }
  };

  OMM.precache(settings, callback);
};

/*todo: @Refactoring precacheAtlantisGEO*/
ESRIMap.precacheAtlantisGEO = function() {
  console.log("ESRIMapInterface->ESRIMap.precacheAtlantisGEO: Invoked");
  /*Run the device cache to get the Storage Perms -- TEMP FIX*/
  getDeviceCache();
  var settings = {
    tags: [
      "88008"
      /*,"88009","89012"*/
      /*"Atlantis"*/
    ],
    cacheType: "ALL" /* valid values: ALL, TILE_PACKAGES, GEODATABASE, VECTOR_TILES*/

    /*Census block in PR*/
    ,
    northEast: {
      lat: 40.747509,
      lon: -73.968290
    },
    /* holland tunnel*/
    southWest: {
      lat: 40.726070,
      lon: -74.010990
    },
    maxZoom: 18,
    minZoom: 0
  };

  var timeStamp = Date.now();
  var timeTaken;
  var callback = {
    onSuccess: function(data) {
      timeTaken = (Date.now() - timeStamp) / 1000;

      console.log("Got data: " + JSON.stringify(data));
    },
    onProgress: function(data) {},
    onFailure: function(data) {
      timeTaken = (Date.now() - timeStamp) / 1000;
      console.log(data.tags + " caching failed in " + timeTaken + " seconds with error " +
        JSON.stringify(data));
    }
  };

  OMM.precache(settings, callback);
};

/*tod: @Refactoring configPortalEsri */
ESRIMap.configPortalEsri = function() {
  /*OMM.initOfflineMaps();*/
  console.log("ESRIMapInterface->ESRIMap.configPortalEsr: Invoked");
  OMM.configurePortal({
    url: "http://ditd012arcgisd.boc.ad.census.gov/arcgis"
  });
  console.log("Portal Loaded");

};

ESRIMap.menuActions = [{
  displayName: "Center on YAHI",
  actionID: "userLocation"
}, {
  displayName: "Center on Census",
  actionID: "centerCensus"
}, {
  displayName: "Center on PR",
  actionID: "centerPR"
},{
  displayName: "Identify Roads",
  actionID: "idfeatures"
},
{
  displayName: "Show Legend",
  actionID: "legend"
}, {
  displayName: "List Basemaps",
  actionID: "basemaps"
}, {
  displayName: "List Layers",
  actionID: "layers"
}, {
  displayName: "Hide Map",
  actionID: "hideMap"
}];

CChlpr.pyWorkPageGetProperty = function(propName) {
  console.log("CChlpr.pyWorkPageGetProperty invoked for property: " + propName);
  try {
    var pyWrkPg = CChlpr.findPage("pyWorkPage");
    var propObj = pyWrkPg.get(propName);
    return (propObj) ? propObj.getValue() : "";
  } catch (e) {
    console.log(e.message + "\n" + e.stack);
    throw e;
  }
};

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-26-2016
 *  Purpose: Return a element from BCU 
 */
CChlpr.BCUGetProperty = function(fieldName) {
  console.log("CChlpr.BCUGetProperty invoked");
  try {
    var BCU = CChlpr.findPage("pyWorkPage.BCU");
    var fieldVar = BCU.get(fieldName);
    return (fieldVar) ? fieldVar.getValue() : "";
  } catch (err) {
    console.log("function findPage error: " + err.message + "\n" + err.stack);
    throw (err);
  }
};

CChlpr.getPageProperty = function(page, propName) {
  console.log("CChlpr.getPageProperty invoked");
  var propVal = "";
  if (page && typeof page === "string") {
    page = CChlpr.findPage(page);
  }
  if (page) {
    var prop = page.get(propName);
    if (!prop) {
      /*console.log(arguments.callee.caller.toString() + ";page for propName: " + propName + " is null or empty. Parent page JSON:\n");*/
      console.log("page for propName: " + propName + " is null or empty. Parent page JSON:\n");
      console.log(page.getJSON());
    } else {
      propVal = prop.getValue();
      console.log(propName + ":" + propVal);
    }
  } else {
    console.log(arguments.callee.caller.toString() + ";Parent for propName: " + propName + " is null or empty.");
  }
  return propVal;
};

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-18-2016
 *  Purpose: Return a Page Reference
 */
CChlpr.findPage = function(pageName) {
  console.log("CChlpr.findPage invoked");
  try {
    var page = null;
    if (pega.mobile.isHybrid) {
      page = pega.ui.ClientCache.find(pageName);
    } else {
      page = pega.clientTools.find(pageName);
    }

    if (page) {
      console.log("pageName: " + pageName + " was found.");
      return page;
    } else {
      console.log("pageName: " + pageName + " was NOT Found.");
      return null;
    }
  } catch (err) {
    /* since the low level helper function is should always throw errors back or return null */
    console.log("function findPage error: " + err.message + "\n" + err.stack);
    throw (err);
  }
};