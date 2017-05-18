/******************** Common functions **************************************************
***                       we can also add map functions here once the map
***                       application is finalized
*****************************************************************************************/
/*namespace*/
var CB = CB || {};


/* OVERRIDING OOTB function to remove alert
 @key : Ins Handle provided for opening a Work Item.
 */
pega.desktop.openWorkByHandle = function() {
  var args = arguments[0],
    oSafeURL = null,
    key = arguments[0] ? arguments[0] : "",
    harnessVersion = arguments[1] ? arguments[1] : "",
    contentID = arguments[2] ? arguments[2] : "",
    dynamicContainerID = arguments[3] ? arguments[3] : "",
    skipConflictCheck = arguments[4] ? arguments[4] : "",
    alwaysReload = arguments[5] ? arguments[5] : "";

  if (typeof args == "object" && args.name == "safeURL") {
    oSafeURL = SafeURL_clone(args);
    key = oSafeURL.get("key");
  } else {
    oSafeURL = new SafeURL();
    oSafeURL.put("contentID", contentID);
    oSafeURL.put("dynamicContainerID", dynamicContainerID);
  }
  if (key == "") {
    /*BUG-163412: Using getLocalString API instead of string for localization*/
    //BUG-182692: correcting the fieldvalue key
    var msgEmptyWorkItemHandle = pega.u.d.fieldValuesList.get("Empty Work Item ID");
    return;
  }
  // TASK-149436 03/19/2013 GUJAS1: If skipConflictCheck has been specified, put in the parameters.
  // US-58856 : Added always Reload param,if true the document gets reloaded without any warning.
  oSafeURL.put("SkipConflictCheck", skipConflictCheck);
  oSafeURL.put("reload", alwaysReload);

  if (pega.desktop.support.handleMultipleAG(key, false, harnessVersion)) {
    pega.desktop.support.postOpenWorkByHandle(key, harnessVersion, oSafeURL);
  }
}

/*	
 *	Created By: Drake Downs
 *	Date: 1.11.17
 *	Purpose: This function validates a text input field against the valid character set US-1080
 */

function ValidateCharacterSet (selector) {
  var regex = /^([A-Za-z0-9&'\s\(\),-\.\ÁÉÍÓÚÅÜÑ/]*)$/;
  var userInput = ($("."+selector).find('input').val());
  var ootb_error_frag = '<div class="iconErrorDiv dynamic-icon-error-div"><span class="iconError validation-error">';
  var errorFrag = document.getElementsByClassName("iconErrorDiv");  
  var errorDiv = ($("."+selector)).find(".iconErrorDiv");
  
  	if  (!regex.test(userInput)) {   
      
      if ((errorDiv.length) == 0) {
        $("."+selector).addClass("usds-text-input-error-layout");        
        $("."+selector).find('input').parent().before(ootb_error_frag+ALMCensus.Messages.Msg_InvalidData+"</span></div>");
      } 
      
    }
  else {    
     if (regex.test(userInput)) { 
       $("."+selector).removeClass("usds-text-input-error-layout");
       $("."+selector).find(".iconErrorDiv").empty();
       $("."+selector).find(".iconErrorDiv").remove();
    }
    
  }
  
}



/* This function formats the Unable to Work Address Reason field to the business rules */
function formatReason(addressReason, path) {  
  var workPage = pega.ui.ClientCache.find("pyWorkPage"); 
  var format = addressReason.split('"').join("");
  var setPropInCache = workPage.put(path, format);
  var setPropInClipboard = pega.u.d.setProperty("pyWorkPage."+path, format);
  
}
  


/*****************************************************************************************
***** to format phone in a particular format "(800)-123 4568"
*****         The following method will check the phone # in LEAP Phone Format
******************************************************************************************/

CB.LeapPhoneFormat = function(phoneValue) {
  var USPhoneString = /^\(([0-9]{3})\)([0-9]{3})-([0-9]{4})$/;
  try {
    if (phoneValue.length == 0) {
      return true;
    }
    var newPhone = CB.phoneFormat(phoneValue);
    if (!USPhoneString.test(newPhone)) {
      /*console.log("Invalid Phone number: " + newPhone);*/
      return false;
    }
    if (phoneValue.length !=13) {
      return false;
    }
    return true;
  } catch(e) {
    /*log the error*/
    console.log("Unexpected CB.LeapPhoneFormat error: " + e.message);
  }
};

/** Common function to refresh a screen */
CB.RefreshWhen = function(property) {
  pega.u.ChangeTrackerMap.getTracker().changedPropertiesList.push(property);
  pega.u.d.evaluateClientConditions();
};

/** Common function to grab SelectedUnitPage to ensure validations are done on the correct PageContext*/
/** Created by Marc Gosselin */
CB.GetSelectedUnitPage = function(){
	return pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage");
}

/******************************************************************************************
****	This method will format given phone # with the following format (222)111-4444
*******************************************************************************************/
CB.phoneFormat = function(phone) {
  try {
    if (phone.length == 0) {
      return "";
    }
    phone = phone.replace(/[^0-9]/g, '');
    phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1)$2-$3");
    return phone;
  } catch(e) {
    console.log("Unexpected CB.phoneFormat error: " + e.message);
  }
};


/**********************************************************************************************
******            The following method will check the email # in LEAP email Format
***********************************************************************************************/
CB.LeapEmailFormat = function(emailValue) {
  var usEmail=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  try {
    console.log("Inside LeapEmailFormat: " + emailValue + " : Returns: " + usEmail.test(emailValue));
    if (emailValue.length == 0) {
      /*console.log("Inside LeapEmailFormat: " + emailValue.length);*/
      return true;
    }
    if (!usEmail.test(emailValue)) {
      return false;
    } else {
      return  true;
    }
  } catch(e) {
    /*log the error*/
    console.log("Unexpected CB.LeapEmailFormat error: " + e.message);
  }
};

/**********************************************************************************************
****	this method checks for a valid US zipcode
***********************************************************************************************/
CB.isValidZipcode = function(zipValue) {
  var reg = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
  /*console.log("inside isvlaidzip: zip " + zipValue + " Returns: " + reg.test(zipValue));*/
  if (reg.test(zipValue)) {
    return true;
  } else {
    return false;
  }
};

/**********************************************************************************************
*****	this method checks for a valid US zipcode
**********************************************************************************************/
CB.zipCodeFormat = function(zipValue) {
  /*var reg = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;*/
  if (zipValue.length < 5)
    return false;
  if (zipValue.indexOf("-") < 0 && zipValue.length > 5) {
    var newZip = zipValue.substr(0,5) + "-" + zipValue.substr(5,9);
    /* console.log("Inside zipCodeFormat - oldZip: " + zipValue + " new Zip: " + newZip)*/
    return newZip;
  }
  return zipValue;
};

/**********************************************************************************************
*****	this method checks for numbers and returns true or false
***********************************************************************************************/
CB.isDigit = function(numValue) {
  var reg = /^\d+$/;
  /*console.log("inside isdigit: " + reg.test(numValue));*/
  if (!reg.test(numValue)) {
    return false;
  } else {
    return true;
  }
};

/**********************************************************************************************
*****	This method validate if a given value is alpha
***********************************************************************************************/
CB.isAlpha = function (stringVal) {
  if( /[^a-zA-Z]/.test(stringVal) ) {
    /*console.log("Inside isAlpha: " + stringVal);*/
    return false;
  }
  return true;
};

/**********************************************************************************************
****	This method validate if a given value is alpha
**********************************************************************************************/
CB.isAlphaNumeric = function (stringVal) {
  /*return /^[a-z]+$/i.test(stringVal);*/
  if( /[^a-zA-Z0-9]/.test(stringVal) ) {
    return false;
  }
  return true;
};


/*
*  formatPhone formats phone number while user is entering the number
*	Created by Omar Mohammed
*/
CB.formatPhone = function (value) {
  var digitsOnlyPhone = value.replace(/\D/g,'');
  var phoneLength = digitsOnlyPhone.length;
  var formattedPhone = "";
  if(phoneLength == 0) {
    formattedPhone = "";
    return formattedPhone;
  }
  else if(phoneLength >= 3 && phoneLength < 7) {
    formattedPhone = "(" + digitsOnlyPhone.substring(0, 3) + ") " + digitsOnlyPhone.substring(3, phoneLength);
    return formattedPhone;  
  }
  else if(phoneLength >= 7) {
    formattedPhone = "(" + digitsOnlyPhone.substring(0, 3) + ") " + digitsOnlyPhone.substring(3, 6) + "-" + digitsOnlyPhone.substring(6, 10);
    return formattedPhone;
  }
  return value;
};

/*
*  	formatEnteredAge formats entered age while user is entering the number. Makes sure the age
*	is an integer between 0 and 125, inclusive
*	Created by Cody Bohlman
*/

CB.formatEnteredAge = function(value) {
  var matches = value.search(/^\b(00[0-9])|(0[0-9])|([0-9]|[1-9][0-9]|1[01][0-9]|12[0-5])\b$/);
  if(matches != 0) {
    return "";
  }
  return value;
};

/***************************************************************************************
*******	utility function to check if a row is already added to JSON object 
******* to check if the value is already added to the DP
****************************************************************************************/
CB.isInDataPage = function (dataPage,key, value){
  try {
    var clientCache = pega.ui.ClientCache;
    var dataPageForAgent = clientCache.find(dataPage +".pxResults");
    var dpRow = "";
    var recVal = "";
    if (dataPageForAgent) { 
      dataPageForAgent = dataPageForAgent.iterator();
      while (dataPageForAgent.hasNext()) {
        dpRow = dataPageForAgent.next();
        recVal = getPropertyValue(dpRow.get(key));
        if ( recVal == value) {
          /*console.log("inside isInDataPage: value matches ");*/
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.log("Error in isInDataPage: " + e.message);
  }
};

CB.getTodayAsDateString = function () {
  try {
    var jsDate = new Date();
    var year = jsDate.getFullYear();
    var month = jsDate.getMonth() + 1;
    var day = jsDate.getDate();
    var dateString = "";
    dateString += year;
    if (month < 10) {
      dateString += "0";
    }
    dateString += month;
    if (day < 10) {
      dateString += "0";
    }
    dateString += day;
    return (dateString);
  } catch (e) {
    console.log("Error in getTodayAsDateString: " + e.message);
  }
};

CB.getCurrentDateTimeAsString = function () {

 	try {
      var d = new Date();
      var hours = d.getHours();
      var minutes = d.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours ? hours : 12; /* the hour '0' should be '12'*/
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return d.getMonth() + 1 + "/" + d.getDate() + "/" + d.getFullYear() + "  " + strTime;
    }
  	catch(e) {
      console.log("Error in getCurrentDateTimeAsString: " + e.message);
    }
};

/*
* converts a pegadate string to js date string, so can be used in Date()
*/
CB.convertPegaDateStringToJSDateString = function (sDate) {
  try {
    var returnDate = "";
    sDate = sDate.replace(/ GMT/gi, "");
    returnDate += sDate.substring(0,4);
    returnDate += "-";
    sDate = sDate.substring(4);
    returnDate += sDate.substring(0,2);
    returnDate += "-";
    sDate = sDate.substring(2);
    returnDate += sDate.substring(0,5);
    returnDate += ":";
    sDate = sDate.substring(5);
    returnDate += sDate.substring(0,2);
    returnDate += ":";
    sDate = sDate.substring(2);
    returnDate += sDate;
    return(returnDate);
  } catch (e) {
    console.log("Error in convertPegaDateStringToJSDateString: " + e.message);
  }
};

/* get number of days in seconds */
CB.getDaysInSeconds = function (days){
  return (days * 60 * 60 * 24);
};

/*
* function will mask DOB year so it will be dd/MM/XXXX
*/
CB.maskDOB = function (result) {
  var sDOB = result.get("IndexData.DOB").getValue();
  sDOB = sDOB.substring(0, 6) + "XXXX";
  result.get("IndexData").put("DOB", sDOB);
};

/* this causes errors on the desktop and doesn't seem related to census so I commented it out - 10/5 JES */
/**************** Declare expressions for offline ************************/
/*register's declarative Function on ConfirmationNo property  
	pega.offline.declareexpressions.register("ConfirmationNo",function(value){ */
	/*if(value == "" || value == " "){ */ /* Update ConfirmationNo value only if it is blank or space */
/*		var deviceId = launchbox.Container.deviceId;
		var charSum=0;
		for(var i=0; i<deviceId.length;i++){
		  charSum += deviceId.charCodeAt(i);
		}
		return "E-" + charSum+""+Math.floor(((new Date()).getTime()-(new Date("2015-01-01")).getTime())/1000);  
	}
},"UHG-MedRet-Enroll-FS-Work-EMSEnrollment");*/



/*********************************************************************************************
***	To get an element value
**********************************************************************************************/
CB.getElementValue = function(elementName) {
  try {
    var elementVal = "";
    if (!($("#"+elementName).val()===undefined)) {
      elementVal = $("#"+elementName).val();/*targetElement.value;*/
      console.log(elementName + ": ~~" + elementVal + "~~");	
    } else {
      console.log("element val:" + $("#"+elementName).val() + "; Trying another way to find value");
      /*try using ends with name search for finding the element. This will work for radio buttons*/
      $("input[name$='"+elementName+"']").each(function(){
        if (this.checked == true){
          elementVal = this.value;
          return true;
        }
      });					
    }
    return elementVal;
  } catch (e) {
    console.log("Unexpected Error in getElementValue: " + e.message);
  }
};

/**************************************************************************************
*******
***************************************************************************************/
CB.getPageWithNullCheck = function(obj, attrib) {
  if (obj) {
    var pg = obj.get(attrib);
    if (!pg) {
      console.log(arguments.callee.caller.toString() + ";Page for attrib: " +attrib +" is null or empty. Parent obj JSON:\n");
      console.log(obj.getJSON());
    }
    return pg;
  } else {
    console.log(arguments.callee.caller.toString() + ";Parent for attrib: " +attrib +" is null or empty. ");
  }
};

/*******************************************************************************************
********
********************************************************************************************/
CB.IsObjectEditable = function(el) {
  try{
    if ((el.offsetWidth > 0 || el.offsetHeight > 0) && el.disabled==false) {
      return true;
    } else return false;
  } catch (err) {
    console.log("***CBUtil Error - " + "Error in IsObjectVisible: " + err);
    throw err;
  }
};

/****************************************************************************************************
*******
*****************************************************************************************************/
CB.characterValidation = function(obj,attribName,required,regExValidator,specializeMsg) {
  var elementVal = DLCensus.getTrimmedValue(obj);
  console.log("characterValidation:" + obj.name + ":" + elementVal);
  if (regExValidator==null){
    regExValidator = /^([a-zA-Z0-9-\s.\/]+)$/;
  }
  if (specializeMsg==null) {
    specializeMsg = SetLALiterals.msg_AlphaNumeric;
  }
  if (required==null){
    required=false;
  }
  if (required) {
    if (!regExValidator.test(elementVal)) {
      return new validation_Error(obj, attribName + " " + specializeMsg);
    } 	
  } else {
    if (elementVal.length>=1 && !regExValidator.test(elementVal)) {
      return new validation_Error(obj, attribName + " " + specializeMsg);
    }
  }
  return null;
};

/*****************************************************************************************
*******
******************************************************************************************/
CB.getTrimmedValue = function(obj) {
  var elementVal = "";
  if (obj.type=="radio") {
    var propName = obj.name;
    propName = propName.substring(propName.lastIndexOf("$p")+2);
    console.log(propName + ";ID: " + obj.id + "=" + obj.checked);
    $("input[name$='"+propName+"']").each(function(){
      if (this.checked == true){
        elementVal = this.value;
      }
    });
  } else {
    elementVal = obj.value;
    obj.value = elementVal;
  }
  elementVal = elementVal.trim();
  return elementVal; 
};

/*****************************************************************************************
********
******************************************************************************************/
CB.lengthValidation = function(obj,attribName,attribMaxLength) {
  var elementVal = DLCensus.getTrimmedValue(obj);
  if (attribMaxLength==null) {
    attribMaxLength = obj.maxLength;
  }

  if (elementVal.length>attribMaxLength) {
    return new validation_Error(obj, attribName + " must not be more than "+attribMaxLength+" characters");
  }
};

/************************************************************************************
*	Generic function to toggle button on/off
*	Created by: Kyle Gravel
*   Parameters (Strings): flagName == EnumFlags Property, Value = true or false
*	Ex: toggleFlag("DKRFEnabled","true");
*************************************************************************************/
CB.toggleFlag = function(flagName,value) {
  try{
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    questFlags.put(flagName,value);
    console.log("Inside toggleFlag: " + value);
  }
  catch(e) {
    console.log("***CBUtil Error - " + e.message);
  }
};

/************************************************************************************
*	Function to update current locale
*	Created by: Aansh Kapadia
*   Parameters (Strings): locale = new Locale property
*	Ex: updateLocale("es_PR");
*************************************************************************************/
CB.updateLocale = function(locale, primaryPage) {
  if (pega.mobile.isHybrid){
   try {   
    var opIDPG = pega.ui.ClientCache.find("OperatorID");
    if(opIDPG) {
      opIDPG.put("pyUseLocale",locale);
    }
    else {
      alert("Page does not exist");
    }
    pega.clientTools.switchLocale(locale);
    
    alert("op id page: " + opIDPG.getJSON());
    
    var cpLocale = pega.ui.ClientCache.find(primaryPage + ".QuestFlags.SelectedLanguage");
    if(cpLocale){
      pega.ui.ClientCache.find(primaryPage + ".QuestFlags.SelectedLanguage").setValue(locale);
      /*pega.ui.DCUtil.refresh();*/
    } else {
      console.log("***CBUtil Error - " + "ERROR: SelectedLanguage property is NULL");
    }
    
    var currLocale = pega.offline.localizationUtils.getCurrentLocale();
    alert("current Locale: " + currLocale);
   }
   catch(e) {
     alert(e.message);
   }
  } 
  else {
    var runActivity = new SafeURL("CB-FW-CensusFW-Work-Quest.UpdateLocaleOnline");
    runActivity.put("SelectedLocale", locale);

    pega.util.Connect.asyncRequest("GET", runActivity.toURL(), {
      success: function (o) {  
        pega.u.d.refreshSection("pyCaseHeader","","");
        pega.u.d.refreshSection("pyCaseBody","","");
        pega.u.d.refreshSection("pyCaseActionAreaButtons","","");
        pega.u.d.refreshSection("MainHarnessContent","","");
      },
      failure: function (o) {
        console.log("Failure");
      }
    });  
  }
};

/************************************************************************************
*	Function to get current Pega Date
*	Created by: Aansh Kapadia
*   Parameters (Strings): none
*	Ex: curr_date = getCurrentPegaDate();
*************************************************************************************/
CB.getCurrentPegaDate = function() {
  var dateObj = new Date();
  var year = dateObj.getFullYear();
  var month = ('0' + (dateObj.getMonth()+1)).toString().slice(-2);
  var day = ('0' + dateObj.getDate()).toString().slice(-2);
  var hours = ('0' + dateObj.getUTCHours().toString()).slice(-2);
  var minutes = ('0' + dateObj.getMinutes().toString()).slice(-2);
  var seconds = ('0' + dateObj.getSeconds().toString()).slice(-2);
  var milli = ("000" + dateObj.getMilliseconds().toString()).slice(-3);

  var pegaDate = year + month + day + 'T' + hours + minutes + seconds + '.' + milli + " GMT";
  return pegaDate;
};

/************************************************************************************
*	Function takes ONE checkbox ID and fills OR clears the corresponding checkbox
*	Created by: Aansh Kapadia
*   Parameters (Strings): divID(checkbox ID), fill(boolean)
*	Ex: fillCheckbox("exampleDiv", false);
*************************************************************************************/
CB.fillCheckbox = function(divID, fill) {
  if(fill == "true"){ /* if user wants to FILL checkboxes */
    if($('#' + divID).not(":checked")){
    	$('#' + divID).prop('checked', true);
    }
  } else if(fill == "false"){ /* if user wants to CLEAR checkboxes */
      if($('#' + divID).is(":checked")){
        $('#' + divID).prop('checked', false);
      }
  }
};

/************************************************************************************
*	Function takes in a list of checkbox IDs and fills OR clears the corresponding checkboxes 
*	Created by: Aansh Kapadia
*   Parameters (Strings): checkboxesString(string of IDs), fill(boolean)
*	Ex: fillCheckboxes("ReviewSex,ReviewDoB,ReviewAge,ReviewRace", false);
*************************************************************************************/
CB.fillCheckboxes = function(checkboxesString, fill) {  
  var checkboxesArray = checkboxesString.split(',');
  for (var i = 0; i < checkboxesArray.length; i++){
    if(fill == "true"){ /* if user wants to FILL checkboxes */
      if($('#' + checkboxesArray[i]).not(":checked")){
      	$('#' + checkboxesArray[i]).prop('checked', true);
      }
    } else if(fill == "false"){ /* if user wants to CLEAR checkboxes */
      if($('#' + checkboxesArray[i]).is(":checked")){
        $('#' + checkboxesArray[i]).prop('checked', false);
      }
    }
  }
};

/************************************************************************************
*	Generic function to wrap clientTools.getLocalizedTextForString and parse property references
*   Used in Soft/Hard Edits to return localized validation message
*	Created by: Domenic Giancola
*   Parameters (Strings): baseref = String base page reference, fieldname = Field Value Rule Field Name, fieldvalue = Field Value Rule Field Value
*   Returns: String - returned field value text w/ all property references replaced with values
*	Ex: getAndParseFieldValue("pyWorkPage","pyLabel","Help");
*************************************************************************************/
CB.getAndParseFieldValue = function(baseref,fieldname,fieldvalue) {
  /* grab the localized field value text */
  if(baseref !="" && fieldname != "" && fieldvalue !=""){
    var cpBaseref = pega.ui.ClientCache.find(baseref);
    if(cpBaseref !== null){
      pega.pushStackFrame(cpBaseref);
    }
    else {
      console.log("***CBUtil Error - " + "Unable to find supplied baseref page in CB.getAndParseFieldValue");
      return "";
    }
    var strTempFV = pega.clientTools.getLocalizedTextForString(fieldname,fieldvalue);
    /* grab the first (if any) property ref matches */
    var fvPropMatches = strTempFV.match(/(\{([^}]+)\})/);
    if(fvPropMatches){
      for(i = 0; i < fvPropMatches.length; i++){
        var strCurMatch = fvPropMatches[i];
        var strCurPropRef = strCurMatch.substring(1,strCurMatch.length-1);
        /* is this a valid property reference */
        if(strCurPropRef.includes(".")){
          /* is this an embedded reference */
          if(strCurPropRef.startsWith(".")){
            var strFullPropRef = baseref + strCurPropRef;
            var curProp = pega.ui.ClientCache.find(strFullPropRef);
            if(curProp !== null){
              var curPropVal = curProp.getValue();
              strTempFV = strTempFV.replace(strCurMatch,curPropVal);
            }
            else {
              strTempFV = strTempFV.replace(strCurMatch,"");
            }
          }
          else {
            /* this is a top level page or data page reference */
            var curProp = pega.ui.ClientCache.find(strCurPropRef);
            if(curProp !== null){
              var curPropVal = curProp.getValue();
              strTempFV = strTempFV.replace(strCurMatch,curPropVal);
            }
            else {
              strTempFV = strTempFV.replace(strCurMatch,"");
            }
          }
        }
        else{
          /* not a valid property reference so replace with blank */
          strTempFV = strTempFV.replace(strCurMatch,"");
        }
      }
    }
    pega.popStackFrame();
    return strTempFV;
  }
  else {
    console.log("***CBUtil Error - " + "Must call CB.getAndParseFieldValue with all three params populated, e.g. ('pyWorkPage','pyCaption','SUBMIT')");
    return "";
  }
};

function getTodayString(){
  var d = new Date();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; /* the hour '0' should be '12' */
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return d.getMonth()+1 + "/" + d.getDate() + "/" + d.getFullYear() + "  " + strTime;  
}


/*
*	Enumeration goForward
*/
CB.enumGoForward = function() {
  /* Set flags to show we are using next button */
  var isGoingBack = document.getElementById("IsGoingBack");
  var isGoingForward = document.getElementById("IsGoingForward");
  if(isGoingBack){	
    isGoingBack.value = false;
  }
  if(isGoingForward) {
    isGoingForward.value = true;
  }
  if(pega.mobile.isHybrid) {

    var cpEnumGoBack = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.IsGoingBack");
    var cpEnumGoForward = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.IsGoingForward");
    if(cpEnumGoBack){
      cpEnumGoBack.setValue("false");
    }
    if(cpEnumGoForward){
      cpEnumGoForward.setValue("true");
    }
  }
};


/*
*	Enumeration goBack
*/
CB.enumGoBack = function(){
  /* Set Flags to show we are using previous button*/
  var isGoingBack = document.getElementById("IsGoingBack");
  var isGoingForward = document.getElementById("IsGoingForward");
  if(isGoingBack){
    isGoingBack.value = true;
  }
  if(isGoingForward) {
    isGoingForward.value = false;
  } 

  if(pega.mobile.isHybrid) {

    var cpEnumGoBack = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.IsGoingBack");
    var cpEnumGoForward = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.IsGoingForward");
    if(cpEnumGoBack){
      cpEnumGoBack.setValue("true");
    }
    if(cpEnumGoForward){
      cpEnumGoForward.setValue("false");
    }

    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var questionName = workPage.get("CurrentSurveyQuestion").getValue();
    
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var exitSurveyAction = cpQuestFlags.get("ExitSurveyAction").getValue();

    if(questionName == "Home_QSTN") {
      if(!workPage.hasMessages()) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "Home_HARD");
        workPage.addMessage(errorMessage);
        pega.ui.DCUtil.refresh(); 
      }
    }else if(questionName == "RosterReview_QSTN") {
      if(!workPage.hasMessages()) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RosterReview_HARD");
        workPage.addMessage(errorMessage);
        pega.ui.DCUtil.refresh(); 
      }else {
        workPage.clearMessages();
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RosterReview_HARD");
        workPage.addMessage(errorMessage);
        pega.ui.DCUtil.refresh(); 
      }
    } else if(questionName == exitSurveyAction) {
      /* In exit survey flow so check if we need to hide the default FA buttons and show Yes/No instead */
      var isInExitSurveyFlow = cpQuestFlags.get("IsInExitSurveyFlow").getValue();
      if(isInExitSurveyFlow == true || isInExitSurveyFlow == "true"){
        cpQuestFlags.put("HideFAButtons",true);
        cpQuestFlags.put("IsInExitSurveyFlow",false);
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true");
      }
      else {
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true");
      }
    }
    else {
      pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true");
    }
  }
  else {    
    /*var xhr = new XMLHttpRequest();*/ 
    var runActivity = new SafeURL("CB-FW-CensusFW-Work-Quest-Enum.CheckForPrevHardEdit");
    var runAct = httpRequestAsynch(runActivity.toURL(),null,50,100);
    if(runAct == "true") {

      var strNewUrl = SafeURL_createFromEncryptedURL(document.main.action);
      pega.u.d.KeepPageMessages = "true";
      pega.u.d.checkAndUpdateTargetParam(strNewUrl);
      strNewUrl.put("PreActivity","TriggerPreviousHardEdit");
      strNewUrl.put("pzKeepPageMessages","true");
      strNewUrl.put("ActDTPage","pyWorkPage");
      strNewUrl.put("HarnessMode","ACTION");
      strNewUrl.put("pzPrimaryPageName","pyWorkPage");
      strNewUrl.put("test","test");
      document.main.action = strNewUrl.toURL();
      strNewUrl.put("pyActivity","ReloadHarness");
      document.main.submit();


      /*var sectionName = pega.u.d.getSectionByName("Errors",'',"");
	  pega.u.d.reloadSection(sectionName,"",false,true,'',false);*/
    }
    else {
      pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&previousAssignment=true");
    }
  }
};

/**
*	Get member from roster based on index
*	Created by: Omar Mohammed
*/
CB.getMemberFromRoster = function(currentMemberIndex) {
  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var memberFromRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember("+currentMemberIndex+")");
  householdMemberTemp.adoptJSON(memberFromRoster.getJSON());
}

/**
*	Set member in roster based on index, OR appends a new member to the roster
*	Created by: Omar Mohammed
*/
CB.setMemberInRoster = function(currentMemberIndex, isAppending) {
  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  if(householdMemberTemp) {
    if(isAppending) {
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
      if(!householdRoster) {
        householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster").put("HouseholdMember",[]);
      }
      householdRoster.add().adoptJSON(householdMemberTemp.getJSON());
    }
    else {
      var currentMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember(" + currentMemberIndex +")");
      currentMember.adoptJSON(householdMemberTemp.getJSON());
      var cpRespondentFlag = householdMemberTemp.get("ReferencePersonFlag");
      if (cpRespondentFlag) {
        if (cpRespondentFlag.getValue()+"" == "true") {
          var cpReferencePerson = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
          if (cpReferencePerson) {
            cpReferencePerson.adoptJSON(householdMemberTemp.getJSON());
          }
        }
      }
    } 
  }
}

/*****************************************
*** Get form property value
******************************************/
CB.getFormPropertyValue = function(page,element) {
  var formJSONObj = JSON.parse(pega.ui.property.getFormJSON());
  var elemValue = formJSONObj[page][element];
  console.log("Inside getFormPropertyValue: " + elemValue);
  return elemValue;
};

/***********************************************
*	Place chosen answer on client cache
*	Parameter: takes in target property name
*	Created by: Kyle Gravel
****************************************************/
CB.setQuestionResponseProp = function() {
  try {
    if (pega.mobile.isHybrid) {
      var workPG = pega.ui.ClientCache.find("pyWorkPage");
      var questionName = workPG.get("CurrentSurveyQuestion").getValue();
      var questionPage = pega.ui.ClientCache.find("pyWorkPage.Question(" + questionName + ")");
      var cpAnswer = questionPage.get("Answer");
      var questionAnswer = "";
      if(!cpAnswer) {
        questionPage.put("Answer", "");
      }
      else {
        questionAnswer = cpAnswer.getValue();
      }
      var targetProp = questionPage.get("PropertyName").getValue();
      var targetProp_array = targetProp.split('.');
      var propName = targetProp_array[targetProp_array.length - 1];
      var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      responsePage.put(propName,questionAnswer);
      console.log("****** Inside setQuestionResponseProp-1: " + questionName);
      console.log("****** Inside setQuestionResponseProp-2: " + questionPage.get("Answer").getValue());
      console.log("****** Inside setQuestionResponseProp-3: " + questionAnswer);
      console.log("****** Inside setQuestionResponseProp-4: " + targetProp);
      console.log("****** Inside setQuestionResponseProp-5: " + propName);
      console.log("****** Inside setQuestionResponseProp-6: " + responsePage.get(propName).getValue());
    }
  }
  catch(e) {
    console.log("***CBUtil Error - " + e.message);
  }
};

/************************************************************************************
*	Generic function to output debug data related to current case
*	Created by: Domenic Giancola
*************************************************************************************/
CB.logDebugData = function() {
  console.log("*** START DEBUG LOG OUTPUT *** ");
  var strCurObjClass = pega.u.d.getHarnessClass();
  console.log("Current harness class: " + strCurObjClass);
  console.log("*** END DEBUG LOG OUTPUT *** ");
};

/************************************************************************************
*	Generic function to return the current workstream class
*   Used to wrap functions that must only execute in a given class context
*	Created by: Domenic Giancola
*   Parameters (Strings): baseref = String base page reference, will default to pyWorkPage if blank or null
*   Returns: String - ADCAN,ENUM,ISR
*	Ex: getCurrentWorkstream("pyWorkPage");
*************************************************************************************/
CB.getCurrentWorkstream = function(baseref) {
  if(!baseref){
    baseref="pyWorkPage";
  }
  var cpBaseref = pega.ui.ClientCache.find(baseref);
  if(cpBaseref !== null){

    if(cpBaseref.get("pxObjClass") === null){
      console.log("***CBUtil Error - " + "Unable to find pxObjClass within the supplied baseref page in CB.getCurrentWorkstream");
      return "";
    }

    var strClass = cpBaseref.get("pxObjClass").getValue();
    var matchAdCan = strClass.match(/adcan/i);
    var matchISR = strClass.match(/isr/i);
    var matchEnum = strClass.match(/enum/i);
    if(matchAdCan){
      return "ADCAN";
    }
    else if(matchISR){
      return "ISR";
    }
    else if(matchEnum){
      return "ENUM";
    }
    else {
      console.log("***CBUtil Error - " + "Unable to match supplied baseref - " + baseref + " - against known workstreams in CB.getCurrentWorkstream");
      return "";
    }
  }
  else {
    console.log("***CBUtil Error - " + "Unable to find supplied baseref page in CB.getCurrentWorkstream");
    return "";
  }
};

/************************************************************************************
*Generic function to return clear the HouseholdMemberTemp
*  Created by:  Ramin M. 
*   
*************************************************************************************/
CB.clearHouseholdMemberTemp = function() {
  /* Clear House Hold temp   - reCreate  */
  var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
  if(cpWorkPage){
    cpWorkPage.remove("HouseholdMemberTemp");
    var cpMemberTemp = cpWorkPage.put("HouseholdMemberTemp",{});
    cpMemberTemp.put("Age","");
    cpMemberTemp.put("RespondantFlag","false");
    var cpMemberDKRefused = cpMemberTemp.put("DKRefused",{});
    cpMemberDKRefused.put("People","");
    var cpMemberResponse = cpMemberTemp.put("Response",{});
    cpMemberResponse.put("P_FIRST_NAME","");
    return true;
  }
  else {return false;
       }
  return false;
};

/*
* Pass in the month integer, returns the string name of that month i.e Pass in 01 returns January
* Created by David Bourque
*/

CB.getMonthName = function(param) {
	var months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
	return months[param];
};

/*
* Pass in the day month and year integers, returns the string of the localized date
* Created by David Bourque
*/

CB.getLocalizedDate = function(day,month,year) {
  var locale = pega.ui.ClientCache.find("pxRequestor.pxReqLocale");
  if (locale) {
    locale = locale.getValue();
  } else {
    locale = "en_US";
  }
  if (locale == "en_US") {
    var monthName = CB.getAndParseFieldValue("pyWorkPage", "pyCaption",CB.getMonthName(month));
    var dayEnding = "";
    if (day.toString().length == 2 && day.toString().startsWith(1)) {
      dayEnding = "th";
    } else if (day.toString().endsWith(1)) {
      dayEnding = "st";
    } else if (day.toString().endsWith(2)) {
      dayEnding = "nd";
    } else if (day.toString().endsWith(3)) {
      dayEnding = "rd";
    } else {
      dayEnding = "th";
    }
    var dateString = monthName + " " + day + dayEnding + ", " + year;
    return dateString;
  } else if (locale == "es_PR") {
    var monthName = CB.getAndParseFieldValue("pyWorkPage", "pyCaption",CB.getMonthName(month));
    var dateString = day + " " + monthName + " " + year;
    return dateString;
  }
}


/*
* Function to determine whether property is in a page list
* Checks if propertyName has the value in any of the pageListName 
* Created by: Aditi Ashok
*/

CB.isInPageList = function (propertyName, value, pageListName) {
  try {
    var pageList = pega.ui.ClientCache.find(pageListName);
    var currentPage;
    var pageListIterator;
    
    if (pageList) {
      pageListIterator = pageList.iterator();
      while(pageListIterator.hasNext()) {
        currentPage = pageListIterator.next();
        var property = currentPage.get(propertyName);
        var propertyValue = (property) ? property.getValue(): "";
       
        if (propertyValue == value) {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.log("Error in PageList: " + e.message);
  }
}



/* Return index of first page in a pagelist where propertyName = value

@param propertyName: property to look in
@param value: value to compare property value against
@param pageListName: name of page list to iterate through

 */

CB.indexInPageList = function (propertyName, value, pageListName) {
  try {
    var pageList = pega.ui.ClientCache.find(pageListName);
    var currentPage;
    var pageListIterator;
    
    if (pageList) {
	  var index = 1;
      pageListIterator = pageList.iterator();
      while(pageListIterator.hasNext()) {
        currentPage = pageListIterator.next();
        var property = currentPage.get(propertyName);
        var propertyValue = (property) ? property.getValue(): "";
       
        if (propertyValue == value) {
          return index;
        }
		
		index++;
      }
    }
    return -1;
  } catch (e) {
    console.log("Error in PageList: " + e.message);
  }
}


/*
* Sort the pages of a pagelist
* pageName:Name of page that has the pagelist (e.g. D_MyDataPage)
* comparatorFn: comparator function
* listName: Name of the pagelist property (e.g. pxResults)
*/
CB.sortPageList = function(pageName, comparatorFn, listName) {  
  
  if (!comparatorFn) {  
   return;  
  }  
  var cbPage = pega.ui.ClientCache.find(pageName);  
  if (!cbPage) {  
 	return;  
  } 
 
  listName = listName || "pxResults";  
  var pageJSONObj = JSON.parse(cbPage.getJSON());  
  var listArray = pageJSONObj[listName];  
  
  listArray.sort(comparatorFn);
  cbPage.adoptJSON(JSON.stringify(pageJSONObj));  
}  

/***************************************************************************************
************ Ebenezer Owoeye
*******	utility function to set the focus on the  Address Status Reason when "Unable to work"is selected for ADCAN cases 
*******/
function SetFocusInputBox() {
  try {
    $("#AddressStatusReason").focus();
  } catch (e) {
    console.log("Error in PageList: " + e.message);
  }
}

/******* End of the SetFocusInputBox function **************/



/*
 ParaData Start
*/
var ParaData = {
	_init : false,
	_this : this,
	_paraDataPage : '',
	_map : {},
	_count : {},
	_log : [],
	_hhIX : null,
	_uIX : 1,
	_storage : {
		isAvailable : typeof(sessionStorage) !== "undefined" ? true : false,
		Get : function(key){ return sessionStorage.getItem(key); },
		Set : function(key, value){ sessionStorage.setItem(key, value); }	
	},
	InitializePre: function(paraDataPage){},
	Initialize : function(paraDataPage) {
		/* Save the Map */
		this._paraDataPage = paraDataPage || this._paraDataPage;
		/* Process if a Page was passed */
		if(this._paraDataPage){
			/*  Call Pre */
			this.InitializePre(paraDataPage);			
			/* Get log from storage if available */
			if(this._storage.isAvailable && this._storage.Get("log")){ this._log = JSON.parse(this._storage.Get("log")); }
			if(this._storage.isAvailable && this._storage.Get("count")){ this._count = JSON.parse(this._storage.Get("count")); }		
			this._hhIX = $("#CurrentHHMemberIndex").val();
			this._uIX = $("#CurrentRosterReference").val();	
			var cursor;	
          	var key;
			for(i = 0;  i < this._paraDataPage.Elements.length; i++){
				/* Set the Current Object in the Loop */
				cursor = this._paraDataPage.Elements[i];
              	key = cursor.n.replace(/\s/g,'').replace(/,/g,'-');
				/* Add the Associative Property to the Map Object */
				this._map[key] = cursor.v;
				/* if CTR and does not exist */
				if(cursor.n.indexOf('-CTR') >= 0){
					var ifPresent = this._count[this._paraDataPage.Prefix + cursor.v];
					if(!ifPresent){		
						this._count[this._paraDataPage.Prefix + cursor.v] = 0;
					}
				}
			}
			/* Create Bind Pulse */
			setInterval(ParaData.Bind, 500);
			/* Set to true object was initialized. */
			this._init = true;
			/*  Call Post */
			this.InitializePost(paraDataPage);			
		}
	},
	InitializePost: function(paraDataPage){},
	BindPre: function(){},
	Bind : function(){
		/*  Call Pre */
		ParaData.BindPre();
		/* Select Elements Not Binded */
		$("a[Analytics!='true'], button[Analytics!='true']").attr("Analytics", "true").click(function(){
			ParaData.Insert($(this).text());
		});
		$("input[type='radio'][Analytics!='true'], input[type='checkbox'][Analytics!='true']").attr("Analytics", "true").click(function(){
			ParaData.Insert($(this).next().text());
		});
		$("input[Analytics!='true'], textarea[Analytics!='true'], select[Analytics!='true']").attr("Analytics", "true").focus(function(){
			ParaData.Insert($(this).attr("id"));
		});
		if($(".VDLN[Analytics!='true']").attr("Analytics", "true").length > 0){
			ParaData.Insert("VDLN");
		}
		/*  Call Post */
		ParaData.BindPost();
	},
	BindPost: function(){},
 	GetLocale : function(key){
      try{
          var eIND; 
          if(key == "entry"){
            eIND = this.Map("Entry-IND"); 
          } else {
            eIND = this.Map("Exit-IND");
          }
          var SelectedLanguage = $("#pxReqLocale").val();
          if(SelectedLanguage.indexOf("en_") >= 0){return { ElementName: eIND, Value: 1};}
          if(SelectedLanguage.indexOf("es_") >= 0){return { ElementName: eIND, Value: 2};}  
      }  catch (ex){}
	}, 
	MapPre: function(key){},
	Map : function(key){
		/* Call Pre */
		this.MapPre(key);
		return this._map[key];
		/* Call Post */
		this.MapPost(key);
	},
	MapPost: function(key){},
	InsertPre: function(element){},
	Insert : function(element){	
		if(this._init){
			/*  Call Pre */
			this.InsertPre(element);
			/* Remove any Spaces, & with and*/
			/* element = element.replace(/\s/g,'').replace("&","and"); */
          	element = element.replace("&","and").replace(/\s/g,'').replace(/,/g,'-');
			/* Perform Map of Elements */
			var eTIME = this.Map(element + "-TIME");
			var eCTR = this.Map(element + "-CTR");
			/* If Mapping Found, Insert into the log */
			if(eTIME){this._log.push({ElementName : this._paraDataPage.Prefix + eTIME, Value: new Date().toLocaleString(), HHIX: this._hhIX, UIX: this._uIX});}
			// If Mapping Found, Increment Counter
			if(eCTR){this._count[this._paraDataPage.Prefix + eCTR]++;}
			/*  Call Post */
			this.InsertPost(element);
		}
	},
	InsertPost: function(element){},
	InsertWithValues : function(element){
		if(this._init){
			try{
			  /* Perform Insert */
			  this._log.push({ElementName : this._paraDataPage.Prefix + element.ElementName, Value: element.Value, HHIX: this._hhIX, UIX: this._uIX});	  
			} catch (ex){}
		}
	},
  	IncrementCTR : function(element){
		if(this._init && element){
			// If Mapping Found, Increment Counter
			if(this._count[element] === undefined){
				this._count[element] = 1;
			} else {
				this._count[element]++;
			}
		}
	},
	SerializePre: function(){},
	Serialize : function(){
		/*  Call Pre */
		this.SerializePre();
		var cursor;
		var ctrValue;
		var tempLog = this._log.slice();
		for(var propertyName in this._count){	
			/* If Counter */
			if(propertyName.indexOf('_CTR') >= 0){
				/* Get the Value */
				ctrValue = this._count[propertyName];
				/* If Found and greater than 0 */
				if(ctrValue && ctrValue > 0){ tempLog.push({ElementName : propertyName, Value: ctrValue}); }
			}
		}
		/* Save to storage */
		this._storage.Set("log", JSON.stringify(this._log));
		/* Save to storage */
		this._storage.Set("count", JSON.stringify(this._count));		
		/* Return */
		return JSON.stringify({ pxResults:tempLog });
	},
	SerializePost: function(){},
	SavePre: function(){},
	Save : function(){
		if(this._init){
			/*  Call Pre */
			this.SavePre();
			$.ajax({
               async : false,
               url: new SafeURL("").toURL(),
               data: "pyActivity=CB-FW-CensusFW-Work.ProcessParaDataJSONEntries&Data=" +  this.Serialize(),
               method: "POST",
               success: function(){},
               failure:  function(){},
               complete: function(e, xhr, settings){}
			});
			/*  Call Post */
		}
	},
	SavePost: function(){}
};
/* 
ParaData End
*/



// this is so ugly. it is the ugliest. believe me. sad!
CB.callActivityAfterParadata = function (activity) {
  // call paradata as if unloading
  ParaData.InsertWithValues(ParaData.GetLocale("exit"));
  ParaData.Insert("Page Unload");
  ParaData.Save();
  
  // now disable paradata from unload
  ParaData._init = false;
  
  // now unload page and logoff
  var oSafeUrl =  new SafeURL(activity);
  var strNextUrl = oSafeUrl.toURL();
   
  if (top.navigate) {
  	top.navigate(strNextUrl);
  } else {
  	top.location= strNextUrl;
  }
};

CB.logoffLaterAfterParadata = function () {
  CB.callActivityAfterParadata("Code-Security.LogOff");
};

// Call to logoff CQA Agent and redirect to NonID cluster
CB.logoffCQAAndRedirect = function () {
  CB.callActivityAfterParadata("Code-Security.LogOffCQAAndRedirect");
};

CB.sendCQAtoPortal = function (accessGroupName) {
  // call paradata as if unloading
  ParaData.InsertWithValues(ParaData.GetLocale("exit"));
  ParaData.Insert("Page Unload");
  ParaData.Save();
  
  // now disable paradata from unload
  ParaData._init = false;

  var oShowDesktopUrl = new SafeURL("Data-Portal.ShowDesktop");
  var oRedirectUrl = new SafeURL("RedirectAndRun");
  oRedirectUrl.put("ThreadName","");
  oRedirectUrl.put("bPurgeTargetThread","true"); 
  oRedirectUrl.put("Location",oShowDesktopUrl.toQueryString());
  oRedirectUrl.put("AccessGroupName",accessGroupName);
  var strNextUrl = oRedirectUrl.toURL();
    if (top.navigate) {
  	top.navigate(strNextUrl);
  } else {
  	top.location= strNextUrl;
  }
};

/*	
*	Created By: Jack McCloskey
*	Date: 02-16-2017
*	Purpose: Used to change icon color on case notes
*			 
*/

CB.changeCaseNoteColor = function(){

if($(".enum-casenotes-padding-top i").hasClass("usds-text-census-red")){
     $(".enum-casenotes-padding-top i").removeClass("usds-text-census-red");
 } else{
     $(".enum-casenotes-padding-top i").addClass("usds-text-census-red");
 }

};

/*	Created By: Jack McCloskey
*	Date: 02-24-2017
*	Purpose: Add an item to case notes
*/

CB.addCaseNote = function(caseText) 
{  
  if (pega.mobile.isHybrid)
  {
    var CaseNotesPage  = pega.ui.ClientCache.find("caseNotesPage");
    var OperatorID = pega.ui.ClientCache.find("OperatorID.pxInsName").getValue();
    var caseNotesList = pega.ui.ClientCache.find("pyWorkPage.CaseNotes");
    var currDateTime = CB.getCurrentDateTimeAsString();
    if (!caseNotesList) {
      var workpage = pega.ui.ClientCache.find("pyWorkPage");
      caseNotesList = workpage.put("CaseNotes",[]);
    }
    if($(".enum-casenotes-padding-top i").hasClass("usds-text-census-red")){
      CaseNotesPage.put("DangerFlag", "Red");
    }
    else{
      CaseNotesPage.put("DangerFlag", "");
    }
    CaseNotesPage.put("UserID", OperatorID );
    CaseNotesPage.put("CaseText", caseText );
    CaseNotesPage.put("CreateTimestamp", currDateTime);
    caseNotesList.add().adoptJSON(CaseNotesPage.getJSON());
  }
};