/****
Author: Rohit Chaudhri
Creation Date: Sept 29th 2016
****/

var CensusMap = CensusMap || {};

/* Track the configuration state */
CensusMap.mapConfigured = false;


/* Default the census HQ Lat/Long */
CensusMap.censusHQ = {
    lat: 38.846455,
    lon: -76.930446,
    zoom: 14
};

/* Default the Puerto Rico Lat/Long */
CensusMap.PR = {
    lat: 18.4663338,
    lon: -66.1087774,
    zoom: 14
};

CensusMap.ScreenName = {
    mapSpot: "MapSpot",
    addrLst: "AddressList"
}

function configureEmptyMap() {
    CensusMap.configureEmptyMap();
};

function addCensusPoint() {
    CensusMap.addCensusPoint();
};


CensusMap.selectStateFeature = function() {
    /* Maryland FeatureID = 31*/
    OMM.selectFeatureById(31, "States");

};

CensusMap.deselectStateFeature = function() {
    /* Maryland FeatureID = 31*/
    OMM.deselectFeatureById(31, "States");

};


CensusMap.menuActions = [{
    displayName: "Center on YAHI",
    actionID: "userLocation"
}, {
    displayName: "Center on Census",
    actionID: "centerCensus"
}, {
    displayName: "Center on PR",
    actionID: "centerPR"
}, {
    displayName: "Show Legend",
    actionID: "legend"
}, {
    displayName: "List Basemaps",
    actionID: "basemaps"
}, {
    displayName: "List Layers",
    actionID: "layers"
}, {
    displayName: "Select MD Feature",
    actionID: "selectStateMD"
}, {
    displayName: "De-select MD Feature",
    actionID: "deselectStateMD"
}, {
    displayName: "Simulate Map OnShow",
    actionID: "SimulateMapOnShow"
}, {
    displayName: "Selected Point Reporting Unit",
    actionID: "selectedPtRptUnit"
}, {
    displayName: "Toggle Screen Name",
    actionID: "toggleScreenName"
}, {
    displayName: "Toggle Selected Icon",
    actionID: "resetSelectedIcon"
}];


CensusMap.eventListeners = {
    onAction: function(data) {
        console.log("Action " + data.actionID + " called");
        if (data.actionID === "userLocation") {
            OMM.centerUserLocation(10);
        }
        if (data.actionID === "centerCensus") {
            OMM.centerAt(CensusMap.censusHQ);
        }
        if (data.actionID === "centerPR") {
            OMM.centerAt(CensusMap.PR);
        }
        if (data.actionID === "legend") {
            OMM.showLegend();
        }
        if (data.actionID === "basemaps") {
            OMM.switchBasemap();
        }
        if (data.actionID === "layers") {
            OMM.switchLayers();
        }
        if (data.actionID === "selectStateMD") {
            CensusMap.selectStateFeature();
        }
        if (data.actionID === "deselectStateMD") {
            CensusMap.deselectStateFeature();
        }
        if (data.actionID === "SimulateMapOnShow") {
            CensusMap.ptWrpMgr.clearAllPlots();
            CensusMap.onShow();
        }
        if (data.actionID === "selectedPtRptUnit") {
            console.log("Selected Map Spot Reporting Units:" + CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
			
        }
        if (data.actionID === "toggleScreenName") {
			if (CensusMap.ptWrpMgr.screenName == CensusMap.ScreenName.mapSpot) {
				CensusMap.switchPointMgr(CensusMap.ScreenName.addrLst);
				console.log("Screen Name Changed: " + CensusMap.ptWrpMgr.screenName);
			} else {
				CensusMap.switchPointMgr(CensusMap.ScreenName.mapSpot);
				console.log("Screen Name Changed: " + CensusMap.ptWrpMgr.screenName);
			}
			/*console.log("Current Screen Name: " + CensusMap.ptWrpMgr.screenName);
			CensusMap.ptWrpMgr.removePoints();
			if (CensusMap.ptWrpMgr.screenName == CensusMap.ScreenName.mapSpot) {
				CensusMap.ptWrpMgr = CensusMap.PointManagers.addrLstMgr;
				console.log("Screen Name Changed: " + CensusMap.ptWrpMgr.screenName);
			} else {
				CensusMap.ptWrpMgr = CensusMap.PointManagers.mapSpotMgr;
				console.log("Screen Name Changed: " + CensusMap.ptWrpMgr.screenName);
			}
			CensusMap.ptWrpMgr.clearAllPlots();
			CensusMap.onShow();*/
        }
        if (data.actionID === "resetSelectedIcon") {
            CensusMap.resetSelectedIcon();
        }
    },
    onPointAction: function(data) {
        console.log("Action " + data.actionID + " called from point " + data.pointID);
        if (data.actionID === "hideMap") {
            OMM.hide();
        }
        if (data.actionID === "verify") {
            OMM.changeIcon(data.pointID, "complete");
        }
        if (data.actionID === "delete") {
            OMM.changeIcon(data.pointID, "delete");
        }
        if (data.actionID === "userLocation") {
            OMM.centerUserLocation(10);
        }

		/*delegate to point Manager*/
		try {
			if (CensusMap.ptWrpMgr) {
				CensusMap.ptWrpMgr.onPointAction(data);
			}
		} catch (e) {
			console.log(e.message);
			throw e;
		}
	 
    },
    onShow: function() {
        console.log("onShow called from callback");
        CensusMap.onShow();
    },
    onHide: function() {
        console.log("onHide called");
		if (CensusMap.ptWrpMgr.onHide) CensusMap.ptWrpMgr.onHide();
    },
    onPointCreated: function(data) {
        console.log("onPointCreated called " + data.pointID +
            " at: " + data.location.lat + ", " + data.location.lon);
    },
    onPointSelected: function(data) {
        console.log("onPointSelected called " + data.pointID);
        /*+ 
                   " at: " + data.location.lat + ", " + data.location.lon);*/
        CensusMap.ptWrpMgr.toggleSelected(data.pointID);
        /*if (CensusMap.ptWrpMgr.screenName == "MapSpot") confirm("Is this mapspot correct?");*/
    },
    onLongPress: function(data) {
        console.log("longPress at " + data.location.lat + ", " + data.location.lon);
        /*CensusMap.processLongPress(data);*/
		if (CensusMap.ptWrpMgr.onLongPress) {
			CensusMap.ptWrpMgr.onLongPress(data);
		} else {
			console.log("onLongPress not implemented by: " + CensusMap.ptWrpMgr.screenName);
		}
    },
    onViewpointChanged: function(data) {
    /**
	console.log("Points are bounded with: NE = " + data.northEast.lat + ", " + data.northEast.lon +
				" SW = " + data.southWest.lat + ", " + data.southWest.lon);
 	*/
    console.log(data);
    },
    onMapLoaded: function() {
        console.log("Map is ready");
    }
};

CensusMap.configureEmptyMap = function() {

    console.log("CensusMap.configureEmptyMap");
    if (!this.mapConfigured) {

        var myCenter = this.PR;
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
            title: "Census Map",
            disableNavBar: false,
            backButtonText: "\uE00F  "
        };

        OMM.initOfflineMaps();
        OMM.configure(config, myCenter);
        OMM.setEventListeners(this.eventListeners);
        OMM.configureMenu(this.menuActions);
        OMM.setIcons(this.icons);
        OMM.setShowUserLocation(true);
        OMM.lockOrientation(true);
        OMM.addFeatureLayer("States", "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2");
        OMM.showCenter();

        OMM.printMapStatus();
        this.mapConfigured = true;
    } else {
        console.log("Map already configured, skipping configure call");
        OMM.showCenter();
    }
};


CensusMap.processLongPress = function(data) {

    var newPt = {
        pointID: "drpPointLat_" + data.location.lat,
        title: "Dropped Point",
        subtitle: "Click Here For Menu",
        location: {
            lat: data.location.lat,
            lon: data.location.lon
        },
        iconName: "defaultPin",
        editable: true,
        actions: [{
            displayName: "Verified",
            actionID: "verify"
        }, {
            displayName: "Delete",
            actionID: "delete"
        }, {
            displayName: "Hide Map",
            actionID: "hideMap"
        }, {
            displayName: "User Location",
            actionID: "userLocation"
        }, ]
    };
    OMM.addPoint(newPt);
};

CensusMap.ReportingUnit = function(rptID) {
    this.reportingUnitID = rptID.trim();
    this.addressStatus = null;
    this.addressSelected = false;
    this.locationAddress = null;
    this.isValidRptUnit = false;
    this.isValid = function() {
        console.log("isValid invoked for RptID:" + this.reportingUnitID + "; validation status is:" + this.isValidRptUnit);
        return this.isValidRptUnit;
    };
    this.getStatus = function() {
        return this.addressStatus
    };
    this.setStatus = function(st) {
        this.addressStatus = st
    };
    this.setSelected = function(flag) {
        this.addressSelected = flag
    };
    this.isSelected = function() {
        return this.addressSelected
    };
    this.getReportingUnitID = function() {
        return this.reportingUnitID
    };
    if (this.reportingUnitID.length == 0) {
        this.isValidRptUnit = false;
    } else {
        this.isValidRptUnit = true;
    };
};

CensusMap.iconSelected = "incomplete";

CensusMap.resetSelectedIcon = function() {
    console.log("resetSelectedIcon called");
    if (this.iconSelected == "default_onFocus") {
        this.iconSelected = "incomplete";
    } else {
        this.iconSelected = "default_onFocus";
    }
}

CensusMap.PointWrapper = function() {
    var iconSelected = CensusMap.iconSelected;
    var iconDefault = "default";
    var iconIncomplete = "incomplete";
    var zoom = 14;
    var point = null; /*OMM Point*/
    var plotted = false;
    var selected = false;
    this.unitList = new Array(); /*list of ReportingUnit*/
    this.validPoint = false;
	this.userInput = {
		accepted: false,
		manual : {
			lat:null,
			lon:null
		},
		gps : {
			lat:null,
			lon:null
		}
	}
    this.isValid = function() {
        console.log("isValid called for pointID: " + point.pointID + ";validation status:" + this.validPoint);
        return this.validPoint;

    }

    this.toggleSelected = function() {
        console.log("toggleSelected called for pointID: " + point.pointID);
        if (plotted) {
			/*Possible BUG IN ESRI - i shouldn't need to remove a point. Some how with change icon stale menu is maintained*/
            OMM.removePoint(point.pointID);
            this.toggleIcon();
            OMM.addPoint(point);
            /*this.toggleIcon();
            OMM.changeIcon(point.pointID, point.iconName);*/
        }
    }
    this.toggleIcon = function() {
        console.log("toggleIcon called for pointID: " + point.pointID);
        selected = !selected;
        if (selected) {
            point.iconName = CensusMap.iconSelected;
        } else {
            point.iconName = iconDefault;
        }
        console.log("toggleIcon, icon set to " + point.iconName);
    }
    this.removePlot = function() {
        console.log("removePlot called for pointID: " + point.pointID);
        point.iconName = iconDefault;
        if (plotted) OMM.removePoint(point.pointID);
        plotted = false;
        selected = false;
    }
    this.plot = function() {
        var show = true;
        console.log("Plotting PointID:" + this.getPointID());
        console.log("iterating unitList of length: " + this.unitList.length);
        for (var i = 0; i < this.unitList.length; i++) {
            var unit = this.unitList[i];
            var addrStatus = unit.getStatus();
            console.log("PointID:" + this.getPointID() + ";ReportingUnitID:" + unit.getReportingUnitID() + ";Unit Status:" + unit.getStatus() + ";isSelected:" + unit.isSelected());
            if (addrStatus == SetLALiterals.addressStatus_DNE || addrStatus == SetLALiterals.addressStatus_UTW) {
                show = false;
            }
            if (unit.isSelected()) {
                selected = true;
            }
        }
        if (selected) {
            point.iconName = iconSelected;
        } else {
            point.iconName = iconDefault;
        }
        console.log("PointID:" + this.getPointID() + ";show:" + show + ";selected:" + selected + ";plotted:" + plotted);
        if (show) {
            OMM.addPoint(point);
            plotted = true;
        } else {
            if (plotted) OMM.removePoint(point.pointID);
        }
        console.log("PointID:" + this.getPointID() + ";show:" + show + ";selected:" + selected + ";plotted:" + plotted);
        return {
            show: show,
            selected: selected
        };
    };
    this.getPlotted = function() {
        return plotted;
    };
    this.getSelected = function() {
        return selected;
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
    this.addReportingUnit = function(unit) {
        if (unit.isValid()) {
            console.log("Adding ReportingUnit:" + unit.getReportingUnitID());
            this.unitList.push(unit);
            console.log("After push; unitList.length: " + this.unitList.length + " " + this.getPointID() + " " + this.unitList[this.unitList.length - 1].getReportingUnitID() + " " + this.unitList[this.unitList.length - 1].getStatus());
        } else {
            console.log("***********************ReportingUnit:" + unit.getReportingUnitID() + "is not valid; NOT ADDED to PointID: " + this.getPointID() + "***********************");
        }
    };
    this.getReportingUnitList = function() {
        var rptList = new Array();
        for (var i = 0; i < this.unitList.length; i++) {
            var unit = this.unitList[i];
            rptList.push(unit.getReportingUnitID());
        }
        console.log("getReportingUnitList invoked. returning list:" + rptList);
        return rptList;
    }
    this.getReportingUnitObjects = function() {
        var rptList = new Array();
        for (var i = 0; i < this.unitList.length; i++) {
            var unit = this.unitList[i];
            rptList.push(unit);
        }
        console.log("getReportingUnitObjects invoked. returning object array of length:" + rptList.length);
        return rptList;
    }
    this.createPoint = function(pointID, title, geoLoc) {
        console.log("createPoint invoked for pointID:" + pointID);
        /*check for mandatory attributes*/
        var vLatLon = true;
        var regValidatorLatLon = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

        if (pointID) {
            pointID = pointID.trim();
        }

        if (!regValidatorLatLon.test(geoLoc.lat + "," + geoLoc.lon)) {
            vLatLon = false;
        }

        if (pointID.length == 0 || !vLatLon) {
            this.validPoint = false;
        } else {
            this.validPoint = true;
        }

        point = {
            pointID: pointID,
            title: title + " (" + pointID + ")",
			/*subtitle: "<b>Click to open Menu for:</b><br><i>PointID: $pointID$</i>",
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
            }],*/
            subtitle: CensusMap.ptWrpMgr.pointMenu.subtitle,
			actions: CensusMap.ptWrpMgr.pointMenu.actions,
            location: {
                lat: geoLoc.lat,
                lon: geoLoc.lon
            },
            iconName: "defaultPin",
            editable: true
            
        };
    };
};
/***************************
JS enclosures can lead to SEVERE memory leaks in Internet Explorer.
FIX the following enclosure style class definition
***************************/
CensusMap.PointManager = function(scrnType) {
    this.screenName = scrnType;
    this.pointWrpMap = {};
    this.pointWrpMapLength = 0;
    this.currentSelectedPointID = null;
    this.pointMenu = {};
	
    this.hasPoints = function() {
        if (this.pointWrpMapLength > 0) {
            return true;
        } else {
            return false;
        }
    };
    this.removePoints = function() {
        this.clearAllPlots();
        this.pointWrpMap = {};
        this.pointWrpMapLength = 0;
    };
    this.addPointWrp = function(pw) {
        console.log("addPointWrp invoked for point id: " + pw.getPointID());
        if (pw.isValid()) {
            if (this.isPointAdded(pw.getPointID()) == true) {
                console.log("point id: " + pw.getPointID() + " already managed by PointManager");
                var expw = this.pointWrpMap[pw.getPointID()];
                var rptList = pw.getReportingUnitObjects();
                console.log("size of ReportingUnit List send in to method addPointWrp:" + rptList.length);
                /*if (rptList.length==0) {console.log("No reporting unit associated with this point. Please check code");}*/
                if (rptList.length == 1) {
                    console.log("addPointWrp; Adding ReportingUnitID: " + rptList[0].getReportingUnitID() + " for managed pointID: " + pw.getPointID());
                    expw.addReportingUnit(rptList[0]);
                }
                /*if (rptList.length=>1) {console.log("At this point there should only be one reporting unit; something is wrong please check the code");}*/
            } else {
                console.log("point id: " + pw.getPointID() + " is not managed by PointManager; adding to PointManager");
                this.pointWrpMap[pw.getPointID()] = pw;
                this.pointWrpMapLength += 1;
            }
        } else {
            console.log("**************point id: " + pw.getPointID() + " is not VALID point. THIS WON'T BE PLOTTED***************************");
        }

    };
    this.setScreenName = function(scrName) {
        /* Supported Screens:
        	CensusMap.ScreenName.mapSpot;
        	CensusMap.ScreenName.addrLst;
        */
        try {
            switch (scrName) {
                case CensusMap.ScreenName.mapSpot:
                case CensusMap.ScreenName.addrLst:
					this.screenName = scrName;
					this.setupPointMenu();
                    break;
                default:
                    throw scrName + " screen name doesn't exist";
            }
        } catch (err) {
            console.log(err.message);
            throw err;
        }
		console.log("setScreenName invoked; current screen:" + this.screenName);
    };
	
    this.setupDefaultPointMenu = function() {
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
        }
    };
	
    this.isPointAdded = function(pointID) {
        if (this.pointWrpMap[pointID]) {
            return true;
        }
        return false;
    };
    this.plot = function() {
        /*THIS METHOD DOESNOT CATER FOR MULTIPLE SELECTED POINTS*/
        /*For allow multiple selected points modify the foreach loop below and also think through how you would manage the unitList loop in PointWrapper.plot*/
        try {
			console.log("Point Manager plot invoked. Number of points to plot: " + this.pointWrpMapLength);
			var currSel = null;
			for (var k in this.pointWrpMap) {
				console.log("Plotting PointID: " + k);
				var pw = this.pointWrpMap[k];
				var pointState = pw.plot();
				/* if no points are selected then set the first point as selected */
				if (pointState.selected || currSel === null) {
					currSel = pw.getPointID();
					console.log("Currently Selected Point: " + currSel);
				}
			}

			this.currentSelectedPointID = currSel;
			var pw = this.pointWrpMap[this.currentSelectedPointID];
			OMM.centerAt(CensusMap.convertToZoomPoint(pw));
			OMM.presentAllPoints();
			this.onShow();
		} catch(e) {
			console.log(e.message);
			throw e;
		}

    }
    this.clearAllPlots = function() {
		try {
			for (var k in this.pointWrpMap) {
				console.log("Clearing Plot for Point: " + k);
				var pw = this.pointWrpMap[k];
				pw.removePlot();
			}
			this.currentSelectedPointID = null;
		} catch(e) {
			console.log(e.message);
			throw e;
		}
    }
    this.toggleSelected = function(pointID) {
        var pw = null;
        console.log("Currently Selected Point: " + this.currentSelectedPointID);
        /*are we moving from point to point*/
        if (this.currentSelectedPointID != null && this.currentSelectedPointID != pointID) {
            /*user moved from previous point, so toggle it*/
            console.log("Toggle previous point: " + this.currentSelectedPointID);
            pw = this.pointWrpMap[this.currentSelectedPointID];
            pw.toggleSelected();
        }
        if (this.currentSelectedPointID != pointID) {
            /*toggle the new location too*/
            console.log("Toggle new point: " + pointID);
            pw = this.pointWrpMap[pointID];
            pw.toggleSelected();
            this.currentSelectedPointID = pw.getPointID();
        }
        /*this.getSelectedMapSpotReportingUnit();*/
    }
    this.getSelectedMapSpotReportingUnit = function() {
        var rptList = new Array();
        if (this.currentSelectedPointID != null) {
            var pw = this.pointWrpMap[this.currentSelectedPointID];
            rptList = pw.getReportingUnitList();
        }
        console.log("Selected Map Spot Reporting Units: " + rptList);
        return rptList;
    }
	
	/*Init here*/
	this.setScreenName(this.screenName);
};

CensusMap.MapSpotPointManager = function () {
	
	CensusMap.PointManager.call(this, CensusMap.ScreenName.mapSpot);

	/*Initialize MapSpotPointManager specific properties here*/
	this.showAltMsg = false;
  
};

CensusMap.MapSpotPointManager.prototype = Object.create(CensusMap.PointManager.prototype);

CensusMap.MapSpotPointManager.prototype.constructor = CensusMap.MapSpotPointManager;

CensusMap.MapSpotPointManager.prototype.setupPointMenu = function () {
	console.log("setupPointMenu invoked for: " + this.screenName);
	this.pointMenu = {
		subtitle: "<b>Is this map spot correct?</b>",
		actions: [{
			displayName: "Yes",
			actionID: CensusMap.ScreenName.mapSpot + "_verified_yes"
		}, {
			displayName: "No",
			actionID: CensusMap.ScreenName.mapSpot + "_verified_no"
		}]
	}
	console.log("setupPointMenu invoked actions set: " + this.pointMenu.actions[0].displayName);
}

CensusMap.MapSpotPointManager.prototype.showAlert = function () {
	console.log("showAlert invoked for: " + this.screenName);
	this.showAltMsg = true;
}


CensusMap.MapSpotPointManager.prototype.onShow = function () {
	if (this.showAlert()) alert("Touch and hold a point on the screen to collect a mapspot");
	return true;
};

CensusMap.MapSpotPointManager.prototype.onPointAction = function(data) {

	var success = function (position) {
		// resolve the deferredLoc with your object as the data
		deferredLoc.resolve({
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		});
		console.log("success:::lon/lat:" + position.coords.longitude + "," + position.coords.latitude);
		
	};

	var fail = function () {
		// reject the deferredLoc with an error message
		deferredLoc.reject('failed!');
	};

	var getLocation = function () {
		navigator.geolocation.getCurrentPosition(success, fail,{ enableHighAccuracy: true, timeout: 10 * 1000 * 1000, maximumAge: 0 }); 
		
		setTimeout(function working() {
			if ( deferredLoc.state() === "pending" ) {
				deferredLoc.notify( "working... " );
				setTimeout( working, 500 );
			}
		}, 1 );	
		
		return deferredLoc.promise();
	};

	
	console.log("MapSpotPointManager onPointAction Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);
	try {
	getLocation().then(
		function (location) {
			var gpsCords = null;
			console.log("getLocation invoked");
			var point = {
				lat: location.latitude,
				lon: location.longitude
			};
			console.log("lon/lat:" + point.lon + "," + point.lat);
			//alert("lon/lat:" + point.lon + "," + point.lat);
			//callBk(point);
			gpsCords = {
				lon: point.lon,
				lat: point.lat
			}			
			console.log("gpsCords.lat:" + gpsCords.lat + ";gpsCords.lon:" + gpsCords.lon);
			var pw = CensusMap.ptWrpMgr.pointWrpMap[data.pointID];
			if (data.actionID === CensusMap.ScreenName.mapSpot + "_verified_yes") {
				if (CensusMap.ptWrpMgr.pointWrpMap) {
					
					/*alert("Yes;" + pw.userInput.accepted);*/
					var gpsPt;
					/*getGPSCord(function(pt){gpsPt=pt;});*/
					pw.userInput.accepted = true;
					
					var pt = pw.getPoint();
					pw.userInput.manual.lat =  pt.location.lat || null;
					pw.userInput.manual.lon = 	pt.location.lon || null;
					pw.userInput.gps.lat = gpsCords.lat; 
					pw.userInput.gps.lon = gpsCords.lon;
					
					CensusMap.ptWrpMgr.pointWrpMap[data.pointID] = pw;
					
					console.log("pointID:" + data.pointID + 
						";pw.userInput.accepted:" + pw.userInput.accepted +
						";pw.userInput.manual.lat:" + pw.userInput.manual.lat +
						";pw.userInput.manual.lon:" + pw.userInput.manual.lon +
						";pw.userInput.gps.lat:" + pw.userInput.gps.lat +
						";pw.userInput.gps.lon:" + pw.userInput.gps.lon				
					);
					
					alert("PointID: " + pw.getPointID() + "\n\n" +
						"Accepted: " + pw.userInput.accepted + "\n\n" +
						"Manual Lat: " + pw.userInput.manual.lat + "\n" +
						"Manual Lon: " + pw.userInput.manual.lon + "\n\n" +
						"GPS Lat: " + pw.userInput.gps.lat + "\n" +
						"GPS Lon: " + pw.userInput.gps.lon + "\n\n\n"
					);
				}
			} else {
				pw.userInput.accepted = false;
				alert("PointID: " + pw.getPointID() + "\n\n" +
					"Accepted: " + pw.userInput.accepted + "\n\n" +
					"Manual Lat: " + pw.userInput.manual.lat + "\n" +
					"Manual Lon: " + pw.userInput.manual.lon + "\n\n" +
					"GPS Lat: " + pw.userInput.gps.lat + "\n" +
					"GPS Lon: " + pw.userInput.gps.lon + "\n\n\n"
				);
			}
			if (data.actionID === CensusMap.ScreenName.mapSpot + "_verified_no") {
				console.log("User selected: No");
				return false;
			}
		}, 
		function (errorMessage) {
			 // fail, errorMessage is the string you passed to reject
			 alert("failed");
		}); 
		console.log("getGPSCord called");
	} catch (e) {
		console.log(e.message);
		throw e;
	}

}

CensusMap.genrateGUID = function () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	return v.toString(16);
});
};




// create a new deferred object
var deferredLoc = $.Deferred();
CensusMap.MapSpotPointManager.prototype.onLongPress = function(data) {
	var success = function (position) {
		// resolve the deferredLoc with your object as the data
		deferredLoc.resolve({
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		});
		console.log("success:::lon/lat:" + position.coords.longitude + "," + position.coords.latitude);
		
	};

	var fail = function () {
		// reject the deferredLoc with an error message
		deferredLoc.reject('failed!');
	};

	var getLocation = function () {
		navigator.geolocation.getCurrentPosition(success, fail,{ enableHighAccuracy: true, timeout: 10 * 1000 * 1000, maximumAge: 0 }); 
		
		setTimeout(function working() {
			if ( deferredLoc.state() === "pending" ) {
				deferredLoc.notify( "working... " );
				setTimeout( working, 500 );
			}
		}, 1 );	
		
		return deferredLoc.promise();
	};

	console.log("MapSpotPointManager on long press Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);
	try {
		
		getLocation().then(
		function (location) {
			var gpsCords = null;
			console.log("getLocation invoked");
			var point = {
				lat: location.latitude,
				lon: location.longitude
			};
			console.log("lon/lat:" + point.lon + "," + point.lat);
			//alert("lon/lat:" + point.lon + "," + point.lat);
			//callBk(point);
			gpsCords = {
				lon: point.lon,
				lat: point.lat
			}			
			console.log("gpsCords.lat:" + gpsCords.lat + ";gpsCords.lon:" + gpsCords.lon);
			
			if (true) {
				if (CensusMap.ptWrpMgr.pointWrpMap) {
					var pw = new CensusMap.PointWrapper();
					CensusMap.GlobalAddedPointGUID = CensusMap.genrateGUID();
					pw.createPoint(CensusMap.GlobalAddedPointGUID, "Some address", {
						lat: data.location.lat,
						lon: data.location.lon
					}, "defaultPin");				
					CensusMap.ptWrpMgr.pointWrpMap[pw.getPointID()] = pw;
					pw.plot();
					CensusMap.ptWrpMgr.toggleSelected(pw.getPointID());
					pw.userInput.accepted = false;
					pw.userInput.manual.lat = data.location.lat || null;
					pw.userInput.manual.lon = data.location.lon || null;
					pw.userInput.gps.lat = gpsCords.lat; /*gpsPt.lat || null;*/
					pw.userInput.gps.lon = gpsCords.lon; /*gpsPt.lon || null;*/		
					console.log("pointID:" + pw.getPointID() + 
						";pw.userInput.accepted:" + pw.userInput.accepted +
						";pw.userInput.manual.lat:" + pw.userInput.manual.lat +
						";pw.userInput.manual.lon:" + pw.userInput.manual.lon +
						";pw.userInput.gps.lat:" + pw.userInput.gps.lat +
						";pw.userInput.gps.lon:" + pw.userInput.gps.lon				
					);
					alert("PointID: " + pw.getPointID() + "\n\n" +
						"Accepted: " + pw.userInput.accepted + "\n\n" +
						"Manual Lat: " + pw.userInput.manual.lat + "\n" +
						"Manual Lon: " + pw.userInput.manual.lon + "\n\n" +
						"GPS Lat: " + pw.userInput.gps.lat + "\n" +
						"GPS Lon: " + pw.userInput.gps.lon + "\n\n\n"
					);
				}
			}
		},
		function (errorMessage) {
			 // fail, errorMessage is the string you passed to reject
			 alert("failed");
		});
		console.log("getGPSCord called");
	
	} catch (e) {
		console.log(e.message);
		throw e;
	}

}

CensusMap.GlobalAddedPointGUID = null;
CensusMap.MapSpotPointManager.prototype.onHide = function() {
	console.log("Selected Map Spot Reporting Units:" + CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
	
	if (CensusMap.GlobalAddedPointGUID) {
		var pw = CensusMap.ptWrpMgr.pointWrpMap[CensusMap.GlobalAddedPointGUID];
		console.log("CensusMap.MapSpotPointManager.prototype.onHide pointID:" + pw.getPointID() + 
			";pw.userInput.accepted:" + pw.userInput.accepted +
			";pw.userInput.manual.lat:" + pw.userInput.manual.lat +
			";pw.userInput.manual.lon:" + pw.userInput.manual.lon +
			";pw.userInput.gps.lat:" + pw.userInput.gps.lat +
			";pw.userInput.gps.lon:" + pw.userInput.gps.lon				
		);		
		/*GPSLat, GPSLon, MarkerLat, MarkerLon, PointId*/
		AddUnitPointData(pw.userInput.gps.lat,pw.userInput.gps.lon,pw.userInput.manual.lat,pw.userInput.manual.lon,CensusMap.GlobalAddedPointGUID);
		CensusMap.GlobalAddedPointGUID = null;
	}
	
	/*alert("Selected Map Spot Reporting Units:" + CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());*/
}


CensusMap.AddressListPointManager = function () {

  CensusMap.PointManager.call(this, CensusMap.ScreenName.addrLst);

  /*Initialize AddressListPointManager specific properties here*/
  
};
CensusMap.AddressListPointManager.prototype = Object.create(CensusMap.PointManager.prototype);

CensusMap.AddressListPointManager.prototype.constructor = CensusMap.AddressListPointManager;

CensusMap.AddressListPointManager.prototype.setupPointMenu = function () {
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

CensusMap.AddressListPointManager.prototype.onShow = function () {
	return true;
};

CensusMap.AddressListPointManager.prototype.onPointAction = function(data) {
	console.log("AddressListPointManager onPoint Action Invoked, actionID: " + data.actionID + ";pointID:" + data.pointID);
}

CensusMap.AddressListPointManager.prototype.onHide = function() {
	console.log("Selected Map Spot Reporting Units:" + CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
	/*alert("Selected Map Spot Reporting Units:" + CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());*/
	SelectedAddressListUnit(CensusMap.ptWrpMgr.getSelectedMapSpotReportingUnit());
}

CensusMap.PointManagers = {
	mapSpotMgr : new CensusMap.MapSpotPointManager(),
	addrLstMgr : new CensusMap.AddressListPointManager(),
}

CensusMap.ptWrpMgr = CensusMap.PointManagers.addrLstMgr;

CensusMap.switchPointMgr = function(scrName, show) {
	console.log("Previous Point Mgr Name: " + CensusMap.ptWrpMgr.screenName);
	try {
		CensusMap.ptWrpMgr.removePoints();
		switch (scrName) {
			case CensusMap.ScreenName.mapSpot:
				CensusMap.ptWrpMgr = CensusMap.PointManagers.mapSpotMgr;
				break;
			case CensusMap.ScreenName.addrLst:
				CensusMap.ptWrpMgr = CensusMap.PointManagers.addrLstMgr;
				break;
			default:
				throw scrName + " screen name doesn't exist";
		}
		console.log("Current Point Mgr Name: " + CensusMap.ptWrpMgr.screenName);
		CensusMap.ptWrpMgr.clearAllPlots();
		if (show) CensusMap.onShow();
	} catch (err) {
		console.log(err.message);
		throw err;
	}
}

CensusMap.switchPointMgr = function(scrName) {
	console.log("Previous Point Mgr Name: " + CensusMap.ptWrpMgr.screenName);
	try {
		CensusMap.ptWrpMgr.removePoints();
		switch (scrName) {
			case CensusMap.ScreenName.mapSpot:
				CensusMap.ptWrpMgr = CensusMap.PointManagers.mapSpotMgr;
				break;
			case CensusMap.ScreenName.addrLst:
				CensusMap.ptWrpMgr = CensusMap.PointManagers.addrLstMgr;
				break;
			default:
				throw scrName + " screen name doesn't exist";
		}
		console.log("Current Point Mgr Name: " + CensusMap.ptWrpMgr.screenName);
		CensusMap.ptWrpMgr.clearAllPlots();
		CensusMap.onShow();
	} catch (err) {
		console.log(err.message);
		throw err;
	}
}

CensusMap.DummyData = function() {
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
        var pw = new CensusMap.PointWrapper();
        pw.createPoint("Point " + i, geo.addr, {
            lat: geo.lat,
            lon: geo.lon
        }, "defaultPin");
        for (var x = 0; x <= 3; x++) {
            var rptUnit = new CensusMap.ReportingUnit("ReportUnitID-" + i + "/" + x);
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
            console.log(pw.getPointID() + " " + rptUnit.getReportingUnitID() + " " + rptUnit.getStatus() + " isSelected:" + rptUnit.isSelected());
        }
        this.ptWrpMgr.addPointWrp(pw); // pw.getPointID()] = pw;
    }
};

CensusMap.getPointsToPlot = function() {
    this.DummyData();
    return this.ptWrpMgr;
};

CensusMap.convertToZoomPoint = function(pointWrp) {
    var zoomPoint = {};
    zoomPoint.lat = pointWrp.getLat();
    zoomPoint.lon = pointWrp.getLon();
    zoomPoint.zoom = pointWrp.getZoom();
    return zoomPoint;
};

CensusMap.onShow = function() {
    CensusMap.ptWrpMgr.removePoints();
	/*REMOVE following code should be removed before ALM Team 2 Sprint-4 closes*/
    if (OMM.isTestHarness === undefined) {
		if (CensusMap.ptWrpMgr.screenName == CensusMap.ScreenName.mapSpot) {
				console.log("Collecting Data for: " + CensusMap.ptWrpMgr.screenName);
				CensusMap.ptWrpMgr.showAlert();
				getSelectedUnitLatLong();	
			} else {
				console.log("Collecting Data for: " + CensusMap.ptWrpMgr.screenName);
				getAddressLatLonList();
		}	
	} else {
		this.getPointsToPlot();
	}
    CensusMap.ptWrpMgr.plot();
};

CensusMap.addCensusPoint = function() {
    var newPt = {
        pointID: "point1",
        title: "Census HQ",
        subtitle: "<b>Headquarters</b><br><i>Suitland</i><br><u>Maryland</u>",
        location: {
            lat: 38.846455,
            lon: -76.930446
        },
        iconName: "defaultPoint",
        editable: true,
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

    OMM.addPoint(newPt);
};