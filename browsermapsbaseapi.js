/****
Author: Rohit Chaudhri
Creation Date: Sept 3rd 2016


Lite: http://geodienste-umwelt.hessen.de/arcgis_js_api/sdk_37/sandbox/sandbox.html?sample=widget_infowindow
****/

console.log("Loading BrowserMapsBaseAPI.js");

var BRMAP = BRMAP || {};


/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
BRMAP.toggleDropdownMenu = function() {
    document.getElementById("myDropdown").classList.toggle("show");
};

/* Close the dropdown if the user clicks outside of it*/
window.onclick = function(event) {
  try{
    var targetElement;
    if (typeof event.target != 'undefined') {
        targetElement = event.target;
    }
    /*otherwise it is IE then adapt syntax */
    else {
        targetElement = event.srcElement;
    }

    if (!targetElement.matches('.dropbtn')) {

        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
  }catch(exe){
    console.log(exe.message);
  }
};

/*
Menu events
*/

BRMAP.eventListeners = {};

/**
todo: BRMAP.configure needs to be changed in the base api
*/
BRMAP.Map = function(config, centerOn) {

    var esriMapObj = null;
    var gsvc = null;
    var selfRef = this;

    this.center = centerOn;
    this.showUserLocation = false;
    this.eventListeners = {};
    this.icons = {};
    this.lastCenterPoint = {};
    this.graphics = {};
    this.gLayer = null;

    /* todo:  */
    this.setTitle(config.title);

    require([
        "esri/map",
        "esri/layers/VectorTileLayer",
        "esri/layers/FeatureLayer",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "esri/geometry/Point",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/PictureMarkerSymbol",
        "esri/layers/ArcGISTiledMapServiceLayer",
        "esri/graphic",
        "esri/layers/GraphicsLayer",
        "esri/geometry/Extent",
        "esri/tasks/GeometryService",
        "esri/tasks/ProjectParameters",
        "esri/SpatialReference",
        "esri/InfoTemplate",
        "dojo/domReady!",
    ], function(
        Map, VectorTileLayer, FeatureLayer, BorderContainer, ContentPane, Point, SimpleMarkerSymbol, PictureMarkerSymbol, ArcGISTiledMapServiceLayer, graphic, GraphicsLayer, Extent, GeometryService, ProjectParameters, SpatialReference, InfoTemplate) {
        console.log("call back invoked; this.center.lat:" + selfRef.center.lat);

        try {
            esriMapObj = new Map("mapCanvasBrowser", {
                basemap: config.activeStyle.source.toLowerCase(),
                center: [centerOn.lon, centerOn.lat],
                zoom: centerOn.zoom
            });
        } catch (e) {
            console.log(e.message + " " + e.stack);
            throw e;
        }


        var secureLayer = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ["*"]
        });

        var template = new InfoTemplate();
        template.setTitle("<b>" + "D_MapConfig.Name" + "</b>");
        template.setContent("BCU Details: " + "D_MapConfig.BCUID");

        /***********
            
        Add tract and BCU layers
            
        var bcuF = new FeatureLayer("https://services7.arcgis.com/d3ZJwaciVKHJWEKM/arcgis/rest/services/LIMA_Operational_Layers/FeatureServer/3?token=FNQW8-G8uEMYrgP-gXkTUTEgZ6u9JK2Nxq-jLdhx0cvF4MZrSkhiUfK6Hwg7uOGO8VYY66leeAXz9TYzttrix5G9TacQ4VGakqW9R1djNsxkRXKwTtTU8tnxej6vr0Us2u_Se9ZOVw7NmJed7Eew2AiWxX-eWA1TEcT6npDUhcH-uu9wuZaqMk7xXvp86kuc",{
            infoTemplate: template,
            outFields: ["*"]
        });
        esriMapObj.addLayer(bcuF);

        var tractF = new FeatureLayer("https://services7.arcgis.com/d3ZJwaciVKHJWEKM/arcgis/rest/services/LIMA_Operational_Layers/FeatureServer/4?token=FNQW8-G8uEMYrgP-gXkTUTEgZ6u9JK2Nxq-jLdhx0cvF4MZrSkhiUfK6Hwg7uOGO8VYY66leeAXz9TYzttrix5G9TacQ4VGakqW9R1djNsxkRXKwTtTU8tnxej6vr0Us2u_Se9ZOVw7NmJed7Eew2AiWxX-eWA1TEcT6npDUhcH-uu9wuZaqMk7xXvp86kuc");
        esriMapObj.addLayer(tractF);
            
        **********/

        if (BRMAP.isTestHarness) {
            esriMapObj.addLayer(secureLayer);
        } else {
            var vtlayer = new VectorTileLayer("https://geo086webl.boc.ad.census.gov/server/rest/services/Hosted/Atlantis_ESRI/VectorTileServer");
            /* todo: VectorTileLayer because of fonts this is not allowed through census firewall
            esriMapObj.addLayer(vtlayer);*/

            var basemapLayer = new ArcGISTiledMapServiceLayer("https://tigerweb.dev.geo.census.gov/arcgis/rest/services/Atlantis/USLandmass/MapServer");
            esriMapObj.addLayer(basemapLayer);

            template = new InfoTemplate();

            template.setTitle("<b>${NAME}</b>");
            template.setContent("BCU Details: ${GEOID} ");

            var roadsLayer = new FeatureLayer("https://tigerweb.dev.geo.census.gov/arcgis/rest/services/Atlantis/Transportation/MapServer/2");
            esriMapObj.addLayer(roadsLayer);


            var roadsLayer1 = new FeatureLayer("https://tigerweb.dev.geo.census.gov/arcgis/rest/services/Atlantis/Transportation/MapServer/8");
            esriMapObj.addLayer(roadsLayer1);


            var bcuF = new FeatureLayer("https://tigerweb.dev.geo.census.gov/arcgis/rest/services/Atlantis/BCUs/FeatureServer/0", {

                infoTemplate: template,

                outFields: ["*"]

            });

            esriMapObj.addLayer(bcuF);

            var tractF = new FeatureLayer("https://tigerweb.dev.geo.census.gov/arcgis/rest/services/Atlantis/Tracts_Blocks/FeatureServer/0");

            esriMapObj.addLayer(tractF);
        }

        esriMapObj.on("load", function(evt) {
            esriMapObj.disableDoubleClickZoom();
          	esriMapObj.disableScrollWheelZoom();
          	esriMapObj.setInfoWindowOnClick(false)

        });

        esriMapObj.on("click", function(evt) {
            selfRef.ClickEventHandler(evt);
        });
        esriMapObj.on("dbl-click", function(evt) {
          /*  projectToWebMercator(evt); */
        });

        esriMapObj.on("mouse-move", function(evt) {
            infoHover(evt);
        });
      
        gsvc = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
		
        function projectToWebMercator(evt) {
            var point = evt.mapPoint;

            gsvc.project([point], evt.mapPoint.spatialReference, function(projectedPoints) {
                pt = projectedPoints[0];
                projectToLatLong();
            });
        }

        function projectToLatLong() {
            var outSR = new SpatialReference(4326);
            var params = new ProjectParameters();
            params.geometries = [pt.normalize()];
            params.outSR = outSR;

            gsvc.project(params, function(projectedPoints) {
                var pt = projectedPoints[0];
                var lat = pt.y.toFixed(3);
                var lon = pt.x.toFixed(3);
                console.log("dblClick Lat/Lon" + lat + " " + lon);
                selfRef.DblClickEventHandler({
                    location: {
                        lat: lat,
                        lon: lon
                    }
                });
            });
        }
      
        function infoHover(evt){
              if(evt.graphic != undefined){   
                	try{
                      
                    var info = evt.graphic.infoTemplate;
                      
                    esriMapObj.infoWindow.setTitle(info.title);
  					esriMapObj.infoWindow.setContent(info.content);
  					esriMapObj.infoWindow.show(evt.screenPoint,esriMapObj.getInfoWindowAnchor(evt.screenPoint));
                      
                	BRMAP.eventListeners.onMouseMove(evt.graphic);
                      
                    }catch(ex){
                      console.log(ex.message);
                    }
               } 
        }
        ESRIMap.onShow();

        function supports_local_storage() {
            try {
                return "localStorage" in window && window["localStorage"] !== null;
            } catch (e) {
                return false;
            }
        }
    });

    this.getMap = function() {
        return esriMapObj;
    };

    /* TODO: this.setTitle((config.title) || "Test Harness");*/
};

BRMAP.Map.prototype.initOfflineMaps = function() {};

BRMAP.Map.prototype.setEventListeners = function(evnts) {
    console.log("setEventListeners invoked while esriMapObj is " + this.getMap());
    if (ESRIMap.eventListeners === undefined) {
        alert("eventListeners is not defined");
    } else {
        BRMAP.eventListeners = evnts;
    }

};

BRMAP.Map.prototype.configureMenu = function(menuActions) {
    for (var i = 0; i < menuActions.length; i++) {
        var data = {
            actionID: menuActions[i].actionID
        };
        var runAllBtn = '<a href="#' + menuActions[i].actionID + '" onclick="BRMAP.eventListeners.onAction({actionID:\'' + menuActions[i].actionID + '\'});return false;">' + menuActions[i].displayName + '</a>';
        $("#myDropdown").append(runAllBtn);
    }
};

BRMAP.Map.prototype.centerAt = function(newCenter, no_zoomFlag) {
    var point = new esri.geometry.Point({
        latitude: newCenter.lat,
        longitude: newCenter.lon
    });
    console.log("centerAt point.lat: " + point.latitude);
    console.log("centerAt point.lon: " + point.longitude);
    if (point.latitude && point.longitude) {
        console.log("Browsermap.centerAt");
        this.lastCenterPoint.point = point;
        this.lastCenterPoint.zoom = newCenter.zoom;
        if (no_zoomFlag) {
            console.log("centerAt (No Zoom)");
            this.getMap().centerAt(point);
        } else {
            console.log("centerAt (Zoom) newCenter.zoom: " + newCenter.zoom);
            this.getMap().centerAndZoom(point, newCenter.zoom);
        }
    } else {
        console.log("invalid lat/lon Browsermap.centerAt is a no-op");
    }

};

BRMAP.Map.prototype.centerUserLocation = function() {
    var mapObj = this.getMap();
    var deferred = $.Deferred();

    var success = function(position) {
        deferred.resolve({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        });
        console.log("lon/lat:" + position.coords.longitude + "," + position.coords.latitude);
    };

    var fail = function() {
        deferred.reject('failed!');
    };

    var getLocation = function() {
        navigator.geolocation.getCurrentPosition(success, fail);

        setTimeout(function working() {
            if (deferred.state() === "pending") {
                deferred.notify("working... ");
                setTimeout(working, 500);
            }
        }, 1);

        return deferred.promise();
    };

    getLocation().then(
        function(location) {
            var point = new esri.geometry.Point({
                latitude: location.latitude,
                longitude: location.longitude
            });
            console.log("lon/lat:" + point.longitude + "," + point.latitude);
            mapObj.centerAndZoom(point, 15);
        },
        function(errorMessage) {
            alert("failed");
        });
    console.log("Browsermap.centerUserLocation called");
};

BRMAP.Map.prototype.showLegend = function() {
    alert("Stub for showLegend()");
};

BRMAP.Map.prototype.pointNorth = function() {
    alert("Stub for pointNorth()");
    console.log("pointNorth called");
};

BRMAP.Map.prototype.lockOrientation = function() {
    console.log("lockOrientation called: /***************************Implement******************************************/");
};

BRMAP.Map.prototype.printMapStatus = function() {
    console.log("printMapStatus invoked");
};


BRMAP.Map.prototype.listBasemaps = function() {
    alert("Stub for listBasemaps()");
    console.log("listBasemaps called");
};

BRMAP.Map.prototype.listLayers = function() {
    alert("Stub for listLayers()");
    console.log("listLayers called");
};

BRMAP.Map.prototype.addPoint = function(pt, infoTemplate) {
    /*addressList = [{lat: pt.location.lat,lon: pt.location.lon,pointID:pt.pointID,iconName:pt.iconName}];*/
    var addressList = [pt];
    var infoTemp = [infoTemplate];
    this.showMark(addressList, infoTemp);
};

BRMAP.Map.prototype.setTitle = function(newTitle) {
    if (document.getElementById("mapTitle")) document.getElementById("mapTitle").innerHTML = newTitle;
    console.log("Browsermaps.setTitle called");
};

BRMAP.Map.prototype.changeIcon = function(ptID, icon) {
    /*addressList = [{lat: pt.location.lat,lon: pt.location.lon,pointID:pt.pointID,iconName:pt.iconName}];*/
    var pw = ESRIMap.ptWrpMgr.pointWrpMap[ptID];
    var addressList = [pw.getPoint()];
    this.showMark(addressList);
};

BRMAP.Map.prototype.removePoint = function(pointID) {
    this.gLayer.remove(this.graphics[pointID]);
};

BRMAP.Map.prototype.presentAllPoints = function() {
    console.log("presentAllPoints invoked  /***************************Implement******************************************/");
    this.getMap().centerAndZoom(this.lastCenterPoint.point, this.lastCenterPoint.zoom - 5);
};

BRMAP.Map.prototype.setShowUserLocation = function(flag) {
    console.log("setShowUserLocation invoked /***************************Implement******************************************/");
    console.log("implement setShowUserLocation(flag); parameter passed: " + flag);
};

BRMAP.Map.prototype.showMark = function(listOfLatLon, infoTemp) {
    console.log("showMark called");
    var s = null;
    var pic = {};
    var selfRef = this;
    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["default"] = new PictureMarkerSymbol({
            /*todo: CensusMap.icons is this realy needed*/
            "url": CensusMap.icons["default"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["complete"] = new PictureMarkerSymbol({
            "url": selfRef.icons["complete"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["default_onFocus"] = new PictureMarkerSymbol({
            "url": selfRef.icons["default_onFocus"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["incomplete"] = new PictureMarkerSymbol({
            "url": selfRef.icons["incomplete"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["Lister"] = new PictureMarkerSymbol({
            "url": selfRef.icons["Lister"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["Enumerator"] = new PictureMarkerSymbol({
            "url": selfRef.icons["Enumerator"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });
    /*todo: load census icons using a loop*/
    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["CFS"] = new PictureMarkerSymbol({
            "url": selfRef.icons["CFS"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

      /*todo: load census icons using a loop*/
    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic["SelectedEnum"] = new PictureMarkerSymbol({
            "url": selfRef.icons["SelectedEnum"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require(["esri/symbols/SimpleMarkerSymbol"], function(SimpleMarkerSymbol) {
        s = new SimpleMarkerSymbol().setSize(60);
    });
    if (this.gLayer == null) {
        this.gLayer = new esri.layers.GraphicsLayer();
    }
    var gl = this.gLayer;
    var g = null;
    for (var i = 0; i < listOfLatLon.length; i++) {
        console.log("lat: " + listOfLatLon[i].location.lat + "lon: " + listOfLatLon[i].location.lon + " pointID: " + listOfLatLon[i].pointID + " icon: " + listOfLatLon[i].iconName);
        var p = new esri.geometry.Point({
            latitude: listOfLatLon[i].location.lat,
            longitude: listOfLatLon[i].location.lon
        });


        var infoTemplate = null;

        require(["esri/InfoTemplate"], function(InfoTemplate) {
            if (infoTemp) {
                var hd, txt;
                if (infoTemp[i].header) {
                    hd = infoTemp[i].header;
                }
                if (infoTemp[i].htmlText) {
                    txt = infoTemp[i].htmlText;
                }
                infoTemplate = new InfoTemplate(hd, txt);
                /*infoTemplate = new InfoTemplate(listOfLatLon[i].pointID, "Title: " + 'title' + "<br>Desc: "+ 'desc');*/
            } else {
                infoTemplate = new InfoTemplate(listOfLatLon[i].pointID, "Title: " + 'title' + "<br>Desc: " + 'desc');
            }
        });


        console.log("showing picture");
        g = new esri.Graphic(p, pic[listOfLatLon[i].iconName], {}, infoTemplate);
        g.setAttributes({
            id: listOfLatLon[i].pointID,
            name: listOfLatLon[i].pointID,
            myData: listOfLatLon[i]
        });

        this.graphics[listOfLatLon[i].pointID] = g;
        gl.add(g);
    }
    this.getMap().addLayer(gl);
};

BRMAP.Map.prototype.DblClickEventHandler = function(point) {
    console.log("DblClickEventHandler event handler invoked");

    if (!point) {
        console.log("point for double click is not defined");
    } else {
        BRMAP.eventListeners.onLongPress(point);
    }
};

BRMAP.Map.prototype.ClickEventHandler = function(evt) {
    if (evt.graphic === undefined) {
        console.log("evt.graphic not defined");
    } else {
        console.log(evt.graphic.attributes.name);
        /*var pw = ESRIMap.ptWrpMgr.pointWrpMap.get(evt.graphic.attributes.id);
        BRMAP.eventListeners.onPointSelected(pw.getPoint());*/
        BRMAP.eventListeners.onPointSelected(evt.graphic.attributes.myData);
        this.setMenuForPoint(evt.graphic.attributes.myData);
    }
};

BRMAP.Map.prototype.setMenuForPoint = function(pt) {
    var selfRef = this;
    try {
        if (pt === undefined) {
            console.log("pt not defined");
        } else {
            console.log("setting up menu for point" + pt.pointID);
            var pw = ESRIMap.ptWrpMgr.pointWrpMap[pt.pointID];

            var newPt = pt;
            $("#pointDropDown").empty();
            $("ptTitle").empty();
            var titleandSub = newPt.title + "<br/>" + newPt.subtitle;
            $("#pointDropDown").append(titleandSub);
            if (newPt.actions != null && newPt.actions.length > 0) {
                for (var i = 0; i < newPt.actions.length; i++) {
                    var data = {
                        actionID: newPt.actions[i].actionID,
                        pointID: newPt.pointID
                    };
                    var runAllBtn = '<a href="#' + newPt.actions[i].actionID + '" onclick="BRMAP.eventListeners.onPointAction({actionID:\'' + newPt.actions[i].actionID + '\',pointID:\'' + data.pointID + '\',location: {lon:\'' + pw.getPoint().location.lon + '\',lat:\'' + pw.getPoint().location.lat + '\'}});return false;">' + newPt.actions[i].displayName + '</a>';
                    $("#pointDropDown").append(runAllBtn);
                }
            }
            document.getElementById("pointDropDown").classList.toggle("show");
        }
    } catch (e) {
        console.log(e.message);
        throw e;
    }
};

BRMAP.Map.prototype.toggleShowUserLocation = function() {
    this.showUserLocation = !this.showUserLocation;
    var selfRef = this;
    console.log("this.center.lat: " + this.center.lat);
    console.log("this.center.lon: " + this.center.lon);

    var p = new esri.geometry.Point({
        latitude: this.center.lat,
        longitude: this.center.lon
    });
    var gl = new esri.layers.GraphicsLayer();
    var s = null;
    var pic = null;
    require([
        "esri/symbols/PictureMarkerSymbol"
    ], function(PictureMarkerSymbol) {
        pic = new PictureMarkerSymbol({
            "url": selfRef.icons["defaultPin"].image,
            "height": 20,
            "width": 20,
            "type": "esriPMS"
        });
    });

    require(["esri/symbols/SimpleMarkerSymbol"], function(SimpleMarkerSymbol) {
        s = new SimpleMarkerSymbol().setSize(60);
    });

    var g = new esri.Graphic(p, pic);
    gl.add(g);
    this.getMap().addLayer(gl);

    console.log("setShowUserLocation called");
};

BRMAP.Map.prototype.setIcons = function(icons) {
    this.icons = icons;
    console.log("setIcons called");
};

BRMAP.Map.prototype.addFeatureLayer = function(name, url) {
    var interval = setInterval(function() {
        if (typeof map == 'undefined') return;
        clearInterval(interval);
    }, 500);

    console.log("wait over addFeatureLayer invoked while map is " + map);


    var secureLayer = null;
    require(["esri/layers/FeatureLayer"], function(FeatureLayer) {
        secureLayer = new FeatureLayer("https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ["*"]
        });
    });

    try {
        this.getMap().addLayer(secureLayer);
    } catch (e) {
        console.log("map FeatureLayer not added called - FIX LATER" + e.message);
    }
    console.log("addFeatureLayer called");
};

BRMAP.Map.prototype.showCenter = function() {
    var point = new esri.geometry.Point({
        latitude: this.center.lat,
        longitude: this.center.lon
    });
    try {
        this.getMap().centerAndZoom(point, this.center.lat.zoom);
    } catch (e) {
        console.log("FIX LATER" + e.message);
    }
    console.log("show called");
};


BRMAP.Map.prototype.hide = function() {
    console.log("hide called");
    this.getMap().setVisibility(false);
    ESRIMap.onHide();
};

BRMAP.Map.prototype.show = function() {
    console.log("hide called");
    this.getMap().setVisibility(true);
    ESRIMap.onShow();
};