var ALMCB_Helpers = {
  /*	
     *	Created By: Sonny Kocak
     *	Date: 11-17-2016
     *	Purpose: Return a value from an element
     */
  getFieldValue: function(page, fieldName) {
    console.log("getFieldValueSTR invoked");
    try {
      var fieldVal = page.get(fieldName);
      return (fieldVal) ? fieldVal.getValue() : "";
    } catch (err) {}
  },

  /*	
     *	Created By: Sonny Kocak
     *	Date: 11-16-2016
     *	Purpose: Builds A String
     */
  BuildAString: function(fullString, page, fieldName) {
    try {
      var tempFullString = "";
      var temp = null;
      var tempVal = null;

      if (fullString)
        tempFullString = fullString;

      /* get field value  */
      temp = page.get(fieldName);
      tempVal = (temp) ? temp.getValue() : "";

      /* only add field value is exist */
      if (tempVal && tempVal.length > 0) {
        /* if this is NOT the first field value added to FullAddres */
        if (tempFullString && tempFullString.length > 0) {
          tempFullString += " " + tempVal;
        } else {
          /* if this is the first field value added to FullAddres */
          tempFullString += tempVal;
        }
      }
      console.log(fieldName + " : " + tempVal);
      return tempFullString;
    } catch (err) {
      alert("BuildAString Error : " + err.message);
      return tempFullString;
    }
  },

  /*	
     *	Created By: Sonny Kocak
     *	Date: 11-16-2016
     *	Purpose: Builds and Updates the Full Address for the current page context
     */
  updateFullAddress: function(reportingUnitPage) {
    var tempFullAddress = "";
    var LFCR = "<br>";
    var commaPadded = ", ";
    var perCommaText = "";
    var lookAheadValue = "";

    try {
      var locationAddress = reportingUnitPage.get("LocationAddress");
      var addressTypePR = this.getFieldValue(locationAddress, "AddressTypePR");
      var addressType;

      if (addressTypePR == ""){
        addressType = this.getFieldValue(locationAddress, "AddrType");
      }
      else
      {
        addressType=addressTypePR;
      }
      switch (addressType) {
        case SetLALiterals.addressType_Urbanizacion:
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCURB");
          if (addressTypePR == ""){
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHN");
          }
          else
          {
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHNPR");
          }
          if (tempFullAddress && tempFullAddress.length > 0)
            tempFullAddress = tempFullAddress + LFCR;
          break;
        case SetLALiterals.addressType_ApartmentComplex:
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCAPTCOMPLEX");
          if (tempFullAddress && tempFullAddress.length > 0)
            tempFullAddress = tempFullAddress + LFCR;
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCBLDGDESC");
          perCommaText += this.getFieldValue(locationAddress, "LOCBLDGDESC");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCBLDGID");
          perCommaText += this.getFieldValue(locationAddress, "LOCBLDGID");
          break;
        case SetLALiterals.addressType_AreaName:
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCDESC");
          if (tempFullAddress && tempFullAddress.length > 0)
            tempFullAddress = tempFullAddress + LFCR;
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCAPTCOMPLEX");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCURB");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCAREANM1");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCAREANM2");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "KMHM");
          if (tempFullAddress && tempFullAddress.length > 0)
            tempFullAddress = tempFullAddress + LFCR;
          if (addressTypePR == ""){
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHN");
          }
          else
          {
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHNPR");
          }
          perCommaText += this.getFieldValue(locationAddress, "LOCHNPR");
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "StreetName");
          perCommaText += this.getFieldValue(locationAddress, "StreetName");
          break;
        case SetLALiterals.addressType_General:
        case "":
        default:
          if (addressTypePR == ""){
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHN");
          }
          else
          {
            tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCHNPR");
          }
          tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "StreetName");
          if (tempFullAddress && tempFullAddress.length > 0)
            tempFullAddress = tempFullAddress + LFCR;
          break;
      }

      /* Common Fields for each PR Category */
      tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCWSDESC1");
      perCommaText += this.getFieldValue(locationAddress, "LOCWSDESC1");
      tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCWSID1");
      perCommaText += this.getFieldValue(locationAddress, "LOCWSID1");
      lookAheadValue = this.getFieldValue(locationAddress, "LOCZIP");
      if ((perCommaText && perCommaText.length > 0) && (lookAheadValue && lookAheadValue.length > 0))
        tempFullAddress = tempFullAddress.trim() + commaPadded;
      tempFullAddress = this.BuildAString(tempFullAddress, locationAddress, "LOCZIP");

      /* if tempFullAddress is not null then update */
      if (tempFullAddress) {
        console.log("tempFullAddress: " + tempFullAddress);
        tempFullAddress = tempFullAddress.toUpperCase();
        locationAddress.put("FullAddress", tempFullAddress);
        tempFullAddress = "";
      }
    } catch (err) {
      alert("updateFullAddress Error : " + err.message);
    }
  }

};

/*
 *	Created By: David Hwang
 *	Date: 02-14-2017
 *	Purpose: Update the 'ReportingStatus'  and 'StatusReason' properties at BCU level
 *	User Story: US-1445.
 */
function UpdateReportingStatusAndStatusReasonForBCU( reportingStatus, statusReason ) {
  /* If mobile and online */
  if (pega.mobile.isHybrid) {
    try {
      /* BCU page being worked*/
      var BCUPage = pega.ui.ClientCache.find('pyWorkPage.BCU');
      /* Update the required properties */
      BCUPage.put("ReportingStatus", reportingStatus);
      BCUPage.put("StatusReason", statusReason);
    }
    catch(e) {
      console.log("Error in updateStatusAndReportingStatusForBCU: " + e.message);
    }
  }
  /* Desktop */  
  else {
    /* Launch the Corresponding Data Transform via an activity; required for now ("until Pega 7.2.3 release") so data transform can be called via JS.*/    
    var oSafeUrl = new SafeURL("CB-Data-BCU.UpdateReportingStatusAndStatusReasonForBCU");
    oSafeUrl.put("ReportingStatus", reportingStatus);
    oSafeUrl.put("StatusReason", statusReason);
    oSafeUrl.put("workPage", "pyWorkPage");
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
  }
}

/*
 *	Created By: David Hwang
 *	Date: 02-14-2017
 *	Purpose: Update the 'ReportingStatus'  and 'StatusReason' properties at Unit/Subcase level after the unit has been selected in the address list.
 *	User Story: US-1445.
 */
function UpdateReportingStatusAndStatusReasonForRU( reportingStatus, statusReason ) {
  /* If mobile and online */
  if (pega.mobile.isHybrid) {
    try {
      /* RU page being worked*/
      var selectedUnitPage = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
      /* Initialize some properties used */
      var addressStatus;
      /* If the status reason given is "AddressStatus" then use the address status to status reason mapping */
      if (statusReason == "AddressStatus") {
        /*Get the current address status for the reporting unit */
        addressStatus = selectedUnitPage.get('AddressStatus') ? selectedUnitPage.get('AddressStatus').getValue() : "";
        /* Address status to status reason mapping */
        /* NOTE: Please update the decision table rule 'DetermineStatusReasonFromAddressStatus' as well (used for desktop) */
        var addressStatusToStatusReason = [ ];
        addressStatusToStatusReason['Nonresidential'] = "Nonresidential";
        addressStatusToStatusReason['Housing Unit'] = "HousingUnit(HU)";
        addressStatusToStatusReason['Uninhabitable'] = "Uninhabitable";
        addressStatusToStatusReason['Under Construction'] = "UnderConstruction";
        addressStatusToStatusReason['Empty Trailer Pad/Mobile Home Site'] = "EmptyTrailerPad";
        addressStatusToStatusReason['Group Quarters (GQ)'] = "GroupQuarters(GQ)";
        addressStatusToStatusReason['Transitory Location (TL)'] = "TransitoryLocation(TL)";
        addressStatusToStatusReason['Exists in Fringe'] = "ExistsInFringe";
        addressStatusToStatusReason['Does Not Exist'] = "DoesNotExist";
        addressStatusToStatusReason['Duplicate'] = "Duplicate";
        addressStatusToStatusReason['Unable To Work'] = "UnitSupervisoryReview";
        /* Set statusReason variable dependent on the mapping */
        if (addressStatus in addressStatusToStatusReason) {
          statusReason = addressStatusToStatusReason[addressStatus];
        }
        else{ 
          /* Might be excessive to throw an error, will just set the statusReason to blank */
          /*throw "Unable to find address status to status reason mapping";*/
          statusReason = "";
        }
      }
      /* If the reporting status given is "AddressStatus" */
      if (reportingStatus == "AddressStatus") { 
        /* If there is no address status set then reinitialize/get that property value */
        if (addressStatus == "") {
          addressStatus = selectedUnitPage.get('AddressStatus') ? selectedUnitPage.get('AddressStatus').getValue() : "";
        }
        /* If address status is "Unable To Work" set reporting status to "Pending" else "Resolved" */
        if (addressStatus == "Unable To Work") { reportingStatus = "Pending"; }
        else { reportingStatus = "Resolved"; }
      }

      /* Update the required properties for the selected unit page */
      selectedUnitPage.put("ReportingStatus", reportingStatus);
      selectedUnitPage.put("StatusReason", statusReason);
      /* Get page index used to determine where the unit is in the unit list */
      var pageIndex = selectedUnitPage.get('PageIndex') ? selectedUnitPage.get('PageIndex').getValue() : "";
      if (pageIndex != "") {
        /* Find the selected unit in the unit list using the page index */
        var unitInUnitList = pega.ui.ClientCache.find('pyWorkPage.BCU.UnitList(' + pageIndex + ')');
        /* Update the required properties for the unit in the unit list */
        unitInUnitList.put("ReportingStatus", reportingStatus); 
        unitInUnitList.put("StatusReason", statusReason);
      }
      else { throw "No page index found."; }
    }
    catch(e) {
      console.log("Error in updateStatusAndReportingStatusForRU: " + e.message);
    }
  }
  /* Desktop */  
  else {
    /* Launch the Corresponding Data Transform via an activity; required for now ("until Pega 7.2.3 release") so data transform can be called via JS.*/    
    var oSafeUrl = new SafeURL("CB-FW-CensusFW-Work.CallDataTransform");
	oSafeUrl.put("DataTransformName", "UpdateReportingStatusAndStatusReasonForRU");
    oSafeUrl.put("workPage", "pyWorkPage.BCU.SelectedUnitPage");
    oSafeUrl.put("ReportingStatus", reportingStatus);
    oSafeUrl.put("StatusReason", statusReason);
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
  }
}

function AppendWorkEvent(EventDetails, OperatorID) {
  if(OnMobileApp()) {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var workEvents = pega.ui.ClientCache.find("pyWorkPage.WorkEvents");
    if(!workEvents) {
      workPage.put("WorkEvents", []);
      workEvents = workPage.get("WorkEvents");
    }
    /*Get the current date time and format to be same as Pega OOTB format**/
    var date = new Date().toJSON();
    date = date.split("-").join("");
    date = date.split(":").join("");
    date = date.replace("Z"," GMT");

    /*Store all the values in a temp page **/
    var tempPage = pega.ui.ClientCache.createPage("temp");
    tempPage.put("pyLabel", EventDetails);
    tempPage.put("pyOwner", OperatorID);
    tempPage.put("EventTime", date);

    /**Append the temp page to pyWorkPage.WorkEvents **/
    workEvents.add().adoptJSON(tempPage.getJSON());
    tempPage.remove();
  } 
  else {
    var oSafeURL = new SafeURL("CB-FW-CensusFW-Work.CallDataTransform");
    oSafeURL.put("DataTransformName", "AppendWorkEvent");
    oSafeURL.put("EventDetails", EventDetails);
    oSafeURL.put("OperatorID", OperatorID);
    oSafeURL.put("workPage", "pyWorkPage");
    /*
    httpRequestAsynch(oSafeURL.toURL(), null, 50, 100);*/
    pega.util.Connect.asyncRequest('GET', oSafeURL.toURL(), '');
  }
}


function FilterAddressList(selectclass) {
  var valueEntered = $('.' + selectclass).find("input").val();
  if(valueEntered.length >=3){
    $(".adress_wrapper").each(function() {
      if($(this).find(".fulladdress span.usds_body_copy").html().toLowerCase().includes(valueEntered.toLowerCase())){
        $(this).closest(".content-item .content-sub_section").removeClass("hiddenaddress").show();
      }
      else {
        $(this).closest(".content-item .content-sub_section").addClass("hiddenaddress").hide();
      }
    }); 
  }
  else {
    $(".adress_wrapper").each(function() {
      $(this).closest(".content-item .content-sub_section").removeClass("hiddenaddress").show();
    }); 
  }
}
/*	
 *	Created By: Sonny Kocak
 *	Date: 11-16-2016
 *	Purpose: Preps and Updates the FullAddress field for Each ReportingUnit page in  UnitList 
 */
function PrepareFullAddresses() {
  try {
    var unitList = findPage("pyWorkPage.BCU.UnitList");
    /* check that the UnitList page has values */
    if (unitList) {
      console.log("PrepareFullAddresses - unitList length:" + unitList.length);
      var ULiterator = unitList.iterator();
      /* loop each reporting unit */
      while (ULiterator.hasNext()) {
        var reportingUnit = ULiterator.next();
        ALMCB_Helpers.updateFullAddress(reportingUnit);
      }
    }
  } catch (e) {
    /*console log and stack trace added by Rohit Chaudhri on 11/18/2016*/
    console.log("PrepareFullAddresses Error : " + e.message + "\n" + e.stack);
    alert("PrepareFullAddresses Error : " + e.message);
  }
}

/*	
 *	Created By: Sonny Kocak
 *	Date: 11-16-2016
 *	Purpose: Preps and Updates the FullAddress for current SelectUnitList page
 */
function PrepareFullAddress() {
  try {
    var selectedUnitPage = findPage("pyWorkPage.BCU.SelectedUnitPage");

    /* Check for SelectedUnit page*/
    if (selectedUnitPage) {
      console.log("selectedUnitPage length:" + selectedUnitPage.length);
      ALMCB_Helpers.updateFullAddress(selectedUnitPage);
      LogPageFieldValue("pyWorkPage.BCU.SelectedUnitPage.LocationAddress","FullAddress");
    }
  } catch (e) {
    alert("PrepareFullAddresses Error : " + e.message);
  }
}


/*	
 *	Created By: Sonny Kocak
 *	Date: 11-16-2016
 *	Purpose: Preps and Updates the FullAddress for current SelectUnitList page
 */
function LogPageFieldValue(pageName, fieldName) {
  try {

    var page = findPage(pageName);
    var fieldValue = ALMCB_Helpers.getFieldValue(page, fieldName);
    console.log("the value of " + fieldName + " : " + fieldValue);
    /* alert("Temporary Alert: ProcessFullAddress returns " + fieldValue); */

  }
  catch (e) {
    alert("LogPageFieldValue Error : " + e.message);
  }
}

/*	
 *	Created By: Kenward Thoi
 *	Date: 09-21-2016
 *	Purpose: Start processing of new unit
 */
function AddNewUnit(event) {

  if (pega.mobile.isHybrid) {
    var workPg = pega.ui.ClientCache.find('pyWorkPage');
    var BCU = workPg.get('BCU');
    var state = BCU.get('State');
    if (state) {
      state = state.getValue();
    } else {
      var state = "";
    }
    var UnitList = BCU.get('UnitList');
    if (!UnitList) {
      var tempBCU = BCU.getJSON();
      tempBCU = tempBCU.substring(0, tempBCU.length - 1);
      tempBCU = tempBCU + ', "UnitList": [{"pxObjClass":"CB-Data-ReportingUnit", "LocationAddress":{"pxObjClass":"CB-Data-Address-Location" ,"STATE":"' + state + '" , "IsLocationAvailable":"false" , "AddressTypePR":""}}] }';
      BCU.adoptJSON(tempBCU);
      var NewUnit = BCU.get("UnitList(1)");
    } else {
      var NewUnit = UnitList.add();
      NewUnit.adoptJSON('{ "pxObjClass":"CB-Data-ReportingUnit", "LocationAddress":{"pxObjClass":"CB-Data-Address-Location" ,"STATE":"' + state + '" , "IsLocationAvailable":"false" , "AddressTypePR":""}}');
    }
    var indexNum = parseInt(BCU.get('TotalUnits').getValue()) + 1;
    BCU.put('TotalUnits', indexNum);
    var remaining = parseInt(BCU.get('RemainingUnits').getValue()) + 1;
    BCU.put('RemainingUnits', remaining);
    BCU.put('SelectedUnit', String(indexNum));
    NewUnit.put('PageIndex', String(indexNum));
    NewUnit.put('NewUnitStatus', 'New');
    NewUnit.put('ReportingUnitStatus', '');
    NewUnit.put('AddressStatus', '');
    NewUnit.put('ListingStatus', 'Unworked');
    NewUnit.put('StatusReason', 'InProgress');
    NewUnit.put('ReportingStatus', 'Open');
    var locAdd = NewUnit.get('LocationAddress');
    if (BCU.get('IsPR').getValue() === "false") {
      locAdd.put('IsHouseNumEditable', true);
      locAdd.put('DisplayHouseNum', true);
      locAdd.put('DisplayHouseNumSuf', false);
      locAdd.put('DisplayHouseNumNoSuf', false);
    }

    var selectedUnitPage = BCU.get('SelectedUnitPage');
    selectedUnitPage.adoptPage(NewUnit);

  } else {
    var safeUrl = SafeURL_createFromURL(pega.u.d.url);
    safeUrl.put('pyActivity', 'AddNewUnit');
    var callback = {
      success: function() {}
    };
    var ev = pega.util.Event.getTarget(event);
    pega.u.d.asyncRequest('POST', safeUrl, callback, pega.u.d.getQueryString(ev));
  }

}


/*	
 *	Created By: Mark Switzer
 *	Date: 09-29-2016
 *	Purpose: This onClick action sets the Address Status to the one (of 3) radio button groups
 *			 that displays based on the New Unit Status ('', New, Rework).
 *			 Part of US-578 and US-1269.
 */
function onClickAddressStatus(status) {
  if (pega.mobile.isHybrid) {
    try {
      var workPage = pega.ui.ClientCache.find('pyWorkPage');
      var BCU = workPage.get('BCU');
      var unit = BCU.get('SelectedUnitPage');
      unit.put('AddressStatus', status);
      /*unit.put('AddressStatusReason', 'test this');*/
      /*switz302 - question about setting property in editable text field on mobile. */

      /*Pre-populate current address' reason with the most recently enetered reason for a previous "unable to work" address (stored at BCU level)*/
      if (status === 'Unable To Work') {
        var latestASR = BCU.get('LatestAddressStatusReason');
        if (!latestASR) {
          latestASR = '';
        } else {
          latestASR = latestASR.getValue();
        }
        document.getElementById('AddressStatusReason').value = latestASR;
        setInterval(SetFocusInputBox, 500);
      }
      else {
        document.getElementById('AddressStatusReason').value = '';
      }

    } catch (er) {
      console.log("Error in onClickAddressStatus: " + er.message);
    }
  }
}


/*	
 *	Created By: Kenward Thoi
 *	Date: 09-14-2016
 *	Purpose: Used to blank out the StreetName or replace StreetName with source data
 */
function SetStreetName() {
  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var Unknown = document.getElementsByName("$PpyWorkPage$pBCU$pSelectedUnitPage$pLocationAddress$pIsUnnamedUnknown")[1].checked;
    var street = document.getElementById('StreetName');
    if (Unknown) {
      pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage.LocationAddress").put("StreetName", "");
      street.value = '';
    } else {
      var StreetNameObj;
      var StreetName;
      StreetNameObj = BCU.get("UnitList(" + BCU.get("SelectedUnit").getValue() + ").LocationAddress.StreetName");
      if (StreetNameObj) {
        StreetName = StreetNameObj.getValue();
      } else {
        StreetName = '';
      }
      pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage.LocationAddress").put("StreetName", StreetName);
      street.value = StreetName;
    }
    pega.u.d.evaluateClientConditions();

  } else {
    var oSafeUrl = new SafeURL("CB-Data-ReportingUnit.SetStreetName");
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
    var section = pega.u.d.getSectionByName("SetLocationAddress", '', document);
    pega.u.d.reloadSection(section, '', '', false, false, '', false);
  }
}


function SetFacilityName() {
  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var SameAsGQ = document.getElementsByName("$PpyWorkPage$pBCU$pSelectedUnitPage$pIsFacilityNameSameAsGQ")[1].checked;
    var facility = document.getElementById('GQFacilityName');
    if (SameAsGQ) {
      var GQName = document.getElementById('GQName');
      pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage").put("GQFacilityName", GQName.value);
      facility.value = GQName.value;
    } else {
      var FacilityNameObj;
      var FacilityName;
      FacilityNameObj = BCU.get("UnitList(" + BCU.get("SelectedUnit").getValue() + ").GQFacilityName");
      if (FacilityNameObj) {
        FacilityName = FacilityNameObj.getValue();
      } else {
        FacilityName = ''
      }
      pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage").put("GQFacilityName", FacilityName);
      facility.value = FacilityName;
    }
    pega.u.d.evaluateClientConditions();
  } else {
    var oSafeUrl = new SafeURL("CB-Data-ReportingUnit.SetFacilityName");
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
    var section = pega.u.d.getSectionByName("SetLocationAddress", '', document);
    pega.u.d.reloadSection(section, '', '', false, false, '', false);
  }
}


/*	
 *	Created By: Kenward Thoi
 *	Date: 08-26-2016
 *	Purpose: Used to copy the Unit List index of the selected unit to the BCU page
 *			 If not on mobile, run "SetSelectedUnit" activity. Part of US-626
 */
function SetSelectedUnit(Index) {

  var base_ref_prefix = "";

  if (pega.mobile.isHybrid) {
    base_ref_prefix = "pyWorkPage";
    pega.ui.ClientCache.find("pyWorkPage.BCU").put("SelectedUnit", Index);
    pega.u.d.evaluateClientConditions();
  } else {
    var oSafeUrl = new SafeURL("CB-Data-ReportingUnit.SetSelectedUnit");
    oSafeUrl.put("Index", Index);
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
    var section = pega.u.d.getSectionByName("AddressListContainer", '', document);
    pega.u.d.reloadSection(section, '', '', false, false, '', false);
  }


  /*Remove any already showing buttons before showing the currently selected.*/
  $('.my-address-work-list-content div.work-item-buttons.work-item-buttons-show').removeClass('work-item-buttons-show');

  /*Remove any already expanded markers before expanding the currently selected one.*/
  $('.my-address-work-list-content div.my-work-address-marker').closest('.layout.my-work-address-marker-expand').removeClass('my-work-address-marker-expand');

  /*Set height of progress markers that are available for this item as well as show buttons*/
  $('.my-address-work-list-content div[base_ref="' + base_ref_prefix + '.BCU.UnitList(' + Index + ')"] div.my-work-address-marker').closest('.layout').addClass('my-work-address-marker-expand');
  $('.my-address-work-list-content div[base_ref="' + base_ref_prefix + '.BCU.UnitList(' + Index + ')"] div.work-item-buttons').addClass('work-item-buttons-show');

  if (Index == 1) {
    console.log($('.my-address-work-list-content div[base_ref="' + base_ref_prefix + '.BCU.UnitList(' + Index + ')"] div.work-item-buttons'));
  }
}


/*	
 *	Created By: Kenward Thoi
 *	Date: 08-26-2016
 *	Purpose: Copies the Current page of the UnitList over to the UnitPage
 */
function ViewUnit(Index) {

  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var tempPage = BCU.get("UnitList(" + Index + ")");
    var UnitPage = pega.ui.ClientCache.find("UnitPage");
    if (!UnitPage) {
      var UnitPage = pega.ui.ClientCache.createPage("UnitPage");
      var objJSON = '{"pxObjClass":"CB-Data-ReportingUnit"}';
      UnitPage.adoptJSON(objJSON);
    }
    UnitPage.adoptPage(tempPage);
  } else {
    var oSafeUrl = new SafeURL("CB-Data-ReportingUnit.SetTopUnitPage");
    oSafeUrl.put("Index", Index);
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
  }
}


/*	
 *	Created By: Kenward Thoi
 *	Date: 08-26-2016
 *	Purpose: Copies the Current page of the UnitList over to the SelectedUnitPage
 *			 where work will be done. Part of US-626
 */
function ProcessUnit(Index) {

  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var tempPage = BCU.get("UnitList(" + Index + ")");
    var page = BCU.get("SelectedUnitPage");
    page.adoptPage(tempPage);
  } else {
    var oSafeUrl = new SafeURL("CB-Data-ReportingUnit.SetSelectedUnitPage");
    oSafeUrl.put("Index", Index);
    pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
  }
}

function AdCanCancel(event) {
  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var newUnitStatus = BCU.get("SelectedUnitPage.NewUnitStatus");
    if (newUnitStatus) {
      if (newUnitStatus.getValue() === 'New') {
        var UnitList = BCU.get('UnitList');
        var temp = UnitList.get(BCU.get('SelectedUnit').getValue());
        temp.remove();
        BCU.put('SelectedUnit', 'None');
        var total = parseInt(BCU.get('TotalUnits').getValue()) - 1;
        BCU.put('TotalUnits', total);
        var remaining = parseInt(BCU.get('RemainingUnits').getValue()) - 1;
        BCU.put('RemainingUnits', remaining);
      }
    }
  } else {
    var safeUrl = SafeURL_createFromURL(pega.u.d.url);
    safeUrl.put('pyActivity', 'CancelNewUnit');
    var callback = {
      success: function() {}
    };
    var ev = pega.util.Event.getTarget(event);
    pega.u.d.asyncRequest('POST', safeUrl, callback, pega.u.d.getQueryString(ev));
  }
  pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=ASSIGNMENT63");
}


function AdCanGoBack() {
  if (pega.mobile.isHybrid) {
    var taskName = pega.ui.ClientCache.find('newAssignPage.pxTaskName').getValue();

    switch (taskName) {
      case 'Assignment2':
        /* Structure Type go to Set Address Status */
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment1");
        break;
      case 'Assignment3':
        var addressStatus = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.AddressStatus').getValue();

        if (addressStatus === "Group Quarters (GQ)") {
          var selectedUnitPage = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
          var attemptContactYesNo = selectedUnitPage.get("AttemptContactYesNo")?selectedUnitPage.get("AttemptContactYesNo").getValue(): '';

          var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
          var gqType = locationAddress.get("GQTypes") ? locationAddress.get("GQTypes").getValue(): '';
          /* Location Address go to Collect GQ Information.-Jared Nichols, Part of US-595,596. -Updated by switz302, Part of US-592,1919. */
          if (gqType === "703: Domestic Violence Shelters") {  
            pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment9");
          }
          /* Location Address go to GQ Contact Information.-switz302, Part of US-592. -Updated by cai00304*/
          else if(attemptContactYesNo === "Yes"){
            pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment11");
          }
          else {
            /* Location Address screen go to Attempt Contact.*/
            pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment8");
          }
        }
        else if (addressStatus === "Transitory Location (TL)") {
          /* Location Address go to TL Contact Information.-switz302, Part of US-1919. -Updated by cai00304*/
          var selectedUnitPage = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
          var attemptContactYesNo = selectedUnitPage.get("AttemptContactYesNo")?selectedUnitPage.get("AttemptContactYesNo").getValue(): '';
          if(attemptContactYesNo === "Yes"){
            pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment11");
          }
          else {
            /* Location Address screen go to Attempt Contact.*/
            pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment8");
          }
        }
        else {
          /* Location Address screen go to Attempt Contact.*/
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment8");
        }
        break;
      case 'Assignment4':
        /* Mailing Address go to Location Address screen */
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment3");
        break;
      case 'Assignment5':
        /* Map Spot */
        var selectedUnitPage = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
        try {
          var attemptContactYesNo = selectedUnitPage.get("AttemptContactYesNo").getValue() || '';
        } catch (e) {}

        try {
          var enumerate = selectedUnitPage.get("EnumerateUnit").getValue() || '';
        } catch (e) {
          var enumerate = false;
        }

        try {
          var mailAddress = selectedUnitPage.get("LocationAddress.LOCISMAIL").getValue().toString() || '';
        } catch (e) {
          var mailAddress = new String();
          mailAddress = 'Y';
        }
        if (attemptContactYesNo === 'Yes' && enumerate === true) {
          /* go to Enumerate */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment6");
        } else if (attemptContactYesNo === 'Yes' && mailAddress === 'N') {
          /* go to Mailing Address */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment4");
        } else {
          /* go to Location Address */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment3");
        }
        break;
      case 'Assignment6':
        /* Enumerate */
        var selectedUnitPage = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
        try {
          var attemptContactYesNo = selectedUnitPage.get("AttemptContactYesNo").getValue() || '';
        } catch (e) {
          var attemptContactYesNo = 'No'; /* Kelsey Justis- Would like to remove to this line; not comfortable with setting this property value here.*/
        }
        try {
          var mailAddress = selectedUnitPage.get("LocationAddress.LOCISMAIL").getValue().toString() || '';
        } catch (e) {
          var mailAddress = new String();
          mailAddress = 'Y';
        }
        if (attemptContactYesNo === 'Yes' && mailAddress === 'N') {
          /* go to Mailing Address */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment4");
        } else {
          /* go to Location Address */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment3");
        }
        break;
      case 'Assignment8':
        /* Attempt Contact screen */
        var addressStatus = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.AddressStatus').getValue();
        /* this logic replicates the SetAddressStatus post flow action to reverse the route taken */
        if (["Housing Unit", "Uninhabitable", "Under Construction"].indexOf(addressStatus) != -1) {
          /* go to Structure Type */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment2");
        } 
        /* IF Address Status is GQ and IF Previous Button Clicked go back to "Collect GQ Information" screen.-KCJ, Part of US-845.*/
        else if (addressStatus === "Group Quarters (GQ)") { 
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment9");
        }
        /* IF Address Status is TL and IF Previous Button Clicked go back to "Select TL Type" screen.-KCJ, Part of US-845.*/
        else if (addressStatus === "Transitory Location (TL)") { 
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment10");
        }
        else {
          /* go to Address Status */
          pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment1");
        }
        break;
      case 'Assignment9':
        /* "Collect GQ Information" screen IF Previous Button Clicked go to Set Address Status screen.-KCJ, Part of US-845.*/
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment1");
        break;
      case 'Assignment10':
        /* "Select TL Type" screen IF Previous Button Clicked go to Set Address Status screen.-KCJ, Part of US-845.*/
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment1");
        break;
      case 'Assignment11':
        /* "Collect Contact Info" screen IF Previous Button Clicked go to Attempt Contact screen.-switz302, Part of US-592.*/
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=ProcessBCU&TaskName=Assignment8");
        break;
      default:
        /* fallback version use product implementation */
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true&previousEntryPoint=true");
        break;
    }
  } else {
    /* server implementation of GoToPrevious works so let it */
    pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true&previousEntryPoint=true");
  }
}


function setActionCase(showActnCase, strShowProp) {
  if (showActnCase) {
    showActnCase.put("DisplayCaseList", (strShowProp === 'DisplayCaseList') ? true : false);
    showActnCase.put("HideHomeScreen", (strShowProp === 'HideHomeScreen') ? false : true);
    showActnCase.put("DisplayWorkAvailability", (strShowProp === 'DisplayWorkAvailability') ? true : false);
    showActnCase.put("DisplayTimeAndExpense", (strShowProp === 'DisplayTimeAndExpense') ? true : false);
  }
}


function getActionPage() {
  var showActnCase = pega.ui.ClientCache.find("ShowActionPage");

  if (!showActnCase) {
    console.log("ShowActionPage not found.  Generating a new one with default values.");
    showActnCase = pega.ui.ClientCache.createPage("ShowActionPage");
    showActnCase.adoptJSON('{"pxObjClass":"Data-Portal"}');
    showActnCase.put("LastSyncTime", getTodayString());

    /* Sets Default Values by passing no value to strShowProp.  System should default to showing the home screen */
    setActionCase(showActnCase, "HideHomeScreen");
  }

  return showActnCase;
}


function setMenuOption(strPropName, strHelpName) {
  try {
    if (pega.mobile.isHybrid) {
      var showActnCase = getActionPage();

      setActionCase(showActnCase, strPropName);
      setHelpPage(strHelpName);
    }
  } catch (e) {
    console.log("Inside setMenuOption: " + e.message);
  }
}


/*	
 *	Created By: Randall Reese
 *	Date: 09-06-2016
 *	Purpose: Sets value of boolean property to display the user Case List. US-
 */
function DisplayCaseList() {
  pega.desktop.activateDocument(0);
  setMenuOption("DisplayCaseList", "CaseList");
}


function DisplayTimeAndExpense() {
  pega.desktop.activateDocument(0);
  setMenuOption("DisplayTimeAndExpense", "TimeAndExpense");
}


function DisplayMenu() {
  pega.desktop.activateDocument(0);
  setMenuOption("HideHomeScreen", "Home");
}


function CallServiceCenter() {
  try {
    pega.desktop.activateDocument(0);
    window.location.href = 'tel:8552362020';

  } catch (e) {
    console.log("Error inside CallServiceCenter: " + e.message);
  }
}


/*	
 *	Created By: Kelsey C. Justis
 *	Date: 11-15-2016
 *	Purpose: If AddressTypePRNoApartmentComplex property has a value copy this value into the AddressTypePR property.
 *	Part of US-1382. 
 */
function SyncAddressTypeProperty() {
  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage");
    var locationAddress = BCU.get("LocationAddress");
    var addressTypePRNoApartmentComplexValue = locationAddress.get("AddressTypePRNoApartmentComplex").getValue();
    locationAddress.put("AddressTypePR", addressTypePRNoApartmentComplexValue);

    /*Refresh Section.-KCJ*/
    var section = pega.u.d.getSectionByName("SetLocationAddress", '', document);
    pega.u.d.reloadSection(section, '', '', false, false, '', false);
  }
}

function setHelpPage(helpName) {
  try {
    if (pega.mobile.isHybrid) {
      var showHelp = pega.ui.ClientCache.find("HelpSelection");

      if (!showHelp) {
        console.log("Creating 'HelpSelection' page.");
        showHelp = pega.ui.ClientCache.createPage("HelpSelection");
        showHelp.adoptJSON('{"pxObjClass":"Data-Portal"}');
        showHelp.put("ShowFor", "NONE");
        console.log("Finished createing page: 'HelpSelection'");
      }

      showHelp.put("ShowFor", helpName);
      console.log("Help to show has been set to: " + helpName)
    }

  } catch (e) {
    console.log(e.message);
  }
}


/*	
 *	Created By: Bola Oseni
 *	Date: 10-14-2016
 *	Purpose: Check if the D_pyUserWorkList contains the a reference to a class that has an infix of parameter value
 */
function checkClassName(ClassToCheck) {
  console.log("Inside checkClassName, parameter: " + ClassToCheck);

  /* parameter value */
  if (ClassToCheck === '')
    return false;

  /* Check if parameter, ClassToCheck is in the list */
  var found = false;
  //var workListItems = pega.ui.ClientCache.find("D_pyUserWorkList.pxResults");
  var workListItems = pega.ui.ClientCache.find("D_AdCanWorkList.pxResults");
  if (!workListItems) workListItems = pega.ui.ClientCache.find("D_AdCanUserWorkList.pxResults");

  var firstItem = workListItems[1];
  if (firstItem && firstItem.get("pxRefObjectKey") && firstItem.get("pxRefObjectKey").getValue().includes(ClassToCheck)) {
    console.log("Inside checkClassName, found parameter: " + ClassToCheck);
    found = true;
  }

  return found;
}

/* Set the BCUStatus for proper display of Finish Block screen */
function UpdateBCUStatus(event) {
  if (pega.mobile.isHybrid) {
    var BCU = pega.ui.ClientCache.find('pyWorkPage.BCU');
    var remainingUnits = parseInt(BCU.get('RemainingUnits').getValue());
    var totalUnits = parseInt(BCU.get('TotalUnits').getValue());
    var BCUStatus;
    if (remainingUnits === 0) {
      BCUStatus = "Worked";
    } else if (remainingUnits != 0 && remainingUnits != totalUnits) {
      BCUStatus = "In Progress";
    } else {
      BCUStatus = "Unworked";
    }
    BCU.put("Status", BCUStatus);
  } else {
    var safeUrl = SafeURL_createFromURL(pega.u.d.url);
    safeUrl.put('pyActivity', 'UpdateBCUStatus');
    var callback = {
      success: function() {}
    };
    var ev = pega.util.Event.getTarget(event);
    pega.u.d.asyncRequest('POST', safeUrl, callback, pega.u.d.getQueryString(ev));
  }
}


function SyncData() {
  try {
    if (pega.mobile.isHybrid) {
      var showActnCase = pega.ui.ClientCache.find("ShowActionPage");

      if (!showActnCase) {
        showActnCase = pega.ui.ClientCache.createPage("ShowActionPage");
        var objJSON = '{"pxObjClass":"Data-Portal"}';
        showActnCase.adoptJSON(objJSON);
      }

      /* Hide last sync while syncing is occuring */
      $('div.last-sync').attr('display', 'none !important');

      datasyncStart();

      var dateStr = getTodayString();
      showActnCase.put("LastSyncTime", dateStr);
      /* Now populate .last-sync with latest sync time */

      $('.last-sync span').html(dateStr);
      $('.last-sync').attr('display', 'inline-block !important');
    }
  } catch (e) {
    console.log("Inside syncing: " + e.message);
  }
}

/* Add message to Unable to Work reason */
function ValidateBlockUnableToWork() {
  var BCU = pega.ui.ClientCache.find('pyWorkPage.BCU');
  var unableToWorkBlockReason = BCU.get('UnableToWorkBlockReason');
  if (unableToWorkBlockReason) {
    unableToWorkBlockReason = BCU.get('UnableToWorkBlockReason').getValue();
  } else {
    BCU.put("UnableToWorkBlockReason", "");
  }
  BCU.get('UnableToWorkBlockReason').clearMessages();
  BCU.get('UnableToWorkBlockReason').addMessage(ALMCensus.Messages.Msg_UnableToWorkBlockReasonRequired);
  pega.ui.DCUtil.refresh();
}

/* Update the Data Page for the worklist and set SelectedUnit to None to allow finish of block*/
function FinishAddressList(event) {
  if (pega.mobile.isHybrid) {
    //var userWorkList = pega.ui.ClientCache.find('D_pyUserWorkList');
    var userWorkList = pega.ui.ClientCache.find('D_AdCanUserWorkList');
    var count = parseInt(userWorkList.get('pxResultCount').getValue());
    var caseList = userWorkList.get('pxResults').iterator();
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var caseID = workPage.get('pzInsKey').getValue();
    var BCU = workPage.get('BCU');
    var UnableToWork = BCU.get('UnableToWork') ? BCU.get('UnableToWork').getValue() : false;
    BCU.put('SelectedUnit', 'None');
    if (UnableToWork !== true) {
      BCU.put('UnableToWorkBlockReason', '');
    }
    while (caseList && caseList.hasNext()) {
      var tempCase = caseList.next();
      if (tempCase.get('pxRefObjectKey').getValue() === caseID) {
        tempCase.put("pyAssignmentStatus", "Resolved-Completed");
        count = count - 1;
        userWorkList.put('pxResultCount', count);
      }
    }
  } else {
    var safeUrl = SafeURL_createFromURL(pega.u.d.url);
    safeUrl.put('pyActivity', 'ClearSelectedUnitPage');
    var callback = {
      success: function() {}
    };
    var ev = pega.util.Event.getTarget(event);
    pega.u.d.asyncRequest('POST', safeUrl, callback, pega.u.d.getQueryString(ev));
  }
}

/* Clear message on the modal window when */
function ClearUnableToWorkMessages() {
  var BCU = pega.ui.ClientCache.find('pyWorkPage.BCU');
  BCU.get('UnableToWorkBlockReason').clearMessages();
  pega.ui.DCUtil.refresh();
}

/*  
   *  Created By: Deepak Nagda
   *  Date: 12-20-2016
   *  Purpose: To creae a page for section include to display for AttemptContactInfo for SelectedunitPage.
   */
function SetContactPageInfo(){
  try {
    var bcu = CChlpr.findPage("pyWorkPage.BCU");
    var selectedUnit = bcu.get("SelectedUnitPage");
    if (!selectedUnit) {
      console.log("ALMCB_offlineFunctions->SetContactPage: " + "selectedUnit not found");
      return;
    }
    var supage = selectedUnit.getJSON();
    console.log("ALMCB_offlineFunctions->SetContactPage: " + "selectedUnit.getJSON():\n" + selectedUnit.getJSON());

    var attemptContactInfo = selectedUnit.get("AttemptContactInfo");

    if (!attemptContactInfo) { /** empty page. Create and add new attemptContactInfo page **/
      console.log("ALMCB_offlineFunctions->SetContactPage: " + "Empty AttemptContactInfo Page " + selectedUnit.getJSON());
      var tmpPage = pega.ui.ClientCache.createPage("TempUnitPage1");

      var unitPointObjJSON = '{"pxObjClass" : "CB-Data-AttemptContact","ContactName":""}';
      tmpPage.adoptJSON(unitPointObjJSON);

      /* tmpPage.put("ContactName", " ");
      tmpPage.put("ContactTitle", " ");
      tmpPage.put("Email", "");
      tmpPage.put("MaxCapacity", "");
      tmpPage.put("OfficeLocation", "");
      tmpPage.put("PhoneExtension", "");
      tmpPage.put("PhoneNumber", "");
      tmpPage.put("Website", "");*/

      var tempWorkpg = selectedUnit.getJSON();
      tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1);
      tempWorkpg = tempWorkpg + ',"AttemptContactInfo" : ' + tmpPage.getJSON() + '}';
      console.log("ALMCB_offlineFunctions->SetContactPage: " + "tempWorkpg: " + tempWorkpg);
      selectedUnit.adoptJSON(tempWorkpg);
      console.log("ALMCB_offlineFunctions->SetContactPage: " + selectedUnit.getJSON());
    } 
  } catch (e) {
    console.log("ALMCB_offlineFunctions->SetContactPage: "  + "Error :: Caught exception" + e);
    throw e;
  }
}

/*  
   *  Created By: David Oliver, Sonny Kocak 
   *  Date: 02-14-2017
   *  Purpose: To creae a page for section include to display for AttemptContactInfo for SelectedunitPage.
   */
function SetContactDetailsInfo(){
  try {  

    /* Set the value for .AddressStatusCurrent to  .AddressStatus,   or "Blank"   if  .AddressStatus has no value,    strip special char, */
    var selectedUnitPage = findPage('pyWorkPage.BCU.SelectedUnitPage');
    var attemptContactInfo = findPage('pyWorkPage.BCU.SelectedUnitPage.AttemptContactInfo');
    var addressStatusCurrent = ALMCB_Helpers.getFieldValue(selectedUnitPage, "AddressStatusCurrent");

    var contactDetail = findPage("pyWorkPage.BCU.SelectedUnitPage.ContactDetail(SORIn)");
    var SORStatus  = contactDetail.get("SORStatus");
    var SORStatusValue  =  SORStatus ? SORStatus.getValue() : "";

    if (SORStatusValue == "Available") {
      contactDetail.put('SORStatus', "Processed");

      /* .BCU.SelectedUnitPage.AttemptContactInfo set to Current Address */
      attemptContactInfo.adoptJSON(contactDetail.getJSON())

      /*  create in contactDetail element with Key/Index with the value of the Current Address */
      var contactDetailCA = pega.ui.ClientCache.createPage("pyWorkPage.BCU.SelectedUnitPage.ContactDetail(" + addressStatusCurrent + ")");
      contactDetailCA.adoptJSON(contactDetail); 


    }

  }
  catch(err) {
    console.log("SetContactDetailsInfoTemp Error" + err.message);
  }}



/* ALM Case List: Show Details/Work buttons for the selected case
Uses parameters to get index of selected case in case in order to show buttons on selected div

@param propLookAt: property used to identify case index in pagelist 
@param propValue: property value we are looking for
@param pagelist: pagelist we are iterating through

 */
function ShowWorklistButtons(propLookAt, propValue, pagelist) {

  /* Get the index of our case in the pagelist */
  var index = CB.indexInPageList(propLookAt, propValue, pagelist);

  /* If index of our case is found, remove all buttons currently displayed and display work buttons for selected case */
  if(index > 0) {
    $('.my-address-work-list div.work-item-buttons-show').removeClass('work-item-buttons-show');
    $('.my-address-work-list div[base_ref="D_AdCanUserWorkList.pxResults(' + index + ')"] div.work-item-buttons-hide').addClass('work-item-buttons-show');
    $('.my-address-work-list div[base_ref="D_EnumUserWorkList.pxResults(' + index + ')"] div.work-item-buttons-hide').addClass('work-item-buttons-show');
    /* $('.my-address-work-list div[base_ref="D_pyUserWorkList.pxResults(' + index + ')"] div.work-item-buttons-hide').addClass('work-item-buttons-show'); */
  } 

}

function PostReviewCaseContent(pzInsKey)
{
  try
  {
    if(OnMobileApp())
    {
      var workItems = pega.ui.ClientCache.find("D_AdCanUserWorkList.pxResults");
      var iterWorkItems = workItems.iterator();
      while(iterWorkItems.hasNext())
      {
        var cpCurWorkItem = iterWorkItems.next();
        var cpPxRefObjectKey = cpCurWorkItem.get("pxRefObjectKey") ? cpCurWorkItem.get("pxRefObjectKey").getValue() : "";
        if(cpPxRefObjectKey == pzInsKey)
        {
          var cpPzInsKey = cpCurWorkItem.get("pzInsKey") ? cpCurWorkItem.get("pzInsKey").getValue() : "";
          var cpReportingUnitID = cpCurWorkItem.get("ReportingUnitID") ? cpCurWorkItem.get("ReportingUnitID").getValue() : "";
          var cpTract = cpCurWorkItem.get("Tract") ? cpCurWorkItem.get("Tract").getValue() : "";
          var newPage = pega.ui.ClientCache.createPage("DetailsCurrentPageInfo");
          newPage.put("pxObjClass", "Assign-Worklist");
          newPage.put("pzInsKey", cpPzInsKey);
          newPage.put("ReportingUnitID", cpReportingUnitID);
          newPage.put("Tract", cpTract);
          /*alert(newPage.getJSON());
                var getPage = pega.ui.ClientCache.find("DetailsCurrentPageInfo");
                if(getPage)
				{
                   alert(getPage.getJSON());
                }
                else
                {
                   alert("Could not get what I just created.");
                }
                */
          break;
        }
      } 
    } 
    else
    {
      var oSafeURL = new SafeURL("CB-FW-CensusFW-Work-AdCan.PostReviewCaseContent");
      oSafeURL.put("pzInsKey", pzInsKey);
      pega.util.Connect.asyncRequest('GET', oSafeURL.toURL(), '');
    }
  }
  catch(Err)
  {
    alert("Error ==> " + Err.message);
  }
}