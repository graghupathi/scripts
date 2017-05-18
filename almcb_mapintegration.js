/****
  Author: Rohit Chaudhri, Sonny Kocak
  Creation Date: Nov 3rd 2016
  Last Updated Date: Feb 2/9/2017
****/

/*define all global variables here*/

var gblMapType = "";
var cbGlbMap = null;
/****-----------------------------------------------------------------------------------------------------------****/
function ClickToContinue(){
  try {
    /*  pushes the Mobile Map Sync Harness to Case List View */
    $( document ).ready(function() {
      $("button[class='pzhc pzbutton']").click(); 
    });

  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }
};
/****-----------------------------------------------------------------------------------------------------------****/

/*Refer to comments above ALMCB_GetOfflineData to see how caching works*/

/*todo: (0) @CM all there init modules make a call to ALMCB_GetOfflineData. Consolidate this call in one function and the call mainModule*/
/*todo: (0) @CM change all *init methods to PointManagerSpecialization.configureAL/configureMS/configureBCU make a call to ALMCB_GetOfflineData.*/
ALMPrecacheMapLayers = function() {
  try {
    if (true) {
      MapManager.CensusMap.listCachedFiles().then(ALMCaseListView.mainModule);
    } else {
      /*cbGlbMap.show();*/
      cbGlbMap.setTitle("Case View");
      cbGlbMap.showBCUPointsWithYahi();
    }
  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }

};

ALMPrecacheMapLayers.mainModule = function(data) {
  console.log("ALMCB_mapIntegration->ALMPrecacheMapLayers invoked");
  var mapConfig = {
    mapTitle: "Precaching Map",
    reset: true,
    mapType: gblMapType,
  };
  ALMCB_GetOfflineData(data, false, mapConfig).then(function() {
    cbGlbMap.showBCUPointsWithYahi();
  });  
};


ALMCaseListView = function() {
  try {
    /* if (!cbGlbMap) { */
    /* reinit the Map object each time for now; due to many unhappy path issues with resync'ing between map sessions */
    /* deliberately set to true to force a review of this */
    if (true) {
      MapManager.CensusMap.listCachedFiles().then(ALMCaseListView.mainModule);
    } else {
      /*cbGlbMap.show();*/
      cbGlbMap.setTitle("Case View");
      cbGlbMap.showBCUPointsWithYahi();
    }
  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }

};

ALMCaseListView.mainModule = function(data) {
  console.log("ALMCB_mapIntegration->ALMCaseListView invoked");
  var mapConfig = {
    mapTitle: "Case View",
    mapType: gblMapType,
    reset: true
  };
  ALMCB_GetOfflineData(data, false, mapConfig).then(function() {
    cbGlbMap.showBCUPointsWithYahi();
  });  
};


ALMAddressListInit = function() {
  try {
    /* if (!cbGlbMap) { */
    /* reinit the Map object each time for now; due to many unhappy path issues with resync'ing between map sessions */
    /* deliberately set to true to force a review of this */
    if (true) {
      MapManager.CensusMap.listCachedFiles().then(ALMAddressListInit.mainModule);
    } else {
      /*cbGlbMap.show();*/
      cbGlbMap.setTitle("Block Map");
      cbGlbMap.showALPoints();
    }
  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }

};

ALMAddressListInit.mainModule = function(data) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit invoked");
  var mapConfig = {
    mapTitle: "Block Map",
    mapType: gblMapType,
    reset: true
  };
  ALMCB_GetOfflineData(data, false, mapConfig).then(function() {
    cbGlbMap.showALPoints();
  });
};

ALMMapSpotInit = function() {
  try {
    /* if (!cbGlbMap) { */
    /* reinit the Map object each time for now; due to many unhappy path issues with resync'ing between map sessions */
    /* deliberately set to true to force a review of this */
    if (true) {
      MapManager.CensusMap.listCachedFiles().then(ALMMapSpotInit.mainModule);
    } else {
      /*cbGlbMap.show();*/
      cbGlbMap.setTitle("Collect a MapSpot");
      cbGlbMap.showMSPoints();
    }
  } catch (e) {
    console.error(e.message + "\n" + e.stack);
    throw e;
  }

};

/*ALMMapSpotInit.pointIcon = function(pw) {
  if (true) {

  } else {

  }
  return "Enumerator";
}*/

ALMMapSpotInit.mainModule = function(data) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit invoked");
  var mapConfig = {
    mapTitle: "Collect a MapSpot",
    mapType: gblMapType,
    reset: true
  };
  ALMCB_GetOfflineData(data, false, mapConfig).then(function() {
    cbGlbMap.showMSPoints();
  });
};

ALMMapSpotInit.configure = function(ptrMgr) {
  var constStrOriginalPtSubtitle = '<b>Is this map spot correct? Selecting "Yes" will Save and Exit"</b>';
  var pointMenu = {
    subtitle: constStrOriginalPtSubtitle,
    actions: [{
      displayName: "Yes",
      actionID: "verified_yes"
    }, {
      displayName: "No",
      actionID: "verified_no"
    }]
  };

  var mapObj = cbGlbMap;


  /*when true, on double click or long press remove the the selected point, if none is selected remove the last point
  ptrMgr.setRemoveLastOrSelectedPoint(true);*/

  Object.getPrototypeOf(ptrMgr).setupPoints = function() {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->setupPoints: " + this.screenName + " setupPoints invoked");
    this.parentSetupPoints();
  };

  Object.getPrototypeOf(ptrMgr).getPointWrpAddStatusStructType = function(ptWrp, currentPointFlg) {
    var rt = new ALMMapSpotInit.retVal(currentPointFlg);
    var unitLst = ptWrp.unitList;
    for (var i = 0; i < unitLst.length; i++) {
      var unit = unitLst[i];
      var addrStatus = unit.getStatus();
      var strType = unit.getStructureType();
      if (addrStatus == SetLALiterals.addressStatus_ETMH) {
        rt.addrStatus = addrStatus;
      }
      if (strType == SetLALiterals.addressStructureType_Trailer) {
        rt.structType = strType;
      }
    }
    return rt;
  };

  Object.getPrototypeOf(ptrMgr).buildPointSubTitle = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->buildPointSubTitle: " + "mapspot buildPointSubTitle invoked; # of reporting Units: " + pointWrapper.unitList.length);
    /*execute following code if byPassBuildPointSubTitleCall is undefined or byPassBuildPointSubTitleCall===false*/
    if (!this.byPassBuildPointSubTitleCall) {
      if (pointWrapper.unitList.length > 1) {
        /*pointWrapper.setPointTitle("");*/
        return '<b>' + pointWrapper.unitList.length + ' Units at this map spot </b> <br/>' + pointMenu.subtitle;
      }
    }
    return null;

  };

  Object.getPrototypeOf(ptrMgr).processShow = function() {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processShow: " + " currentSelectedPointID: " + this.currentSelectedPointID);
    try {
      var pw = null;
      if (this.currentSelectedPointID) {
        pw = this.pointWrpMap[this.currentSelectedPointID];

        /* refresh point title with current address value */
        var locationAddress = CChlpr.findPage("pyWorkPage.BCU.SelectedUnitPage.LocationAddress");
        var fullAddress = CChlpr.getPageProperty(locationAddress, "FullAddress");
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->processShow: " + "fullAddress:" + fullAddress);
        /* per alexei suggestion - remove full address from MapTitle
        pw.setMapTitle(fullAddress); */
        pw.setPointTitle(fullAddress);
        /* refresh point title with current address value */

        /*
        console.log("pw.getPoint().title:" + pw.getPoint().title);
        mapObj.setTitle(mapConfig.mapTitle + "<br/>" + pw.getMapTitle());
        		ptrMgr.centerAt(pw.getPointID());
                    ptrMgr.showCallout(pw.getPointID(), false);*/
      }
      if (this.originalSelectedPointID) {
        var pw = this.pointWrpMap[this.originalSelectedPointID];
        if (!pw.getPlotted()) {
          globalMap.showHint({
            title: "Touch and hold a point on the screen to collect a mapspot",
            message: "",
            titleColor: "#FFFFFFFF",
            messageColor: "#FFdedfe0",
            backgroundColor: "#FF4aa564",
            duration: 4,
            position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
            hideOnTap: true,
            hideOnSwipe: true
          });          
        }
      }      
    } catch (e) {
      console.log("ALMCB_mapIntegration->ALMMapSpotInit->processShow: " + "Error :: " + e.message + "\n" + e.stack);
      throw e;
    }
    return true;

  };

  Object.getPrototypeOf(ptrMgr).processPointSelected = function(pointWrapper) {
    _this = this;
    var pointWithGeo = pointWrapper.getPointGeometry();
    if (this.bcu) {
      this.bcu.isPointWithinBCU(pointWithGeo).then(function(data) {
        console.log("Point within bcu complete longPress");
        _this.processPointSelectedWrapper(pointWrapper);
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
        /*re-plot the point*/
        pointWrapper.removePlot();
        _this.setSelectedPoint(pointWrapper.getPointID());
        /*pointWrapper.setPointTitle("");
        note: buildPointSubTitle is called when a point is plotted, following setTitle will be overwritten
                  To compensate, set pointMenu.subtitle = "";
                  pointWrapper.setSubTitle(subTitle);			
                  */
        var pointOrgTitle = {};
        pointOrgTitle.subtitle = pointMenu.subtitle;
        pointMenu.subtitle = '';
        pointWrapper.setSubTitle("The mapspot must be placed inside the block");

        pointWrapper.setPointActions([]);
        pointWrapper.plot();
        pointMenu.subtitle = '';
        pointWrapper.setSubTitle(pointOrgTitle.subtitle);
        pointMenu.subtitle = pointOrgTitle.subtitle;
        _this.showCallout(pointWrapper.getPointID(), false);    
      });
    } else {
      this.processPointSelectedWrapper(pointWrapper);
    }
    /*this.processPointSelectedWrapper(pointWrapper);*/

  }

  Object.getPrototypeOf(ptrMgr).processPointSelectedWrapper = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointSelected: " + pointWrapper);
    var tempPointTitle = pointWrapper.getPoint().title;

    /*
            Don't change Map title, remains the same as original point.

            var newTitle = mapConfig.mapTitle;
            newTitle += "<br/>" + pointWrapper.getMapTitle();
            mapObj.setTitle(newTitle);
             */
    var title = "";
    var subTitle = "";
    var actions = {};

    var bcu = cbGlbMap.getSelectedBCU();
    if (this.originalSelectedPointID === pointWrapper.getPointID() && pointWrapper.getForAttach() && this.getPointsAttached()) {
      /*points were attached rebuild the callout for original point*/
      var orgSelectedPoint = this.pointWrpMap[this.originalSelectedPointID];

      subTitle = "";
      if (orgSelectedPoint.unitList.length > 1) {
        subTitle = '<b>' + orgSelectedPoint.unitList.length + ' Units at this map spot </b> <br/>';
        orgSelectedPoint.getPoint().title = "";
      } else {
        orgSelectedPoint.subtitle = "";
      }

      actions = [];

      /*remove the plot its stale*/
      orgSelectedPoint.removePlot();
      /*reset selected point status as it was removed*/
      this.setSelectedPoint(orgSelectedPoint.getPointID());

      /*don;t allow more operations US-1301 is for managing single point at a time*/
      orgSelectedPoint.setPointActions(actions);
      orgSelectedPoint.plot();
      this.showCallout(orgSelectedPoint.getPointID(), false);
    }

    if (this.originalSelectedPointID !== pointWrapper.getPointID() && pointWrapper.getPointID() && !pointWrapper.isNew()) { 
      /*!pointWrapper.getForAttach() condition is not needed*/

      /*User clicked on a point other than the currently selected address. Prepare for attach*/  
      pointWrapper.setForAttach(true);
      this.byPassBuildPointSubTitleCall = true;
      title = "";
      subTitle = "";
      actions = {};

      var pwStatusStructType = this.getPointWrpAddStatusStructType(this.pointWrpMap[this.originalSelectedPointID], true);  
      var attPtStatusStructType = this.getPointWrpAddStatusStructType(pointWrapper, false);

      if (pwStatusStructType.isInValidMapspot() || attPtStatusStructType.isInValidMapspot()) {

        title = pwStatusStructType.getTitle();
        actions = pwStatusStructType.getActions();

        if (pwStatusStructType.isInValidMapspot()) {
          subTitle = pwStatusStructType.getSubTitle();
        } else {
          if (attPtStatusStructType.isInValidMapspot()) {
            subTitle = attPtStatusStructType.getSubTitle();
          }
        }
      } else {
        /*build title*/
        title = "The mapspot entered for:<br/>";
        title += this.pointWrpMap[this.originalSelectedPointID].getPoint().title;
        title += "<br/>is at the same location as the mapspot for:<br/>";
        title += tempPointTitle + "<br/>";

        /*build subtitle*/
        if (pointWrapper.unitList.length > 1) {
          subTitle = '<b>' + pointWrapper.unitList.length + ' Units at this map spot<br/>' + 'Are they the same structure? Yes/No</b>';
        } else {
          subTitle = '<b>Are they the same structure? Yes/No</b>';
        }

        /*build actions*/
        actions = [{
          displayName: "Yes",
          actionID: "verified_yes_attach"
        }, {
          displayName: "No",
          actionID: "verified_no_attach"
        }];

      }

      /*re-plot the point*/
      pointWrapper.removePlot();
      this.setSelectedPoint(pointWrapper.getPointID());
      pointMenu.subtitle = subTitle;
      pointWrapper.setSubTitle(subTitle);
      pointWrapper.setPointActions(actions);
      pointWrapper.setPointTitle(title);
      pointWrapper.plot();
      this.showCallout(pointWrapper.getPointID(), false);
      pointWrapper.setPointTitle(tempPointTitle);
      this.byPassBuildPointSubTitleCall = false;
    } else {
      /*re-plot the point*/
      pointWrapper.removePlot();
      this.setSelectedPoint(pointWrapper.getPointID());
      if (this.originalSelectedPointID != "") {
        pointMenu.subtitle = constStrOriginalPtSubtitle;
        pointWrapper.setPointTitle(this.pointWrpMap[this.originalSelectedPointID].getPoint().title);
        pointWrapper.setSubTitle(this.pointWrpMap[this.originalSelectedPointID].getPoint().subtitle);
      }
      pointWrapper.plot();
      this.showCallout(pointWrapper.getPointID(), false);	
      pointWrapper.setPointTitle(tempPointTitle);


    }

    return true;
  };

  Object.getPrototypeOf(ptrMgr).processHide = function(newPoints) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processHide: ");
    var pwWrkedOn = this.pointWrpMap[this.currentSelectedPointID];
    if (pwWrkedOn && pwWrkedOn.userInput && (pwWrkedOn.userInput.accepted === true || this.getPointsAttached())) {
      ALMMapSpotInit.FinishMapSpotAssignment();
    } else {
      AdCanGoBack();
    }
    pwWrkedOn.setForAttach(false);
    this.setPointsAttached(false);
    return true;
  };

  Object.getPrototypeOf(ptrMgr).processPointMenuAction = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "mapspot END:::processPointMenuAction\n" + pointWrapper);

    /* refresh point title with current address value
    var locationAddress = CChlpr.findPage("pyWorkPage.BCU.SelectedUnitPage.LocationAddress");
    var fullAddress = CChlpr.getPageProperty(locationAddress, "FullAddress");
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "fullAddress:" + fullAddress);
    pointWrapper.setPointTitle(fullAddress); */

    switch (pointWrapper.menuAction.actionID) {
      case "verified_yes":
        pointWrapper.userInput.accepted = true;
        for (var k in this.pointWrpMap) {
          if (this.pointWrpMap.hasOwnProperty(k)) {
            console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + " processing PointID: " + k);
            var pw = this.pointWrpMap[k];
            if (pw.isNew()) {
              console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + " new point: \n" + pw);
              if (pw.userInput.accepted) {
                ALMMapSpotInit.AddUnitPointData(pw.userInput.gps.lat, pw.userInput.gps.lon, pw.userInput.manual.lat, pw.userInput.manual.lon, pw.getPointID(),pw);
              }
            } else {
              console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + " existing point: \n" + pw);
              if (pointWrapper.getPointID() === pw.getPointID()) {
                ALMMapSpotInit.AddUnitPointData(pw.userInput.gps.lat, pw.userInput.gps.lon, pw.userInput.manual.lat, pw.userInput.manual.lon, pw.getPointID(),pw);
              }
            }
          }
        }
        mapObj.hide();
        break;
      case "verified_no_attach":
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "verified_no_attach invoked for point id:" + pointWrapper.getPointID());
        break;
      case "verified_yes_attach":
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "verified_yes_attach invoked for point id:" + pointWrapper.getPointID());

        /*resetState so the title on pointwrapper is set to original address*/
        pointWrapper.resetState();
        pointWrapper.userInput.accepted = true;

        orgSelectedpw = this.pointWrpMap[this.originalSelectedPointID];

        /*update JS object move only the reporting unit that the user verified*/
        var selectedUnitPg = CChlpr.findPage("pyWorkPage.BCU.SelectedUnitPage");
        var ReportingUnitIDVal = CChlpr.getPageProperty(selectedUnitPg, "ReportingUnitID");
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "SelectedUnitPage ReportingUnitIDVal:" + ReportingUnitIDVal);

        var newunitList = [];
        for (var i = 0; i < orgSelectedpw.unitList.length; i++) {
          var unit = orgSelectedpw.unitList[i];
          if (ReportingUnitIDVal === unit.reportingUnitID) {
            pointWrapper.addReportingUnit(unit);
          } else {
            newunitList.push(unit);
          }
        }

        orgSelectedpw.unitList = newunitList;
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "Remaining units:" + orgSelectedpw.unitList.length);


        /*update clipboard*/
        /*move originally selected mapsot to pointWrapper lat/lon*/
        /*assign pointWrapper pointID to originally selected mapspot*/
        ALMMapSpotInit.AddUnitPointData(pointWrapper.userInput.gps.lat, pointWrapper.userInput.gps.lon, pointWrapper.userInput.manual.lat, pointWrapper.userInput.manual.lon, pointWrapper.getPointID(),pointWrapper);

        /*remove originally selected mapspot*/
        if (orgSelectedpw.unitList.length === 0) {
          orgSelectedpw.removePlot();
        }

        /*display message*/
        var title = "Mapspot Collected<br/>";
        /*get original address of point wrapper*/
        title += pointWrapper.getPoint().title;

        var subTitle = "";
        if (pointWrapper.unitList.length > 1) {
          subTitle = '<b>' + pointWrapper.unitList.length + ' Units at this map spot </b> <br/>';
          pointWrapper.setPointTitle('<b>' + pointWrapper.unitList.length + ' Units at this map spot </b> <br/>');
          pointWrapper.setSubTitle('');
        }

        var actions = [];

        pointWrapper.removePlot();
        this.setSelectedPoint(pointWrapper.getPointID());
        pointWrapper.setPointTitle(title);


        /*note: buildPointSubTitle is called following setTitle will be overwritten
                    To compensate, set pointMenu.subtitle = "";

                    pointWrapper.setSubTitle(subTitle);			
                    */
        pointMenu.subtitle = "";

        pointWrapper.setPointActions(actions);
        pointWrapper.plot();
        this.showCallout(pointWrapper.getPointID(), false);
        this.setPointsAttached(true);
        /* code to resolve the bug (#491) for map not closing */
        mapObj.hide();
        /**************/
        break;
      case "verified_no":
        pointWrapper.userInput.accepted = false;
        break;
      default:
        pointWrapper.userInput.accepted = false;

    }
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "Processing ended: \n" + pointWrapper);
    return true;
  };

  Object.getPrototypeOf(ptrMgr).processLongPress = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->processPointMenuAction: " + "ALM Mapspot END:::processLongPress\n" + pointWrapper.toString());
    return true;
  };

  /**Set menu to show on when user clicks a Point**/
  ptrMgr.setupPointMenu(pointMenu);

};

ALMMapSpotInit.retVal = function(crrFlg) {
  this.addrStatus = "";
  this.structType = "";
  var currentSelectedPoint = crrFlg;

  this.getTitle = function() {
    return "Invalid Mapspot Collected";
  };

  this.getSubTitle = function() {
    var stitle = null;
    switch (currentSelectedPoint) {
      case true:
        if (this.addrStatus === SetLALiterals.addressStatus_ETMH) {
          stitle = "Each Empty Trailer Pad/Mobile Home Site must be mapspotted separately.";
        }
        if (this.structType === SetLALiterals.addressStructureType_Trailer) {
          stitle = "Each Trailer/Mobile Home must be mapspotted separately.";
        }
        break;
      case false:
        if (this.addrStatus === SetLALiterals.addressStatus_ETMH) {
          stitle = "Addresses cannot be attached to a Empty Trailer Pad/Mobile Home Site.";
        }
        if (this.structType === SetLALiterals.addressStructureType_Trailer) {
          stitle = "Addresses cannot be attached to a Trailer/Mobile Home.";
        }
        break;
      default:
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->retVal: " + "ERROR INVALID case option reached");
    }
    return stitle;
  };

  this.getActions = function() {
    var actions = [{
      displayName: "OK",
      actionID: "verified_no"
    }];
    return actions;
  };

  this.isInValidMapspot = function() {
    if (this.addrStatus === SetLALiterals.addressStatus_ETMH || this.structType === SetLALiterals.addressStructureType_Trailer) {
      return true;
    }
    return false;
  };
};

ALMMapSpotInit.AddUnitPointData = function(GPSLat, GPSLon, MarkerLat, MarkerLon, PointId,pw) {
  /*
      todo: what should happen when a new point is added
          1. Replace originally selectedUnitPage with the new point - this is what is hapenning below
          2. Add a new point to the block
       */
  try {
    var bcu = CChlpr.findPage("pyWorkPage.BCU");
    var selectedUnit = bcu.get("SelectedUnitPage");
    if (!selectedUnit) {
      console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + "selectedUnit not found");
      return;
    }
    var supage = selectedUnit.getJSON();
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + "selectedUnit.getJSON():\n" + selectedUnit.getJSON());

    if (pw.isPointIDGenerated()) {
      selectedUnit.put("MAFStructurePointID",PointId);		
      selectedUnit.put("MAFStructurePointIDInd","N");
    } else {
      /*update MAFStructurePointID to take care of attach case existing to existing to new to existing mapspot*/
      selectedUnit.put("MAFStructurePointID",PointId);
    }

    var locationAddress = selectedUnit.get("LocationAddress");
    var latVal = CChlpr.getPageProperty(locationAddress, "OFLAT");
    var lonVal = CChlpr.getPageProperty(locationAddress, "OFLON");

    var unitPoint = selectedUnit.get("UnitPoint");

    var spa = cbGlbMap.getSpatialUtils();
    var gpsDistance = null;
    var officialDistance = null;
    if (isNaN(parseFloat(GPSLat)) || parseFloat(GPSLat) === 0 || isNaN(parseFloat(GPSLon)) || parseFloat(GPSLon) === 0) {
      console.warn("GPS LAT/LON is not valid");    	
    } else {
      /*calculate distance between marked and gps lat/lon*/		
      gpsDistance = spa.getDistanceBetweenPoints(GPSLat, GPSLon, MarkerLat, MarkerLon);
    }

    if (isNaN(parseFloat(latVal)) || parseFloat(latVal) === 0 || isNaN(parseFloat(lonVal)) || parseFloat(lonVal) === 0) {
      console.warn("Official LAT/LON is not valid");    	
    } else {
      /*calculate distance between marked and official lat/lon*/		
      officialDistance = spa.getDistanceBetweenPoints(latVal, lonVal, MarkerLat, MarkerLon);
    }

    if (!unitPoint) { /** empty page. Create and add new UnitPoint page **/
      console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + "Empty UnitPoint Page " + selectedUnit.getJSON());
      var tmpPage = pega.ui.ClientCache.createPage("TempUnitPage");

      var unitPointObjJSON = '{"pxObjClass" : "CB-Data-StructurePoint"}';
      tmpPage.adoptJSON(unitPointObjJSON);

      tmpPage.put("BlockCoordinateFlag", " ");
      tmpPage.put("CoordinateCollectType", "");
      tmpPage.put("GPSLatitude", GPSLat);
      tmpPage.put("GPSLongitude", GPSLon);
      tmpPage.put("MarkerLatitude", MarkerLat);
      tmpPage.put("MarkerLongitude", MarkerLon);
      tmpPage.put("OfficalLatitude", latVal);
      tmpPage.put("OfficalLongitude", lonVal);
      /*US-2232 if gps lat/lon is not valid, gpsDistance should be null*/
      if (gpsDistance) {
        tmpPage.put("DistanceGPSToMarkerPoint", gpsDistance);
      }
      /*US-2232 if official lat/lon is not valid, officialDistance should be null*/
      if (officialDistance) {
        tmpPage.put("DistanceOfficalToMarkerPoint", officialDistance);
      }
      tmpPage.put("PointID", PointId);

      var tempWorkpg = selectedUnit.getJSON();
      tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1);
      tempWorkpg = tempWorkpg + ',"UnitPoint" : ' + tmpPage.getJSON() + '}';
      console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + "tempWorkpg: " + tempWorkpg);
      selectedUnit.adoptJSON(tempWorkpg);
      console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + selectedUnit.getJSON());

    } else {
      unitPoint.put("GPSLatitude", GPSLat);
      unitPoint.put("GPSLongitude", GPSLon);
      unitPoint.put("MarkerLatitude", MarkerLat);
      unitPoint.put("MarkerLongitude", MarkerLon);
      unitPoint.put("OfficalLatitude", latVal);
      unitPoint.put("OfficalLongitude", lonVal);
      /*US-2232 if gps lat/lon is not valid, gpsDistance should be null*/
      if (gpsDistance) {
        unitPoint.put("DistanceGPSToMarkerPoint", gpsDistance);
      }
      /*US-2232 if official lat/lon is not valid, officialDistance should be null*/
      if (officialDistance) {
        unitPoint.put("DistanceOfficalToMarkerPoint", officialDistance);
      }
      unitPoint.put("PointID", PointId);

    }
  } catch (e) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->AddUnitPointData: " + "Error :: Caught exception" + e);
    throw e;
  }
};

ALMMapSpotInit.FinishMapSpotAssignment = function() {
  try {
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var BCU = workPage.get('BCU');
    var unit = BCU.get('SelectedUnitPage');
    var latVal = "";
    if (unit) {
      var unitPoint = unit.get('UnitPoint');
      if (unitPoint) {
        var lat = unitPoint.get("MarkerLatitude");
        latVal = parseFloat((lat) ? lat.getValue() : "");
        console.log("ALMCB_mapIntegration->ALMMapSpotInit->FinishMapSpotAssignment: " +
                    " latVal: " + latVal);
        var lon = unitPoint.get("MarkerLongitude");
        var lonVal = parseFloat((lon) ? lon.getValue() : "");
      }
    }
    pega.u.d.submit("pyActivity=FinishAssignment", null, "");
    /*if (latVal == "" || isNaN(latVal)) {
              AdCanGoBack();
          } else {
              pega.u.d.submit("pyActivity=FinishAssignment", null, "");
          }*/
  } catch (e) {
    console.log("ALMCB_mapIntegration->ALMMapSpotInit->FinishMapSpotAssignment: " + "Error " + e.message + "\n" + e.stack);
    throw e;
  }
};

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-26-2016
 *  Purpose: Return a Page/Elememt Reference 
 */
ALMAddressListInit.configure = function(ptrMgr) {

  var mapConfig = {
    mapTitle: "Block Map",
    mapType: gblMapType,
  };
  var mapObj = cbGlbMap;
  var pointMenu = {
    subtitle: ""
  };

  Object.getPrototypeOf(ptrMgr).setupPoints = function() {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->: " + this.screenName + " setupPoints invoked");
    this.parentSetupPoints();
  };

  Object.getPrototypeOf(ptrMgr).buildPointSubTitle = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->buildPointSubTitle: " + " # of reporting Units: " + pointWrapper.unitList.length);
    if (pointWrapper.unitList.length > 1) {
      pointWrapper.setPointTitle("");
      return '<b>' + pointWrapper.unitList.length + ' Units at this map spot<br/>' + pointMenu.subtitle + '</b>';
    }
    return null;

  };

  Object.getPrototypeOf(ptrMgr).processShow = function() {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->processShow: " + "currentSelectedPointID: " + this.currentSelectedPointID);
    try {
      var pw = null;
      if (this.currentSelectedPointID) {
        pw = this.pointWrpMap[this.currentSelectedPointID];
      }
    } catch (e) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->processShow: " + "Error: " + e.message + "\n" + e.stack);
      throw e;
    }
    return true;
  };

  Object.getPrototypeOf(ptrMgr).processHide = function(newPoints) {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->processHide: ");
    SelectedAddressListUnit(this.getSelectedMapSpotReportingUnit());
    return true;
  };

  /* some how iterferes with Mapspot onLonPress - need to find the root cause. 
  For now handling the issues in the parent
  Object.getPrototypeOf(ptrMgr).onLongPress = function(pointData) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->onLongPress: " + "END:::onLongPress\n Ignoring long press");
      return true;
  };*/

  Object.getPrototypeOf(ptrMgr).processLongPress = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->processLongPress: " + "END:::processLongPress\n" + pointWrapper.toString());
    return true;
  };

  Object.getPrototypeOf(ptrMgr).processPointSelected = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->ALMAddressListInit->processLongPress: " + pointWrapper);
    var newTitle = mapConfig.mapTitle;
    /* newTitle += "<br/>" + pointWrapper.getPoint().title; */
    mapObj.setTitle(newTitle);

    if (pointWrapper.unitList.length > 1) {
      pw = this.pointWrpMap[this.currentSelectedPointID];
      pw.getPoint().title = '<b>' + pointWrapper.unitList.length + ' Units at this map spot </b> <br/>' + pointMenu.subtitle;
      pointWrapper.setPointTitle('<b>' + pointWrapper.unitList.length + ' Units at this map spot </b> <br/>' + pointMenu.subtitle);
      pointWrapper.setSubTitle("");

    }
    this.showCallout(pointWrapper.getPointID(), false);  
    return true;
  };

  ptrMgr.setupPointMenu(pointMenu);
};

var BCUPointManager = BCUPointManager || {};

BCUPointManager.configure = function(ptManager) {

  var pointMenu = {
    subtitle: '<b></b>',
    actions: [{
      displayName: "Work",
      actionID: "work"
    }, {
      displayName: "Details",
      actionID: "details"
    }, {
      displayName: "View Default Map",
      actionID: "viewDefaultMap"
    }]
  };
  var mapObj = cbGlbMap;

  Object.getPrototypeOf(ptManager).setupPoints = function(bcuList) {
    console.log(this.screenName + " setupPoints invoked");
    for (var k in bcuList) {
      if (bcuList.hasOwnProperty(k)) {
        var bcu = bcuList[k];
        if (bcu) {
          var lat = bcu.getLatitude();
          var lon = bcu.getLongitude();
          var bcuid = bcu.getBCUID();
          var wrkStatus = bcu.getWorkStatus();

          console.log("bcu.bcuID:" + bcuid + "; lat:" + lat + ";lon:" + lon);
          var InfoTitleBarHeader, InfoHTMLTxt;

          InfoTitleBarHeader = bcuid;
          InfoHTMLTxt = "BCUID: " + bcuid + "<br/>Work: <b>" + wrkStatus + "</b>";

          var pointConfig = {
            type: "Mapspot",
            pointID: bcuid,
            title: "BCU : " ,
            lat: lat,
            lon: lon,
            userPlottedPoint: false,
            popupTitle: InfoTitleBarHeader,
            popupContent: InfoHTMLTxt,
            selected: false
          }
          var pw = this.createPointWrapper(pointConfig);
          this.addPointWrp(pw);
          console.log("Point Created and Added: " + pw);
        }
      }
    }
  };  /* end of prototype of setupPoints*/

  /* some how iterferes with Mapspot onLonPress - need to find the root cause. 
  For now handling the issues in the parent
  Object.getPrototypeOf(ptManager).onLongPress = function(pointData) {
      console.log("ALMCB_mapIntegration->BCUPointManager->onLongPress: " + "END:::onLongPress\n Ignoring long press");
      return true;
  };*/  

  Object.getPrototypeOf(ptManager).processPointSelected = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->BCUPointManager->processPointSelected: " + pointWrapper);
    console.log("ALMCB_mapIntegration->BCUPointManager->mapObj.getBCU=>bcuid: " + mapObj.getBCU(pointWrapper.getPointID()).getBCUID());

    mapObj.selectBCU(mapObj.getBCU(pointWrapper.getPointID()).getBCUID());
    this.showCallout(pointWrapper.getPointID(), false);  
    return true;
  };

  Object.getPrototypeOf(ptManager).processPointMenuAction = function(pointWrapper) {
    console.log("ALMCB_mapIntegration->BCUPointManager->processPointMenuAction: " );

    switch (pointWrapper.menuAction.actionID) {
      case "work":
        console.log("ALMCB_mapIntegration->BCUPointManager->processPointMenuAction:  WORK Menu Item selected");
        /* get BCUDI */
        var BCUID = cbGlbMap.getSelectedBCU().getBCUID();
        /* get Region */
        var region = BCUPointManager.GetRegionFromBCUID(BCUID);
        /* bcuMap */
        if (MapManager.CheckCacheStatus(region) == true) {
          pega.desktop.openAssignment(cbGlbMap.getSelectedBCU().getpzInsKeyCase());  
          cbGlbMap.hide();
        }
        else
        {
          console.log("Map Files for selected BCU needs to be Cached first.");
          globalMap.showHint({
            title: "Map Files for selected BCU needs to be Cached first.",
            message: "",
            titleColor: "#FFFFFFFF",
            messageColor: "#FFdedfe0",
            backgroundColor: "#FFcd2026",
            duration: 4,
            position: window.launchbox.OfflineMapEsri.HintPosition.TOP,
            hideOnTap: true,
            hideOnSwipe: true
          });
        }
        break;
      case "details":
        console.log("ALMCB_mapIntegration->BCUPointManager->processPointMenuAction:  DETAILS Menu Item selected");
        pega.desktop.openWorkByHandle(cbGlbMap.getSelectedBCU().getpzInsKey());  
        cbGlbMap.hide();
        break;
      case "viewDefaultMap":
        console.log("ALMCB_mapIntegration->BCUPointManager->processPointMenuAction:  ViewDefaultMap Menu Item selected");
        OMM.OfflineMaps.dismissCallout();
        cbGlbMap.setTitle("Case View");
        cbGlbMap.showBCUPointsWithYahi();

        break;
      default:
    }    console.log("ALMCB_mapIntegration->BCUPointManager->processPointMenuAction: ");
    return true;
  };

  ptManager.setupPointMenu(pointMenu);

};

BCUPointManager.GetRegionFromBCUID = function(BCUID) {
  /* D_AdCanUserWorkList */
  try {
    var caseList = findPage("D_AdCanUserWorkList.pxResults");
    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var state  = "";
      var county  = "";
      var bcuID  = "";
      while (caseIterator.hasNext()) {
        casePage = caseIterator.next();
        bcuID = ALMCB_Helpers.getFieldValue(casePage, "BCUID");
        if (bcuID = BCUID){
          state = ALMCB_Helpers.getFieldValue(casePage, "State");
          county = ALMCB_Helpers.getFieldValue(casePage, "County");
          return state + county;
        }
      }
    }
    return "";
  } catch (err) {
    console.error(err);
    return "";
  }
};

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-31-2016
 *  Purpose: Select the Address List's selected Unit
 */
function SelectedAddressListUnit(rptList) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit->SelectedAddressListUnit: " + "SelectedAddressListUnit called");
  var debugList = "";
  var pageIndex = "";
  var pageIndexVal = "";

  try {
    if (rptList && Array.isArray(rptList)) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->SelectedAddressListUnit: " + "loop selected list");
      var rptListLen = rptList.length;
      var selectedUnitID = "";
      var firstReportingUnitSet = false;

      /* grab references for WorkPage, BCU, & Unlist (can clean this up - only need UnitList really - system down */
      var unitList = findPage("pyWorkPage.BCU.UnitList");
      /* loop each unit to get Unique ID, Lat, Lon and Address Info */
      if (unitList) {
        console.log("ALMCB_mapIntegration->ALMAddressListInit->SelectedAddressListUnit: " + "unitList length:" + unitList.length);
        var ULiterator = unitList.iterator();
        while (ULiterator.hasNext()) {
          var reportingUnit = ULiterator.next();

          /* Reporting Unit ID */
          var reportingUnitID = reportingUnit.get("ReportingUnitID");
          var reportingUnitIDVal = (reportingUnitID) ? reportingUnitID.getValue() : "0";
          console.log("ALMCB_mapIntegration->ALMAddressListInit->SelectedAddressListUnit: " + "reportingUnitIDVal: " + reportingUnitIDVal);

          if (rptList.indexOf(reportingUnitIDVal) >= 0)
            reportingUnit.put('IsReportingUnitSelected', String("yes"));
          else
            reportingUnit.put('IsReportingUnitSelected', String("no"));

          /* select the specific unit that corresponds to the selected Map Spot */
          if (firstReportingUnitSet === false) {
            for (i = 0; i < rptListLen; i++) {
              if (rptList[i] == reportingUnitIDVal) {
                /* Page Index */
                pageIndex = reportingUnit.get("PageIndex");
                pageIndexVal = (pageIndex) ? pageIndex.getValue() : "0";
                console.log("ALMCB_mapIntegration->ALMAddressListInit->SelectedAddressListUnit: " + "pageIndexVal: " + pageIndexVal);

                /* set BCU.SelectUnit */
                var bcu = findPage("pyWorkPage.BCU");
                bcu.put('SelectedUnit', pageIndexVal);
                firstReportingUnitSet = true;
              }
            }
          }
        }
      }
    }
    /* refresh the section and scroll to selected unit */
    RefreshSection("DisplayAddressList");
    goTo('.work-item-buttons:Visible', "main #HARNESS_CONTENT", pageIndexVal);
  } catch (err) {
    alert("SelectedAddressListUnit Error : " + err.message);
  }
}

/*  
 *  Created By: Nathaniel Dietrich & Sonny Kocak
 *  Date: 11-04-2016
 *  Purpose: Scroll to selected unit
 */
function goTo(elementName, containerStr, elementIndex) {
  try {
    /* Return if no container passed in */
    if (!$(containerStr) && !$(elementName)) {
      return;
    }
    if ($(elementName).scrollTop(0) === undefined || $(elementName).scrollTop(0).offset() === undefined) {
      return;
    }
    var headerOffset = 300;
    var elementScrollTop = $(elementName).scrollTop(0).offset().top;
    var containerOffSet = $(".my-address-work-list-item").height();
    var containerScrollTop = $(containerStr).scrollTop(0).offset().top;
    var containerHeight = $(containerStr).height();
    console.log("ALMCB_mapIntegration->ALMAddressListInit->goTo: " + "elementScrollTop : " + elementScrollTop);
    console.log("ALMCB_mapIntegration->ALMAddressListInit->goTo: " + "containerOffSet : " + containerOffSet);
    console.log("ALMCB_mapIntegration->ALMAddressListInit->goTo: " + "containerScrollTop : " + containerScrollTop);
    console.log("ALMCB_mapIntegration->ALMAddressListInit->goTo: " + "containerHeight : " + containerHeight);

    if (elementIndex > 2) {
      $(containerStr).animate({
        scrollTop: (headerOffset) + ((containerHeight * 0.33) * (elementIndex - 1))
      });
    } else if (elementIndex > 1 && elementIndex < 3) {
      $(containerStr).animate({
        scrollTop: (headerOffset) + containerHeight * 0.31
      });
    } else {
      $(containerStr).animate({
        scrollTop: (headerOffset)
      });
    }

    /*
          if (elementScrollTop > (containerOffSet * 4)){
            $(containerStr).animate({ scrollTop: (containerHeight * (elementIndex-1) ) - (containerHeight*.75) });
          }

          if (elementScrollTop > (containerOffSet * 4)){
            $(containerStr).animate({ scrollTop: elementScrollTop - (containerOffSet * 2) });
          }
          */
  } catch (err) {
    alert("goTo Error : " + err.message);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 01-12-2017
 *  Purpose: Return BCU Count
 */
function getCaseKeyInfo() {
  try {
    /* pxRefObjectKey & pzInsKey */
    /* pull Caselist data from data page */
    var caseList = findPage("D_pyUserWorkList.pxResults");
    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var pxRefObjectKey  = "";
      var pzInsKey  = "";
      while (caseIterator.hasNext()) {
        casePage = caseIterator.next();
        pxRefObjectKey = ALMCB_Helpers.getFieldValue(casePage, "pxRefObjectKey");
        pzInsKey = ALMCB_Helpers.getFieldValue(casePage, "pzInsKey");
      }
    }
  } catch (err) {
    console.log("function getCaseKeyInfo error: " + err.message);
    throw (err);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 01-12-2017
 *  Purpose: Return BCU Count  
 */
function getBCUCount() {
  try {
    /* state, county, track, bcuid */
    /* pull Caselist data from data page */
    var caseList = findPage("D_pyUserWorkList.pxResults");
    var count = 0;
    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var BCUId = "";
      while (caseIterator.hasNext()) {
        casePage = caseIterator.next();
        count = count + 1;
      }
    }
    /*      
        var portalPage = findPage("pyPortal");
        if (portalPage) {
    	alert("portal page exist");
          portalPage.put('BCUCount', count);
        }

    */

  } catch (err) {
    console.log("function getBCUCount error: " + err.message);
    throw (err);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 12-16-2016
 *  Purpose: Get List of Cases' BCU, Track, County and State info
 */
function getBCUTrackList() {
  try {
    /* state, county, track, bcuid */
    /* pull Caselist data from data page */
    var caseList = findPage("D_pyUserWorkList.pxResults");
    var BCUList = [];

    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var BCUId = "";
      var tractId = "";
      var BCU = {};
      var county = "";
      var state = "";
      var lat = "";
      var lon = "";
      var caseWorkId = "";


      while (caseIterator.hasNext()) {
        casePage = caseIterator.next();
        console.log(casePage.getJSON());
        if (casePage) {
          BCUId = ALMCB_Helpers.getFieldValue(casePage, "ReportingUnitID");
          /* BCUId =    ALMCB_Helpers.getFieldValue(casePage,"BCUID"); */
          tractId = ALMCB_Helpers.getFieldValue(casePage, "Tract");
          county = ALMCB_Helpers.getFieldValue(casePage, "County");
          state = ALMCB_Helpers.getFieldValue(casePage, "State");

          /* Updated by Deepak on 01/10/2017 to get BCU Lat / Lon from case list local store on mobile device. */
          caseWorkId = ALMCB_Helpers.getFieldValue(casePage, "pxRefObjectKey");
          pega.offline.clientstorehelper.getWorkItem(
            caseWorkId,
            function(result) {

              console.debug("AdCan: new work item retrieved.");
              var localData = result.pyData;
              if (localData) {
                var BCUPage = localData.BCU;
                if (BCUPage) {
                  lat = BCUPage.Latitude;
                  lon = BCUPage.Longitude;

                }
              }
            },
            function() {
              console.debug("AdCan: new work item retrieved getWorkItem Failed");
            });
          if (BCUId) {
            BCU = {
              bcuID: BCUId,
              tract: tractId,
              region: state + county,
              county: county,
              state: state,
              Latitude: lat,
              Longitude: lon
            };

            BCUList.push(BCU);
          }
        }
      }
    }
    /*alert("BCU/Tract size: " + BCUList.length);*/
    return BCUList;

  } catch (err) {
    console.log("function getBCUList error: " + err.message);
    throw (err);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-18-2016
 *  Purpose: Return a Page Reference
 */
function findPage(pageName) {
  try {
    /* Get the Page reference and validate the results*/
    var page = null;
    if (pega.mobile.isHybrid) {
      page = pega.ui.ClientCache.find(pageName);
    } else {
      page = pega.clientTools.find(pageName);
    }

    if (page) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->findPage: " + "pageName: " + pageName + " was found.");
      return page;
    } else {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->findPage: " + "pageName: " + pageName + " was NOT Found.");
      return null;
    }
  } catch (err) {
    /* since the low level helper function is should always throw errors back or return null */
    console.log("ALMCB_mapIntegration->ALMAddressListInit->findPage: " + "function findPage error: " + err.message);
    throw (err);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-18-2016
 *  Purpose: Return a Page/Elememt Reference 
 */
function getPage(parentPage, pageName) {
  try {
    /* Validate Parms */
    if (!parentPage) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->getPage: " + "parentPage: " + parentPage + " is null.");
      return null;
    }
    /* Get the Page/Element reference and validate the results*/
    var page = parentPage.get(pageName);
    if (page) {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->getPage: " + "pageName: " + pageName + " was found.");
      return page;
    } else {
      console.log("ALMCB_mapIntegration->ALMAddressListInit->getPage: " + "pageName: " + pageName + " was NOT Found.");
      return null;
    }
  } catch (err) {
    /* since the low level helper function is should always throw errors back or return null */
    console.log("ALMCB_mapIntegration->ALMAddressListInit->getPage: " + "function getPage error: " + err.message);
    throw (err);
  }
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-26-2016
 *  Purpose: Return a element from BCU 
 */
function getBCUFieldValue(fieldName) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit->getBCUFieldValue: " + " invoked");
  try {
    var BCU = findPage("pyWorkPage.BCU");
    var fieldVar = BCU.get(fieldName);
    return (fieldVar) ? fieldVar.getValue() : "";
  } catch (err) {}
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-26-2016
 *  Purpose: Return a element from UnitList 
 */
function getUnitListFieldValue(fieldName) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit->getUnitListFieldValue: " + " invoked");
  try {
    var unitList = findPage("pyWorkPage.BCU.UnitList");
    var fieldVar = unitList.get(fieldName);
    return (fieldVar) ? fieldVar.getValue() : "";
  } catch (err) {}
}

/*  
 *  Created By: Sonny Kocak
 *  Date: 10-31-2016
 *  Purpose: Select the Address List's selected Unit
 */
function RefreshSection(sectionName) {
  console.log("ALMCB_mapIntegration->ALMAddressListInit->RefreshSection: " + " called");
  try {
    /* refresh section */
    var section = pega.u.d.getSectionByName(sectionName, '', document);
    if (section)
      pega.u.d.reloadSection(section, '', '', false, false, '', false);
  } catch (err) {
    alert("RefreshSection Error : " + err.message);
  }
}

/* Added by Deepak on 01/28/2017 to update BCU lat / lon with Valid first address lat/lon */
/* This is a temprorary code to correct BCU lat /lon. This logic should be removed once data is corrected.*/            
synchrnizedGetWorkItem1 = function(caseWorkId) {
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
            /* Added by Deepak on 01/28/2017 to update BCU lat / lon with Valid first address lat/lon */
            /* This is a temprorary code to correct BCU lat /lon. This logic should be removed once data is corrected.*/            
            var regValidatorLatLon = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
            var BCUUnitList = BCUPage.UnitList;
            /*code for debugging added by Rohit*/
            if (BCUPage.BCUID === "00014600") {
              console.log("BCUUnitList.length: " + BCUUnitList.length);
            }
            if (BCUUnitList){
              console.log("BCUUnitList length:" + BCUUnitList.length);
              for (var x = 0; x < BCUUnitList.length; x++) {
                var LocationAddress = null;
                var UnitLat = null;
                var UnitLon = null;
                var vLatLon = false; 
                LocationAddress = BCUUnitList[x].LocationAddress;
                if (LocationAddress){
                  UnitLat = LocationAddress.OFLAT;
                  UnitLon = LocationAddress.OFLON;

                  if (regValidatorLatLon.test(UnitLat + "," + UnitLon))  vLatLon = true;

                  if (vLatLon == true){
                    BCUPage.Latitude = UnitLat;
                    BCUPage.Longitude = UnitLon;
                    x = BCUUnitList.length;
                  }

                } 
              }
            }
            /* Added by Deepak on 01/28/2017 to update BCU lat / lon with Valid first address lat/lon */
            bcuData = {
              caseID: caseWorkId,
              bcuID: BCUPage.BCUID,
              tract: BCUPage.Tract,
              region: BCUPage.State + BCUPage.County,
              county: BCUPage.County,
              state: BCUPage.State,
              latitude: BCUPage.Latitude,
              longitude: BCUPage.Longitude,
              wrkStatus: BCUPage.Status

            };
          }
        }
        resolve(bcuData);
      },
      function() {
        console.debug("AdCan: new work item retrieved getWorkItem Failed");
        reject("No Data Received");
      });

  });
  return promise;
};

/* Added by Deepak on 01/28/2017 to update BCU lat / lon with Valid first address lat/lon */
/* This is a temprorary code to correct BCU lat /lon. This logic should be removed once data is corrected.*/            
getCaseData1 = function() {
  var promise = new Promise(function(resolve, reject) {
    /* do a thing, possibly async, then…*/
    var caseList = CChlpr.findPage("D_pyUserWorkList.pxResults");
    MobileTestData.collect("D_pyUserWorkList", JSON.stringify(caseList));
    var BCUList = [];
    var countOfCases = 0;
    if (caseList) {
      var caseIterator = caseList.iterator();
      var casePage;
      var caseWorkId = "";
      while (caseIterator.hasNext()) {
        countOfCases += 1;
        casePage = caseIterator.next();
        console.log(casePage.getJSON());
        if (casePage) {
          caseWorkId = CChlpr.getPageProperty(casePage, "pxRefObjectKey");
          synchrnizedGetWorkItem1(caseWorkId).then(function(data) {
            BCUList.push(data);
            if (BCUList.length >= countOfCases) {
              resolve(BCUList);
            }
          }, function(data) {
            console.log("getWorkItems failed for caseid:" + caseWorkId);
            reject(new Error("getWorkItems failed for caseid:" + caseWorkId));
          });
        }
      }
    }
  });
  return promise;
};