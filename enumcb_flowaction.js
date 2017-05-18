/*************************************************************************************************
*	Begin Pre/Post actions for question shapes
*	DO NOT USE NAMESPACE FOR PRE/POST
*************************************************************************************************/

/*namespace*/
var ENUMCB = ENUMCB || {};
/*
*	Pre Action for AttemptType_QSTN 
*	Created by:Mike Hartell
*/
function EnumCB_AttemptType_PRE(){
  CB.toggleFlag("DKRFEnabled", "false");
  CB.toggleFlag("ExitSurveyEnabled","false");
}

/**
*	Pre action for RelationshipOther_QSTN
*	Created by: Omar Mohammed
**/
function EnumCB_RelationshipOther_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","true");
  CB.toggleFlag("DKRFEnabled","true");

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var rosterSize = questFlags.get("CurrentRosterSize").getValue();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var memIndex = householdRoster.get("CurrentHHMemberIndex").getValue();


  /*Determine the correct index of current member in roster*/
  if(isGoingBack=="true"){/*Got here by clicking Previous*/

    if(previousQuestion=="Sex_QSTN"){ /*start at end of roster*/
      memIndex=rosterSize;
    }
    else if(previousQuestion=="RelationshipOther_QSTN"){
      memIndex=memIndex-1;          
    } 		
  }
  else{/*Got here by clicking Next*/
    if(previousQuestion=="Home_QSTN" || previousQuestion=="Owner_QSTN" || previousQuestion=="Renter_QSTN"){
      memIndex=1; /*start at beginning of roster*/
    }		
  }  

  /*Now check to see if the memIndex is the Reference Person because we need to skip over the Reference Person*/
  var currMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember("+memIndex+")");
  var refPersonFlagProp = currMember.get("ReferencePersonFlag");
  if(refPersonFlagProp){
    var refPersonFlag= refPersonFlagProp.getValue();
  }
  else{
    var refPersonFlag= "";
  }

  if(refPersonFlag==true){
    if(isGoingBack=="true"){
      memIndex=memIndex-1;
    }
    else{
      memIndex=memIndex+1;
    }
  }

  householdRoster.put("CurrentHHMemberIndex", memIndex);
  CB.getMemberFromRoster(memIndex);  

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isFirstTimeRelOther = questFlags.get("IsFirstTimeRelOther").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
  var firstRelOtherIndex = questFlags.get("FirstMemberIndexForRelOther").getValue();
  if(currentMemberIndex == firstRelOtherIndex || isFirstTimeRelOther == "true") {
    questFlags.put("DisplayRelOtherInst", "true");
  }
  else {
    questFlags.put("DisplayRelOtherInst", "false");
  }
  ENUMCB.updateDKRefVisibility("RelationshipOther"); 
}

/**
*	Returns the calculated age
*	Pass in integer values for the month, day, and year
*	Pass in string using pega formatted date property for dateToCompare
**/
ENUMCB.calculateAge = function(month, day, year, dateToCompare) {
  var censusYear = parseInt(dateToCompare.substring(0,4));
  var censusMonth = parseInt(dateToCompare.substring(4,6));
  var censusDay = parseInt(dateToCompare.substring(6));
  var age = censusYear - year;
  if (censusMonth < (month)) {
    age--;
  }
  if(day != "") {
    if ((month == censusMonth) && (censusDay < day)) {
      age--;
    }
  } 
  return age;
}


/**
*	Post action for RelationshipOther_QSTN
*	Created by: Omar Mohammed, mod AXJ
**/
function EnumCB_RelationshipOther_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();

    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RelationshipOther", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipOther");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RelationshipOther");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipOther", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var memberTempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var respProp = memberTempPage.get("RelationshipOther");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      if(respProp == "SD") {
        questFlags.put("NextSurveyQuestion", "RelationSD_QSTN");
        var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
        CB.setMemberInRoster(curMemberIndex,false);
      }
      else if(respProp == "OT") {
        questFlags.put("NextSurveyQuestion", "RelationOT_QSTN");
        var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
        CB.setMemberInRoster(curMemberIndex,false);
      }
      else{
        ENUMCB.setRelTextInHouseholdMemberTemp("RelationshipOther","D_RelationshipOptions_ALL","RelationshipOther");
        var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
        respPage.put("P_REL_CODE", respProp);
        questFlags.put("NextSurveyQuestion", "");
        var params = {isFirstTimeProp: "IsFirstTimeRelOther"};
        ENUMCB.updateMemberIndexPost(params);
        ENUMCB.skipReferencePerson();

      }
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationshipOther_POST:" + e.message);*/
  }
}

ENUMCB.skipReferencePerson = function() {
  /*check to see if last person is reference person, in which case we need to skip*/
  var HHRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHIndex = parseInt(HHRoster.get("CurrentHHMemberIndex").getValue(),10);
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var rosterSize = parseInt(questFlags.get("CurrentRosterSize").getValue(),10);    

  if(currentHHIndex==rosterSize){
    var lastMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember("+rosterSize+")");
    var referencePersonFlag = lastMember.get("ReferencePersonFlag").getValue();
    if(referencePersonFlag== true){
      HHRoster.put("CurrentHHMemberIndex", rosterSize+1);
    }
  }	
}

/**
*	Pre action for RelationshipResp_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_RelationshipResp_PRE(){
  CB.toggleFlag("ExitSurveyEnabled","true");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  if(cpQuestFlags && cpHouseholdRoster && cpHouseholdMemberList){

    if(cpQuestFlags.get("IsGoingForward").getValue() == "true"){
      cpQuestFlags.put("SkipDec", "false");
    }
    var curRosterSize = cpHouseholdMemberList.size();
    var params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
    var curMemberIndex;
    if(cpQuestFlags.get("SkipDec").getValue() == "false"){
      curMemberIndex = ENUMCB.updateMemberIndexPre(params);
    }else{
      cpQuestFlags.put("SkipDec", "false");
    }
    var curMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember("+curMemberIndex+")");
    var referenceFlag = curMember.get("ReferencePersonFlag").getValue();

    /*If the household member is the reference person, increment/decrement*/
    if(referenceFlag == true){
      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        curMemberIndex = curMemberIndex - 1;
        if(curMemberIndex == 0){
          curMemberIndex = curRosterSize;
        }
      }else{
        curMemberIndex = curMemberIndex + 1;
      }
      cpHouseholdRoster.put("CurrentHHMemberIndex", curMemberIndex);
    }

    CB.getMemberFromRoster(curMemberIndex);

    /*DKRef*/
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("RelationshipResp");
  }
}


/**
*	Post action for RelationshipResp_QSTN
*	Created by: Dillon Irish, Jack McCloskey
**/
function EnumCB_RelationshipResp_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var respProp = respPage.get("P_REL_CODE");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if(respProp == "SD") {
        questFlags.put("NextSurveyQuestion", "RelationSD_QSTN");
      }
      else if(respProp == "OT") {
        questFlags.put("NextSurveyQuestion", "RelationOT_QSTN");
      }
      else{
        ENUMCB.setRelTextInHouseholdMemberTemp("Response.P_REL_CODE","D_RelationshipOptions_ALL","RelationshipResp");
        ENUMCB.updateMemberIndexPost(params);
        questFlags.put("NextSurveyQuestion", "");
      }      
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationshipResp_POST:" + e.message);*/
  }
}



/*
*	Created by: Kyle Gravel
*	Used by Owner_QSTN to prime the DK Ref values
*/
function EnumCB_Owner_PRE() {
  ENUMCB.updateDKRefVisibility("Owner");
  CB.toggleFlag("ExitSurveyEnabled","true");

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();

  var dkRef = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  var owner = dkRef.get("Owner");
  if(owner) {
    owner = owner.getValue();
  } else {
    owner = "";
  }

  if(isGoingBack == "true" && owner != ""){
    questFlags.put("IsDKRefVisible","true");
  }
}

/*
*	Created by: Kyle Gravel
*	Used by Owner_QSTN to prime the DK Ref values
*/
function EnumCB_Renter_PRE() {
  ENUMCB.updateDKRefVisibility("Renter");
  CB.toggleFlag("ExitSurveyEnabled","true");

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();

  var dkRef = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  var renter = dkRef.get("Renter");
  if(renter) {
    renter = renter.getValue();
  } else {
    renter = "";
  }

  if(isGoingBack == "true" && renter != ""){
    questFlags.put("IsDKRefVisible","true");
  }
}

/**
*	Call this function on post action of questions that have DKRef disabled
*	Changes the color back to black for enabled
*	Created by Omar Mohammed
**/
ENUMCB.updateDisabledDKRefColor = function() {
  $('.fa-ban').css("color", "black"); 
  var dkRefDiv = document.getElementsByClassName("dont-know-refused");
  var dkRefSpan = dkRefDiv[0].firstElementChild;
  dkRefSpan.style.color = "black";
  CB.toggleFlag("DKRFEnabled", "true");
}

/**
*	Function to toggle the DKRef radio buttons on click of DK Ref
*	Created by Omar Mohammed
**/
ENUMCB.showDKRef = function() {
  if(pega.mobile.isHybrid) {
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var DKRFEnabled = questFlags.get("DKRFEnabled");
    if(DKRFEnabled) {
      DKRFEnabled = DKRFEnabled.getValue();
    }
    else {
      DKRFEnabled = "";
    }
    if(DKRFEnabled != "false") {

      var isDKRefVisible = ENUMCB.getIsDKRefVisible();
      if(isDKRefVisible == "true") {
        questFlags.put("IsDKRefVisible", "false");
        pega.u.d.setProperty('pyWorkPage.QuestFlags.IsDKRefVisible', 'false');
      }
      else {
        questFlags.put("IsDKRefVisible", "true");
        pega.u.d.setProperty('pyWorkPage.QuestFlags.IsDKRefVisible', 'true');
      }
      //      CB.RefreshWhen("pyWorkPage.QuestFlags.IsDKRefVisible");

      $('.layout-noheader-enumeration_options_menu').removeClass( "usds_show", 200);

    }
  } else {
    var DKRFEnabled = pega.u.d.getProperty("pyWorkPage.QuestFlags.DKRFEnabled");
    if (DKRFEnabled === undefined) {
      DKRFEnabled = "";
    }
    if (DKRFEnabled != "false") {
      var isDKRefVisible = ENUMCB.getIsDKRefVisible();
      if (isDKRefVisible == "true") {
        pega.u.d.setProperty("pyWorkPage.QuestFlags.IsDKRefVisible", "false");
      } else {
        pega.u.d.setProperty("pyWorkPage.QuestFlags.IsDKRefVisible", "true");
      }

      $('.layout-noheader-enumeration_options_menu').removeClass( "usds_show", 200);
    }
  }
}

/**	Test function do not use **/
ENUMCB.clearCorrDKRefProp = function(currPropVal, corrProp) {
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isDKRefVisible = questFlags.get("IsDKRefVisible");
  if(isDKRefVisible) {
    isDKRefVisible = isDKRefVisible.getValue();
    if(isDKRefVisible == "true") {  
      if(currPropVal != "") {
        clearCorrProp(corrProp);
      }
    }
  }
}

/** 
*	Call this function on click of a radio button to clear the corresponding DKRef prop or vice versa
*	Param takes full property path - "pyWorkPage.HouseholdMemberTemp.DKRefused.Intro"
*	Created by Omar Mohammed
**/
ENUMCB.clearCorrProp = function(corrProp, currPropVal) {
  currPropVal = currPropVal || "";
  if(currPropVal != "") {
    var corrPropPath = corrProp.substring(0, corrProp.lastIndexOf("."));
    var corrPropName = corrProp.substring(corrProp.lastIndexOf(".") + 1);
    var page = pega.ui.ClientCache.find(corrPropPath);
    page.put(corrPropName, "");
    var setProp = pega.u.d.setProperty(corrProp, ""); 
    var parsedPropPath = corrProp.split(".");
    var result = "";
    var i;
    for(i = 0; i < parsedPropPath.length; i++) {
      if(i == 0) {
        parsedPropPath[i] = "$P" + parsedPropPath[i];
      }
      else {
        if(parsedPropPath[i].indexOf('(') > -1) {
          parsedPropPath[i] = "$p" + parsedPropPath[i].substring(0, parsedPropPath[i].length - 3) + "$l1";
        }
        else {
          parsedPropPath[i] = "$p" + parsedPropPath[i]; 
        }
      }
      result = result + parsedPropPath[i];
    }

    $("input:radio[name='"+result+"']").each(function(i) {
      this.checked = false;
    });
    $("input:radio[name='"+result+"']").parent().parent().parent().attr("radvalue", "");
  }
}


/*
*	Post Action for AttemptType_QSTN
*	Created by: Kyle Gravel, Jacob Zadnik, Aansh Kapadia
*/
function EnumCB_AttemptType_POST() {
  ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_ATTEMPT_TYPE_CODE");
  
  var workPage = pega.ui.ClientCache.find("pyWorkPage");	
  
  if(!workPage.hasMessages()) {  
	var responsePG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
	var timestamp = CB.getCurrentPegaDate();
	responsePG.put("RESP_CONTACT_DATE",timestamp);

	var attemptType = responsePG.get("NRFU_ATTEMPT_TYPE_CODE");
	attemptType = attemptType ? attemptType.getValue() : "";
	/*If attempt type is PV, set ATTACTUAL to PV*/
	if(attemptType == "PV") {
	  responsePG.put("ATTACTUAL",attemptType);
	}
	/*If attempt type is any of the telephone ways, set ATTACTUAL to "T"*/
	else if(attemptType == "TA" || attemptType == "TB" || attemptType == "TC") { 
	  responsePG.put("ATTACTUAL","T");
	}  
	  
	/* Set NextSurveyQuestion based on response chosen */
	if(attemptType == "PV" || attemptType == "TA" || attemptType == "TB") { 
	  questFlags.put("NextSurveyQuestion","RespLocation_QSTN");
	}
	  
	else if(attemptType == "TC") {
	  questFlags.put("NextSurveyQuestion","DateOfContact_QSTN");
	}
	  
	else if(attemptType =="CA") {
	  questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
    }
  }
}
/*
*	Pre Action for RespLocation_QSTN disabled the DK/REF button as well as the Exit Survey button
*	Created by: Kyle Gravel
*/

function EnumCB_RespLocation_PRE() {
  CB.toggleFlag("DKRFEnabled","false");
  CB.toggleFlag("ExitSurveyEnabled","false");
  /*
  pega.u.d.evaluateClientConditions();
  */
  var workPg = pega.ui.ClientCache.find("pyWorkPage");
  var questNameTesting = workPg.get("CurrentSurveyQuestion").getValue();  
  var respLocationANSW1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespLocation_ANSW");
  var respLocationANSW2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespLocation1_ANSW");
  var respLocationANSW3 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespLocation2_ANSW");

  if(pega.mobile.isHybrid) {
    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var proxyEligible = questFlagsPage.get("ProxyEligible").getValue();
    var proxyRequired =questFlagsPage.get("ProxyRequired").getValue(); 
    var respLocationDP = pega.ui.ClientCache.find("D_RespLocationOptions").put("pxResults",[]);  

    if(proxyRequired == "false") {
      var respLocationPage1 = pega.ui.ClientCache.createPage("respLocationPage");
      respLocationPage1.put("pyLabel", respLocationANSW1);
      respLocationPage1.put("pyValue", "1");
      respLocationDP.add().adoptJSON(respLocationPage1.getJSON());
    }
    if(proxyEligible=="true"){
      var respLocationPage2 = pega.ui.ClientCache.createPage("respLocationPage");
      respLocationPage2.put("pyLabel", respLocationANSW2);
      respLocationPage2.put("pyValue", "2");
      respLocationDP.add().adoptJSON(respLocationPage2.getJSON());        
    }
    var respLocationPage3 = pega.ui.ClientCache.createPage("respLocationPage");
    respLocationPage3.put("pyLabel", respLocationANSW3);
    respLocationPage3.put("pyValue", "3");
    respLocationDP.add().adoptJSON(respLocationPage3.getJSON());
  } 
}

function EnumCB_formatPhone(primaryPage, propertyRef, event) {
  if(event.which != 8) { 
     var workPage = primaryPage.substring(0,primaryPage.indexOf("."));
     var embeddedPage = primaryPage.substring(primaryPage.indexOf("."));
    /* alert("embedded page: " + embeddedPage + " workPage: "+workPage);*/
    if(pega.mobile.isHybrid) {
      var telephonePage = pega.ui.ClientCache.find(primaryPage);     
      var phone = pega.ui.d.getProperty(embeddedPage+propertyRef, workPage);
      
      var formattedPhone = CB.formatPhone(phone); 
      var setPropInCache = telephonePage.put(propertyRef, formattedPhone);
      var setPropInClipboard = pega.u.d.setProperty(primaryPage + propertyRef, formattedPhone);
    }
    else {
      var phone = pega.ui.d.getProperty(embeddedPage+propertyRef, workPage);
      phone= phone.toString();
      var formattedPhone = CB.formatPhone(phone);
      var setProp = pega.u.d.setProperty(primaryPage + propertyRef, formattedPhone);
    }
  }
}

function EnumCB_formatDOB(primaryPage, propertyRef, event) {
  if(event.which != 8) {
    if(pega.mobile.isHybrid) {
      var workPage = pega.ui.ClientCache.find(primaryPage);
      var value = pega.ui.d.getProperty("." + propertyRef, primaryPage);
      var digitsOnlyValue = value.replace(/\D/g,'');
      var setPropInCache = workPage.put(propertyRef, digitsOnlyValue);
      var setPropInClipboard =  pega.u.d.setProperty(primaryPage + "." + propertyRef, digitsOnlyValue);
    }
    else {
      var value = pega.ui.d.getProperty("." + propertyRef, primaryPage);
      value= value.toString();
      var digitsOnlyValue = value.replace(/\D/g,'');
      var setProp = pega.u.d.setProperty(primaryPage + "." + propertyRef, digitsOnlyValue);
    }
  }
}

/*	
*	Post Action for RespLocation_QSTN to set flag values based on question answer
*	Toggles DKRFEnabled as well as ExitSurvey
*	Sets RESP_TYPE_CODE depending on answer selected
*	Created by: Kyle Gravel
*/
function EnumCB_RespLocation_POST() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if(isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.Respondent.Response.RESPONSE_LOCATION_CODE", "RespLocation");
  }
  else {
    ENUMCB.Required("pyWorkPage.Respondent.Response.RESPONSE_LOCATION_CODE");      
  }

  /*Grab all necessary properties*/
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var responseTMP = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var attactual = responseTMP.get("ATTACTUAL");
  attactual = attactual ? attactual.getValue() : "";
  var respLocANSR = responseTMP.get("RESPONSE_LOCATION_CODE");
  respLocANSR = respLocANSR ? respLocANSR.getValue() : "";
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var proxyRequired = questFlags.get("ProxyRequired");
  proxyRequired = proxyRequired ? proxyRequired.getValue() : "";
  var proxyAlert = questFlags.get("ProxyAlert");
  proxyAlert = proxyAlert ? proxyAlert.getValue() : "";
  var attemptType = responseTMP.get("NRFU_ATTEMPT_TYPE_CODE");
  attemptType = attemptType ? attemptType.getValue() : "";

  if(respLocANSR == "1") {
    responseTMP.put("RESP_TYPE_CODE","HH");
    CB.toggleFlag("DKRFEnabled","true");
    CB.toggleFlag("ExitSurveyEnabled","true");
  }

  if(respLocANSR == "2") {
    responseTMP.put("RESP_TYPE_CODE","proxy");
    CB.toggleFlag("DKRFEnabled","true");
    CB.toggleFlag("ExitSurveyEnabled","true");
  } 

  if(proxyRequired == "true" && attactual == "PV" && respLocANSR == "3") {
    questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
  }
  if(attactual == "T" && respLocANSR == "3") {
    questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
  }
  if((attemptType == "PV" || attemptType == "TA") && respLocANSR == "2" && proxyAlert == "true") {
    questFlags.put("NextSurveyQuestion","ProxyAlerts_QSTN");
  }
  if(attemptType == "TA" && respLocANSR == "1") {
    questFlags.put("NextSurveyQuestion","NumberCalled_QSTN");
  }

}

/**
* limitChars removes invalid characters from string
* Created by Omar Mohammed
*/
function limitChars(name, value) {
  if(pega.mobile.isHybrid) {
    
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var currentName = value;

    var splitString = currentName.split('&').join("");
    splitString = splitString.split('\\').join("");
    splitString = splitString.split('`').join("");
    splitString = splitString.split('<').join("");
    splitString = splitString.split('>').join("");
    splitString = splitString.split('^').join("");
    splitString = splitString.split('|').join("");
    
    /*Need to update value both in clipboard and in clientcache to keep in sync and to update UI on the fly*/
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    
    var setPropInCache = responsePage.put(name, splitString);    
    var setPropInClipboard = pega.u.d.setProperty("pyWorkPage.HouseholdMemberTemp.Response" + name, splitString);
    
  }
  else {
    var currentName = pega.ui.d.getProperty(".HouseholdMemberTemp.Response" + name,"pyWorkPage");
    var splitString = currentName.split('&').join("");
    splitString = splitString.split('\\').join("");
    splitString = splitString.split('`').join("");
    splitString = splitString.split('<').join("");
    splitString = splitString.split('>').join("");
    splitString = splitString.split('^').join("");
    splitString = splitString.split('|').join("");
    var setProp = pega.u.d.setProperty("pyWorkPage.HouseholdMemberTemp.Response" + name, splitString);
  }
}


/*
* Pre Action for BestTime_QSTN
* Created by: Aditi Ashok
*/ 

function EnumCB_BestTime_PRE () {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "false");
  ENUMCB.updateDKRefVisibility("BestTime");
}

/*
* Post Action for BestTime_QSTN
* Created by: Aditi Ashok
*/ 
function EnumCB_BestTime_POST () {
  var response = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ATTACTUAL = "";
  var RESP_TYPE = "";
  var NO_COMPLETE = "";
  var RESULT_OF_MESSAGE = "";

  if (response.get("NRFU_ATTEMPT_TYPE_CODE")) {
    ATTACTUAL = response.get("NRFU_ATTEMPT_TYPE_CODE").getValue();
  } 
  if (response.get("RESP_TYPE_CODE")) {
    RESP_TYPE = response.get("RESP_TYPE_CODE").getValue();
  }
  if (response.get("NRFU_INCOMPLETE_CODE")) {
    NO_COMPLETE = response.get("NRFU_INCOMPLETE_CODE").getValue();
  }
  if (response.get("NRFU_PH_MSG_RESULT_CODE")) {
    RESULT_OF_MESSAGE = response.get("NRFU_PH_MSG_RESULT_CODE").getValue();
  }
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  if (ATTACTUAL == "PV" && RESP_TYPE == "HH" && (NO_COMPLETE == "1" || NO_COMPLETE == "2")) {
    questFlags.put("NextSurveyQuestion", "Strategies");
  } else if (((ATTACTUAL == "TA" || ATTACTUAL == "TB" || ATTACTUAL == "TC") && RESP_TYPE == "HH" && 
              (NO_COMPLETE == "1" || NO_COMPLETE == "2")) || RESULT_OF_MESSAGE == "1") {
    questFlags.put("NextSurveyQuestion", "CaseNotes"); 
    
  }  else if (ATTACTUAL == "PV"  && RESP_TYPE == "proxy" ){
    questFlags.put("NextSurveyQuestion", "CaseNotes");   
  } else {
    questFlags.put("NextSurveyQuestion", "Goodbye");
  } 

  /* begin validation and mapping */
  var count = 0;
  var NRFUAvailability = pega.ui.ClientCache.find("pyWorkPage.Respondent.NRFUAvailability");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");

  respPage.put("NRFUBestTimes", []);
  var NRFUBestTimes = respPage.get("NRFUBestTimes");
  var NRFUBestTimesIterator = NRFUBestTimes.iterator();

  if (NRFUAvailability.get("IsAnytime").getValue() == true) {
    var currentPage = pega.ui.ClientCache.createPage("BestTimes");
    currentPage.put("NRFU_BEST_DAY_CODE", "1");
    currentPage.put("NRFU_BEST_TIME_CODE", "1");
    NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
    count++;
  }
  else {
    var currentPage = pega.ui.ClientCache.createPage("BestTimes");
    currentPage.put("NRFU_BEST_DAY_CODE", "0");
    currentPage.put("NRFU_BEST_TIME_CODE", "0");
    NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
  }

  if (NRFUAvailability.get("IsSunday").getValue() == true) {
    if (NRFUAvailability.get("IsSundayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "2");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());;
      count++;
    }
    if (NRFUAvailability.get("IsSundayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "2");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsSundayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "2");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsMonday").getValue() == true) {
    if (NRFUAvailability.get("IsMondayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "3");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsMondayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "3");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsMondayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "3");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());;
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsTuesday").getValue() == true) {
    if (NRFUAvailability.get("IsTuesdayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "4");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsTuesdayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "4");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsTuesdayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "4");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsWednesday").getValue() == true) {
    if (NRFUAvailability.get("IsWednesdayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "5");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsWednesdayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "5");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsWednesdayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "5");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsThursday").getValue() == true) {
    if (NRFUAvailability.get("IsThursdayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "6");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsThursdayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "6");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsThursdayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "6");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsFriday").getValue() == true) {
    if (NRFUAvailability.get("IsFridayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "7");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsFridayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "7");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsFridayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "7");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }

  if (NRFUAvailability.get("IsSaturday").getValue() == true) {
    if (NRFUAvailability.get("IsSaturdayMorning").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "8");
      currentPage.put("NRFU_BEST_TIME_CODE", "2");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsSaturdayAfternoon").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "8");
      currentPage.put("NRFU_BEST_TIME_CODE", "3");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    if (NRFUAvailability.get("IsSaturdayEvening").getValue() == true) {
      var currentPage = pega.ui.ClientCache.createPage("BestTimes");
      currentPage.put("NRFU_BEST_DAY_CODE", "8");
      currentPage.put("NRFU_BEST_TIME_CODE", "4");
      NRFUBestTimes.add().adoptJSON(currentPage.getJSON());
      count++;
    }
    count++;
  }
  ENUMCB.BestTime_VLDN(count);
}

/*
*	Pre Action for RespName_QSTN
*/
function EnumCB_RespName_PRE() {
  CB.toggleFlag("DKRFEnabled", "false");  
  CB.toggleFlag("ExitSurveyEnabled", "true");
}

/*	
*	Post Action for RespName_QSTN to validate values based on question answer
	Created by: Omar Mohammed
*/

/*
*	Pre Action for Goodbye_QSTN
*	Created by Ebenezer Owoeye
*/
function EnumCB_Goodbye_PRE() {
  CB.toggleFlag("DKRFEnabled","false");
  CB.toggleFlag("ExitSurveyEnabled","false");
}



function EnumCB_RespName_POST() {
  if(pega.mobile.isHybrid) {
    ENUMCB.updateDisabledDKRefColor();

    ENUMCB_RespName_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    /**This block enables the DKRef a long as there are no error messages and we can move forward **/
    if(!workPage.hasMessages()) {
      CB.toggleFlag("DKRFEnabled","true");
    }

  }
}

/***
	When the use selects "Add Phone Number on RespPhone screen, refresh the section and display the box to insert the new number
	Created by: Omar Mohammed
**/

function enumCB_selectPhoneNumber(phoneNumber) {
  if(phoneNumber == "-1") {
    CB.RefreshWhen("pyWorkPage.HouseholdMemberTemp.TelephoneInfo.TelephoneNumber(1).CountryCode");
  }
}

/*
*	When a user presses "Other" on NoComplete_QSTN
*/
function EnumCB_showOtherTextBox(otherOption) {
  if(otherOption == "9") {
    CB.RefreshWhen("pyWorkPage.HouseholdMemberTemp.Response.NRFU_INCOMPLETE_CODE");
  }
}

/***
	Display roster when yes is selected on elsewhere screen
	Created by: Omar Mohammed
**/

function EnumCB_SelectElsewhere(response) {
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if(response == "1") {
    var currRosterSize = questFlags.get("CurrentRosterSize").getValue();
    if(currRosterSize > 1) {
      var putAnswer = questFlags.put("IsElsewhereSelected", "true");
      var setProp = pega.u.d.setProperty("pyWorkPage.QuestFlags.IsElsewhereSelected", true);    
      /**   CB.RefreshWhen("pyWorkPage.HouseholdMemberTemp.Response.P_FIRST_NAME");
       alert("Refresh complete");

       **/
      var section = pega.u.d.getSectionByName("WhoLivesElsewhere_ANSW",'',document);
      pega.u.d.reloadSection(section, '', '', false,true, '', false);

    }
  } 

  else {
    var putAnswer = questFlags.put("IsElsewhereSelected", "false");
    /**   CB.RefreshWhen("pyWorkPage.HouseholdMemberTemp.Response.P_FIRST_NAME");
       alert("Refresh complete");

       **/
    var section = pega.u.d.getSectionByName("WhoLivesElsewhere_ANSW",'',document);
    pega.u.d.reloadSection(section, '', '', false,true, '', false);

  }
}
/**
*   Pre action for Resp Phone to load DP
*   Created by: Omar Mohammed
*/
function EnumCB_RespPhone_PRE() {
  if(pega.mobile.isHybrid) {
    ENUMCB.updateDKRefVisibility("RespPhone", "pyWorkPage.Respondent.DKRefused");
    CB.toggleFlag("DKRFEnabled", "true");
    CB.toggleFlag("ExitSurveyEnabled", "true");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var phone = respPage.get("RESP_PH_NUMBER_TEXT");
    phone = phone ? phone.getValue() : "";

    var telephone = pega.ui.ClientCache.find("pyWorkPage.Respondent.TelephoneInfo.TelephoneNumber(1)");
    var answerSelected = telephone.get("CountryCode");
    if(!answerSelected) {
      var D_RespPhoneOptions = pega.ui.ClientCache.find("D_RespPhoneOptions");

      var phoneNumbers = pega.ui.ClientCache.find("D_RespPhoneOptions").put("pxResults",[]);  
      if(phone != "") {
        var phonePage = pega.ui.ClientCache.createPage("phonePage");
        phonePage.put("pyLabel", phone);
        phonePage.put("pyValue", phone);
        phoneNumbers.add().adoptJSON(phonePage.getJSON());
      } 
      var addPhonePage = pega.ui.ClientCache.createPage("addPhone");
      addPhonePage.put("pyLabel", "Add Number");
      addPhonePage.put("pyValue", "-1");
      phoneNumbers.add().adoptJSON(addPhonePage.getJSON()); 
    }
  }
}

/**
*	Post action for Resp Phone to copy temp phone into RESP_PH_NUMBER_TEXT
*	
*	Created by: Omar Mohammed
*/
function EnumCB_RespPhone_POST() {

  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var selection = workPage.get("Respondent.TelephoneInfo.TelephoneNumber(1).CountryCode");

  if(!selection) {
    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
    workPage.addMessage(errorMessage);
  }
  selection = selection.getValue();
  if(selection == "-1") {
    var temp = workPage.get("Respondent.TelephoneInfo.TelephoneNumber(1).Extension").getValue();
    var persistTempVal = respPage.put("RESP_PH_NUMBER_TEXT", temp);
  }
  else{
    respPage.put("RESP_PH_NUMBER_TEXT", selection);
  }
  var respPhone = respPage.get("RESP_PH_NUMBER_TEXT");
  var respPhoneValue = respPhone.getValue();
  ENUMCB_RespPhone_VLDN(workPage, respPhoneValue);
  ENUMCB.setDKRefResponse("pyWorkPage.Respondent.DKRefused.RespPhone", "pyWorkPage.Respondent.Response.RESP_PH_DK_IND", "pyWorkPage.Respondent.Response.RESP_PH_REF_IND");
}
/**
*	Pre action for DOB to copy current member from Roster into temp
*	Created by: Omar Mohammed
**/
function EnumCB_DOB_PRE() {
  if(pega.mobile.isHybrid) {
    CB.toggleFlag("DKRFEnabled", "true");
    CB.toggleFlag("ExitSurveyEnabled", "true");
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();     
    var isGoingBack = questFlags.get("IsGoingBack").getValue();
    var memberIndexProp = householdRoster.get("CurrentHHMemberIndex");
    var memberIndex = (memberIndexProp) ? memberIndexProp.getValue() :1;
    /*Previous*/
    if(isGoingBack =="true"){
      /*dont update index*/
    }
    /*Next*/
    else{
      if(previousQuestion=="Sex_QSTN" || previousQuestion=="ConfirmSex_QSTN" || previousQuestion=="ChangeSex_QSTN" || previousQuestion=="RelationshipCheckRS_QSTN" 
         || previousQuestion=="ChangeRelationshipRS_QSTN" || previousQuestion=="ChangeRelationRSOT_QSTN" || previousQuestion=="ChangeRelationRSSD_QSTN"){
        memberIndex=1; /*start at first member*/
      }
    }	
    householdRoster.put("CurrentHHMemberIndex", memberIndex);
    CB.getMemberFromRoster(memberIndex);  
    ENUMCB.DOBDKRefVisibility("DOBDay", "DOBMonth", "DOBYear");
  }
}

/**
*	Post action for DOB to call vldn and calc age
*	Created by: Omar Mohammed
**/
function EnumCB_DOB_POST() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var dkRefMonth = dkRefused.get("DOBMonth");
  if(dkRefMonth) {
    dkRefMonth = dkRefMonth.getValue();
  }
  else {
    dkRefMonth = "";
  }
  var dkRefDay = dkRefused.get("DOBDay");
  if(dkRefDay) {
    dkRefDay = dkRefDay.getValue();
  }
  else {
    dkRefDay = "";
  }
  var dkRefYear = dkRefused.get("DOBYear");
  if(dkRefYear) {
    dkRefYear = dkRefYear.getValue();
  }
  else {
    dkRefYear = "";
  }

  var birthMonth = respPage.get("P_BIRTH_MONTH_INT");
  if(birthMonth) {
    birthMonth = birthMonth.getValue();
  }
  else {
    birthMonth = "";
  }
  var birthDay = respPage.get("P_BIRTH_DAY_INT");
  if(birthDay) {
    birthDay = birthDay.getValue();
  }
  else {
    birthDay = "";
  }
  var birthYear = respPage.get("P_BIRTH_YEAR_INT");
  if(birthYear) {
    birthYear = birthYear.getValue();
  }
  else {
    birthYear = "";
  }
  /*Begin DOB Validation*/
  if(!ENUMCB_DOB_VLDN(workPage, birthMonth, birthDay, birthYear, dkRefMonth, dkRefDay, dkRefYear)) {
    var parsedMonth = parseInt(birthMonth, 10);
    var parsedDay = parseInt(birthDay, 10);
    var parsedYear = parseInt(birthYear, 10);   

    var todayYear = parseInt(workPage.get("CensusYear").getValue());
    var censusDate = workPage.get("CensusDate").getValue();
    if((parsedYear == todayYear && parsedMonth == 4 && parsedDay > 1) || (parsedYear == todayYear && parsedMonth > 4)) {
      var putNextQuestion = questFlags.put("NextSurveyQuestion", "BabyFlag_QSTN");
    }
    else if(parsedMonth != "" && parsedYear > 1891 && parsedYear <= todayYear && (parsedMonth != 4 || (parsedMonth == 4 && parsedDay != ""))) {
      var putNextQuestion = questFlags.put("NextSurveyQuestion", "ConfirmAge_QSTN");
      var age = ENUMCB.calculateAge(parsedMonth, parsedDay, parsedYear, censusDate);
      respPage.put("P_AGE_CALC_INT", age);
    }
    else if (!(parsedMonth != "" && parsedYear > 1891 && parsedYear <= todayYear && (parsedMonth != 4 || (parsedMonth == 4 && parsedDay != "")))) {
      var putNextQuestion = questFlags.put("NextSurveyQuestion", "Age_QSTN");
    }   
    else {
      var putNextQuestion = questFlags.put("NextSurveyQuestion", "");
    }

    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.DOBMonth", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_REF_IND");

    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.DOBDay", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_REF_IND");

    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.DOBYear", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_REF_IND");

    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();

    if(dkRefMonth == "D") {
      birthMonth = "DK";
    }
    else if(dkRefMonth == "R") {
      birthMonth = "REF";
    }
    if(dkRefDay == "D") {
      birthDay = "DK";
    }
    else if(dkRefDay == "R") {
      birthDay = "REF";
    }
    if(dkRefYear == "D") {
      birthYear = "DK";
    }
    else if(dkRefYear == "R") {
      birthYear = "REF";
    }

    var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    householdMemberTemp.put("DOBMonth",birthMonth);
    householdMemberTemp.put("DOBDay",birthDay);
    householdMemberTemp.put("DOBYear",birthYear);

    CB.setMemberInRoster(curMemberIndex, false);
  }
}

/*
*	Pre Action for Eligible Respondent
*	Created by: Mike Hartel
*/
function EnumCB_EligibleRespondent_PRE(){  
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("EligibleResp", "pyWorkPage.Respondent.DKRefused");
}

/*
*	Post Action for Eligible Respondent
*	Created by: Kyle Gravel
*/
function EnumCB_EligibleRespondent_POST(){  
  ENUMCB.EligibleRespondent_VLDN();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var respEligibilityCode = workPage.get("Respondent.Response.NRFU_RESP_ELIG_CODE").getValue();
  if(!workPage.hasMessages()){
  	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  	var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  	var eligibleRespDKRef = dkRefPage.get("EligibleResp");
  	eligibleRespDKRef = eligibleRespDKRef ? eligibleRespDKRef.getValue() : "";
  	if(eligibleRespDKRef == "D" || eligibleRespDKRef == "R") {
    	questFlags.put("NextSurveyQuestion","NoComplete_QSTN");
  	}
    else if(respEligibilityCode=="1"){
        questFlags.put("NextSurveyQuestion","Address_QSTN");
    }
    else{
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
  }
}

/*
*	Pre Action Address_QSTN to disable DK
*	Created by: Kyle Gravel
*/
function EnumCB_Address_PRE() {
  ENUMCB.updateDKRefVisibility("Address", "pyWorkPage.Respondent.DKRefused");
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
}


/*
*	Post Action for Address_QSTN to set RESP_TYPE_CODE accordingly
*	Re-Enable DK
*	Created by: Kyle Gravel
*/
function EnumCB_Address_POST() {

  try{
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if(isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.Respondent.Response.IsCensusDayAddress", "pyWorkPage.Respondent.DKRefused.Address", "PleaseProvideAnAnswer");
    }
    else {
      ENUMCB.Required("pyWorkPage.Respondent.Response.IsCensusDayAddress");
    }

    var responseTMP = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    var respLocANSR = responseTMP.get("RESPONSE_LOCATION_CODE");
    if(respLocANSR) {
      respLocANSR = respLocANSR.getValue();
    }
    else {
      respLocANSR = "";
    }

    var addressANSR = responseTMP.get("IsCensusDayAddress");
    if(addressANSR) {
      addressANSR = addressANSR.getValue();
    }
    else{
      addressANSR = "";
    }

    if((respLocANSR=="1") && (addressANSR=="1")) {
      responseTMP.put("RESP_TYPE_CODE","HH");
      CB.toggleFlag("DontKnowEnabled","true");
    }

    if((respLocANSR=="1") && (addressANSR=="0")) {
      responseTMP.put("RESP_TYPE_CODE","proxy");
      CB.toggleFlag("DontKnowEnabled","true");
    }
    
    if( addressANSR == "0")
    {
      cpQuestFlags.put("NextSurveyQuestion","Anyone_QSTN") ;       
    }
    var refused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused.Address");
    if (refused && refused.getValue() == "R") {
      cpQuestFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }

  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }

}


/*
*	Post Action for INTRO_QSTN to set RESP_TYPE_CODE accordingly
*	Created by: Ramin Moghtadernejad, Dillon Irish
*/
function EnumCB_Intro_POST() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if(isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.Respondent.Response.IntroQuestionAnswer", "pyWorkPage.Respondent.DKRefused.Intro");
  }
  else {
    ENUMCB.Required("pyWorkPage.Respondent.Response.IntroQuestionAnswer");
  }
  /*
	Online-Capability set in:   PostIntroScreenAction  from:  Intro_QSTN   Simple Question
	*/
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var responseTMP = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response"); 

  var respLocANSR = responseTMP.get("RESPONSE_LOCATION_CODE"); /* Changed from RESP_LOCATION_CODE*/
  respLocANSR = respLocANSR ? respLocANSR.getValue() : "";
  var introQstnANSR = responseTMP.get("IntroQuestionAnswer");
  introQstnANSR = introQstnANSR ? introQstnANSR.getValue() : "";
  var attempTypeQstnANSR = responseTMP.get("NRFU_ATTEMPT_TYPE_CODE"); 
  attempTypeQstnANSR = attempTypeQstnANSR ? attempTypeQstnANSR.getValue() : "";

  var respTypeCode = responseTMP.get("RESP_TYPE_CODE");
  respTypeCode = respTypeCode ? respTypeCode.getValue() : "";
  var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  var introDK = dkRefPage.get("Intro");
  introDK = introDK ? introDK.getValue() : "";

  if((attempTypeQstnANSR == "PV") && (respTypeCode == "HH")) {
    if(introQstnANSR == "Yes") {
      questFlags.put("NextSurveyQuestion","EligibleResp_QSTN");
    }
    else if(introQstnANSR == "No") {
      questFlags.put("NextSurveyQuestion","KnowAddress_QSTN");
    }
    else if(introQstnANSR == "NoAnswer") {
      questFlags.put("NextSurveyQuestion","PersonalNonContact_QSTN");
    }
    else if(introQstnANSR == "ContactMade") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
    else if(introDK == "D" || introDK == "R") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
  }
  else if((attempTypeQstnANSR == "TA" || attempTypeQstnANSR == "TB" || attempTypeQstnANSR == "PV") && (respTypeCode == "proxy")) {
    if(introQstnANSR == "Yes") {
      questFlags.put("NextSurveyQuestion","Anyone_QSTN");
    }
    else if(introQstnANSR == "No") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
    else if(introQstnANSR == "NotHousing") {
      questFlags.put("NextSurveyQuestion","SpecificUnitStatus_QSTN");
    }
    else if(introQstnANSR == "NoContact") {
      questFlags.put("NextSurveyQuestion","TypeOfProxy_QSTN");
    }
    else if(introDK == "D" || introDK == "R") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
  }
  else if((attempTypeQstnANSR == "TA" || attempTypeQstnANSR == "TB") && (respTypeCode == "HH")) {
    if(introQstnANSR == "Yes") {
      questFlags.put("NextSurveyQuestion","EligibleResp_QSTN");
    }
    else if(introQstnANSR == "No") {
      questFlags.put("NextSurveyQuestion","KnowAddress_QSTN");
    }
    else if(introQstnANSR == "UnableToInterview") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
    else if(introDK == "D" || introDK == "R") {
      questFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    }
  }

  /*Set Response class values based on location code, intro answer, and attempt type code*/
  if((respLocANSR=="1") && (attempTypeQstnANSR=="PV")) {
    if(introQstnANSR=="No"){
      responseTMP.put("RESP_TYPE_CODE","proxy");
      responseTMP.put("NRFU_FIND_ADR_NO_IND", "false");
      responseTMP.put("NRFU_FIND_ADR_YES_IND", "");
    } 
    else {
      responseTMP.put("NRFU_FIND_ADR_NO_IND", "");
      responseTMP.put("NRFU_FIND_ADR_YES_IND", "true");
    }
  }

}

/** 
*	Pre action for home_qstn to copy respondant into temp
*	Created by: Omar Mohammed, Kyle Gravel
**/
function EnumCB_Home_PRE() {
  ENUMCB.setHouseholdMembersFullName();
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("Home");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var householdRosterIterator = householdRoster.iterator();
  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  while(householdRosterIterator.hasNext()) {
    /** Set .HouseholdMemberTemp to be the respondent **/
    var currentPage = householdRosterIterator.next();
    var isRespondent = currentPage.get("RespondantFlag");
    if(isRespondent) {
      isRespondent = isRespondent.getValue();
    }
    else  {
      isRespondent = "";
    }
    if(isRespondent == "true") {
      householdMemberTemp.adoptJSON(currentPage.getJSON());
    }
  }
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if (householdRoster){
    /* get roster size */
    var sizeOfIndex  = householdRoster.size(); 
    questFlagsPage.put("CurrentRosterSize", sizeOfIndex); 
    if (sizeOfIndex > 1) {
      questFlagsPage.put("IsRosterSizeGreaterThanOne", true);
    }
    else {
      questFlagsPage.put("IsRosterSizeGreaterThanOne", false);
    }
  }


  ENUMCB.updateDKRefVisibility("Home");
}


/*
*	Post Action for Home_QSTN
*	Created by Omar Mohammed
*/
function EnumCB_Home_POST() {
  try{ 
    if(pega.mobile.isHybrid) {
      var workPage = pega.ui.ClientCache.find("pyWorkPage");
      var referencePersonPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
      var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var homeAnswer = responsePage.get("H_TENURE_CODE");
      if(homeAnswer) {
        homeAnswer = homeAnswer.getValue();
      }
      else {
        homeAnswer = "";
      }
      var isDKRefVisible = ENUMCB.getIsDKRefVisible();
      if(isDKRefVisible == "true") {
        ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.H_TENURE_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.Home");
      }
      else {
        ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.H_TENURE_CODE");
      }
      if(!workPage.hasMessages()) {
        CB.setMemberInRoster(1, false);
        var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
        var currRosterSize = questFlags.get("CurrentRosterSize").getValue();
        /*Set Reference person flag is 1 person household*/
        if (currRosterSize == 1 || homeAnswer == 4) { 
          var firstMember = CB.getMemberFromRoster(1);
          var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
          householdMemberTemp.put("ReferencePersonFlag", true);
          referencePersonPage.adoptJSON(householdMemberTemp.getJSON());
          CB.setMemberInRoster(1, false); 
          var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent");
          respondentPage.put("ReferencePersonFlag", true);
        } 
        var dkRef = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");  
        var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
        var dkRefValue = dkRef.get("Home");
        if(dkRefValue) {
          dkRefValue = dkRefValue.getValue();
        }
        else {
          dkRefValue = "";
        }
        var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
        var respProp = respPage.get("RESPONSE_LOCATION_CODE");
        if(respProp) {
          respProp = respProp.getValue();
        }
        else {
          respProp = "";
        }
        if(respProp == "1" && dkRefValue != "") {
          questFlags.put("IsDKAndAddress", "true");
        }
        else if(respProp == "2" && dkRefValue != "") {
          questFlags.put("IsDKAndAddress", "false");
        }
      }
    }

  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}



/*
* Pre Action for Popcount
* Created by Qaiser Fayyaz
*/
function EnumCB_Popcount_PRE() {
  if(pega.mobile.isHybrid) {
    ENUMCB.updateDKRefVisibility("Popcount", "pyWorkPage.Respondent.DKRefused");
    CB.toggleFlag("ExitSurveyEnabled", "true");
    CB.toggleFlag("DKRFEnabled", "true");
    /* When going back set Respondent to HouseholdMemberTemp 
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isGoingBack = questFlags.get("IsGoingBack").getValue();
    if(isGoingBack=="true") {
      var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent");
      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      householdMemberTemp.adoptJSON(respondentPage.getJSON()); 
    }
    */
    var softEditPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");
    softEditPage.put("PopcountFlag", "false");
  }
  else {
    var setProp = pega.u.d.setProperty("pyWorkPage.Respondent.Response.SoftEditVLDN.PopcountFlag", false);
  } 
}

/*
* Post Action for Popcount
* Created by Qaiser Fayyaz
*/
function EnumCB_Popcount_POST() {

  if(pega.mobile.isHybrid) {
    var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response"); 
    var firstName = respPage.get("RESP_FIRST_NAME").getValue(); 
    var putFirst = respPage.put("P_FIRST_NAME", firstName);
    var middleName = respPage.get("RESP_MIDDLE_NAME").getValue();
    var putMiddle = respPage.put("P_MIDDLE_NAME", middleName);
    var lastName = respPage.get("RESP_LAST_NAME").getValue();
    var putLast = respPage.put("P_LAST_NAME", lastName);
    var workPage = pega.ui.ClientCache.find("pyWorkPage");    
    EnumCB_Popcount_VLDN(workPage);
    ENUMCB.setDKRefResponse("pyWorkPage.Respondent.DKRefused.Popcount", "pyWorkPage.Respondent.Response.H_SIZE_STATED_DK_IND", "pyWorkPage.Respondent.Response.H_SIZE_STATED_REF_IND");
    var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
    var popcount = dkRefPage.get("Popcount");
    popcount = popcount ? popcount.getValue() : "";
    if(popcount == "D" || popcount == "R") {
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      questFlags.put("NextSurveyQuestion","NoComplete_QSTN");
    }
     ENUMCB.CopyRespondentToRoster();

    /*The following step is for testing*/
    TEST_AddTestMembersToRoster();
  }
}


/**
 * Pre Action for LanguageAssist_QSTN
 * Created by Taylor Hunter
 */

function EnumCB_LanguageAssist_PRE() {
  ENUMCB.updateDKRefVisibility("LanguageAssist", "pyWorkPage.Respondent.DKRefused");
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "false");
}

/**
 * Post Action for LanguageAssist_QSTN
 * Created by Taylor Hunter
 */
function EnumCB_LanguageAssist_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");

    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_LANGUAGE_ASSIST_CODE", "pyWorkPage.Respondent.DKRefused.LanguageAssist");
    } else {
      ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_LANGUAGE_ASSIST_CODE");
    }

    if (!workPage.hasMessages()) {
      var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
      var dkRefused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var dkRefusedAnswer = dkRefused.get("LanguageAssist").getValue();

      /* Determine if Don't Know or Refused were selected and update NRFU_LANGUAGE_ASSIST_CODE to reflect the choice */
      if (dkRefusedAnswer == "D")
        respPage.put("NRFU_LANGUAGE_ASSIST_CODE", "8");
      if (dkRefusedAnswer == "R")
        respPage.put("NRFU_LANGUAGE_ASSIST_CODE", "9");

      var answer = respPage.get("NRFU_LANGUAGE_ASSIST_CODE").getValue();
      var isMultiUnit = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.LocationAddress").get("IsMultiUnit").getValue();
      var isReInterview = pega.ui.ClientCache.find("pyWorkPage").get("IsReInterview").getValue();

      /*  Set the next question. 'Yes' will return us to the intro to start with a new respondent,
          'No' will bring us to Language Phone, and DK/Ref will bring us to Strategies */

      if (answer == "0") { /* No */
        respPage.put("NRFU_LANGUAGE_ASSIST_CODE", "2"); /* No is defined for this question as '2' */
        questFlags.put("NextSurveyQuestion", "LanguagePhone_QSTN");
      }
      else if (answer == "8" || answer == "9") /* Don't Know or Refused */
        questFlags.put("NextSurveyQuestion", "Strategies_QSTN");
      else if (answer == "1" && isReInterview == 'true') /* Yes, and is a Reinterview */
        questFlags.put("NextSurveyQuestion", "RIIntro_QSTN");
      else if (answer == "1" && isMultiUnit == 'true') /* Yes, and is a multiunit */
        questFlags.put("NextSurveyQuestion", "MUIntro_QSTN");
      else /* Yes */
        questFlags.put("NextSurveyQuestion", "Intro_QSTN");
      /* TODO: Ensure that 'RIIntro_QSTN' and 'MUIntro_QSTN' question names are correct as they are implemented */
    }
  }
  catch (Err) {
    alert(Err.message);
  }
}


/***
By Mike Hartel
Copy .Respondent into the .HouseholdRoster.HouseholdMember(1)
***/
ENUMCB.CopyRespondentToRoster = function () {
  try { 
    var Workpage = pega.ui.ClientCache.find("pyWorkPage");    
    var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent"); 
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var respType = responsePage.get("RESP_TYPE_CODE").getValue();
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var householdMemberRespondantFlag = householdRoster.get("HouseholdMember(1).RespondantFlag");
    if(!householdMemberRespondantFlag){    
      var householdRosterlist = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster").put("HouseholdMember",[]);  
      if(respType != "proxy") {	
        respondentPage.put("RespondantFlag","true");
        householdRosterlist.add().adoptJSON(respondentPage.getJSON());
      }
    }
    else{
      var householdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
      var householdMemberIter = householdMemberList.iterator();
      while(householdMemberIter.hasNext()){
        var householdMemberPage = householdMemberIter.next();
        var isRespondentProp = householdMemberPage.get("RespondantFlag");
        if(isRespondentProp){
          var isRespondent = isRespondentProp.getValue();
          if(isRespondent=="true"){
            householdMemberPage.adoptJSON(householdMemberTemp.getJSON());
          }
        }      
      }
    }
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }

}







/* US-27  and US-1400
*  Pre Action for Undercount
*  Created by David Bourque
*  update  by Ramin Moghtadernejad
*  Update  by Domenic Giancola
*/
function EnumCB_Undercount_Pre() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("Undercount");
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  /* property for checking how many screens behind the newest Undercount screen  */
  var undercountPreviousCounter = questFlagsPage.get("UndercountPreviousCounter");
  /* property which stores the current undercount screen number */
  var undercountCurrentScreenIndex = questFlagsPage.get("UndercountCurrentScreenIndex");   
  /* property which stores the size of the roster when entering the undercount screen */
  var undercountStartingRosterIndex = questFlagsPage.get("UndercountStartingRosterIndex");  
  /* Flag used as workaround for product bug, flag used to tell if we are on a previously seen undercount screen */
  var isUndercountPreviousFlag = questFlagsPage.get("IsUndercountPreviousFlag");
  if (isUndercountPreviousFlag) {
    /* reset value of flag */
    isUndercountPreviousFlag.setValue("false");
  }

  /* check if exists */
  if (undercountPreviousCounter &&  undercountCurrentScreenIndex && undercountStartingRosterIndex)
  {
    /*   Undercount Pre - First time     */
    if ( parseInt(undercountPreviousCounter.getValue()) == 0  && parseInt(undercountCurrentScreenIndex.getValue())  <= 0){

      /* Get roster cache  */
      var householdRosterMember= pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");  
      if (householdRosterMember){

        /* get roster size */
        var sizeOfIndex  = householdRosterMember.size(); 
        questFlagsPage.put("CurrentRosterSize", sizeOfIndex); 
        undercountStartingRosterIndex.setValue(sizeOfIndex); 
      }

      /* initializing screen index */
      undercountCurrentScreenIndex.setValue(1);


      /* Clear House Hold temp   - reCreate  */
      CB.clearHouseholdMemberTemp();
    }

    /* Flag used to tell is previous button was used to enter screen */
    var isGoingBack = questFlagsPage.get("IsGoingBack");
    /* Flag containing response data(yes or no) for undercount screen */
    var hasAdditionalUndercount = questFlagsPage.get("HasAdditionalUndercount");
    if (hasAdditionalUndercount) {
      if (isGoingBack.getValue() == "true") {

        /* If previous button was used to enter screen set values of flags accordingly   */
        undercountPreviousCounter.setValue(parseInt(undercountPreviousCounter.getValue()) + 1);
        undercountCurrentScreenIndex.setValue( parseInt(undercountCurrentScreenIndex.getValue()) -1);
        hasAdditionalUndercount.setValue("true");

      }
      /* If current screen is a new screen reset response */
      if (hasAdditionalUndercount.getValue() == "true" && parseInt(undercountPreviousCounter.getValue()) <= 0) {
        hasAdditionalUndercount.setValue("");
      }
    }

    if(parseInt(undercountPreviousCounter.getValue()) > 0)
    {
      /* If a previously seen screen, get information about member from roster and set flag to true */
      var CurrentRosterIndex  =   parseInt(undercountStartingRosterIndex.getValue()) +   parseInt(undercountCurrentScreenIndex.getValue());  

      /* Set current index on HouseholdMemberTemp   */   
      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 

      if (householdMemberTemp){    
        var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
        if(cpHouseholdRoster){
          var cpMemberList = cpHouseholdRoster.get("HouseholdMember");
          householdMemberTemp.adoptPage(cpMemberList.get(CurrentRosterIndex));

        }
      }

      if (isUndercountPreviousFlag) {
        isUndercountPreviousFlag.setValue("true");
      }
    }

    /* 
	*   Flag used as workaround for product bug, used to tell if on the first undercount screen,
    *	when the current screen is 1 then on first screen and set flag accordingly 
	*/
    var isFirstTimeUndercount = questFlagsPage.get("IsFirstTimeUndercount");
    if (isFirstTimeUndercount) {
      if (parseInt(undercountCurrentScreenIndex.getValue()) == 1) {
        isFirstTimeUndercount.setValue("true");
      } else {
        isFirstTimeUndercount.setValue("false");
      }
    }

    var nrfuAttemptTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_ATTEMPT_TYPE_CODE");
    var respTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.RESP_TYPE_CODE");
    /* Flag used to determine if enumerator is in a personal visit */
    var undercountIsPersonalVisit = questFlagsPage.get("UndercountIsPersonalVisit");
    if (nrfuAttemptTypeCode && respTypeCode && undercountIsPersonalVisit) {
      if (nrfuAttemptTypeCode.getValue() == "PV" && (respTypeCode.getValue() == "HH" || respTypeCode.getValue() == "PROXY")) {
        undercountIsPersonalVisit.setValue("true");
      }
      if ((nrfuAttemptTypeCode.getValue() == "TA" || nrfuAttemptTypeCode.getValue() == "TB" || nrfuAttemptTypeCode.getValue() == "TC") && (respTypeCode.getValue() == "HH" || respTypeCode.getValue() == "PROXY")) {
        undercountIsPersonalVisit.setValue("false");
      }
    }
    /* Flag used to determine if roster is at max size and if it is, allow the case to continue to next screen */
    var isUndercountBranchMaxRoster = questFlagsPage.get("IsUndercountBranchMaxRoster");
    if(isUndercountBranchMaxRoster) {
      if(isUndercountBranchMaxRoster.getValue() == "true"){
        hasAdditionalUndercount.setValue("false");
      }
    }

  }
}

/* US-27  and US-1400
* Post Action for Undercount
* Created by David Bourque
* update  by Ramin Moghtadernejad
* Update  by Domenic Giancola
*/
function EnumCB_Undercount_Post()
{
  /* Call validation, if it passes enter post function */
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.Undercount_VLDN();
  if(!workPage.hasMessages())
  {

    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    /* Counter used to determine how many times we have gone backwards in undercount screen */
    var undercountPreviousCounter = questFlagsPage.get("UndercountPreviousCounter");
    if (undercountPreviousCounter) 
    {
      /* Flag that holds response data for undercount screen */
      var hasAdditionalUndercount = questFlagsPage.get("HasAdditionalUndercount");   
      if(hasAdditionalUndercount) 
      {

        if(hasAdditionalUndercount.getValue() == "true") 
        {
          /* house hold member page   */
          if (parseInt(undercountPreviousCounter.getValue()) <= 0) 
          {
            /* if entering new roster member, move them into roster */
            var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
            var cpRespondantFlag = householdMemberTemp.get("RespondantFlag");
            if(!cpRespondantFlag)
            {
              householdMemberTemp.put("RespondantFlag","false");
            }

            /* Create Roster Page */
            var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");   
            if(householdRoster)
            {
              var cpMemberList = householdRoster.get("HouseholdMember");
              var cpNewMemberPage = cpMemberList.add();
              cpNewMemberPage.adoptPage(householdMemberTemp);
            }
          }

          /* Clear House Hold temp   - reCreate  */
          CB.clearHouseholdMemberTemp();
          /* Counter used to tell what the undercount screen we are on */
          var undercountCurrentScreenIndex = questFlagsPage.get("UndercountCurrentScreenIndex");
          if (undercountCurrentScreenIndex)
          {
            undercountCurrentScreenIndex.setValue(parseInt(undercountCurrentScreenIndex.getValue()) + 1)
          }
        }
      }
      /* if we were on a previous undercount screen decrement counter */
      if (parseInt(undercountPreviousCounter.getValue()) > 0) {

        undercountPreviousCounter.setValue(parseInt(undercountPreviousCounter.getValue()) - 1);
      }
    }
  }

  var householdRosterMember= pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");  
  if (householdRosterMember){

    /* get roster size */
    var sizeOfIndex  = householdRosterMember.size();
    /* Flag used to tell if we are at max roster size */
    var isUndercountBranchMaxRoster = questFlagsPage.get("IsUndercountBranchMaxRoster");
    if(isUndercountBranchMaxRoster) {
      if(isUndercountBranchMaxRoster.getValue() == "true"){

        hasAdditionalUndercount.setValue("false");

      }
      else if(sizeOfIndex >= 99) {
        /* If we have reached max roster size set flags accordingly */
        isUndercountBranchMaxRoster.setValue("true");
        hasAdditionalUndercount.setValue("true");
      }
    }
  }
}

/*
* Pre Action for Intro
* Created by Mike Hartel
*/
function EnumCB_Intro_PRE(){
 try {   
  ENUMCB.updateDKRefVisibility("Intro", "pyWorkPage.Respondent.DKRefused");
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");

  var introOptions = pega.ui.ClientCache.find("D_IntroQuestionOptions").put("pxResults",[]);  
  var introOptionsMaster = pega.ui.ClientCache.find("D_IntroQuestionOptions_Master.pxResults").iterator();   
  var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");  
  var attemptType = respPage.get("NRFU_ATTEMPT_TYPE_CODE"); 
  attemptType = attemptType ? attemptType.getValue() : "";
  var respLocation = respPage.get("RESPONSE_LOCATION_CODE");
  respLocation = respLocation ? respLocation.getValue(): "";  

  /*PVProxy*/
  if(attemptType == "PV" && respLocation == "2"){
    while(introOptionsMaster.hasNext()) {    
      var currentPage = introOptionsMaster.next();    
      if(currentPage.get("pyNote").getValue().indexOf("PVProxy")!= -1){
        introOptions.add().adoptJSON(currentPage.getJSON());   
      }
    }
  }

  /*OutboundProxy*/
  if(attemptType == "TA" && respLocation == "2"){
    while(introOptionsMaster.hasNext()) {    
      var currentPage = introOptionsMaster.next();    
      if(currentPage.get("pyNote").getValue().indexOf("OutboundProxy")!= -1){
        introOptions.add().adoptJSON(currentPage.getJSON());   
      }
    }
  }

  /*OutboundCensusAddress*/
  if(attemptType == "TA" && respLocation == "1"){
    while(introOptionsMaster.hasNext()) {    
      var currentPage = introOptionsMaster.next();    
      if(currentPage.get("pyNote").getValue().indexOf("OutboundCensusAddress")!= -1){
        introOptions.add().adoptJSON(currentPage.getJSON());   
      }
    }
  }

  /*PVCensusAddress*/
  if(attemptType == "PV" && respLocation == "1"){
    while(introOptionsMaster.hasNext()) {    
      var currentPage = introOptionsMaster.next();    
      if(currentPage.get("pyNote").getValue().indexOf("PVCensusAddress")!= -1){
        introOptions.add().adoptJSON(currentPage.getJSON());   
      }
    }

    /*InboundProxy*/
    if(attemptType == "TB" && respLocation == "2"){
      while(introOptionsMaster.hasNext()) {    
        var currentPage = introOptionsMaster.next();    
        if(currentPage.get("pyNote").getValue().indexOf("InboundProxy")!= -1){
          introOptions.add().adoptJSON(currentPage.getJSON());   
        }
      }
    }

    /*InboundCensusAddress*/
    if(attemptType == "TB" && respLocation == "1"){
      while(introOptionsMaster.hasNext()) {    
        var currentPage = introOptionsMaster.next();    
        if(currentPage.get("pyNote").getValue().indexOf("InboundCensusAddress")!= -1){
          introOptions.add().adoptJSON(currentPage.getJSON());   
        }
      }
    }  
  }

 }
 catch(e) {
   alert(e.message);
 }
}

/*
*	Pre Action for Sex_QSTN
*	Created by: Domenic Giancola
*/
function EnumCB_Sex_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var householdMembers = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var memberIndexProp = householdRoster.get("CurrentHHMemberIndex");

  var memberIndex = (memberIndexProp) ? memberIndexProp.getValue() :1;
  /* got here from Previous*/
  if(isGoingBack == "true"){
    if(previousQuestion == "Sex_QSTN") {   
      memberIndex = memberIndex - 1;
    }
    else if(previousQuestion == "DOB_QSTN" || previousQuestion =="ConfirmSex_QSTN"){
      memberIndex = householdMembers.size();
    }
  }
  /*got here from Next*/
  else{
    if(previousQuestion =="RelationshipResp_QSTN" || previousQuestion =="RelationshipOther_QSTN" || previousQuestion =="RelationOT_QSTN" || previousQuestion =="RelationSD_QSTN"){
      memberIndex=1;
    }
  }    
  householdRoster.put("CurrentHHMemberIndex", memberIndex);  
  var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
  CB.getMemberFromRoster(curMemberIndex);  
  ENUMCB.updateDKRefVisibility("Sex");
}

/*
*	Post Action for Sex_QSTN
*	Created by: Domenic Giancola
*/
function EnumCB_Sex_POST() {
  ENUMCB.Sex_VLDN();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");

  if(!workPage.hasMessages()){
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var referencePersonPage = pega.ui.ClientCache.find("pyWorkpage.HouseholdRoster.ReferencePerson");
    if(cpQuestFlags && cpHouseholdMemberList && cpHouseholdMemberTemp) {
      cpQuestFlags.put("IsFirstTimeSex","false");
      var curSex = cpHouseholdMemberTemp.get("SexMaleFemale").getValue();
      var cpResponse = cpHouseholdMemberTemp.get("Response");
      var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
      var dkRefProp = dkRefused.get("Sex");
      if(dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      }
      else {
        dkRefProp = "";
      }
      if(dkRefProp == "D") {
        cpResponse.put("P_SEX_DK_IND", "1");
        cpResponse.put("P_SEX_REF_IND", "0");
        cpHouseholdMemberTemp.put("SexMaleFemale", "Don't Know");
      }
      else if(dkRefProp == "R") {
        cpResponse.put("P_SEX_DK_IND", "0");
        cpResponse.put("P_SEX_REF_IND", "1");
        cpHouseholdMemberTemp.put("SexMaleFemale", "Refused");
      }
      else {
        cpResponse.put("P_SEX_DK_IND", "0");
        cpResponse.put("P_SEX_REF_IND", "0");
      }
      if(curSex == "Male"){
        cpResponse.put("P_SEX_MALE_IND","1");
        cpResponse.put("P_SEX_FEMALE_IND","0");
      }
      else if(curSex == "Female"){
        cpResponse.put("P_SEX_MALE_IND","0");
        cpResponse.put("P_SEX_FEMALE_IND","1");
      }
      else{
        cpResponse.put("P_SEX_MALE_IND","0");
        cpResponse.put("P_SEX_FEMALE_IND","0");         
      }
      cpHouseholdMemberTemp.put("SexMaleFemaleConsistencyEdit","");	

      var params = {isFirstTimeProp: "IsFirstTimeSex"};
      ENUMCB.updateMemberIndexPost(params);

      var referencePersonFlag = cpHouseholdMemberTemp.get("ReferencePersonFlag");
      if(referencePersonFlag) {
        referencePersonFlag = referencePersonFlag.getValue();
      }
      else {
        referencePersonFlag = "";
      }

      if(referencePersonFlag == "true") {
        referencePersonPage.adoptJSON(cpHouseholdMemberTemp.getJSON());
      }

      /* check for the last member in roster*/
      var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue(),10);
      var curRosterSize = parseInt(cpQuestFlags.get("CurrentRosterSize").getValue(),10);
      if(curMemberIndex > curRosterSize){
        /*clear the ConfirmSexMemberList*/
        var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
        var confirmSexMemberList = questFlags.put("ConfirmSexMemberList",[]);
        /*call sex validations function here*/
        ENUMCB.RelationshipSexInconsistencyCheck("pyWorkPage.QuestFlags.ConfirmSexMemberList");
        confirmSexMemberList= questFlags.get("ConfirmSexMemberList")
        var confirmSexSize = confirmSexMemberList.size();
        questFlags.put("ConfirmSexSize", confirmSexSize);      
      }	
    }  
    else{
      console.log("***ENUMCB Error - " + "Unable to find QuestFlags page, HouseholdRoster.HouseholdMember pagelist, or HouseholdMemberTemp page in EnumCB_Sex_POST function");
    }
  }  
}

/**
*	ENUMCB.RelationshipSexInconsistencyCheck for sex validation
*	Created by Kyle Gravel, ArtXJ
**/
ENUMCB.RelationshipSexInconsistencyCheck= function(memberIndicesPageListName) {
  try{   
    /*Find Reference Person Sex from Reference Person Page*/
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var referencePersonPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
    var refSexMaleFemale = referencePersonPage.get("SexMaleFemale");
    if(refSexMaleFemale) {
      refSexMaleFemale = refSexMaleFemale.getValue();
    }
    else {
      refSexMaleFemale = "";
    }
    var refSexMaleFemaleConsistencyEdit = referencePersonPage.get("SexMaleFemaleConsistencyEdit");

    if(refSexMaleFemaleConsistencyEdit) {
      refSexMaleFemaleConsistencyEdit = refSexMaleFemaleConsistencyEdit.getValue();
    }
    else {
      refSexMaleFemaleConsistencyEdit = "";
    }

    if (refSexMaleFemaleConsistencyEdit!=""){
      refSexMaleFemale = refSexMaleFemaleConsistencyEdit;
    }

    /*iterator through the household member list
	*	grab P_REL_CODE response page
	*/
    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var householdMemberList = householdMember.iterator();

    while(householdMemberList.hasNext()) {
      var currentPage = householdMemberList.next();
      var referencePersonFlag = currentPage.get("ReferencePersonFlag");
      if(referencePersonFlag) {
        referencePersonFlag = referencePersonFlag.getValue();
      }
      else {
        referencePersonFlag = "";
      }
      var responsePage = currentPage.get(".Response");

      if(referencePersonFlag != true) {    
        var relationshipCode = responsePage.get("P_REL_CODE");
        if(relationshipCode) {
          relationshipCode = relationshipCode.getValue();
        }
        else {
          relationshipCode = "";
        }

        var sexMaleFemale = currentPage.get("SexMaleFemale");             
        if(sexMaleFemale) {
          sexMaleFemale = sexMaleFemale.getValue();
        }
        else {
          sexMaleFemale = "";
        }


        var sexMaleFemaleConsistencyEdit = currentPage.get("SexMaleFemaleConsistencyEdit");
        if(sexMaleFemaleConsistencyEdit) {
          sexMaleFemaleConsistencyEdit = sexMaleFemaleConsistencyEdit.getValue();
        }
        else {
          sexMaleFemaleConsistencyEdit = "";
        }

        if(sexMaleFemaleConsistencyEdit!=""){
          sexMaleFemale =sexMaleFemaleConsistencyEdit;
        }


        var dkRefPage = currentPage.get("DKRefused");
        var sexDKRef = dkRefPage.get("Sex");
        if(sexDKRef) {
          sexDKRef = sexDKRef.getValue();
        }
        else {
          sexDKRef = "";
        }

        if(((relationshipCode == "1") || (relationshipCode == "2")) && ((refSexMaleFemale == sexMaleFemale) && sexDKRef == "")) {
          currentPage.put("RelationshipInconsistent", true);

        }          
        else if(((relationshipCode == "3") || (relationshipCode=="4")) && ((refSexMaleFemale != sexMaleFemale) && sexDKRef == "")) {
          currentPage.put("RelationshipInconsistent", true);

        }
        else{
          currentPage.put("RelationshipInconsistent", false);
        }
      }


    }

    ENUMCB.addMembersToRSMemberIndexList(memberIndicesPageListName);
  }
  catch(e) {
    alert(e.message);
  }
}



ENUMCB.updateMemberIndexPre = function(params) {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  if(householdRoster && cpQuestFlags){
    if(cpHouseholdMemberList){
      var curRosterSize = cpHouseholdMemberList.size();
      var cpCurMemberIndex = householdRoster.get("CurrentHHMemberIndex");
      if(!cpCurMemberIndex){
        householdRoster.put("CurrentHHMemberIndex",1);
      }
      var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
      if(cpQuestFlags.get(params.isFirstTimeProp).getValue() == "true"){
        var curRosterSize = cpHouseholdMemberList.size();
        householdRoster.put("CurrentHHMemberIndex",1);
        cpQuestFlags.put("CurrentRosterSize",curRosterSize);
        curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
      }
      else if(cpQuestFlags.get("IsGoingBack").getValue() == "true" ){
        if(params.currentQuestion != "DOB_QSTN") {
          curMemberIndex = curMemberIndex - 1;
          if(curMemberIndex == 0) {
            curMemberIndex = curRosterSize;
          }
          householdRoster.put("CurrentHHMemberIndex",curMemberIndex);  
        }
      }
      var cpMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      if(cpMemberTemp){
        return curMemberIndex;
      }
      else{
        console.log("***ENUMCB Error - " + "Unable to find HouseholdMemberTemp page in ENUMCB.updateMemberIndexPre function");
        return;
      }
    }
    else {
      console.log("***ENUMCB Error - " + "Unable to find HouseholdRoster.HouseholdMember pagelist in ENUMCB.updateMemberIndexPre function");
      return;
    }
  }
  else{
    console.log("***ENUMCB Error - " + "Unable to find QuestFlags page in ENUMCB.updateMemberIndexPre function");
    return;
  }
}

/**
*	Pre action for confirm age
*	Created by Kyle Gravel
**/
function EnumCB_ConfirmAge_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKRFEnabled", "true");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack");
  isGoingBack = isGoingBack ? isGoingBack.getValue() : "";
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
  currentHHMember = currentHHMember ? currentHHMember.getValue() : alert("curr HH memb doesnt exist");
  var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var householdMemberSize = householdMember.size();

  if(isGoingBack == "true") {
    if(previousQuestion == "DOB_QSTN") {
      currentHHMember = currentHHMember - 1;
      CB.getMemberFromRoster(currentHHMember);
      householdRoster.put("CurrentHHMemberIndex",currentHHMember);
    }
    if (previousQuestion == "Race_QSTN") {
      currentHHMember = householdMemberSize;
      CB.getMemberFromRoster(currentHHMember);
      householdRoster.put("CurrentHHMemberIndex",currentHHMember);
    }
  }

  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var age = parseInt(respPage.get("P_AGE_CALC_INT").getValue());
  var respondentFlag = householdMemberTemp.get("RespondantFlag");
  if(respondentFlag) {
    respondentFlag = respondentFlag.getValue();
  }
  if(age > 0 && respondentFlag == "true") {
    questFlags.put("DisplayConfirmAgeInst","1");
  }
  if(age < 1 && respondentFlag == "true") {    
    questFlags.put("DisplayConfirmAgeInst","2");
  }
  if(age > 0 && respondentFlag == "false") {
    questFlags.put("DisplayConfirmAgeInst","3");
  }
  if(age < 1 && respondentFlag == "false") {
    questFlags.put("DisplayConfirmAgeInst","4");
  }
  ENUMCB.updateDKRefVisibility("ConfirmAge");
}

/*
*	Post Action for ConfrimAge_QSTN
*	Created by: Kyle Gravel, Omar Mohammed
*/
function EnumCB_ConfirmAge_POST() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if(isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CONF_YES_IND", "pyWorkPage.HouseholdMemberTemp.DKRefused.ConfirmAge", "PleaseProvideAnAnswer"); 
  }
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CONF_YES_IND", "", "PleaseProvideAnAnswer"); 
  }
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if(!workPage.hasMessages()) {
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var confirmAge = respPage.get("P_AGE_CONF_YES_IND").getValue();

    if(confirmAge == "1") {
      respPage.put("P_AGE_CONF_YES_IND","1");
      respPage.put("P_AGE_CONF_NO_IND","0");
      var age = respPage.get("P_AGE_CALC_INT");
      if (age) {
        var hhTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
        hhTemp.put("Age",age.getValue());
      }
      var params = {isFirstTimeProp:"IsFirstTimeDOB"};
      ENUMCB.updateMemberIndexPost(params);
      ENUMCB.AreParentsYoungerthanChildren();
    }
    else {
      respPage.put("P_AGE_CONF_YES_IND","0");
      respPage.put("P_AGE_CONF_NO_IND","1");
    }
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ConfirmAge", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CONF_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CONF_REF_IND");
  }

}

/**
*	Pre action for origin white
*	Created by Kyle Gravel
**/
function EnumCB_EthnicityWhite_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginW");
  ENUMCB.getMemberForEthnicityQuestion();
}

/**
*	Post action for details origin white
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityWhite_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethWhiteEnglish = ethFlags.get("IsEthnicityWhiteEnglish").getValue();
  var ethWhiteFrench = ethFlags.get("IsEthnicityWhiteFrench").getValue();
  var ethWhiteGerman = ethFlags.get("IsEthnicityWhiteGerman").getValue();
  var ethWhiteIrish = ethFlags.get("IsEthnicityWhiteIrish").getValue();
  var ethWhiteItalian = ethFlags.get("IsEthnicityWhiteItalian").getValue();
  var ethWhitePolish = ethFlags.get("IsEthnicityWhitePolish").getValue();
  var writeInValue = respPage.get("P_RACE2_WHITE_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginW");
  var numberSelected = 0;

  if(ethWhiteEnglish) {
    respPage.put("P_RACE2_ENGLISH_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ENGLISH_IND", "0");
  }
  if(ethWhiteFrench) {
    respPage.put("P_RACE2_FRENCH_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FRENCH_IND", "0");
  }
  if(ethWhiteGerman) {
    respPage.put("P_RACE2_GERMAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_GERMAN_IND", "0");
  }
  if(ethWhiteIrish) {
    respPage.put("P_RACE2_IRISH_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_IRISH_IND", "0");
  }
  if(ethWhiteItalian) {
    respPage.put("P_RACE2_ITALIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ITALIAN_IND", "0");
  }
  if(ethWhitePolish) {
    respPage.put("P_RACE2_POLISH_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_POLISH_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityWhiteWriteIn",writeInValue);
    numberSelected++;
  }
  
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_WHITE_DK_IND", "1");
			respPage.put("P_RACE2_WHITE_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_WHITE_DK_IND", "0");
			respPage.put("P_RACE2_WHITE_REF_IND", "1");
			numberSelected++;
		}
	}
  
  ENUMCB.EthnicityWhite_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("WHITE")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Pre action for RevDetailedOriginWhite
*	Created by Aansh Kapadia
**/
function EnumCB_RevDetailedOriginWhite_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginWhite");
  CB.toggleFlag("ExitSurveyEnabled","true");
}

/**
*	Post action for RevDetailedOriginWhite
*	Created by Aansh Kapadia
**/
function EnumCB_RevDetailedOriginWhite_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var ethWhiteEnglish = ethFlags.get("IsEthnicityWhiteEnglish").getValue();
  var ethWhiteFrench = ethFlags.get("IsEthnicityWhiteFrench").getValue();
  var ethWhiteGerman = ethFlags.get("IsEthnicityWhiteGerman").getValue();
  var ethWhiteIrish = ethFlags.get("IsEthnicityWhiteIrish").getValue();
  var ethWhiteItalian = ethFlags.get("IsEthnicityWhiteItalian").getValue();
  var ethWhitePolish = ethFlags.get("IsEthnicityWhitePolish").getValue();
  var writeInValue = respPage.get("P_RACE2_WHITE_RV_TEXT").getValue();
  var numberSelected = 0;

  ethFlags.put("IsEthnicityWhiteWriteIn", writeInValue);
  if(ethWhiteEnglish) {
    respPage.put("P_RACE2_ENGLISH_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ENGLISH_RV_IND", "0");
  }
  if(ethWhiteFrench) {
    respPage.put("P_RACE2_FRENCH_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FRENCH_RV_IND", "0");
  }
  if(ethWhiteGerman) {
    respPage.put("P_RACE2_GERMAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_GERMAN_RV_IND", "0");
  }
  if(ethWhiteIrish) {
    respPage.put("P_RACE2_IRISH_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_IRISH_RV_IND", "0");
  }
  if(ethWhiteItalian) {
    respPage.put("P_RACE2_ITALIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ITALIAN_RV_IND", "0");
  }
  if(ethWhitePolish) {
    respPage.put("P_RACE2_POLISH_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_POLISH_RV_IND", "0");
  }
  if(writeInValue != "") {
    numberSelected++;
  }  
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginWhite");
  ENUMCB.setReviewRacePage("RevRaceEthnicity");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
  CB.setMemberInRoster(curMemberIndex,false);
  ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginWhite", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_WHITE_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_WHITE_REF_RV_IND");
}

/**
*	Pre action for origin hispanic
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityHispanic_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginH");
  ENUMCB.getMemberForEthnicityQuestion();
}
/**
*	Function for hispanic post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityHispanic_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethHispColombian = ethFlags.get("IsEthnicityHispanicColombian").getValue();
  var ethHispCuban = ethFlags.get("IsEthnicityHispanicCuban").getValue();
  var ethHispDominican = ethFlags.get("IsEthnicityHispanicDominican").getValue();
  var ethHispMexican = ethFlags.get("IsEthnicityHispanicMexican").getValue();
  var ethHispPuertoRican = ethFlags.get("IsEthnicityHispanicPuertoRican").getValue();
  var ethHispSalvadoran = ethFlags.get("IsEthnicityHispanicSalvadoran").getValue();
  var writeInValue = respPage.get("P_RACE2_HISP_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginH");
  var numberSelected = 0;

  if(ethHispColombian) {
    respPage.put("P_RACE2_COLOMBIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_COLOMBIAN_IND", "0");
  }
  if(ethHispCuban) {
    respPage.put("P_RACE2_CUBAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CUBAN_IND", "0");
  }
  if(ethHispDominican) {
    respPage.put("P_RACE2_DOMINICAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_DOMINICAN_IND", "0");
  }
  if(ethHispMexican) {
    respPage.put("P_RACE2_MEXICAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MEXICAN_IND", "0");
  }
  if(ethHispPuertoRican) {
    respPage.put("P_RACE2_PUERTORICAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_PUERTORICAN_IND", "0");
  }
  if(ethHispSalvadoran) {
    respPage.put("P_RACE2_SALVADORAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SALVADORAN_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityHispanicWriteIn",writeInValue);
    numberSelected++;
  }
  
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_HISP_DK_IND", "1");
			respPage.put("P_RACE2_HISP_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_HISP_DK_IND", "0");
			respPage.put("P_RACE2_HISP_REF_IND", "1");
			numberSelected++;
		}
	}
	
  ENUMCB.EthnicityHispanic_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("HISP")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}



/**
*	Pre action for RevDetailedOriginHisp
*	Created by Aansh Kapadia
**/
function EnumCB_RevDetailedOriginHisp_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginHisp");
  CB.toggleFlag("ExitSurveyEnabled","true");
}

/**
*	Post action for RevDetailedOriginHisp
*	Created by Aansh Kapadia
**/
function EnumCB_RevDetailedOriginHisp_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var ethHispMexican = ethFlags.get("IsEthnicityHispanicMexican").getValue();
  var ethHispPuertoRican = ethFlags.get("IsEthnicityHispanicPuertoRican").getValue();
  var ethHispCuban = ethFlags.get("IsEthnicityHispanicCuban").getValue();
  var ethHispSalvadoran = ethFlags.get("IsEthnicityHispanicSalvadoran").getValue();
  var ethHispDominican = ethFlags.get("IsEthnicityHispanicDominican").getValue();
  var ethHispColombian = ethFlags.get("IsEthnicityHispanicColombian").getValue();
  var writeInValue = respPage.get("P_RACE2_HISP_RV_TEXT").getValue();
  var numberSelected = 0;

  ethFlags.put("IsEthnicityHispanicWriteIn", writeInValue);
  if(ethHispMexican) {
    respPage.put("P_RACE2_MEXICAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MEXICAN_RV_IND", "0");
  }
  if(ethHispPuertoRican) {
    respPage.put("P_RACE2_PUERTORICAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_PUERTORICAN_RV_IND", "0");
  }
  if(ethHispCuban) {
    respPage.put("P_RACE2_CUBAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CUBAN_RV_IND", "0");
  }
  if(ethHispSalvadoran) {
    respPage.put("P_RACE2_SALVADORAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SALVADORAN_RV_IND", "0");
  }
  if(ethHispDominican) {
    respPage.put("P_RACE2_DOMINICAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_DOMINICAN_RV_IND", "0");
  }
  if(ethHispColombian) {
    respPage.put("P_RACE2_COLOMBIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_COLOMBIAN_RV_IND", "0");
  }
  if(writeInValue != "") {
    numberSelected++;
  }  
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginHisp");
  ENUMCB.setReviewRacePage("RevRaceEthnicity");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
  CB.setMemberInRoster(curMemberIndex,false);
  ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginHisp", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_HISP_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_HISP_REF_RV_IND");
}

/**
*	Function for black pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityBlack_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginB");
  ENUMCB.getMemberForEthnicityQuestion();
}

/**
*	Function for black post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityBlack_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var ethBlackAfAm = ethFlags.get("IsEthnicityBlackAfricanAmerican").getValue();
  var ethBlackEthiopian = ethFlags.get("IsEthnicityBlackEthiopian").getValue();
  var ethBlackHaitian = ethFlags.get("IsEthnicityBlackHaitian").getValue();
  var ethBlackJamaican = ethFlags.get("IsEthnicityBlackJamaican").getValue();
  var ethBlackNigerian = ethFlags.get("IsEthnicityBlackNigerian").getValue();
  var ethBlackSomali = ethFlags.get("IsEthnicityBlackSomali").getValue();
  var writeInValue = respPage.get("P_RACE2_BLACK_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginB");
  var numberSelected = 0;

  if(ethBlackAfAm) {
    respPage.put("P_RACE2_AFAM_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_AFAM_IND", "0");
  }
  if(ethBlackEthiopian) {
    respPage.put("P_RACE2_ETHIOPIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ETHIOPIAN_IND", "0");
  }
  if(ethBlackHaitian) {
    respPage.put("P_RACE2_HAITIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_HAITIAN_IND", "0");
  }
  if(ethBlackJamaican) {
    respPage.put("P_RACE2_JAMAICAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_JAMAICAN_IND", "0");
  }
  if(ethBlackNigerian) {
    respPage.put("P_RACE2_NIGERIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_NIGERIAN_IND", "0");
  }
  if(ethBlackSomali) {
    respPage.put("P_RACE2_SOMALI_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SOMALI_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityBlackWriteIn",writeInValue);
    numberSelected++;
  }
  
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_BLACK_DK_IND", "1");
			respPage.put("P_RACE2_BLACK_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_BLACK_DK_IND", "0");
			respPage.put("P_RACE2_BLACK_REF_IND", "1");
			numberSelected++;
		}
	}
	
  ENUMCB.EthnicityBlack_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("BLACK")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Function for asian pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityAsian_PRE() {
	CB.toggleFlag("DKREFEnabled", "true");
	ENUMCB.updateDKRefVisibility("DetailedOriginA");
	ENUMCB.getMemberForEthnicityQuestion();
}


/**
*	Function for asian post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityAsian_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var ethAsianIndian = ethFlags.get("IsEthnicityAsianAsianIndian").getValue();
  var ethAsianChinese = ethFlags.get("IsEthnicityAsianChinese").getValue();
  var ethAsianFilipino = ethFlags.get("IsEthnicityAsianFilipino").getValue();
  var ethAsianJapanese = ethFlags.get("IsEthnicityAsianJapanese").getValue();
  var ethAsianKorean = ethFlags.get("IsEthnicityAsianKorean").getValue();
  var ethAsianVietnamese = ethFlags.get("IsEthnicityAsianVietnamese").getValue();
  var writeInValue = respPage.get("P_RACE2_ASIAN_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginA");
  var numberSelected = 0;

  if(ethAsianIndian) {
    respPage.put("P_RACE2_INDIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_INDIAN_IND", "0");
  }
  if(ethAsianChinese) {
    respPage.put("P_RACE2_CHINESE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CHINESE_IND", "0");
  }
  if(ethAsianFilipino) {
    respPage.put("P_RACE2_FILIPINO_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FILIPINO_IND", "0");
  }
  if(ethAsianJapanese) {
    respPage.put("P_RACE2_JAPANESE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_JAPANESE_IND", "0");
  }
  if(ethAsianKorean) {
    respPage.put("P_RACE2_KOREAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_KOREAN_IND", "0");
  }
  if(ethAsianVietnamese) {
    respPage.put("P_RACE2_VIETNAMESE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_VIETNAMESE_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityAsianWriteIn",writeInValue);
    numberSelected++;
  }
  
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_ASIAN_DK_IND", "1");
			respPage.put("P_RACE2_ASIAN_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_ASIAN_DK_IND", "0");
			respPage.put("P_RACE2_ASIAN_REF_IND", "1");
			numberSelected++;
		}
	}
	
  ENUMCB.EthnicityAsian_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("ASIAN")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Function for rev asian pre action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginAsian_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginAsian");
}


/**
*	Function for rev asian post action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginAsian_POST() {
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var dkRefProp = dkRefused.get("RevDetailedOriginAsian");

  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var ethAsianIndian = ethFlags.get("IsEthnicityAsianAsianIndian").getValue();
  var ethAsianChinese = ethFlags.get("IsEthnicityAsianChinese").getValue();
  var ethAsianFilipino = ethFlags.get("IsEthnicityAsianFilipino").getValue();
  var ethAsianJapanese = ethFlags.get("IsEthnicityAsianJapanese").getValue();
  var ethAsianKorean = ethFlags.get("IsEthnicityAsianKorean").getValue();
  var ethAsianVietnamese = ethFlags.get("IsEthnicityAsianVietnamese").getValue();
  var writeInValue = respPage.get("P_RACE2_ASIAN_RV_TEXT").getValue();
  var numberSelected = 0;

  if(dkRefProp) {
    dkRefProp = dkRefProp.getValue();
  }
  else {
    dkRefProp = "";
  }
  if(dkRefProp == "D") {
    respPage.put("P_RACE2_ASIAN_DK_RV_IND", "1");
    respPage.put("P_RACE2_ASIAN_REF_RV_IND", "0");
  }
  else if(dkRefProp == "R") {
    respPage.put("P_RACE2_ASIAN_DK_RV_IND", "0");
    respPage.put("P_RACE2_ASIAN_REF_RV_IND", "1");
  }

  if(ethAsianIndian) {
    respPage.put("P_RACE2_ASIANINDIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ASIANINDIAN_RV_IND", "0");
  }
  if(ethAsianChinese) {
    respPage.put("P_RACE2_CHINESE_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CHINESE_RV_IND", "0");
  }
  if(ethAsianFilipino) {
    respPage.put("P_RACE2_FILIPINO_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FILIPINO_RV_IND", "0");
  }
  if(ethAsianJapanese) {
    respPage.put("P_RACE2_JAPANESE_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_JAPANESE_RV_IND", "0");
  }
  if(ethAsianKorean) {
    respPage.put("P_RACE2_KOREAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_KOREAN_RV_IND", "0");
  }
  if(ethAsianVietnamese) {
    respPage.put("P_RACE2_VIETNAMESE_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_VIETNAMESE_RV_IND", "0");
  }
  if(writeInValue != "") {
    numberSelected++;
  }
  ethFlags.put("IsEthnicityAsianWriteIn", writeInValue);
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginAsian");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
  }
}


/**
*	Function for mena pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityMENA_PRE() {
  ENUMCB.getMemberForEthnicityQuestion();
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginMENA");
}

/**
*	Function for mena post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityMENA_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var ethMENAEgyptian = ethFlags.get("IsEthnicityMENAEgyptian").getValue();
  var ethMENAIranian = ethFlags.get("IsEthnicityMENAIranian").getValue();
  var ethMENAIsraeli = ethFlags.get("IsEthnicityMENAIsraeli").getValue();
  var ethMENALebanese = ethFlags.get("IsEthnicityMENALebanese").getValue();
  var ethMENAMoroccan = ethFlags.get("IsEthnicityMENAMoroccan").getValue();
  var ethMENASyrian = ethFlags.get("IsEthnicityMENASyrian").getValue();
  var writeInValue = respPage.get("P_RACE2_MENA_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginMENA");
  var numberSelected = 0;

  if(ethMENAEgyptian) {
    respPage.put("P_RACE2_EGYPTIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_EGYPTIAN_IND", "0");
  }
  if(ethMENAIranian) {
    respPage.put("P_RACE2_IRANIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_IRANIAN_IND", "0");
  }
  if(ethMENAIsraeli) {
    respPage.put("P_RACE2_ISRAELI_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ISRAELI_IND", "0");
  }
  if(ethMENALebanese) {
    respPage.put("P_RACE2_LEBANESE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_LEBANESE_IND", "0");
  }
  if(ethMENAMoroccan) {
    respPage.put("P_RACE2_MOROCCAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MOROCCAN_IND", "0");
  }
  if(ethMENASyrian) {
    respPage.put("P_RACE2_SYRIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SYRIAN_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityMENAWriteIn",writeInValue);
    numberSelected++;
  }
  
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_MENA_DK_IND", "1");
			respPage.put("P_RACE2_MENA_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_MENA_DK_IND", "0");
			respPage.put("P_RACE2_MENA_REF_IND", "1");
			numberSelected++;
		}
	}
	
  ENUMCB.EthnicityMENA_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("MENA")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Function for rev mena pre action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginMENA_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginMENA");
}


/**
*	Function for rev mena post action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginMENA_POST() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");

  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var ethMenaLebanese = ethFlags.get("IsEthnicityMENALebanese").getValue();
  var ethMenaIranian = ethFlags.get("IsEthnicityMENAIranian").getValue();
  var ethMenaEgyptian = ethFlags.get("IsEthnicityMENAEgyptian").getValue();
  var ethMenaSyrian = ethFlags.get("IsEthnicityMENASyrian").getValue();
  var ethMenaMoroccan = ethFlags.get("IsEthnicityMENAMoroccan").getValue();
  var ethMenaIsraeli = ethFlags.get("IsEthnicityMENAIsraeli").getValue();
  var writeInValue = respPage.get("P_RACE2_MENA_RV_TEXT").getValue();
  var numberSelected = 0;

  if(ethMenaLebanese) {
    respPage.put("P_RACE2_LEBANESE_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_LEBANESE_RV_IND", "0");
  }
  if(ethMenaIranian ) {
    respPage.put("P_RACE2_IRANIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_IRANIAN_RV_IND", "0");
  }
  if(ethMenaEgyptian) {
    respPage.put("P_RACE2_EGYPTIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_EGYPTIAN_RV_IND", "0");
  }
  if(ethMenaSyrian) {
    respPage.put("P_RACE2_SYRIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SYRIAN_RV_IND", "0");
  }
  if(ethMenaMoroccan) {
    respPage.put("P_RACE2_MOROCCAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MOROCCAN_RV_IND", "0");
  }
  if(ethMenaIsraeli) {
    respPage.put("P_RACE2_ISRAELI_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_ISRAELI_RV_IND", "0");
  }
  if(writeInValue != "") {
    numberSelected++;
  }
  ethFlags.put("IsEthnicityMENAWriteIn", writeInValue);
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginMENA");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginMENA", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_MENA_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_MENA_REF_RV_IND");
    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
  }
}

/**
*	Function for nhpi pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityNHPI_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.getMemberForEthnicityQuestion();
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginNHPI");
}

/**
*	Function for nhpi post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityNHPI_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var ethNHPIChamorro = ethFlags.get("IsEthnicityNHPIChamorro").getValue();
  var ethNHPIFijian = ethFlags.get("IsEthnicityNHPIFijian").getValue();
  var ethNHPIMarshallese = ethFlags.get("IsEthnicityNHPIMarshallese").getValue();
  var ethNHPINativeHawaiian = ethFlags.get("IsEthnicityNHPINativeHawaiian").getValue();
  var ethNHPISamoan = ethFlags.get("IsEthnicityNHPISamoan").getValue();
  var ethNHPITongan = ethFlags.get("IsEthnicityNHPITongan").getValue();
  var writeInValue = respPage.get("P_RACE2_NHPI_TEXT").getValue();
  var dkRefProp = dkRefused.get("DetailedOriginNHPI");
  var numberSelected = 0;

  if(ethNHPIChamorro) {
    respPage.put("P_RACE2_CHAMORRO_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CHAMORRO_IND", "0");
  }
  if(ethNHPIFijian) {
    respPage.put("P_RACE2_FIJIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FIJIAN_IND", "0");
  }
  if(ethNHPIMarshallese) {
    respPage.put("P_RACE2_MARSHALLESE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MARSHALLESE_IND", "0");
  }
  if(ethNHPINativeHawaiian) {
    respPage.put("P_RACE2_NATHAWAIIAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_NATHAWAIIAN_IND", "0");
  }
  if(ethNHPISamoan) {
    respPage.put("P_RACE2_SAMOAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SAMOAN_IND", "0");
  }
  if(ethNHPITongan) {
    respPage.put("P_RACE2_TONGAN_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_TONGAN_IND", "0");
  }
  if(writeInValue != "") {
    ethFlags.put("IsEthnicityNHPIWriteIn",writeInValue);
    numberSelected++;
  }
  
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		if(dkRefProp) {
			dkRefProp = dkRefProp.getValue();
		}
		else {
			dkRefProp = "";
		}
		if(dkRefProp == "D") {
			respPage.put("P_RACE2_NHPI_DK_IND", "1");
			respPage.put("P_RACE2_NHPI_REF_IND", "0");
			numberSelected++;
		}
		else if(dkRefProp == "R") {
			respPage.put("P_RACE2_NHPI_DK_IND", "0");
			respPage.put("P_RACE2_NHPI_REF_IND", "1");
			numberSelected++;
		}
	}
	
  ENUMCB.EthnicityNHPI_VLDN(numberSelected);
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("NHPI")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Pre action for RevDetailedOriginNHPI
*	Created by Jack McCloskey
**/
function EnumCB_RevDetailedOriginNHPI_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginNHPI");
}

/**
*	Post action for RevDetailedOriginNHPI
*	Created by Jack McCloskey
**/
function EnumCB_RevDetailedOriginNHPI_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var ethNHPINativeHawaiian = ethFlags.get("IsEthnicityNHPINativeHawaiian").getValue();
  var ethNHPISamoan = ethFlags.get("IsEthnicityNHPISamoan").getValue();
  var ethNHPIChamorro = ethFlags.get("IsEthnicityNHPIChamorro").getValue();
  var ethNHPITongan = ethFlags.get("IsEthnicityNHPITongan").getValue();
  var ethNHPIFijian = ethFlags.get("IsEthnicityNHPIFijian").getValue();
  var ethNHPIMarshallese = ethFlags.get("IsEthnicityNHPIMarshallese").getValue();
  var writeInValue = respPage.get("P_RACE2_NHPI_RV_TEXT").getValue();
  var numberSelected = 0;

  if(ethNHPINativeHawaiian) {
    respPage.put("P_RACE2_NATHAWAIIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_NATHAWAIIAN_RV_IND", "0");
  }
  if(ethNHPISamoan) {
    respPage.put("P_RACE2_SAMOAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_SAMOAN_RV_IND", "0");
  }
  if(ethNHPIChamorro) {
    respPage.put("P_RACE2_CHAMORRO_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_CHAMORRO_RV_IND", "0");
  }
  if(ethNHPITongan) {
    respPage.put("P_RACE2_TONGAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_TONGAN_RV_IND", "0");
  }
  if(ethNHPIFijian) {
    respPage.put("P_RACE2_FIJIAN_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_FIJIAN_RV_IND", "0");
  }
  if(ethNHPIMarshallese) {
    respPage.put("P_RACE2_MARSHALLESE_RV_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_RACE2_MARSHALLESE_RV_IND", "0");
  }
  if(writeInValue != "") {
    numberSelected++;
  }
  ethFlags.put("IsEthnicityNHPIWriteIn", writeInValue);
  ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginNHPI", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_NHPI_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_NHPI_REF_RV_IND");
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginNHPI");
  ENUMCB.setReviewRacePage("RevRaceEthnicity");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
  CB.setMemberInRoster(curMemberIndex,false);
}

/**
*	Function for aian pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityAIAN_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginAIAN");
  ENUMCB.getMemberForEthnicityQuestion();
}

/**
*	Function for aian post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityAIAN_POST() {
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_AIAN_TEXT", "pyWorkPage.HouseholdMemberTemp.DKRefused.DetailedOriginAIAN");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var dkRefProp = dkRefused.get("DetailedOriginAIAN");

    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if(isDKRefVisible){
      if(dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      }
      else {
        dkRefProp = "";
      }
      if(dkRefProp == "D") {
        respPage.put("P_RACE2_AIAN_DK_IND", "1");
        respPage.put("P_RACE2_AIAN_REF_IND", "0");
      }
      else if(dkRefProp == "R") {
        respPage.put("P_RACE2_AIAN_DK_IND", "0");
        respPage.put("P_RACE2_AIAN_REF_IND", "1");
      }
    }

    var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
    var writeInValue = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_AINDIAN_TEXT").getValue();
    ethFlags.put("IsEthnicityAIANWriteIn",writeInValue);
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("AIAN")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}

/**
*	Function for rev aian pre action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginAIAN_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginAIAN");
}

/**
*	Function for rev aian post action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginAIAN_POST() {
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_AIAN_RV_TEXT", "pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginAIAN");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  if (!workPage.hasMessages()) {
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var dkRefProp = dkRefused.get("RevDetailedOriginAIAN");

    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
    if(dkRefProp == "D") {
      respPage.put("P_RACE2_AIAN_DK_RV_IND", "1");
      respPage.put("P_RACE2_AIAN_REF_RV_IND", "0");
    }
    else if(dkRefProp == "R") {
      respPage.put("P_RACE2_AIAN_DK_RV_IND", "0");
      respPage.put("P_RACE2_AIAN_REF_RV_IND", "1");
    }

    var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
    var writeInValue = respPage.get("P_RACE2_AIAN_RV_TEXT").getValue();
    ethFlags.put("IsEthnicityAIANWriteIn", writeInValue);

    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
  }
}


/**
*	Function for other pre action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityOther_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.getMemberForEthnicityQuestion();
  CB.toggleFlag("DKREFEnabled", "true");
  ENUMCB.updateDKRefVisibility("DetailedOriginSOR");
}

/**
*	Function for other post action
*	Created by Omar Mohammed
**/
function EnumCB_EthnicityOther_POST() {
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_SOR_TEXT", "pyWorkPage.HouseholdMemberTemp.DKRefused.DetailedOriginSOR");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var dkRefProp = dkRefused.get("DetailedOriginSOR");

    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if(isDKRefVisible){
      if(dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      }
      else {
        dkRefProp = "";
      }
      if(dkRefProp == "D") {
        respPage.put("P_RACE2_SOR_DK_IND", "1");
        respPage.put("P_RACE2_SOR_REF_IND", "0");
      }
      else if(dkRefProp == "R") {
        respPage.put("P_RACE2_SOR_DK_IND", "0");
        respPage.put("P_RACE2_SOR_REF_IND", "1");
      }
    }

    var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
    var writeInValue = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_SOR_TEXT").getValue();
    ethFlags.put("IsEthnicityOtherWriteIn",writeInValue);
    ENUMCB.setReviewRacePage("RaceEthnicity");
    if(ENUMCB.isLastOriginQuestion("OTHER")) {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      ENUMCB.updateMemberIndexPost(params);
    }
  }
}



ENUMCB.updateMemberIndexPost = function(params) {
  /*begin looping mech*/
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  if(householdRoster && cpQuestFlags && cpHouseholdMemberList && cpHouseholdMemberTemp) {
    cpQuestFlags.put(params.isFirstTimeProp,false);
    var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
    curMemberIndex = parseInt(curMemberIndex + 1);
    householdRoster.put("CurrentHHMemberIndex",curMemberIndex);
  }
  else{
    console.log("***ENUMCB Error - " + "Unable to find QuestFlags page, HouseholdRoster.HouseholdMember pagelist, or HouseholdMemberTemp page in ENUMCB.updateMemberIndexPost function");
  }
}


/**
*	Function used to determine whether we should increment the currenthhmemberindex
*	This should be called by all post JS functions on Detailed Origin screens 
*	Created by Omar Mohammed
*/
ENUMCB.isLastOriginQuestion = function(currentRaceQuestion) {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var raceWhite = respPage.get("P_RACE_WHITE_IND");
  if(raceWhite) {
    raceWhite = raceWhite.getValue();
  }
  else {
    raceWhite = "";
  }
  var raceAIAN = respPage.get("P_RACE_AIAN_IND");
  if(raceAIAN) {
    raceAIAN = raceAIAN.getValue();
  }
  else {
    raceAIAN = "";
  }
  var raceAsian = respPage.get("P_RACE_ASIAN_IND");
  if(raceAsian) {
    raceAsian = raceAsian.getValue();
  }
  else {
    raceAsian = "";
  }
  var raceBlack = respPage.get("P_RACE_BLACK_IND");
  if(raceBlack) {
    raceBlack = raceBlack.getValue();
  }
  else {
    raceBlack = "";
  }
  var raceHisp = respPage.get("P_RACE_HISP_IND");
  if(raceHisp) {
    raceHisp = raceHisp.getValue();
  }
  else {
    raceHisp = "";
  }
  var raceMENA = respPage.get("P_RACE_MENA_IND");
  if(raceMENA) {
    raceMENA = raceMENA.getValue();
  }
  else {
    raceMENA = "";
  }
  var raceNHPI = respPage.get("P_RACE_NHPI_IND");
  if(raceNHPI) {
    raceNHPI = raceNHPI.getValue();
  }
  else {
    raceNHPI = "";
  }
  var raceOther = respPage.get("P_RACE_SOR_IND");
  if(raceOther) {
    raceOther = raceOther.getValue();
  }
  else {
    raceOther = "";
  }

  switch(currentRaceQuestion) {
    case "WHITE":
      if(raceAIAN == true || raceAsian == true || raceBlack == true || raceHisp == true || raceMENA == true || raceNHPI == true || raceOther == true) {
        return false;
      }
      return true;
    case "HISP":
      if(raceAIAN == true || raceAsian == true || raceBlack == true || raceMENA == true || raceNHPI == true || raceOther == true) {
        return false;
      }
      return true;
    case "BLACK":
      if(raceAIAN == true || raceAsian == true || raceMENA == true || raceNHPI == true || raceOther == true) {
        return false; 
      }
      return true;
    case "ASIAN": 
      if(raceAIAN == true || raceMENA == true || raceNHPI == true || raceOther == true) {
        return false;
      }
      return true;
    case "AIAN": 
      if(raceMENA == true || raceNHPI == true || raceOther == true) {
        return false; 
      }
      return true;
    case "MENA": 
      if(raceNHPI == true || raceOther == true) {
        return false;
      }
      return true;
    case "NHPI":
      if(raceOther == true) {
        return false;
      }
      return true;
    default:
      return true;
  }
  return true; 
}

/*
* Pre Function for Race
* Created by David Bourque
*/
function EnumCB_Race_PRE() {
  if(pega.mobile.isHybrid) {
    CB.toggleFlag("ExitSurveyEnabled", "true");
	CB.toggleFlag("DKRFEnabled", "true");
	ENUMCB.updateDKRefVisibility("Race");
	
    var workPG = pega.ui.ClientCache.find("pyWorkPage");
    var previousQuestion = workPG.get("CurrentSurveyQuestion").getValue();
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
    currentHHMember = currentHHMember ? currentHHMember.getValue() : "";
    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    /* Reset flag used to tell if screen has been answered */
    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isRaceAnswered = questFlagsPage.get("IsRaceAnswered");
    isRaceAnswered = isRaceAnswered ? isRaceAnswered.getValue() : "";
    var isGoingBack = questFlagsPage.get("IsGoingBack");
    isGoingBack = isGoingBack ? isGoingBack.getValue() : "";
    /* Update HouseholdMemberTemp with current roster member */
    if(isGoingBack == "true") {
      if(previousQuestion == "Race_QSTN") {
        currentHHMember = currentHHMember - 1;
        CB.getMemberFromRoster(currentHHMember);
        householdRoster.put("CurrentHHMemberIndex",currentHHMember);
      }
      if(previousQuestion == "WhoLivesElsewhere_QSTN") {
        currentHHMember = householdMember.size();
        CB.getMemberFromRoster(currentHHMember);
        householdRoster.put("CurrentHHMemberIndex",currentHHMember);
      }
    }
    else {
      var params = {isFirstTimeProp: "IsFirstTimeRace"};
      var curMemberIndex = ENUMCB.updateMemberIndexPre(params);
      CB.getMemberFromRoster(curMemberIndex);
    }
  }
}
/*
* Post Function for Race
* Created by Dillon Irish
*/
function EnumCB_Race_POST() {
  /*Retrieve Roster, Questflags, and Response*/
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var cpRaceFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");

  if(cpResponse && cpQuestFlags && cpRaceFlags ){

    /*Set is firstTimeRace to false*/
    var cpFirstTimeRace = cpQuestFlags.get("IsFirstTimeRace");
	var dkRefProp = dkRefused.get("Race");
    if(cpFirstTimeRace){
      cpFirstTimeRace.setValue("false");
    }

    /*Retrieve Race properties and check if null*/
    var white, hisp, black, asian, aian, mena, nhpi, sor = "";
    var cpWhiteFlag = cpRaceFlags.get("IsRaceWhite");
    if(cpWhiteFlag){
      white = "" + cpWhiteFlag.getValue();
      if(white=="true"){
        cpResponse.put("P_RACE_WHITE_IND", "1");
      }else{
        cpResponse.put("P_RACE_WHITE_IND", "0");
      }
    }
    var cpHispFlag = cpRaceFlags.get("IsRaceHispanic");
    if(cpHispFlag){
      hisp = "" + cpHispFlag.getValue();
      if(hisp=="true"){
        cpResponse.put("P_RACE_HISP_IND", "1");
      }else{
        cpResponse.put("P_RACE_HISP_IND", "0");
      }
    }
    var cpBlackFlag = cpRaceFlags.get("IsRaceBlack");
    if(cpBlackFlag){
      black = "" + cpBlackFlag.getValue();
      if(black=="true"){
        cpResponse.put("P_RACE_BLACK_IND", "1");
      }else{
        cpResponse.put("P_RACE_BLACK_IND", "0");
      }
    }
    var cpAsianFlag = cpRaceFlags.get("IsRaceAsian");
    if(cpAsianFlag){
      asian = "" + cpAsianFlag.getValue();
      if(asian=="true"){
        cpResponse.put("P_RACE_ASIAN_IND", "1");
      }else{
        cpResponse.put("P_RACE_ASIAN_IND", "0");
      }
    }
    var cpAianFlag = cpRaceFlags.get("IsRaceAIAN");
    if(cpAianFlag){
      aian = "" + cpAianFlag.getValue();
      if(aian=="true"){
        cpResponse.put("P_RACE_AIAN_IND", "1");
      }else{
        cpResponse.put("P_RACE_AIAN_IND", "0");
      }
    }
    var cpMenaFlag = cpRaceFlags.get("IsRaceMENA");
    if(cpMenaFlag){
      mena = "" + cpMenaFlag.getValue();
      if(mena=="true"){
        cpResponse.put("P_RACE_MENA_IND", "1");
      }else{
        cpResponse.put("P_RACE_MENA_IND", "0");
      }
    }
    var cpNhpiFlag = cpRaceFlags.get("IsRaceNHPI");
    if(cpNhpiFlag){
      nhpi = "" + cpNhpiFlag.getValue();
      if(nhpi=="true"){
        cpResponse.put("P_RACE_NHPI_IND", "1");
      }else{
        cpResponse.put("P_RACE_NHPI_IND", "0");
      }
    }
    var cpSorFlag = cpRaceFlags.get("IsRaceOther");
    if(cpSorFlag){
      sor = "" + cpSorFlag.getValue();
      if(sor=="true"){
        cpResponse.put("P_RACE_SOR_IND", "1");
      }else{
        cpResponse.put("P_RACE_SOR_IND", "0");
      }
    }
	
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	var dkRefSelected = false;
	if(isDKRefVisible){
		if(dkRefProp) {
			var dkRefPropValue = dkRefProp.getValue();
		}
		else {
			var dkRefPropValue = "";
		}
		if(dkRefPropValue == "D") {
			cpResponse.put("P_RACE_DK_IND", "1");
			cpResponse.put("P_RACE_REF_IND", "0");
			dkRefSelected = true;
		}
		else if(dkRefPropValue == "R") {
			cpResponse.put("P_RACE_DK_IND", "0");
			cpResponse.put("P_RACE_REF_IND", "1");
			dkRefSelected = true;
		}
	}

    /*Check if any values were chosen and set isRaceAnswered flag appropriately*/
    if(white=="true"|| hisp=="true" || black=="true" || asian=="true" || aian=="true" || mena=="true" || nhpi=="true" || sor=="true"){
      cpQuestFlags.put("IsRaceAnswered", "true");
    }

    /*Required Validation*/
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible){
		ENUMCB.Required("pyWorkPage.QuestFlags.IsRaceAnswered", "pyWorkPage.HouseholdMemberTemp.DKRefused.Race");
	}else{
		ENUMCB.Required("pyWorkPage.QuestFlags.IsRaceAnswered");
	}
	
	ENUMCB.setReviewRacePage("RaceEthnicity");
	if(dkRefSelected == true){
		var params = {isFirstTimeProp: "IsFirstTimeRace"};
		ENUMCB.updateMemberIndexPost(params);
	}

  }else{
    console.log("ENUMCB Error - " + "Unable to find the Response, QuestFlags, and/or Roster Pages");  
  }
}



/*
*	PRE Action for RosterEdit_QSTN
*	Created by: Aansh Kapadia
*/
function EnumCB_RosterEdit_PRE() {
  if (pega.mobile.isHybrid){
    CB.toggleFlag("ExitSurveyEnabled", "true");
    var currHouseholdMemberIndex = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.CurrentHHMemberIndex");
    if (currHouseholdMemberIndex){
      CB.getMemberFromRoster(parseInt(currHouseholdMemberIndex.getValue()));
    }
  }
}

/*
*	POST Action for RosterEdit_QSTN
*	Created by: Aansh Kapadia
*/
function EnumCB_RosterEdit_POST() {
  if (pega.mobile.isHybrid){
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    ENUMCB.RosterName_VLDN();
    if (!workPage.hasMessages()){
      var currHouseholdMemberIndex = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.CurrentHHMemberIndex");
      CB.setMemberInRoster(parseInt(currHouseholdMemberIndex.getValue()), false);
    }
  }
}

/*
* Pre Function for Review
* Created by Dillon Irish
*/
function EnumCB_Review_PRE() {
  if(pega.mobile.isHybrid) {
    CB.toggleFlag("ExitSurveyEnabled", "true");

    /* Reset flag used to tell if screen has been answered */
    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var dpRelationshipOptions = pega.ui.ClientCache.find("D_RelationshipOptions.pxResults").iterator();

    if (questFlagsPage && cpResponse) {
      var isReviewAnswered = questFlagsPage.get("IsReviewAnswered");
      if (isReviewAnswered) {
        isReviewAnswered.setValue("");
      }

      /* Update HouseholdMemberTemp with current roster member */
      var isGoingBack = questFlagsPage.get("IsGoingBack").getValue();
      var workPage = pega.ui.ClientCache.find("pyWorkPage");
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var currentHHIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
      var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
      if (isGoingBack+"" == "true") {        
        if (previousQuestion == "Review_QSTN") {
          currentHHIndex = currentHHIndex -1;
          cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
        } else if (previousQuestion == "BestTime_QSTN") {
          currentHHIndex = cpHouseholdRoster.get("HouseholdMember").size();
          cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
        }
        else
        {
           return;
        }
      }
      var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
      if (currentHHIndex > rosterSize || previousQuestion == "WhoLivesElsewhere_QSTN" || previousQuestion == "WhyLiveElsewhere_QSTN") {
        questFlagsPage.put("IsFirstTimeReview","true");
      } 
      var isFirstTimeReview = questFlagsPage.get("IsFirstTimeReview").getValue();
      if (isFirstTimeReview+"" == "true") {
        currentHHIndex = 1;
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      }
      CB.getMemberFromRoster(currentHHIndex);


      /* Set AgeLessThanOne flag*/
      var age = cpHouseholdMemberTemp.get("Age");
      if (age) {
        age = age.getValue();
        if (age == "D" || age == "Don't Know") {
          questFlagsPage.put("AgeLessThanOne", "false");
          cpHouseholdMemberTemp.put("ReviewAge","Don't Know");
          cpHouseholdMemberTemp.put("IsBornAfterCensus","false");
        } else if (age == "R" || age == "Refused") {
          questFlagsPage.put("AgeLessThanOne", "false");
          cpHouseholdMemberTemp.put("ReviewAge","Refused");
          cpHouseholdMemberTemp.put("IsBornAfterCensus","false");
        } else {
          age = parseInt(age);
          if (age == -1) {
            cpHouseholdMemberTemp.put("IsBornAfterCensus","true");
          } else if(age < 1){
            questFlagsPage.put("AgeLessThanOne", "true");
            cpHouseholdMemberTemp.put("IsBornAfterCensus","false");
          }else{
            questFlagsPage.put("AgeLessThanOne", "false");
            cpHouseholdMemberTemp.put("IsBornAfterCensus","false");
          }
          cpHouseholdMemberTemp.put("ReviewAge",age);
        }
      }

      /*
			var cpRelationshipCode = (cpResponse.get("P_REL_CODE"));
			if (cpRelationshipCode){
				var relationshipCode = parseInt(cpResponse.get("P_REL_CODE").getValue());
				while(dpRelationshipOptions.hasNext()){
					var currentPage = dpRelationshipOptions.next();
					if(parseInt(currentPage.get("pyValue").getValue())==relationshipCode){
						cpHouseholdMemberTemp.put("Relationship", currentPage.get("pyDescription").getValue());
					}	
				}
            } 
            */
      ENUMCB.setRosterRelationshipText();
    }


    /* This is used to build out the concatenated Race String */
    var strRaceForDisplay = "";
    var ethnicityPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.ReviewRaceEthnicity");
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    if (cpHHMemberTemp && ethnicityPage && responsePage) {
      var isWhite = ethnicityPage.get("IsRaceWhite");			
      if (isWhite && (isWhite.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceWhite") + " ";
        var isGerman = ethnicityPage.get("IsEthnicityWhiteGerman");
        if (isGerman && (isGerman.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityGerman") + " ";
        }
        var isIrish = ethnicityPage.get("IsEthnicityWhiteIrish");
        if (isIrish && (isIrish.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityIrish") + " ";
        }
        var isEnglish = ethnicityPage.get("IsEthnicityWhiteEnglish");
        if (isEnglish && (isEnglish.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityEnglish") + " ";
        }
        var isItalian = ethnicityPage.get("IsEthnicityWhiteItalian");
        if (isItalian && (isItalian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "Ethnicity Italian") + " ";
        }
        var isPolish = ethnicityPage.get("IsEthnicityWhitePolish");
        if (isPolish && (isPolish.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityPolish") + " ";
        }
        var isFrench = ethnicityPage.get("IsEthnicityWhiteFrench");
        if (isFrench && (isFrench.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityFrench") + " ";
        }
        var isWhiteFillIn = ethnicityPage.get("IsEthnicityWhiteWriteIn");
        if (isWhiteFillIn && (isWhiteFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isWhiteFillIn.getValue() + " ";
        }
      }
      var isHispanic = ethnicityPage.get("IsRaceHispanic");
      if (isHispanic && (isHispanic.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceHispanic") + " ";
        var isMexican = ethnicityPage.get("IsEthnicityHispanicMexican");
        if (isMexican && (isMexican.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispMexican") + " ";
        }
        var isPuertoRican = ethnicityPage.get("IsEthnicityHispanicPuertoRican");
        if (isPuertoRican && (isPuertoRican.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispPuertoRican") + " ";
        }
        var isCuban = ethnicityPage.get("IsEthnicityHispanicCuban");
        if (isCuban && (isCuban.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispCuban") + " ";
        }
        var isSalvadoran = ethnicityPage.get("IsEthnicityHispanicSalvadoran");
        if (isSalvadoran && (isSalvadoran.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispSalvadoran") + " ";
        }
        var isDominican = ethnicityPage.get("IsEthnicityHispanicDominican");
        if (isDominican && (isDominican.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispDominican") + " ";
        }
        var isColombian = ethnicityPage.get("IsEthnicityHispanicColombian");
        if (isColombian && (isColombian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityHispColombian") + " ";
        }
        var isHispFillIn = ethnicityPage.get("IsEthnicityHispanicWriteIn");
        if (isHispFillIn && (isHispFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isHispFillIn.getValue() + " ";
        }
      }
      var isBlack = ethnicityPage.get("IsRaceBlack");
      if (isBlack && (isBlack.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceBlack") + " ";
        var isAfricanAmerican = ethnicityPage.get("IsEthnicityBlackAfricanAmerican");
        if (isAfricanAmerican && (isAfricanAmerican.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackAfricanAmerican") + " ";
        }
        var isJamaican = ethnicityPage.get("IsEthnicityBlackJamaican");
        if (isJamaican && (isJamaican.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackJamaican") + " ";
        }
        var isHaitian = ethnicityPage.get("IsEthnicityBlackHaitian");
        if (isHaitian && (isHaitian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackHaitian") + " ";
        }
        var isNigerian = ethnicityPage.get("IsEthnicityBlackNigerian");
        if (isNigerian && (isNigerian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackNigerian") + " ";
        }
        var isEthiopian = ethnicityPage.get("IsEthnicityBlackEthiopian");
        if (isEthiopian && (isEthiopian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackEthiopian") + " ";
        }
        var isSomali = ethnicityPage.get("IsEthnicityBlackSomali");
        if (isSomali && (isSomali.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityBlackSomali") + " ";
        }
        var isBlackFillIn = ethnicityPage.get("IsEthnicityBlackWriteIn");
        if (isBlackFillIn && isBlackFillIn.getValue() !== "") {
          strRaceForDisplay += " " + isBlackFillIn.getValue() + " ";
        }
      }
      var isAsian = ethnicityPage.get("IsRaceAsian");
      if (isAsian && isAsian.getValue() == true) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceAsian") + " ";
        var isChinese = ethnicityPage.get("IsEthnicityAsianChinese");
        if (isChinese && (isChinese.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianChinese") + " ";
        }
        var isFilipino = ethnicityPage.get("IsEthnicityAsianFilipino");
        if (isFilipino && (isFilipino.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianFilipino") + " ";
        }
        var isAsianIndian = ethnicityPage.get("IsEthnicityAsianAsianIndian");
        if (isAsianIndian && (isAsianIndian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianAsianIndian") + " ";
        }
        var isVietnamese = ethnicityPage.get("IsEthnicityAsianVietnamese");
        if (isVietnamese && (isVietnamese.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianViet") + " ";
        }
        var isKorean = ethnicityPage.get("IsEthnicityAsianKorean");
        if (isKorean && (isKorean.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianKorean") + " ";
        }
        var isJapanese = ethnicityPage.get("IsEthnicityAsianJapanese");
        if (isJapanese && (isJapanese.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityAsianJapanese") + " ";
        }
        var isAsianFillIn = ethnicityPage.get("IsEthnicityAsianWriteIn");
        if (isAsianFillIn && (isAsianFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isAsianFillIn.getValue() + " ";
        }
      }
      var isAIAN = ethnicityPage.get("IsRaceAIAN");
      if (isAIAN && (isAIAN.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceAIAN") + " ";
        var isAIANFillIn = ethnicityPage.get("IsEthnicityAIANWriteIn");
        if (isAIANFillIn && (isAIANFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isAIANFillIn.getValue() + " ";
        }
      }
      var isMENA = ethnicityPage.get("IsRaceMENA");
      if (isMENA && (isMENA.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceMENA") + " ";
        var isLebanese = ethnicityPage.get("IsEthnicityMENALebanese");
        if (isLebanese && (isLebanese.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENALebanese") + " ";
        }
        var isIranian = ethnicityPage.get("IsEthnicityMENAIranian");
        if (isIranian && (isIranian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENAIranian") + " ";
        }
        var isEgyptian = ethnicityPage.get("IsEthnicityMENAEgyptian");
        if (isEgyptian && (isEgyptian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENAEgyptian") + " ";
        }
        var isSyrian = ethnicityPage.get("IsEthnicityMENASyrian");
        if (isSyrian && (isSyrian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENASyrian") + " ";
        }
        var isMoroccan = ethnicityPage.get("IsEthnicityMENAMoroccan");
        if (isMoroccan && (isMoroccan.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENAMoroccan") + " ";
        }
        var isIsraeli = ethnicityPage.get("IsEthnicityMENAIsraeli");
        if (isIsraeli && (isIsraeli.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityMENAIsraeli") + " ";
        }
        var isMENAFillIn = ethnicityPage.get("IsEthnicityMENAWriteIn");
        if (isMENAFillIn && (isMENAFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isMENAFillIn.getValue() + " ";
        }
      }
      var isNHPI = ethnicityPage.get("IsRaceNHPI");
      if (isNHPI && (isNHPI.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceNHPI") + " ";
        var isNativeHawaiian = ethnicityPage.get("IsEthnicityNHPINativeHawaiian");
        if (isNativeHawaiian && (isNativeHawaiian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPINativeHawaiian") + " ";
        }
        var isSamoan = ethnicityPage.get("IsEthnicityNHPISamoan");
        if (isSamoan && (isSamoan.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPISamoan") + " ";
        }
        var isChamorro = ethnicityPage.get("IsEthnicityNHPIChamorro");
        if (isChamorro && (isChamorro.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPIChamorro") + " ";
        }
        var isTongan = ethnicityPage.get("IsEthnicityNHPITongan");
        if (isTongan && (isTongan.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPITongan") + " ";
        }
        var isFijian = ethnicityPage.get("IsEthnicityNHPIFijian");
        if (isFijian && (isFijian.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPIFijian") + " ";
        }
        var isMarshallese = ethnicityPage.get("IsEthnicityNHPIMarshallese");
        if (isMarshallese && (isMarshallese.getValue() == true)) {
          strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "EthnicityNHPIMarshallese") + " ";
        }
        var isNHPIFillIn = ethnicityPage.get("IsEthnicityNHPIWriteIn");
        if (isNHPIFillIn && (isNHPIFillIn.getValue() !== "")) {
          strRaceForDisplay += " " + isNHPIFillIn.getValue() + " ";
        }
      }
      var isOther = ethnicityPage.get("IsRaceOther");
      if (isOther && (isOther.getValue() == true)) {
        strRaceForDisplay += " " + CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RaceOther") + " ";
        var isOtherFillIn = ethnicityPage.get("IsEthnicityOtherWriteIn");
        if (isOtherFillIn && isOtherFillIn.getValue() !== "") {
          strRaceForDisplay += " " + isOtherFillIn.getValue() + " ";
        }
      }
      if (strRaceForDisplay == "") {
        var dkRefused = cpHouseholdMemberTemp.get("DKRefused");
        var revRaceDKR = dkRefused.get("RevRace");
        var raceDKR = dkRefused.get("Race");
        if (revRaceDKR && (revRaceDKR.getValue() == "D" || revRaceDKR.getValue() == "R")) {
          if (revRaceDKR.getValue() == "D") {
            strRaceForDisplay = "Don't Know";
          } else if (revRaceDKR.getValue() == "R") {
            strRaceForDisplay = "Refused";
          }
        } else if (raceDKR && (raceDKR.getValue() == "D" || raceDKR.getValue() == "R")) {
          if (raceDKR.getValue() == "D") {
            strRaceForDisplay = "Don't Know";
          } else if (raceDKR.getValue() == "R") {
            strRaceForDisplay = "Refused";
          }
        }
      }
      strRaceForDisplay = strRaceForDisplay.replace(/  /g, ', ');
      cpHHMemberTemp.put("RaceConcatenatedStringForDisplay",strRaceForDisplay);
    }
    /*EnumCB_updateDOBValues();*/
    /*DK Ref*/
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("Review");
    ENUMCB.clearReviewCheckboxes();
  }
}

/*
*	Created by: Omar Mohammed, Kyle Grave
*	Function sets the most up to date date of birth property to DOBMonth, Day, Year to keep 
*	Rev screen updated
*/
function EnumCB_updateDOBValues() {
  var birthMonth = "";
  var birthDay = "";
  var birthYear = "";
  var response = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  /*Handle Month*/
  birthMonth = EnumCB_chooseCorrectDateProp("P_BIRTH_MONTH_INT", "P_BIRTH_MONTH_RV_INT", "P_BIRTH_MONTH_CH_INT");
  /*Handle Day*/
  birthDay = EnumCB_chooseCorrectDateProp("P_BIRTH_DAY_INT", "P_BIRTH_DAY_RV_INT", "P_BIRTH_DAY_CH_INT");
  /*Handle Year*/
  birthYear = EnumCB_chooseCorrectDateProp("P_BIRTH_YEAR_INT", "P_BIRTH_YEAR_RV_INT", "P_BIRTH_YEAR_CH_INT");
  /*put birthMonth, birthDay, birthYear in proper props*/
  var updateValuePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  updateValuePage.put("DOBMonth",birthMonth);
  updateValuePage.put("DOBDay",birthDay);
  updateValuePage.put("DOBYear",birthYear);
} 

/*
*	Created by: Omar Mohammed, Kyle Grave
*	Priority order: Review DOB, Change DOB, Original DOB
*/
function EnumCB_chooseCorrectDateProp(origProp, rvProp, chProp) {
  var birthProp = "";
  var response = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var origDOBProp = response.get(origProp);
  origDOBProp = origDOBProp ? parseInt(origDOBProp.getValue(),10) : ""; 
  var revBirthProp = response.get(rvProp);
  revBirthProp = revBirthProp ? parseInt(revBirthProp.getValue(),10) : "";
  var chBirthProp = response.get(chProp);
  chBirthProp = chBirthProp ? parseInt(chBirthProp.getValue(),10) : "";

  if(origDOBProp != "") {
    birthProp = origDOBProp;
  }

  if(chBirthProp != "") {
    birthProp = chBirthProp;
  }

  if(revBirthProp != "") {    
    birthProp = revBirthProp;
  }
  return birthProp;
}

/*
* Post Function for Review
* Created by Aansh Kapadia
*/
function EnumCB_Review_POST() {
  /*Retrieve ReviewFlags, Questflags, and Response*/
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpReviewFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
  var cpRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
 
 
  var responseTMP = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var respLocANSR = responseTMP.get("RESPONSE_LOCATION_CODE");
 
  
  if(cpResponse && cpQuestFlags && cpReviewFlags && cpRoster){

    /*Set is IsFirstTimeReview to false*/
    var cpFirstTimeReview = cpReviewFlags.get("IsFirstTimeReview");
    if(cpFirstTimeReview){
      cpFirstTimeReview.setValue("false");
    }

    /*Retrieve properties and check if null*/
    var reviewRelationship, reviewSex, reviewDOB, reviewAge, reviewAgeBornAfter, reviewAgeLessThanOneYear, reviewRace, reviewNoChanges = "";

    var cpReviewRelationshipFlag = cpReviewFlags.get("ReviewRelationship");
    if(cpReviewRelationshipFlag){
      reviewRelationship = "" + cpReviewRelationshipFlag.getValue();
    }      
    var cpReviewSexFlag = cpReviewFlags.get("ReviewSex");
    if(cpReviewSexFlag){
      reviewSex = "" + cpReviewSexFlag.getValue();
    }      
    var cpReviewDOBFlag = cpReviewFlags.get("ReviewDoB");
    if(cpReviewDOBFlag){
      reviewDOB = "" + cpReviewDOBFlag.getValue();
    }
    var cpReviewAgeFlag = cpReviewFlags.get("ReviewAge");
    if(cpReviewAgeFlag){
      reviewAge = "" + cpReviewAgeFlag.getValue();
    }
    var cpReviewAgeBornAfterFlag = cpReviewFlags.get("ReviewAgeBornAfter");
    if(cpReviewAgeBornAfterFlag){
      reviewAgeBornAfter = "" + cpReviewAgeBornAfterFlag.getValue();
    }
    var cpReviewAgeLessThanOneYearFlag = cpReviewFlags.get("ReviewAgeLessThanOneYear");
    if(cpReviewAgeLessThanOneYearFlag){
      reviewAgeLessThanOneYear = "" + cpReviewAgeLessThanOneYearFlag.getValue();
    }
    var cpReviewRaceFlag = cpReviewFlags.get("ReviewRace");
    if(cpReviewRaceFlag){
      reviewRace = "" + cpReviewRaceFlag.getValue();
    }
    var cpReviewNoChangesFlag = cpReviewFlags.get("ReviewNoChanges");
    if(cpReviewNoChangesFlag){
      reviewNoChanges = "" + cpReviewNoChangesFlag.getValue();
    }

    /*Check if any values were chosen and set isRaceAnswered flag appropriately*/
    if(reviewRelationship=="true"|| reviewSex=="true" || reviewDOB=="true" || reviewAge=="true" || reviewAgeBornAfter=="true" || reviewAgeLessThanOneYear=="true" || reviewRace=="true" || reviewNoChanges=="true"){
      cpQuestFlags.put("IsReviewAnswered", "true");
    }

    /*Required Validation*/
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if(isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.QuestFlags.IsReviewAnswered", "pyWorkPage.HouseholdMemberTemp.DKRefused.Review");
    } else {
      ENUMCB.Required("pyWorkPage.QuestFlags.IsReviewAnswered");
    }

    var checkDKRefAvail = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused.Review");
    if (!checkDKRefAvail){
      checkDKRefAvail = "";
    } 
    else {
      checkDKRefAvail = checkDKRefAvail.getValue();
    }

   
   
    
    if(reviewNoChanges=="true" || checkDKRefAvail == "R"){
      var params = {isFirstTimeProp: "IsFirstTimeReview"};
      ENUMCB.updateMemberIndexPost(params);
      cpQuestFlags.put("NextSurveyQuestion", "BestTime_QSTN");
    } 
	 
    if(respLocANSR){ 
      if(reviewNoChanges=="true" &&  respLocANSR.getValue() == "2"){
        cpQuestFlags.put("NextSurveyQuestion", "ProxyName_QSTN");
      }
    }

  }else{
    console.log("ENUMCB Error - " + "Unable to find the Response and/or Roster Pages");  
  }
}

/**
*	Pre action for RevSex_QSTN
*	Created by: Aansh Kapadia
**/
function EnumCB_RevSex_PRE(){
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevSex");
  CB.toggleFlag("ExitSurveyEnabled","true");
}

/**
*	Post action for RevSex_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_RevSex_POST() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevSex", "pyWorkPage.HouseholdMemberTemp.DKRefused.RevSex");
  } 
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevSex");
  }
  var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  if(cpHouseholdMemberTemp && dkRefused && cpHouseholdRoster) {
    var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    var curSex = cpHouseholdMemberTemp.get("RevSex").getValue();
    var cpResponse = cpHouseholdMemberTemp.get("Response");
    var dkRefProp = dkRefused.get("RevSex");
    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
    if(dkRefProp == "D") {
      cpResponse.put("P_SEX_DK_IND", "1");
      cpResponse.put("P_SEX_REF_IND", "0");
      cpHouseholdMemberTemp.put("SexMaleFemale", "Don't Know");
    }
    else if(dkRefProp == "R") {
      cpResponse.put("P_SEX_DK_IND", "0");
      cpResponse.put("P_SEX_REF_IND", "1");
      cpHouseholdMemberTemp.put("SexMaleFemale", "Refused");
    }
    else {
      cpResponse.put("P_SEX_DK_IND", "0");
      cpResponse.put("P_SEX_REF_IND", "0");
    }
    if(curSex == "Male"){
      cpResponse.put("P_SEX_MALE_IND","1");
      cpResponse.put("P_SEX_FEMALE_IND","0");
      cpHouseholdMemberTemp.put("SexMaleFemale", "Male");
    }
    else if(curSex == "Female"){
      cpResponse.put("P_SEX_MALE_IND","0");
      cpResponse.put("P_SEX_FEMALE_IND","1");
      cpHouseholdMemberTemp.put("SexMaleFemale", "Female");
    }
    else{
      cpResponse.put("P_SEX_MALE_IND","0");
      cpResponse.put("P_SEX_FEMALE_IND","0");         
    }
    CB.setMemberInRoster(currentHHMemberIndex,false);
  }  
  else{
    console.log("***ENUMCB Error - " + "Unable to find QuestFlags page, HouseholdRoster.HouseholdMember pagelist, or HouseholdMemberTemp page in EnumCB_Sex_POST function");
  }  
}

/*
*	Pre Action for Interpreter_QSTN
*	Created by AXJ
*/
function EnumCB_Interpreter_PRE() {
  CB.toggleFlag("DKRFEnabled", "false"); 
  CB.toggleFlag("ExitSurveyEnabled","false");
}
/**
*	Post action for interpreter qstn
*	Created by Omar Mohammed/AXJ
**/
function EnumCB_Interpreter_POST() {
  try {
    var isRequired = ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_INTERPRETER_YES_IND");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var answer = respPage.get("NRFU_INTERPRETER_YES_IND").getValue();
    if (answer == "1") {
      respPage.put("NRFU_INTERPRETER_YES_IND", "1");
      respPage.put("NRFU_INTERPRETER_NO_IND", "0");  
    } else if (answer == "0") {
      respPage.put("NRFU_INTERPRETER_YES_IND", "0");
      respPage.put("NRFU_INTERPRETER_NO_IND", "1");
    } else {
      /** user did not enter anything **/
    }
  } catch (e) {
    console.log("ENUMCB Error - EnumCB_Interpreter_POST:" + e.message);
  }
}

/*
*	Pre Processing for RosterReview_QSTN
*	Created by: Aansh Kapadia
*/
function EnumCB_RosterReview_PRE() {

  var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var cpDKRefRevRelationshipResp = cpDKRefused.get("RevRelationshipResp");
  if( cpDKRefRevRelationshipResp )
  {
    cpDKRefRevRelationshipResp = cpDKRefRevRelationshipResp.getValue();
    alert( "Coming to Review_PRE with cpDKRefRevRelationshipResp = " + cpDKRefRevRelationshipResp)
  }
  ENUMCB.updateDKRefVisibility("RosterReview");
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if (questFlags){
    var isEditingRosterFlag = questFlags.get("IsEditingRoster");
    var hasRosterChangesFlag = questFlags.get("HasRosterChanges");
    if (isEditingRosterFlag){
      isEditingRosterFlag.setValue("false");
    }
    if (hasRosterChangesFlag){
      hasRosterChangesFlag.setValue("");
    }
  }

}


/*
*	Post Processing for RosterReview_QSTN
*	Created by: Jack McCloskey
*/

function EnumCB_RosterReview_POST() {
  ENUMCB.RosterReview_VLDN();
}

/*
*	Pre processing activity used for WhoLivesElsewhere_QSTN
*	Created by: Kyle Gravel
*/
function EnumCB_WhoLivesElsewhere_PRE() {    
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var currRosterSize = parseInt(questFlags.get("CurrentRosterSize").getValue());
  var isElsewhereSelected = questFlags.get("IsElsewhereSelected");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  if(isElsewhereSelected) {
    isElsewhereSelected = isElsewhereSelected.getValue();
  }
  else {
    isElsewhereSelected = "";
  }
  if(currRosterSize > 1 && isElsewhereSelected == "true") {
    questFlags.put("IsElsewhereSelected","true");
  }
  else {
    questFlags.put("IsElsewhereSelected","false");
  }	
  var householdMemberSize = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember").size();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember").iterator();
  var listOfNames = "";
  var you = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "You");
  var or = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "Or");

  /* if the respondent exists in roster then the list of names should start with "YOU" regardless of the position of the respondent in roster*/
  var householdRosterIter1 = householdRoster; 
  while(householdRosterIter1.hasNext()) {    
    var curr = householdRosterIter1.next();
    var respondentFlag = curr.get("RespondantFlag");
    if(respondentFlag) {
      respondentFlag = respondentFlag.getValue();
    }
    else {
      respondentFlag = "";
    }    
    if(respondentFlag == "true") {
      listOfNames = you;
      break;
    } 
  }
  var index = 0;
  /*add all of the Non-Respondent names to the list*/
  while(householdRoster.hasNext()) {    
    var currentMemberPage = householdRoster.next();
    index = index + 1;
    var fullName = currentMemberPage.get("FullName").getValue();
    var respondentFlag = currentMemberPage.get("RespondantFlag");
    if(respondentFlag) {
      respondentFlag = respondentFlag.getValue();
    }
    else {
      respondentFlag = "";
    }

    if(respondentFlag == "true") {
      continue;
    }

    if(!householdRoster.hasNext() && householdMemberSize > 1) {
      listOfNames = listOfNames + " " + or + " " + fullName;
    }
    else if(householdMemberSize > 1 && respondentFlag != "true") {
      listOfNames = listOfNames + ", " + fullName;
    }
    else if(respondentFlag != "true") {
      listOfNames = listOfNames + fullName;
    }
  }
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var setNames = workPage.put("pyTempText", listOfNames);
}
/*
*	Post processing activity used for WhoLivesElsewhere_QSTN
*	Created by: Omar Mohammed
*/
function EnumCB_WhoLivesElsewhere_POST() {

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");  
  var WhyLiveElsewhereIndexList = questFlags.put("WhyLiveElsewhereIndexList",[]);
  var WhyLiveElsewhereSize = questFlags.get("WhyLiveElsewhereSize");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var householdRosterList = householdRoster.iterator();
  var currentIndex = 0;
  var numberSelected = 0;
  var listOfNames = "";
  while(householdRosterList.hasNext()) {
    currentIndex = currentIndex + 1;
    var currentMemberPage = householdRosterList.next();

    var isSelected = currentMemberPage.get("ElsewhereFlag");
    if(isSelected) {
      isSelected = isSelected.getValue();
    }
    else {
      isSelected = "";
    }
    if(isSelected == true) {
      numberSelected=numberSelected +1;		
      var addedPage = WhyLiveElsewhereIndexList.add();
      addedPage.put("pyTempInteger", currentIndex);
    }
  }
  WhyLiveElsewhereSize=numberSelected;
  questFlags.put("WhyLiveElsewhereSize",WhyLiveElsewhereSize); 


  ENUMCB.WhoLivesElsewhere_VLDN(numberSelected);
  /* alert("number selected " + counter); */
}

/* ***********************************************************
*  Generic Function to expand Help text for survey questions
*  Used When we need to expand help text dynamically 
*  Created by David Bourque
**************************************************************/
ENUMCB.expandHelpForQuestion = function() {
  var cpCurrentSurveyQuestion = pega.ui.ClientCache.find("pyWorkPage.CurrentSurveyQuestion");
  if (cpCurrentSurveyQuestion) {
    if (cpCurrentSurveyQuestion.getValue() == "Race_QSTN") {
      ENUMCB.expandHelpForRace();
    }
  }
}

/* ***********************************************************
*  Generic Function to expand Help text for survey questions
*  Used When we need to expand help text dynamically 
*  Created by David Bourque
**************************************************************/
ENUMCB.expandHelpForQuestion = function() {
  var cpCurrentSurveyQuestion = pega.ui.ClientCache.find("pyWorkPage.CurrentSurveyQuestion");
  if (cpCurrentSurveyQuestion) {
    if (cpCurrentSurveyQuestion.getValue() == "Race_QSTN") {
      ENUMCB.expandHelpForRace();
    }
  }
};

/* ***********************************************************
*  Helper function used to expand help text for Race screen
*  Created by David Bourque
**************************************************************/


ENUMCB.expandHelpForRace = function() {
  try {
    if (document.getElementById("IsRaceWhite").checked == true) {
      document.querySelectorAll('[data-tour-id="WhiteHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceHispanic").checked == true) {
      document.querySelectorAll('[data-tour-id="HispanicHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceBlack").checked == true) {
      document.querySelectorAll('[data-tour-id="BlackHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceAsian").checked == true) {
      document.querySelectorAll('[data-tour-id="AsianHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceAIAN").checked == true) {
      document.querySelectorAll('[data-tour-id="AIANHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceMENA").checked == true) {
      document.querySelectorAll('[data-tour-id="MENAHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceNHPI").checked == true) {
      document.querySelectorAll('[data-tour-id="NHPIHelpText"]')[1].firstChild.firstChild.click();
    }
    if (document.getElementById("IsRaceOther").checked == true) {
      document.querySelectorAll('[data-tour-id="OtherHelpText"]')[1].firstChild.firstChild.click();
    }
  } catch(e) {
    console.log("ENUMCB Error - " + "Unable to Locate Help Section in ENUMCB.expandHelpForRace"); 
  }
};



/*
*	Post Processing for RosterAdd_QSTN
*	Created by:  Ramin M
*/

function EnumCB_RosterAdd_PRE() {
  CB.toggleFlag("ExitSurveyEnabled", "true");
  if(CB.clearHouseholdMemberTemp())
  {
    return true;
  }

}



/*
*	Post Processing for RosterAdd_QSTN
*	Created by:  Ramin  M , Jack
*/
function EnumCB_RosterAdd_POST() {
  /* Call validation, if it passes enter post function */
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.RosterName_VLDN();
  if(!workPage.hasMessages())
  {
    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    /* if entering new roster member, move them into roster */
    var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");

    /* Create Roster Page */
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");   
    if(householdRoster)
    {
      var cpMemberList = householdRoster.get("HouseholdMember");
      var cpNewMemberPage = cpMemberList.add();
      cpNewMemberPage.adoptPage(householdMemberTemp);
    }
    /* Clear House Hold temp   - reCreate  */
    if(CB.clearHouseholdMemberTemp())
    {return true;
    }
  }

}



/** 
*	Call this function to get the value of the IsDKRefVisible prop
*	Created by Omar Mohammed
**/
ENUMCB.getIsDKRefVisible = function() {
  if (pega.mobile.isHybrid) {
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isDKRefVisible = questFlags.get("IsDKRefVisible");
    if(isDKRefVisible) {
      isDKRefVisible = isDKRefVisible.getValue();
    }
    else {
      isDKRefVisible = "";
    }
    return isDKRefVisible;
  } else {
    var isDKRefVisible = pega.u.d.getProperty('pyWorkPage.QuestFlags.IsDKRefVisible');
    if (isDKRefVisible === undefined) {
      isDKRefVisible = "";
    }
    return isDKRefVisible;
  }
}

/**
*	Call this function on the pre action of all questions
*	If the DKRef property was never populated, we need to hide the DKRef section
*   pageName param is optional. If not passed it will default to "pyWorkPage.HouseholdMemberTemp.DKRefused"
*	Created by Omar Mohammed
**/
ENUMCB.updateDKRefVisibility = function(prop, pageName) {
  pageName = (pageName) ? pageName : "pyWorkPage.HouseholdMemberTemp.DKRefused";
  var DKRefused = pega.ui.ClientCache.find(pageName);
  var introDKRef = DKRefused.get(prop);
  if(introDKRef) {
    introDKRef = introDKRef.getValue();
  }
  else {
    introDKRef = "";
  }
  if(introDKRef == "") {
    CB.toggleFlag("IsDKRefVisible", "false");
  }
  else {
    CB.toggleFlag("IsDKRefVisible", "true");
  }
}


/* 
*Created by Mike Hartel 11/28/2016
*programmatically add number of roster members that were specified on test harness
*called from Enumcb_Popcount_POST.
*/

function TEST_AddTestMembersToRoster(){

  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var householdMemberList = householdRoster.get("HouseholdMember");      

  var testHouseholdMemberList = workPage.get("TestHouseholdMemberList");
  var testHHMemberListIter = testHouseholdMemberList.iterator(); 
  var respPage= pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");  
  var popCount= respPage.get("H_SIZE_STATED_INT").getValue(); /*start index at popcount */
  var index=0 + parseInt(popCount, 10);

  while(testHHMemberListIter.hasNext()){
    index++;
    if(index>99){
      break;
    }
    else{
      var testMemberPage = testHHMemberListIter.next();
      householdMemberList.add().adoptJSON(testMemberPage.getJSON());
    }

  }

  testHouseholdMemberList= workPage.put("TestHouseholdMemberList",[]);
}

/*
*	ENUMCB.getSelectedHHMember
*	Created by:  Domenic Giancola
*	Used to update CurrentHHMemberIndex when triggering the Change Spelling action on Roster Review
*/
ENUMCB.getSelectedHHMember = function(e) {
  var baserefDiv = e.target.closest("#CT");
  if(baserefDiv){
    var strBaseref = baserefDiv.getAttribute("sec_baseref");
    if(strBaseref != ""){
      var results = [];
      var strToSplit = strBaseref.split('(');
      for (var i = 1; i < strToSplit.length; i++) {
        var strTemp = strToSplit[i].split(')')[0];
        results.push(strTemp);
      }
      var strCurIndex = results[results.length-1];
      var curIndex = parseInt(strCurIndex);
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var cpHHRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      if(cpQuestFlags || cpHHRoster){
        cpQuestFlags.put("IsEditingRoster",true);
        cpQuestFlags.put("HasRosterChanges","false");
        cpHHRoster.put("CurrentHHMemberIndex",curIndex);
        var nextButton = $("[data-test-id=EnumGoNext]")[0];
        if(nextButton){
          /* TODO: Replace timeout once event blocking JS has been located */
          window.setTimeout(function() {$("[data-test-id=EnumGoNext]")[0].click();},100);
          return false;
        }
      }
      else {
        console.log("***ENUMCB Error - Unable to find QuestFlags or HouseholdRoster pages in ENUMCB.getSelectedHHMember");
      }
    }
    else {
      console.log("***ENUMCB Error - Unable to find current baseref in ENUMCB.getSelectedHHMember");
    }
  }
  else {
    console.log("***ENUMCB Error - Unable to find CT div for baseref in ENUMCB.getSelectedHHMember");
  }
};

/*
*	Used by People_QSTN on Pre action
*	Created by: Domenic Giancola
*/
function EnumCB_People_PRE() {
  if(pega.mobile.isHybrid) {
    CB.toggleFlag("ExitSurveyEnabled", "true");
    var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpHHMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    if(cpWorkPage && cpQuestFlags && cpHHMemberList) {
      console.log("***ENUMCB Alert - EnumCB_People_PRE - All pages exist");
      var cpHasAdditionalPeople = cpQuestFlags.get("HasAdditionalPeople");
      var cpPeoplePreviousCounter = cpQuestFlags.get("PeoplePreviousCounter");
      var isFirstTimePeople = cpQuestFlags.get("IsFirstTimePeople").getValue();
      var cpIsFirstPersonInRoster = cpQuestFlags.get("IsFirstPersonInRoster");
      if(isFirstTimePeople == "true") {
        console.log("***ENUMCB Alert - EnumCB_People_PRE - Starting isFirstTimePeople logic");
        cpQuestFlags.put("PeopleStartingRosterIndex",cpHHMemberList.size());
        cpQuestFlags.put("PeopleCurrentScreenIndex", 1);
        cpQuestFlags.put("IsFirstTimePeople", "false");
        cpHasAdditionalPeople.setValue("true");
        CB.clearHouseholdMemberTemp();
        console.log("***ENUMCB Alert - EnumCB_People_PRE - Ending isFirstTimePeople logic");
      }

      console.log("***ENUMCB Alert - EnumCB_People_PRE - Setting current roster size");
      var curRosterSize = cpHHMemberList.size();
      cpQuestFlags.put("CurrentRosterSize",curRosterSize);
      if (curRosterSize > 1) {
        cpQuestFlags.put("IsRosterSizeGreaterThanOne", "true");
        console.log("***ENUMCB Alert - EnumCB_People_PRE - Set IsRosterSizeGreaterThanOne to true");
      }
      else {
        cpQuestFlags.put("IsRosterSizeGreaterThanOne", "false");
        console.log("***ENUMCB Alert - EnumCB_People_PRE - Set IsRosterSizeGreaterThanone to false");
      }

      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        console.log("***ENUMCB Alert - EnumCB_People_PRE - Starting isGoingBack logic");
        var peoplePreviousCounter = parseInt(cpPeoplePreviousCounter.getValue());
        peoplePreviousCounter++;
        var peopleCurrentScreenIndex = parseInt(cpQuestFlags.get("PeopleCurrentScreenIndex").getValue());
        peopleCurrentScreenIndex--;
        cpPeoplePreviousCounter.setValue(peoplePreviousCounter);
        cpQuestFlags.put("PeopleCurrentScreenIndex", peopleCurrentScreenIndex);
        cpHasAdditionalPeople.setValue("true");

        var lastSurveyQuestion = cpWorkPage.get("CurrentSurveyQuestion").getValue();
        if(lastSurveyQuestion != "People_QSTN") {
          if (lastSurveyQuestion == "NoComplete_QSTN") {
            cpHasAdditionalPeople.setValue("");
          } 
          else {
            cpHasAdditionalPeople.setValue("false");
          }
        }
        else {
          cpHasAdditionalPeople.setValue("true");
        } 
      }

      console.log("***ENUMCB Alert - EnumCB_People_PRE - At PeopleCurrentScreenIndex Logic");
      if(cpQuestFlags.get("PeopleCurrentScreenIndex").getValue() == 1){
        cpIsFirstPersonInRoster.setValue("true");
        CB.toggleFlag("DKRFEnabled","false");
      }
      else {
        cpIsFirstPersonInRoster.setValue("false");
      }

      if(cpIsFirstPersonInRoster.getValue() == "false" && cpHasAdditionalPeople.getValue() == "true" && parseInt(cpPeoplePreviousCounter.getValue()) <= 0){
        cpHasAdditionalPeople.setValue("");
      }

      if(parseInt(cpPeoplePreviousCounter.getValue()) > 0){
        var cpIsNotEnoughPeople = cpQuestFlags.get("IsNotEnoughPeople");
        if (cpIsNotEnoughPeople.getValue() == "true") {
          cpIsNotEnoughPeople.setValue("false");
        }
        cpQuestFlags.put("IsPeoplePreviousFlag","true");
        var currentRosterIndex = parseInt(cpQuestFlags.get("PeopleStartingRosterIndex").getValue()) + parseInt(cpQuestFlags.get("PeopleCurrentScreenIndex").getValue());
        cpQuestFlags.put("CurrentRosterIndex",currentRosterIndex);
        var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 
        if (cpHHMemberTemp){
          if (currentRosterIndex <= parseInt(cpQuestFlags.get("CurrentRosterSize").getValue())) {
            cpHHMemberTemp.adoptPage(cpHHMemberList.get(currentRosterIndex));
          }
          else {
            var isDKForPeople = cpQuestFlags.get("IsDKForPeople").getValue();
            var isRefusedForPeople = cpQuestFlags.get("IsRefusedForPeople").getValue();
            if(isDKForPeople == "true") {
              cpHasAdditionalPeople.setValue("");
              var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
              if (cpDKRefused) {
                cpDKRefused.put("People","D");
                CB.toggleFlag("IsDKRefVisible", "true");
              }
            } else if(isRefusedForPeople == "true") {
              cpHasAdditionalPeople.setValue("");
              var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
              if (cpDKRefused) {
                cpDKRefused.put("People","R");
                CB.toggleFlag("IsDKRefVisible", "true");
              }
            }
            else {
              cpHasAdditionalPeople.setValue("false");
            }       
          }
        }
      }
      else {
        cpQuestFlags.put("IsPeoplePreviousFlag","false");
      }

      var nrfuAttemptTypeCode = "";
      var respTypeCode = "";
      var cpnrfuAttemptTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_ATTEMPT_TYPE_CODE").getValue();
      var cprespTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.RESP_TYPE_CODE").getValue();
      if(cpnrfuAttemptTypeCode && cprespTypeCode){
        nrfuAttemptTypeCode = cpnrfuAttemptTypeCode;
        respTypeCode = cprespTypeCode;
      }

      if (nrfuAttemptTypeCode == "PV" && (respTypeCode == "HH" || respTypeCode == "PROXY")){
        cpQuestFlags.put("IsPersonalVisit","true");
      }
      else if((nrfuAttemptTypeCode == "TA" || nrfuAttemptTypeCode == "TB" || nrfuAttemptTypeCode == "TC") && (respTypeCode == "HH" || respTypeCode == "PROXY")){
        cpQuestFlags.put("IsPersonalVisit","false");
      }

      if(cpQuestFlags.get("IsBranchMaxRoster").getValue() == "true" || cpQuestFlags.get("IsNotEnoughPeople").getValue() == "true"){
        cpQuestFlags.put("HasAdditionalPeople","false");
      }
    }
    else {
      console.log("***ENUMCB Error - Unable to find current pyWorkPage, QuestFlags, or Roster in EnumCB_People_PRE");
    }

    ENUMCB.updateDKRefVisibility("People");
  }
}

/*
*	Used by People_QSTN on Post action
*	Created by: Domenic Giancola
*/
function EnumCB_People_POST() {
  if(pega.mobile.isHybrid) {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    ENUMCB.People_VLDN();
    if(!workPage.hasMessages()){
      var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var cpHHMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
      var cpRespondent = pega.ui.ClientCache.find("pyWorkPage.Respondent");
      if(cpWorkPage && cpQuestFlags && cpHHMemberList) {
        var cpHasAdditionalPeople = cpQuestFlags.get("HasAdditionalPeople");
        var cpCurrentRosterSize = cpQuestFlags.get("CurrentRosterSize");
        var cpIsBranchMaxRoster = cpQuestFlags.get("IsBranchMaxRoster");
        var cpIsNotEnoughPeople = cpQuestFlags.get("IsNotEnoughPeople");
        var cpPeoplePreviousCounter = cpQuestFlags.get("PeoplePreviousCounter");

        if(cpHasAdditionalPeople.getValue() == "true"){
          if(parseInt(cpPeoplePreviousCounter.getValue()) <= 0){
            var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 
            if (cpHHMemberTemp){
              var cpNewMemberPage = cpHHMemberList.add();
              cpNewMemberPage.adoptPage(cpHHMemberTemp);
            }
          }
          else {
            var peoplePreviousCounter = parseInt(cpPeoplePreviousCounter.getValue());
            peoplePreviousCounter--;
            cpPeoplePreviousCounter.setValue(peoplePreviousCounter);
          }
          CB.clearHouseholdMemberTemp();
        }
        var peopleCurrentScreenIndex = parseInt(cpQuestFlags.get("PeopleCurrentScreenIndex").getValue());
        peopleCurrentScreenIndex++;
        cpQuestFlags.put("PeopleCurrentScreenIndex",peopleCurrentScreenIndex);
        var currentRosterSize = cpHHMemberList.size();
        cpQuestFlags.put("CurrentRosterSize",currentRosterSize);
        if(cpIsBranchMaxRoster.getValue()=="true"){
          cpHasAdditionalPeople.setValue("false");
          cpQuestFlags.put("PeopleCurrentScreenIndex",peopleCurrentScreenIndex--);
        }
        else if(currentRosterSize >= 99){
          cpIsBranchMaxRoster.setValue("true");
          cpHasAdditionalPeople.setValue("true");
        }
        var dkRefuedPeople = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused.People");
        if (dkRefuedPeople) {
          if (dkRefuedPeople.getValue() == "D") {
            cpQuestFlags.put("IsDKForPeople","true");
          }
          else if (dkRefuedPeople.getValue() == "R") {
            cpQuestFlags.put("IsRefusedForPeople","true");
          }
        }
        ENUMCB.updateDisabledDKRefColor();
      }
      else {
        console.log("***ENUMCB Error - Unable to find current pyWorkPage, QuestFlags, Roster, or Respondent in EnumCB_People_POST");
      }
    }
  }
}

/*************************************************************************
*	Created by: Kyle Gravel
*	Function is responsible for clearing the owner names on Owner_QSTN
*
**************************************************************************/
ENUMCB.clearCheckboxList = function(propertyValue, checkboxClass) {
  try{ 
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    /*var isNoOwnerRenterSelected = householdRoster.get("IsNoOwnerRenterSelected");*/
    if(propertyValue == "true" || propertyValue == "D" || propertyValue == "R") {
      /*var doc = $(document.body);*/
      $(checkboxClass + ' input:checkbox').each(function(i) {
        var ID = $(this).attr('id');
        CB.fillCheckbox(ID,"false");                                 
      });
    }
  }
  catch(e) {
    alert(e.message);
  }
}

/* Created by: Aditi Ashok
* Function to check all days for BestTime if Anytime is selected
*/
ENUMCB.BestTime_anytimeSelected = function(allDaysAndTimes, propertyValue) {
  if (propertyValue == "true") {
    CB.fillCheckboxes(allDaysAndTimes, "true");
  } else {
    CB.fillCheckboxes(allDaysAndTimes, "false");
  }
}
/***
*	dkRefProp param should contain path of property on DKRefused page
*	dkResponseProp param should contain the path of the DK Response Prop - .Response.RESP_PH_DK_IND
*	refResponseProp param should contain the path of the Ref Response Prop - .Response.RESP_PH_REF_IND
*	Created by Omar Mohammed
**/
ENUMCB.setDKRefResponse = function(dkRefProp, dkResponseProp, refResponseProp) {
  var dkRefVal = pega.ui.ClientCache.find(dkRefProp);
  var dkResponsePropPage = dkResponseProp.substring(0, dkResponseProp.lastIndexOf("."));
  var dkResponsePropName = dkResponseProp.substring(dkResponseProp.lastIndexOf(".") + 1);
  var refResponsePropPage = refResponseProp.substring(0, refResponseProp.lastIndexOf("."));
  var refResponsePropName = refResponseProp.substring(refResponseProp.lastIndexOf(".") + 1);

  var dkResponsePage = pega.ui.ClientCache.find(dkResponsePropPage);
  var refResponsePage = pega.ui.ClientCache.find(refResponsePropPage);

  if(dkRefVal) {
    dkRefVal = dkRefVal.getValue();
  }
  else {
    dkRefVal = "";
  }
  if(dkRefVal == "D") {
    dkResponsePage.put(dkResponsePropName, "1");
    refResponsePage.put(refResponsePropName, "0");
  }
  else if(dkRefVal == "R") {
    dkResponsePage.put(dkResponsePropName, "0");
    refResponsePage.put(refResponsePropName, "1");
  }
}

/* 
* Called when a day is selected in BestTime to autofill corresponding values
* Created By: Aditi Ashok
*/

ENUMCB.BestTime_daySelected = function(propertyName, propertyValue) {
  var morning = propertyName + "Morning";
  var afternoon = propertyName + "Afternoon";
  var evening = propertyName + "Evening";

  if (propertyValue == "true") {
    CB.fillCheckbox(morning, "true");
    CB.fillCheckbox(afternoon, "true");
    CB.fillCheckbox(evening, "true");
  } else {
    CB.fillCheckbox(morning, "false");
    CB.fillCheckbox(afternoon, "false");
    CB.fillCheckbox(evening, "false");
  }
} 

/* 
* Called in BestTime to determine whether anytime is checked when 
* day is deselected
* Created By: Aditi Ashok
*/
ENUMCB.BestTime_anytimeCheck = function(dayValue, anyTimeValue) {
  if (dayValue == "false" && anyTimeValue == "true") {
    CB.fillCheckbox("IsAnytime", "false");
  }
}

/*
*	Created by: Kyle Gravel
*	Used by Owner_QSTN to set the value of P_IS_HU_OWNER_IND
*	Also calls validations
*/
function EnumCB_Owner_POST() {
  try{    
    var householdRosterPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var referencePersonPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
    var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
    var owner = dkRefPage.get("Owner");
    if(owner) {
      owner = owner.getValue();
    }
    else {
      owner = "";
    }
    var isNoOwnerRenterSelected = householdRosterPage.get("IsNoOwnerRenterSelected");
    if(isNoOwnerRenterSelected) {
      isNoOwnerRenterSelected = isNoOwnerRenterSelected.getValue();
    } 
    else {
      isNoOwnerRenterSelected = "";
    }
    var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent");
    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var householdMemberList = householdMember.iterator();
    var ownerRenterIndex = 0;
    var memberIndex = 0;
    while(householdMemberList.hasNext()) {
      memberIndex = memberIndex + 1;
      var currentPage = householdMemberList.next();
      var ownerFlag = currentPage.get("OwnerFlag");
      if(ownerFlag) {

        ownerFlag = ownerFlag.getValue();
        var respPage = currentPage.get("Response");
        if(ownerFlag == true) {

          respPage.put("P_IS_HU_OWNER_IND","1");
          ownerRenterIndex = ownerRenterIndex + 1;
          if(ownerRenterIndex == 1) {

            currentPage.put("ReferencePersonFlag",true);
            referencePersonPage.adoptJSON(currentPage.getJSON());

            var respondentFlag = currentPage.get("RespondantFlag");
            if(respondentFlag) {
              respondentFlag = respondentFlag.getValue();
              var referencePersonFlag = currentPage.get("ReferencePersonFlag").getValue();
              if(respondentFlag == "true" && referencePersonFlag == true) {
                respondentPage.put("ReferencePersonFlag",true);
              }
              if(respondentFlag == "false" && referencePersonFlag == true) {
                respondentPage.put("ReferencePersonFlag",false);
              }
            }
          }
          else {
            currentPage.put("ReferencePersonFlag",false);
            var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
            var firstMemberIndexForRelOther = questFlags.get("FirstMemberIndexForRelOther");
            if(!firstMemberIndexForRelOther) {
              questFlags.put("FirstMemberIndexForRelOther", memberIndex);
            }
          }
        }
        else{
          currentPage.put("ReferencePersonFlag",false);
          respPage.put("P_IS_HU_OWNER_IND","0");
          var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
          var firstMemberIndexForRelOther = questFlags.get("FirstMemberIndexForRelOther");
          if(!firstMemberIndexForRelOther) {
            questFlags.put("FirstMemberIndexForRelOther", memberIndex);
          }
        }
      } 
      var pageInRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember(" + memberIndex + ")");
      pageInRoster.adoptJSON(currentPage.getJSON());
    }

    if(isNoOwnerRenterSelected == true || owner == "R" || owner == "D") {

      var householdMemberOne = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember(1)");
      householdMemberOne.put("ReferencePersonFlag",true);
      referencePersonPage.adoptJSON(householdMemberOne.getJSON());
      var respNoneAbove = householdMemberOne.get("RespondantFlag");
      if(respNoneAbove) {
        respNoneAbove = respNoneAbove.getValue();
        if(respNoneAbove == "true") {
          respondentPage.put("ReferencePersonFlag", true);
        }
        else {
          respondentPage.put("ReferencePersonFlag", false);
        }
      }

    }

    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    ENUMCB.validateOwnerRenter(ownerRenterIndex, "Owner");
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.Owner", "pyWorkPage.HouseholdMemberTemp.Response.H_OWNER_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.H_OWNER_REF_IND");
    questFlags.put("IsDKRefVisible","false");
  }
  catch(e) {
    console.log(e.message);
  }
}

/*
*	Created by: Kyle Gravel
*	Used by Renter_QSTN. sets values of P_HU_RENTER_IND as well as triggers validations
*/
function EnumCB_Renter_POST() {
  try{    
    var householdRosterPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var referencePersonPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
    var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
    var renter = dkRefPage.get("Renter");
    if(renter) {
      renter = renter.getValue();
    }
    else {
      renter = "";
    }
    var isNoOwnerRenterSelected = householdRosterPage.get("IsNoOwnerRenterSelected");
    if(isNoOwnerRenterSelected) {
      isNoOwnerRenterSelected = isNoOwnerRenterSelected.getValue();
    } 
    else {
      isNoOwnerRenterSelected = "";
    }
    var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent");
    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var householdMemberList = householdMember.iterator();
    var ownerRenterIndex = 0;
    var memberIndex = 0;
    while(householdMemberList.hasNext()) {
      memberIndex = memberIndex + 1;
      var currentPage = householdMemberList.next();
      var renterFlag = currentPage.get("RenterFlag");
      if(renterFlag) {
        renterFlag = renterFlag.getValue();
        var respPage = currentPage.get(".Response");
        if(renterFlag == true) {
          respPage.put("P_IS_HU_RENTER_IND","1");
          ownerRenterIndex = ownerRenterIndex + 1;
          if(ownerRenterIndex == 1) {
            currentPage.put("ReferencePersonFlag",true);
            referencePersonPage.adoptJSON(currentPage.getJSON());
          }
          else {
            currentPage.put("ReferencePersonFlag",false);
            var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
            var firstMemberIndexForRelOther = questFlags.get("FirstMemberIndexForRelOther");
            if(!firstMemberIndexForRelOther) {
              questFlags.put("FirstMemberIndexForRelOther", memberIndex);
            }
          }
          var respondentFlag = currentPage.get("RespondantFlag");
          if(respondentFlag) {
            respondentFlag = respondentFlag.getValue();
            var referencePersonFlag = currentPage.get("ReferencePersonFlag").getValue();
            if(respondentFlag == "true" && referencePersonFlag == true) {
              respondentPage.put("ReferencePersonFlag",true);
            }
            if(respondentFlag == "false" && referencePersonFlag == true) {
              respondentPage.put("ReferencePersonFlag",false);
            }
          }
        }
        else{
          respPage.put("P_IS_HU_RENTER_IND","0");
          var firstMemberIndexForRelOther = questFlags.get("FirstMemberIndexForRelOther");
          if(!firstMemberIndexForRelOther) {
            questFlags.put("FirstMemberIndexForRelOther", memberIndex);
          }
          currentPage.put("ReferencePersonFlag",false);
        }
      }
    }
    if(isNoOwnerRenterSelected == true || renter == "R" || renter == "D") {
      var householdMemberOne = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember(1)");
      householdMemberOne.put("ReferencePersonFlag",true);
      referencePersonPage.adoptJSON(householdMemberOne.getJSON());
      var respNoneAbove = householdMemberOne.get("RespondantFlag");
      if(respNoneAbove) {
        respNoneAbove = respNoneAbove.getValue();
        if(respNoneAbove == "true") {
          respondentPage.put("ReferencePersonFlag", true);
        }
        else {
          respondentPage.put("ReferencePersonFlag", false);
        }
      }

    }
    ENUMCB.validateOwnerRenter(ownerRenterIndex, "Renter");
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.Renter", "pyWorkPage.HouseholdMemberTemp.Response.H_RENTER_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.H_RENTER_REF_IND");
    questFlags.put("IsDKRefVisible","false");
  }
  catch(e) {
    console.log(e.message);
  }
}




/*
*    EnumCB_IDInterpreter_PRE:  Load Options for the ID Interpreter with static options and all HouseholdRoster members  
*	Created by: Ramin M.
*	 
*/
function EnumCB_IDInterpreter_PRE() {
  if(pega.mobile.isHybrid) {
    CB.toggleFlag("ExitSurveyEnabled","false");
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var QuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var householdRosterIterator = householdRoster.iterator();

 

    var IDInterpreterDP = pega.ui.ClientCache.find("D_IDInterpreterOptions").put("pxResults",[]);  




    while(householdRosterIterator.hasNext()) {  


      ENUMCB.setHouseholdMembersFullName();


      var currentPage = householdRosterIterator.next(); 
      var fullName = currentPage.get("FullName").getValue();



      var IDInterpreterPage0 = pega.ui.ClientCache.createPage("IDInterpreterPage ");
      IDInterpreterPage0.put("pyValue", fullName);
      IDInterpreterPage0.put("pyDescription", fullName);
      IDInterpreterDP.add().adoptJSON(IDInterpreterPage0.getJSON());
    }

    var IDInterpreterPage1 = pega.ui.ClientCache.createPage("IDInterpreterPage ");
    IDInterpreterPage1.put("pyValue", "Another enumerator");
    IDInterpreterPage1.put("pyDescription", "Another enumerator");
    IDInterpreterDP.add().adoptJSON(IDInterpreterPage1.getJSON());


    var IDInterpreterPage2 = pega.ui.ClientCache.createPage("IDInterpreterPage");
    IDInterpreterPage2.put("pyValue", "Neighbor");
    IDInterpreterPage2.put("pyDescription", "Neighbor");
    IDInterpreterDP.add().adoptJSON(IDInterpreterPage2.getJSON());        


    var IDInterpreterPage3 = pega.ui.ClientCache.createPage("IDInterpreterPage");
    IDInterpreterPage3.put("pyValue", "Local community member");
    IDInterpreterPage3.put("pyDescription", "Local community member");
    IDInterpreterDP.add().adoptJSON(IDInterpreterPage3.getJSON());


    var IDInterpreterPage4 = pega.ui.ClientCache.createPage("IDInterpreterPage");
    IDInterpreterPage4.put("pyValue", "Other");
    IDInterpreterPage4.put("pyDescription", "Other");
    IDInterpreterDP.add().adoptJSON(IDInterpreterPage4.getJSON());


  }
}

function EnumCB_IDInterpreter_POST() {



  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  alert(" Quest Flags 1 Interpreter is Here"  );



  alert(" Quest Flags 2 Interpreter is Here"  );



  if (iDInterOption == "Other")
  {

    var otherName = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_INTRP_TYPE_OTHER_TEXT");

    alert(" Interpreter is Here 3"  + iDInterOption );

    if(ENUMCB.IDInterpreter_VLDN(otherName)){

      alert(" Interpreter is Here 4"  + iDInterOption );

      var otherName = workPage.get("pyWorkPage.Respondent.Response.NRFU_INTRP_TYPE_OTHER_TEXT".getValue());

      alert("2 iDInterOption = ******** " + iDInterOption);
      respondent.put("NRFU_INTRP_TYPE_OTHER_TEXT",otherName);

    }
  } 
  if(ENUMCB.IDInterpreter_VLDN(iDInterOption)){

    if (iDInterOption!= "Other"  && iDInterOption!= "Another enumenator" &&  iDInterOption != "Neighbor" && iDInterOption!= "Local community member")
    {
      var memName = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_INTRP_TYPE_HHMEM_NAME");

      respondent.put("NRFU_INTRP_TYPE_HHMEM_NAME", memName);

    } 
    if (iDInterOption !=  "Other" && iDInterOption == "Another enumenator" || iDInterOption == "Neighbor" || iDInterOption== "Local community member")
    {
      respondent.put("NRFU_INTRP_TYPE_HHMEM_NAME", iDInterOption);

    }

  }


}


/***********************************
*  Function to Delete Member on Roster From Roster Review Screen
*  Created By: David Bourque
*******************************/

ENUMCB.rosterReview_DeleteFromRoster = function() {
  console.log("***ENUMCB entering ENUMCB.rosterReview_DeleteFromRoster");
  var cpHHRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  if(cpHHRoster){
    var cpCurrMemberIndex = parseInt(cpHHRoster.get("CurrentHHMemberIndex").getValue());
    var cpHHMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    cpHHMemberList.remove(cpCurrMemberIndex);
  }
  else {
    console.log("***ENUMCB Error - Unable to find HouseholdRoster pages in ENUMCB.rosterReview_DeleteFromRoster");
  }
};

/*
*	ENUMCB.moveSelectedMembertoHHMemberTemp
*	Created by:  David Bourqe
*	Used to update CurrentHHMemberIndex and move to HouseholdMember Temp
*   when triggering the Remove Name action on Roster Review
*/
ENUMCB.moveSelectedMembertoHHMemberTemp = function(e) {
  var baserefDiv = e.target.closest("#RULE_KEY");
  if(baserefDiv){
    var strBaseref = baserefDiv.getAttribute("full_base_ref");
    if(strBaseref != ""){
      var results = [];
      var strToSplit = strBaseref.split('(');
      for (var i = 1; i < strToSplit.length; i++) {
        var strTemp = strToSplit[i].split(')')[0];
        results.push(strTemp);
      }
      var strCurIndex = results[results.length-1];
      var curIndex = parseInt(strCurIndex);
      var cpHHRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      if(cpHHRoster){
        cpHHRoster.put("CurrentHHMemberIndex",curIndex);
        CB.getMemberFromRoster(curIndex);
      }
      else {
        console.log("***ENUMCB Error - Unable to find QuestFlags or HouseholdRoster pages in ENUMCB.moveSelectedMembertoHHMemberTemp");
      }
    }
    else {
      console.log("***ENUMCB Error - Unable to find current baseref in ENUMCB.moveSelectedMembertoHHMemberTemp");
    }
  }
  else {
    console.log("***ENUMCB Error - Unable to find CT div for baseref in ENUMCB.moveSelectedMembertoHHMemberTemp");
  }
};

/*
*	ENUMCB.setHouseholdMembersFullName
*	Created by:  Mike Hartel
*	Used to set the FullName of every member on the household roster
*/

ENUMCB.setHouseholdMembersFullName = function(){
  var HHRoster  = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var HHMemberListIter = HHRoster.get("HouseholdMember").iterator();

  while(HHMemberListIter.hasNext()){       
    var currentPage = HHMemberListIter.next();
    var respPage = currentPage.get("Response");
    var firstName = respPage.get("P_FIRST_NAME").getValue();
    var middleName = respPage.get("P_MIDDLE_NAME").getValue();
    var lastName = respPage.get("P_LAST_NAME").getValue();
    var fullName = "";
    /* check for all combinations of name */
    if (firstName != "") {
      var fullName = firstName.trim() + " ";
    }
    if (middleName != "") {
      var fullName = fullName + middleName.trim() + " ";
    }
    if (lastName != "") {
      var fullName = fullName + lastName.trim() + " ";
    }
    var fullName = fullName.substring(0, fullName.length - 1);
    fullName = fullName.toUpperCase();
    currentPage.put("FullName", fullName);
  }
};

/*
*  ENUMCB.AreParentsYoungerThanChildren
*  Created by David Bourque
*  Used to check through Roster to see if any of the Reference Person parents are younger than the Refernce Person
*  of if any of the reference persons children are older than the reference person
*/

ENUMCB.AreParentsYoungerthanChildren = function() {
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpRespondent = pega.ui.ClientCache.find("pyWorkPage.Respondent");
  if (cpHouseholdRoster && cpQuestFlags && cpRespondent) {
    var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
    /* Check if at the end of roster */
    var hhIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
	if (hhIndex <= rosterSize) {
		return;
	}
    /* Loop through members to check if any of the reference persons children/parents are older/younger respectivley */
    cpQuestFlags.put("IsEnteringRelationshipCheck","false");
    for (var i = 1; i <= rosterSize; i++) { 
      var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+i+")");
      var isReferencePerson = currentRosterMember.get("ReferencePersonFlag");
      if (isReferencePerson && isReferencePerson.getValue()+"" == "true") {
        currentRosterMember.put("IsChildOlderThanReference","false");
        currentRosterMember.put("IsParentYoungerThanReference","false");
      } else {
        var cpRelationshipToReference =  currentRosterMember.get("Response.P_REL_CODE"); 
        if  (cpRelationshipToReference) {
          if (cpRelationshipToReference.getValue() == "D" || cpRelationshipToReference.getValue() == "R") {
            currentRosterMember.put("IsChildOlderThanReference","false");
            currentRosterMember.put("IsParentYoungerThanReference","false");
          } else {
            var relationshipToReference = parseInt(cpRelationshipToReference.getValue());
            /* If Parent to Reference Person */
            if  (relationshipToReference == 9 || relationshipToReference == 11) { 
              var cpAge = currentRosterMember.get("Age");
              if (cpAge) {
                if (cpAge.getValue() == "D" || cpAge.getValue() == "R") {
                  currentRosterMember.put("IsChildOlderThanReference","false");
                  currentRosterMember.put("IsParentYoungerThanReference","false");
                } else {
                  var cpReferenceAge = cpHouseholdRoster.get("ReferencePerson.Age");
                  if (cpReferenceAge) {
                    if (cpReferenceAge.getValue() == "D" || cpReferenceAge.getValue() == "R") {
                      cpQuestFlags.put("IsEnteringRelationshipCheck","false");
                      currentRosterMember.put("IsChildOlderThanReference","false");
                      currentRosterMember.put("IsParentYoungerThanReference","false");
                      return;
                    } else {
                      var age = parseInt(cpAge.getValue());
                      var referenceAge = parseInt(cpReferenceAge.getValue());
                      if (age < referenceAge) {
                        cpQuestFlags.put("IsEnteringRelationshipCheck","true");
                        currentRosterMember.put("IsParentYoungerThanReference","true");
                        currentRosterMember.put("IsChildOlderThanReference","false");
                      }
                    }
                  }
                }
              }
            } /* If child of Reference Person */
            else if  (relationshipToReference == 5 || relationshipToReference == 6 || relationshipToReference == 7 || relationshipToReference == 12 || relationshipToReference == 15) {
              var cpAge = currentRosterMember.get("Age");
              if (cpAge) {
                if (cpAge.getValue() == "D" || cpAge.getValue() == "R") {
                  currentRosterMember.put("IsChildOlderThanReference","false");
                  currentRosterMember.put("IsParentYoungerThanReference","false");
                } else {
                  var cpReferenceAge = cpHouseholdRoster.get("ReferencePerson.Age"); 
                  if (cpReferenceAge) {
                    if (cpReferenceAge.getValue() == "D" || cpReferenceAge.getValue() == "R") {
                      cpQuestFlags.put("IsEnteringRelationshipCheck","false");
                      currentRosterMember.put("IsChildOlderThanReference","false");
                      currentRosterMember.put("IsParentYoungerThanReference","false");
                      return;
                    } else {
                      var age = parseInt(cpAge.getValue());
                      var referenceAge = parseInt(cpReferenceAge.getValue());
                      if (age > referenceAge) {
                        cpQuestFlags.put("IsEnteringRelationshipCheck","true");
                        currentRosterMember.put("IsParentYoungerThanReference","false");
                        currentRosterMember.put("IsChildOlderThanReference","true");
                      }
                    }
                  }
                }
              }
            } else {
              currentRosterMember.put("IsChildOlderThanReference","false");
              currentRosterMember.put("IsParentYoungerThanReference","false");
            }
          }
        } else {
          currentRosterMember.put("IsChildOlderThanReference","false");
          currentRosterMember.put("IsParentYoungerThanReference","false");
        }
      }
    } 
  }
}

/**
* Pre Function for Relationship Check
* Created by: David Bourque
**/
function EnumCB_RelationshipCheck_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","true");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var cpRespondent = pega.ui.ClientCache.find("pyWorkPage.Respondent");
  if (cpQuestFlags && cpHouseholdRoster && cpHHMemberTemp && cpRespondent) {
    /* set IsInPersonOrTelephoneRespondent */
    ENUMCB.setRosterRelationshipText();
    var nrfuAttemptTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_ATTEMPT_TYPE_CODE").getValue();
    var respTypeCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.RESP_TYPE_CODE").getValue();
    if((nrfuAttemptTypeCode == "PV" || nrfuAttemptTypeCode == "TA" || nrfuAttemptTypeCode == "TB" || nrfuAttemptTypeCode == "TC") && respTypeCode == "HH"){
      cpQuestFlags.put("IsInPersonOrTelephoneRespondent","true");
    }
    else {
      cpQuestFlags.put("IsInPersonOrTelephoneRespondent","false");
    }

    /* set P_REFERENCE_PERSON_IND if not set */
    var cpReferencePersonInd = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.P_REFERENCE_PERSON_IND");
    if(!cpReferencePersonInd){
      var cpResponse = cpRespondent.get("Response");
      cpResponse.put("P_REFERENCE_PERSON_IND","0");
    }

    var cpCurrentHHMemberIndex = cpHouseholdRoster.get("CurrentHHMemberIndex");
    var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
    if (cpCurrentHHMemberIndex) {
      if (parseInt(cpCurrentHHMemberIndex.getValue()) > rosterSize) {
        cpQuestFlags.put("IsFirstTimeRelationshipCheck","true");
      } 
    }
    var isFirstTimeRelationshipCheck = cpQuestFlags.get("IsFirstTimeRelationshipCheck").getValue();
    if (isFirstTimeRelationshipCheck == "true") {
      var currentHHMemberIndex = 1;
      for (currentHHMemberIndex; currentHHMemberIndex <= rosterSize; currentHHMemberIndex++) {
        var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+currentHHMemberIndex+")");
        var cpIsParentYoungerThanReference = currentRosterMember.get("IsParentYoungerThanReference");
        var cpIsChildOlderThanReference = currentRosterMember.get("IsChildOlderThanReference");
        if(cpIsParentYoungerThanReference && cpIsChildOlderThanReference) {
          if(cpIsParentYoungerThanReference.getValue() == "true" || cpIsChildOlderThanReference.getValue() == "true") {
            cpHHMemberTemp.adoptJSON(currentRosterMember.getJSON());
            cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHMemberIndex);
            break;
          }
        }
      }
      cpQuestFlags.put("IsFirstTimeRelationshipCheck","false");
    }
    var isGoingBack = cpQuestFlags.get("IsGoingBack").getValue();
    if(cpQuestFlags.get("IsGoingForward").getValue() == "true"){
      cpQuestFlags.put("SkipDec", "false");
    }
    if(cpQuestFlags.get("SkipDec").getValue() == "false" && cpQuestFlags.get("IsGoingBack").getValue() == "true"){
      ENUMCB.getNextRelCheckPre();
    }else{
      cpQuestFlags.put("SkipDec", "false");
    }
    CB.toggleFlag("DKRFEnabled","true");
    ENUMCB.updateDKRefVisibility("RelationshipCheck");
  }
}

/*
* Post function for Relationship Check
* Created By: David Bourque
*/

function EnumCB_RelationshipCheck_POST() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.RelationshipCheck_VLDN();
  if (!workPage.hasMessages()) {
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    if (cpQuestFlags && cpHouseholdRoster && cpHHMemberTemp) {
      cpQuestFlags.put("SkipDec", "false");
      var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
      CB.setMemberInRoster(currentHHMemberIndex,false);
      var isRelationshipCorrect = cpHHMemberTemp.get("IsRelationshipCorrect").getValue();
      var dkRefProp = cpHHMemberTemp.get("DKRefused.RelationshipCheck")
      if (dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      } else {
        dkRefProp = "";
      }
      if (isRelationshipCorrect == "true" || dkRefProp == "D" || dkRefProp == "R") {
        cpQuestFlags.put("IsRelationshipCorrect","true");
        currentHHMemberIndex = currentHHMemberIndex + 1;
        var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
        cpQuestFlags.put("IsEnteringRelationshipCheck","false");
        for (currentHHMemberIndex; currentHHMemberIndex <= rosterSize; currentHHMemberIndex++) {
          var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+currentHHMemberIndex+")");
          var cpIsParentYoungerThanReference = currentRosterMember.get("IsParentYoungerThanReference");
          var cpIsChildOlderThanReference = currentRosterMember.get("IsChildOlderThanReference");
          if(cpIsParentYoungerThanReference && cpIsChildOlderThanReference) {
            if(cpIsParentYoungerThanReference.getValue() == "true" || cpIsChildOlderThanReference.getValue() == "true") {
              cpHHMemberTemp.adoptJSON(currentRosterMember.getJSON());
              cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHMemberIndex);
              cpQuestFlags.put("IsEnteringRelationshipCheck","true");
              break;
            } 
          }
        }
      } else {
        cpQuestFlags.put("IsRelationshipCorrect","false");
      }
    }
  }
}

/**
*	Pre action for RelationOT_QSTN
*	Created by: Jack McCloskey, David Bourque, Dillon Irish
**/
function EnumCB_RelationOT_PRE(){
  if(pega.mobile.isHybrid){
    CB.toggleFlag("ExitSurveyEnabled","true");
    var pRelCodeClear = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    if(pRelCodeClear && cpHouseholdMember && cpHouseholdRoster && cpQuestFlags){

      cpQuestFlags.put("SkipDec", "true");

      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
        if(curMemberIndex == 1){
          curMemberIndex = parseInt(cpQuestFlags.get("CurrentRosterSize").getValue());
        }else{
          curMemberIndex = curMemberIndex - 1;
        }
        cpHouseholdRoster.put("CurrentHHMemberIndex", curMemberIndex);
        CB.getMemberFromRoster(curMemberIndex);
      }

      var lastSelected = cpHouseholdMember.get("RelationOTLastValueSelected");
      if(lastSelected && lastSelected.getValue() != ""){
        pRelCodeClear.put("P_REL_CODE", lastSelected.getValue());
      } else {
        pRelCodeClear.put("P_REL_CODE", "");
      }

      /*DKRef*/
      CB.toggleFlag("DKRFEnabled", "true");
      ENUMCB.updateDKRefVisibility("RelationOT");
    }
  }
}


/**
*	Post action for RelationOT_QSTN
*	Created by: Jack McCloskey, David Bourque
**/
function EnumCB_RelationOT_POST() {
  try {
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationOT","RelationshipCheck_HARD");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "", "RelationshipCheck_HARD");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var cpHouseholdTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      if(cpResponse && cpHouseholdTemp){
        var pRelCode = cpResponse.get("P_REL_CODE").getValue();
        cpHouseholdTemp.put("RelationOTLastValueSelected", pRelCode);
      }
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var params = "";
      if (cpHouseholdRoster.get("ReferencePerson.RespondantFlag").getValue() == "true") {
        params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      }
      else{
        params =	{isFirstTimeProp: "IsFirstTimeRelOther"};
      }
      var dkrefProp = cpHouseholdTemp.get("DKRefused.RelationOT");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpResponse.put("P_REL_CODE", 16);
        alert("P_REL_CODE: 16");
      }

      ENUMCB.setRelTextInHouseholdMemberTemp("Response.P_REL_CODE","D_RelationOTOptions","RelationOT");

      ENUMCB.updateMemberIndexPost(params);
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationOT", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationOT_POST:" + e.message);*/
  }
}

/*
*	Created by: Kyle Gravel
*	Toggles Exit Survey Funcitonality to off. 
*	Used by Language_QSTN
*/
function EnumCB_Language_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","false");
}

/*
*  Created: Ramin M, Aansh Kapadia
*  Description: Post to CDM data structure 
*/

function EnumCB_Language_POST () {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var languageList = pega.ui.ClientCache.find("D_LanguageList.pxResults").iterator();
  var languageIter = 0;

  respPage.put("NRFU_INTVW_LANGUAGE_CODES", []);

  var NRFU_INTVW_LANGUAGE_CODES = respPage.get("NRFU_INTVW_LANGUAGE_CODES");
  var NRFU_INTVW_LANGUAGE_CODESIterator = NRFU_INTVW_LANGUAGE_CODES.iterator();

  while(languageList.hasNext()) {  
    var thisPage = languageList.next();
    if (thisPage.get("pySelected").getValue() == true) {
      var code = thisPage.get("Code").getValue();
      var lanPage = pega.ui.ClientCache.createPage("LanguageCodes");
      languageIter += 1;

      lanPage.put("SOLICIT_LANGUAGE_CODE", code);
      NRFU_INTVW_LANGUAGE_CODES.add().adoptJSON(lanPage.getJSON());
    }
  }
  ENUMCB.language_VLDN(languageIter);
}

/*
* ENUMCB.setRelTextInHouseholdMemberTemp
* Created by Mark Coats, Updated by GRAVE340
* Sets the RelationshipText in HouseholdMemberTemp.Response to match its P_REL_CODE - written to support RevRelatioonshipResp_POST.
*/
ENUMCB.setRelTextInHouseholdMemberTemp = function(propVal, datapage, DKRProp) { 
  var cpRelationshipOptions = pega.ui.ClientCache.find(datapage + ".pxResults");
  var DKRPropVal = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused." + DKRProp);
  var cpTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  if (DKRPropVal && DKRPropVal.getValue() == "D") {
    if (datapage == "D_RelationSDOptions") {
      cpTemp.put("RelationshipText","Biological son or daughter");
    } else if (datapage == "D_RelationOTOptions") {
      cpTemp.put("RelationshipText","Other nonrelative");
    } else {
      cpTemp.put("RelationshipText","Don't Know");
    }
  } else if (DKRPropVal && DKRPropVal.getValue() == "R") {
    if (datapage == "D_RelationSDOptions") {
      cpTemp.put("RelationshipText","Biological son or daughter");
    } else if (datapage == "D_RelationOTOptions") {
      cpTemp.put("RelationshipText","Other nonrelative");
    } else {
      cpTemp.put("RelationshipText","Refused");
    }
  } else {
    var arrRelOptions = new Array();
    var iterRelOptions = cpRelationshipOptions.iterator();
    while(iterRelOptions.hasNext()){
      var cpCurPage = iterRelOptions.next();
      arrRelOptions[cpCurPage.get("pyValue").getValue()] = cpCurPage.get("pyDescription").getValue();
    }
    /*var cpTempResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");*/
    var cpRelationshipCode = cpTemp.get(propVal);
    if( cpRelationshipCode ) {
      var relationshipCode = cpRelationshipCode.getValue();
      if(arrRelOptions[relationshipCode]){
        cpTemp.put("RelationshipText",arrRelOptions[relationshipCode]);
      }
      else {
        cpTemp.put("RelationshipText","");
      }   
    }
  }  
}

/*
* ENUMCB.setRosterRelationshipText0
* Created by: Domenic Giancola
* Sets P_REL_TEXT value based on P_REL_CODE lookup for all roster members
*/
ENUMCB.setRosterRelationshipText = function(){
  var cpHHMembers = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var cpRelationshipOptions = pega.ui.ClientCache.find("D_RelationshipOptions_ALL.pxResults");
  var arrRelOptions = new Array();

  if(cpHHMembers && cpRelationshipOptions){
    /* populate options array */
    var iterRelOptions = cpRelationshipOptions.iterator();
    while(iterRelOptions.hasNext()){
      var cpCurPage = iterRelOptions.next();
      arrRelOptions[cpCurPage.get("pyValue").getValue()] = cpCurPage.get("pyDescription").getValue();
    }
    /* populate roster values */
    var iterHHMembers = cpHHMembers.iterator();
    while(iterHHMembers.hasNext()){
      var cpCurPage = iterHHMembers.next();
      var cpCurResponse = cpCurPage.get("Response");
      var cpRelationshipCode = cpCurResponse.get("P_REL_CODE");
      if (cpRelationshipCode){
        var relationshipCode = cpRelationshipCode.getValue();
        if(arrRelOptions[relationshipCode]){
          cpCurResponse.put("P_REL_TEXT",arrRelOptions[relationshipCode]);
        }
        else {
          cpCurResponse.put("P_REL_TEXT","");
        }
      }
    }
    return false;
  }
  else {
    return true;
  }
  return false;
}

/*
*	Created by: Kyle Gravel
*	Used to create a pagelist under quest flags of the household members that fail the sex check
*/
ENUMCB.addMembersToRSMemberIndexList = function(memberIndicesPageListName) {
  try { 
    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
    var householdMemberList = householdMember.iterator();
    var memberIndicesPageList = pega.ui.ClientCache.find(memberIndicesPageListName);

    var currentIndex = 0;
    var referencePersonIndex = 0;
    var doesRefNeedConfirmation = false;

    while(householdMemberList.hasNext()) {
      currentIndex = currentIndex + 1; 
      var currentPage = householdMemberList.next();
      var needSexConfirmation = currentPage.get("RelationshipInconsistent");

      if(needSexConfirmation) {
        needSexConfirmation = needSexConfirmation.getValue();
      }
      else {
        needSexConfirmation = "";
      }

      var referencePersonFlag = currentPage.get("ReferencePersonFlag");

      if(referencePersonFlag){
        referencePersonFlag = referencePersonFlag.getValue();
      }
      else {
        referencePersonFlag = "";
      }

      if(referencePersonFlag == true) {
        referencePersonIndex = currentIndex;
      }

      /*add the index of the current page, only if need sex confirmation is true and reference person flag is false*/
      if(needSexConfirmation == true && referencePersonFlag != true) {          
        var addedPage = memberIndicesPageList.add();
        addedPage.put("pyTempInteger",currentIndex);
        doesRefNeedConfirmation = true;
      }
    }

    /*Add reference person to end of list if anyone else had a Relationship Inconsistency*/
    if(doesRefNeedConfirmation == true) {
      var addedPage = memberIndicesPageList.add();
      addedPage.put("pyTempInteger",referencePersonIndex);      
    }
  }
  catch(e) {
    alert(e.message);
  }
}

/*
*	Created by: Kyle Gravel, Mike Hartel
*	Confirm Sex Question Pre js
*/
function EnumCB_ConfirmSex_PRE() {   
  CB.toggleFlag("DKRFEnabled", "true");  
  CB.toggleFlag("ExitSurveyEnabled", "true");

  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");  
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var numberOfConfirmSexMembers =  pega.ui.ClientCache.find("pyWorkPage.QuestFlags.ConfirmSexSize").getValue();
  var confirmSexIndex = questFlags.get("ConfirmSexIndex");
  if(confirmSexIndex) {
    confirmSexIndex = confirmSexIndex.getValue();
  }
  else {
    confirmSexIndex = 0;
  }


  /*Arrived here from click of Previous*/
  if(isGoingBack== "true"){
    if(previousQuestion == "ConfirmSex_QSTN"){
      confirmSexIndex=confirmSexIndex-1;
      questFlags.put("ConfirmSexIndex", confirmSexIndex);
    }
    if(previousQuestion == "DOB_QSTN" || previousQuestion == "RelationshipCheckRS_QSTN"){
      confirmSexIndex = numberOfConfirmSexMembers;
      questFlags.put("ConfirmSexIndex", confirmSexIndex);
    }
  }
  /*Arrived here from click of Next*/
  else{
    if(previousQuestion == "Sex_QSTN"){
      confirmSexIndex=1; /*Start with first index*/
      questFlags.put("ConfirmSexIndex", confirmSexIndex);
    }
  }

  var confirmSexMemberIndices = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.ConfirmSexMemberList("+confirmSexIndex+")");
  var HHMemberIndex = parseInt(confirmSexMemberIndices.get("pyTempInteger").getValue());  
  householdRoster.put("CurrentHHMemberIndex", HHMemberIndex);
  var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
  CB.getMemberFromRoster(curMemberIndex);

  ENUMCB.updateDKRefVisibility("ConfirmSex");

}

/*
*	Created by: Mike Hartel, Kyle Gravel
*	Confirm Sex Question Post js
*/
function EnumCB_ConfirmSex_POST() {
  try {
    /*Validation goes here*/
    ENUMCB.ConfirmSex_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");

    if (!workPage.hasMessages()) {
      var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
      var dkConfirmSex = dkRefPage.get("ConfirmSex");
      if (dkConfirmSex) {
        dkConfirmSex = dkConfirmSex.getValue();
      } else {
        dkConfirmSex = "";
      }
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var currentHHMemberIndex = householdRoster ? householdRoster.get("CurrentHHMemberIndex") : null;
      /* var currentHHMemberIndex = householdRoster.get("CurrentHHMemberIndex"); */
      if (currentHHMemberIndex) {
        currentHHMemberIndex = currentHHMemberIndex.getValue();
      } else {
        currentHHMemberIndex = 0;
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var confirmSexIndex = questFlags.get("ConfirmSexIndex");
      if (confirmSexIndex) {
        confirmSexIndex = confirmSexIndex.getValue();
      }

      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var referencePersonFlag = householdMemberTemp.get("ReferencePersonFlag");
      if (referencePersonFlag) {
        referencePersonFlag = referencePersonFlag.getValue();
      }

      var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var sexConfirm = responsePage.get("P_SEX_CONF_YES_IND");
      if (sexConfirm) {
        sexConfirm = sexConfirm.getValue();
      }

      if (sexConfirm == "1" || dkConfirmSex == "D" || dkConfirmSex == "R") {
        responsePage.put("P_SEX_CONF_NO_IND", "0");
        questFlags.put("IsDKRefVisible", "false");
        confirmSexIndex = confirmSexIndex + 1;
      } else if (sexConfirm == "0") {
        responsePage.put("P_SEX_CONF_NO_IND", "1");

      }

      questFlags.put("ConfirmSexIndex", confirmSexIndex);
      var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
      CB.setMemberInRoster(curMemberIndex, false);

      /* set up relationshipsexmemberlist pagelist when exiting to ConfirmSexNRFUSub*/
      if (referencePersonFlag == true && sexConfirm != "0") {
        var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
        var relationshipSexMemberIndices = questFlags.put("RelationshipSexMemberList", []);
        ENUMCB.RelationshipSexInconsistencyCheck("pyWorkPage.QuestFlags.RelationshipSexMemberList");
        relationshipSexMemberIndices = questFlags.get("RelationshipSexMemberList");
        /*Remove the last person from the list (Reference Person)*/
        var relationshipSexSize = relationshipSexMemberIndices.size();
        relationshipSexMemberIndices.remove(relationshipSexSize);
        relationshipSexSize = relationshipSexMemberIndices.size();
        questFlags.put("RelationshipSexSize", relationshipSexSize);
      }

    }

  } catch (e) {
    alert(e.message);
  }
}

/*
* Pre function for Relation SD
* Created by David Bourque
*/

function EnumCB_RelationSD_PRE(){
  if(pega.mobile.isHybrid){
    CB.toggleFlag("ExitSurveyEnabled","true");
    var pRelCodeClear = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    if(pRelCodeClear && cpHouseholdMember && cpHouseholdRoster && cpQuestFlags){
      cpQuestFlags.put("SkipDec", "true");

      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
        if(curMemberIndex <= 1){
          curMemberIndex = parseInt(cpQuestFlags.get("CurrentRosterSize").getValue());
        }else{
          curMemberIndex = curMemberIndex - 1;
        }
        cpHouseholdRoster.put("CurrentHHMemberIndex", curMemberIndex);
        CB.getMemberFromRoster(curMemberIndex);
        var isReference = cpHouseholdMember.get("ReferencePersonFlag").getValue()+"";
        if (isReference == "true") {
          curMemberIndex = curMemberIndex - 1;
          cpHouseholdRoster.put("CurrentHHMemberIndex", curMemberIndex);
          CB.getMemberFromRoster(curMemberIndex);
        }
      }

      var lastSelected = cpHouseholdMember.get("RelationSDLastValueSelected");
      if(lastSelected && lastSelected.getValue() != ""){
        pRelCodeClear.put("P_REL_CODE", lastSelected.getValue());
      } else {
        pRelCodeClear.put("P_REL_CODE", "");
      }

      /*DKRef*/
      CB.toggleFlag("DKRFEnabled", "true");
      ENUMCB.updateDKRefVisibility("RelationSD");
    }
  }
}

/* 
* Post function for RelationSD
* Created by David Bourque
*/

function EnumCB_RelationSD_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationSD");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var cpHouseholdTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      if(cpResponse && cpHouseholdTemp){
        var pRelCode = cpResponse.get("P_REL_CODE").getValue();
        cpHouseholdTemp.put("RelationSDLastValueSelected", pRelCode);
      }
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var params = "";
      if (cpHouseholdRoster.get("ReferencePerson.RespondantFlag").getValue()+"" == "true") {
        params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      }
      else{
        params = {isFirstTimeProp: "IsFirstTimeRelOther"};
      }
      var dkrefProp = cpHouseholdTemp.get("DKRefused.RelationSD");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpResponse.put("P_REL_CODE","5");
        alert("P_REL_CODE: 5");
      }
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationSD", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND");
      ENUMCB.setRelTextInHouseholdMemberTemp("Response.P_REL_CODE","D_RelationSDOptions","RelationSD");
      ENUMCB.updateMemberIndexPost(params);
      ENUMCB.skipReferencePerson();
    }
  }  
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationSD_POST:" + e.message);*/
  }
}


/*
*	Created by: AXJ
*	Change Sex Question Pre js
*/
function EnumCB_ChangeSex_PRE() {
  try {
    CB.toggleFlag("DKRFEnabled", "true");
    CB.toggleFlag("ExitSurveyEnabled", "true");

    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isGoingBack = questFlags.get("IsGoingBack").getValue();
    var numberOfConfirmSexMembers = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.ConfirmSexSize").getValue();
    var confirmSexIndex = questFlags.get("ConfirmSexIndex");
    if (confirmSexIndex) {
      confirmSexIndex = confirmSexIndex.getValue();
    } 
    else {
      confirmSexIndex = 0;
    }
    /*Arrived here from click of Previous*/
    if (isGoingBack == "true") {
      if (previousQuestion == "ChangeSex_QSTN"  || previousQuestion == "ConfirmSex_QSTN") {
        confirmSexIndex = confirmSexIndex - 1;
        questFlags.put("ConfirmSexIndex", confirmSexIndex);
      }
      if (previousQuestion == "DOB_QSTN" || previousQuestion == "RelationshipCheckRS_QSTN") {
        confirmSexIndex = numberOfConfirmSexMembers;
        questFlags.put("ConfirmSexIndex", confirmSexIndex);
      }
    }
    var confirmSexMemberIndices = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.ConfirmSexMemberList(" + confirmSexIndex + ")");
    var HHMemberIndex = parseInt(confirmSexMemberIndices.get("pyTempInteger").getValue());
    householdRoster.put("CurrentHHMemberIndex", HHMemberIndex);
    var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
    CB.getMemberFromRoster(curMemberIndex);
    ENUMCB.updateDKRefVisibility("ChangeSex");
  } 
  catch (e) {
    alert("ENUMCB Error - EnumCB_ChangeSex_PRE:" + e.message);
  }
}

/*
* Post function for Change Sex
* Created by Mike Hartel, modified AXJ
*/
function EnumCB_ChangeSex_POST() {

  /*Validation Goes Here*/
  ENUMCB.ChangeSex_VLDN();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if(!workPage.hasMessages()){      

    /*Set Member back into roster*/
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
    CB.setMemberInRoster(curMemberIndex, false);		

    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var confirmSexIndex = parseInt(questFlags.get("ConfirmSexIndex").getValue(),10);        
    var HHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var ReferencePersonFlag = HHMemberTemp.get("ReferencePersonFlag");
    var isReferencePerson = (ReferencePersonFlag)?ReferencePersonFlag.getValue():"";       

    if(isReferencePerson!= true){
      var oldSex = HHMemberTemp.get("SexMaleFemale").getValue();
      var newSex = HHMemberTemp.get("SexMaleFemaleConsistencyEdit").getValue();
      var confirmSexMemberList = questFlags.get("ConfirmSexMemberList");
      var confirmSexMemberListSize = confirmSexMemberList.size();          
      /*if the second to last member made a change to their sex, check if there is still an inconsistency with the reference person*/
      if(oldSex!=newSex && confirmSexIndex==confirmSexMemberListSize-1){            
        var responsePage = HHMemberTemp.get("Response");
        var sexMaleFemale ="";

        var relationshipCodeProp = responsePage.get("P_REL_CODE");          
        var relationshipCode = (relationshipCodeProp) ? relationshipCodeProp.getValue() : "";                  

        var sexMaleFemaleConsistencyEditProp = HHMemberTemp.get("SexMaleFemaleConsistencyEdit");
        var sexMaleFemaleConsistencyEdit = (sexMaleFemaleConsistencyEditProp) ? sexMaleFemaleConsistencyEditProp.getValue() : "";

        if(sexMaleFemaleConsistencyEdit!=""){
          sexMaleFemale =sexMaleFemaleConsistencyEdit;
        }            

        var dkRefPage = HHMemberTemp.get("DKRefused");
        var changeSexDKRefProp = dkRefPage.get("ChangeSex");
        var changeSexDKRef = (changeSexDKRefProp) ? changeSexDKRef.getValue() : "";

        var referencePersonPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ReferencePerson");
        var refSexMaleFemaleProp = referencePersonPage.get("SexMaleFemale");
        var refSexMaleFemale = (refSexMaleFemaleProp) ? refSexMaleFemaleProp.getValue() : "";			

        if(((relationshipCode == "1" || relationshipCode=="2") && ((refSexMaleFemale == sexMaleFemale) && changeSexDKRef == "")) ||
           ((relationshipCode == "3" || relationshipCode=="4") && ((refSexMaleFemale != sexMaleFemale) && changeSexDKRef == ""))) {
          /*inconsistency still exists, do nothing*/   
        }
        else{    
          /*no inconsistency, remove reference persion (last in list)*/
          confirmSexMemberList.remove(confirmSexMemberListSize);
          var confirmSexSize = questFlags.get("ConfirmSexMemberList").size();
          questFlags.put("ConfirmSexSize", confirmSexSize);
        }	             
      }
    }
    /*if Reference Person, then this is the last member to loop on. RelationshipSexNRFU is next*/
    else{             
      var relationshipSexMemberIndices = questFlags.put("RelationshipSexMemberList",[]);            
      ENUMCB.RelationshipSexInconsistencyCheck("pyWorkPage.QuestFlags.RelationshipSexMemberList");            
      relationshipSexMemberIndices = questFlags.get("RelationshipSexMemberList");            
      /*Remove the last person from the list (Reference Person)*/
      var relationshipSexSize = relationshipSexMemberIndices.size();   
      relationshipSexMemberIndices.remove(relationshipSexSize);
      relationshipSexSize = relationshipSexMemberIndices.size(); 
      questFlags.put("RelationshipSexSize", relationshipSexSize);
    }

    /*increment ConfirmSexIndex*/
    confirmSexIndex=confirmSexIndex+1;
    questFlags.put("ConfirmSexIndex",confirmSexIndex);        
    ENUMCB.SetChangeSexResponseProperties();     
  }
}

/*
 *	Created by: AXJ
 *	ENUMCB.SetChangeSexResponseProperties
 */
ENUMCB.SetChangeSexResponseProperties = function (){
  try {
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var dkRefProp = dkRefused.get("ChangeSex");
    dkRefProp = (dkRefProp) ? dkRefProp.getValue() : "";
    var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");      
    var revisedSex = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.SexMaleFemaleConsistencyEdit");
    if (cpResponse) {
      if (dkRefProp == "D") {
        cpResponse.put("P_SEX_DK_CH_IND", "1");
        cpResponse.put("P_SEX_REF_CH_IND", "0");
      } else if (dkRefProp == "R") {
        cpResponse.put("P_SEX_DK_CH_IND", "0");
        cpResponse.put("P_SEX_REF_CH_IND", "1");
      } else {
        cpResponse.put("P_SEX_DK_CH_IND", "0");
        cpResponse.put("P_SEX_REF_CH_IND", "0");
      }

      if (revisedSex == "Male") {
        cpResponse.put("P_SEX_MALE_CH_IND", "1");
        cpResponse.put("P_SEX_FEMALE_CH_IND", "0");
      } else if (revisedSex == "Female") {
        cpResponse.put("P_SEX_MALE_CH_IND", "0");
        cpResponse.put("P_SEX_FEMALE_CH_IND", "1");
      } else {
        cpResponse.put("P_SEX_MALE_CH_IND", "0");
        cpResponse.put("P_SEX_FEMALE_CH_IND", "0");
      }
    }
    return;
  } catch (e) {
    alert("ENUMCB Error - ENUMCB.SetChangeSexResponseProperties:" + e.message);
  }
}


/*
* Post Action for RelationshipCheckRS
* Created by: Aditi Ashok
*/

function EnumCB_RelationshipCheckRS_POST () {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");

  ENUMCB.RelationshipCheckRS_VLDN();

  if (!workPage.hasMessages()) { 
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");

    if (cpQuestFlags && cpHouseholdRoster && cpHHMemberTemp) {
      cpQuestFlags.put("NextSurveyQuestion", "");

      var isRelationshipCorrect = cpHHMemberTemp.get("IsRelationshipCorrect").getValue();
      var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
      var dkRefRelationshipCheckRS = dkRefPage.get("RelationshipCheckRS");
      if(dkRefRelationshipCheckRS) {
        dkRefRelationshipCheckRS = dkRefRelationshipCheckRS.getValue();
      }
      else {
        dkRefRelationshipCheckRS = "";
      }

      if (isRelationshipCorrect == "true" || dkRefRelationshipCheckRS == "D" || dkRefRelationshipCheckRS == "R" ) { 
        var relationshipSexIndex = cpQuestFlags.get("RelationshipSexIndex");
        if (relationshipSexIndex) {
          relationshipSexIndex = relationshipSexIndex.getValue();
        } else {
          relationshipSexIndex = 0;
        } 

        relationshipSexIndex = relationshipSexIndex+1;
        cpQuestFlags.put("RelationshipSexIndex", relationshipSexIndex);

      } 

      /* Response Properties */
      if (isRelationshipCorrect == "true") {
        responsePage.put("P_REL_CONF_YES_IND", "1");
        responsePage.put("P_REL_CONF_NO_IND", "0");
      } 
      else if (isRelationshipCorrect == "false") {
        responsePage.put("P_REL_CONF_YES_IND", "0");
        responsePage.put("P_REL_CONF_NO_IND", "1");
        cpQuestFlags.put("NextSurveyQuestion", "ChangeRelationshipRS_QSTN");
      } 
      else if (dkRefRelationshipCheckRS == "D" || dkRefRelationshipCheckRS == "R") {
        responsePage.put("P_REL_CONF_YES_IND", "0");
        responsePage.put("P_REL_CONF_NO_IND", "0");
      }

    }
    /* Increment Index */
    var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(currentHHMemberIndex,false);

  }
}


/*
* Pre Action for RelationshipCheckRS
* Created by: Aditi Ashok
*/
function EnumCB_RelationshipCheckRS_PRE () {
  ENUMCB.setRosterRelationshipText();

  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");  
  var isGoingBack = questFlags.get("IsGoingBack").getValue();

  var numberOfRelationshipSexMembers =  pega.ui.ClientCache.find("pyWorkPage.QuestFlags.RelationshipSexSize").getValue();
  var relationshipSexIndex = questFlags.get("RelationshipSexIndex");

  if(relationshipSexIndex) { 
    relationshipSexIndex = relationshipSexIndex.getValue();
  }
  else {
    relationshipSexIndex = 0;
  }

  /*Arrived here from click of Previous*/ 

  if(isGoingBack== "true"){
    if(previousQuestion == "RelationshipCheckRS_QSTN"){
      relationshipSexIndex = relationshipSexIndex-1;
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);
    } 
    if(previousQuestion == "DOB_QSTN"){
      relationshipSexIndex = numberOfRelationshipSexMembers;
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);
    }

  } 
  /*Arrived here from click of Next*/
  else {
    if(previousQuestion == "ConfirmSex_QSTN" || previousQuestion=="ChangeSex_QSTN"){
      relationshipSexIndex=1; /*Start with first index*/
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);
    }
  } 

  var relationshipSexMemberIndices = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.RelationshipSexMemberList("+relationshipSexIndex+")");
  var HHMemberIndex = parseInt(relationshipSexMemberIndices.get("pyTempInteger").getValue());  
  householdRoster.put("CurrentHHMemberIndex", HHMemberIndex);
  var curMemberIndex = householdRoster.get("CurrentHHMemberIndex").getValue();
  CB.getMemberFromRoster(curMemberIndex);
  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");

  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("RelationshipCheckRS");
  CB.toggleFlag("ExitSurveyEnabled","true");

}

/*
* Function for Exit Survey action in Options menu
* Created by Domenic Giancola
*/
ENUMCB.launchConfirmExitSurvey = function() {
  if(pega.mobile.isHybrid){
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
    if(cpQuestFlags && cpWorkPage){
      var exitSurveyEnabled = cpQuestFlags.get("ExitSurveyEnabled");
      if(exitSurveyEnabled) {
        exitSurveyEnabled = exitSurveyEnabled.getValue();
      }
      else {
        exitSurveyEnabled = "";
      }
      if(exitSurveyEnabled == true || exitSurveyEnabled == "true") {
        var lastSurveyQuestion = cpWorkPage.get("CurrentSurveyQuestion").getValue();
        cpQuestFlags.put("HideFAButtons",true);
        cpQuestFlags.put("ExitSurveyLastQuestion",lastSurveyQuestion);
        cpWorkPage.put("CurrentSurveyQuestion","ExitSurvey_QSTN");
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=CollectEnum&TaskName=Assignment1");
      }
    }
  }
}

/*
* Function for No and Previous buttons in Exit Survey flow
* Created by Domenic Giancola
*/
ENUMCB.exitSurveyGoBack = function() {
  if(pega.mobile.isHybrid){
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    if(cpQuestFlags){
      var isInExitSurveyFlow = cpQuestFlags.get("IsInExitSurveyFlow").getValue();
      if(isInExitSurveyFlow == true || isInExitSurveyFlow == "true"){
        cpQuestFlags.put("HideFAButtons",false);
        cpQuestFlags.put("IsInExitSurveyFlow",false);
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=QuestionShape&TaskName=ASSIGNMENT63");
      }
      else {
        cpQuestFlags.put("HideFAButtons",false);
        cpQuestFlags.put("IsInExitSurveyFlow",false);
        pega.u.d.submit("pyActivity=GoToPreviousTask&skipValidations=true&flowName=QuestionShape&TaskName=ASSIGNMENT63");
      }
    }
  }
}

/*
* Function for Yes button in Exit Survey flow
* Created by Domenic Giancola
*/
ENUMCB.confirmExitSurvey = function() {
  if(pega.mobile.isHybrid){
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
    if(cpQuestFlags && cpWorkPage){
      cpQuestFlags.put("ExitSurveyAction","");
      cpQuestFlags.put("HideFAButtons",false);
      var lastSurveyQuestion = cpQuestFlags.get("ExitSurveyLastQuestion").getValue();
      if (lastSurveyQuestion == "Intro_QSTN" || lastSurveyQuestion == "Address_QSTN" || lastSurveyQuestion == "RespName_QSTN" || lastSurveyQuestion == "RespPhone_QSTN" || lastSurveyQuestion == "Who_QSTN" || lastSurveyQuestion == "Anyone_QSTN") {
        cpQuestFlags.put("ExitSurveyAction","ExitPopStatus_QSTN");
        cpQuestFlags.put("IsInExitSurveyFlow",true);
      }
      else if (lastSurveyQuestion == "EligibleResp_QSTN" || lastSurveyQuestion == "RevRelationshipOther_QSTN" || lastSurveyQuestion == "RevRelationSD_QSTN" || lastSurveyQuestion == "RevRelationOT_QSTN" || lastSurveyQuestion == "RevRace_QSTN" || lastSurveyQuestion == "RevDetailedOriginNHPI_QSTN" || lastSurveyQuestion == "RevDetailedOriginAsian_QSTN" || lastSurveyQuestion == "RevDetailedOriginAIAN_QSTN" || lastSurveyQuestion == "RevDetailedOriginWhite_QSTN" || lastSurveyQuestion == "RevDetailedOriginHisp_QSTN"|| lastSurveyQuestion == "RevDetailedOriginBlack_QSTN"|| lastSurveyQuestion == "RevDetailedOriginOther_QSTN" || lastSurveyQuestion == "PopCount_QSTN" || lastSurveyQuestion == "Undercount_QSTN" || lastSurveyQuestion == "Home_QSTN" || lastSurveyQuestion == "Sex_QSTN" || lastSurveyQuestion == "RosterReview_QSTN" || lastSurveyQuestion == "RosterAdd_QSTN" || lastSurveyQuestion == "RosterEdit_QSTN" || lastSurveyQuestion == "RosterAdd_QSTN" || lastSurveyQuestion == "DOB_QSTN" || lastSurveyQuestion == "Race_QSTN" || lastSurveyQuestion == "EthnicityWhite_QSTN" || lastSurveyQuestion == "EthnicityBlack_QSTN" || lastSurveyQuestion == "EthnicityAsian_QSTN" || lastSurveyQuestion == "EthnicityHisp_QSTN" || lastSurveyQuestion == "EthnicityMENA_QSTN" || lastSurveyQuestion == "EthnicityNHPI_QSTN" || lastSurveyQuestion == "EthnicityOther_QSTN" || lastSurveyQuestion == "EthnicityAIAN_QSTN" || lastSurveyQuestion == "ConfirmAge_QSTN" || lastSurveyQuestion == "Review_QSTN" || lastSurveyQuestion == "People_QSTN" || lastSurveyQuestion == "RelationshipResp_QSTN" || lastSurveyQuestion == "RelationSD_QSTN" || lastSurveyQuestion == "RelationshipCheck_QSTN" || lastSurveyQuestion == "RelationshipOther_QSTN" || lastSurveyQuestion == "RelationOT_QSTN" || lastSurveyQuestion == "Age_QSTN" || lastSurveyQuestion == "Renter_QSTN"  || lastSurveyQuestion == "Owner_QSTN"  || lastSurveyQuestion == "ConfirmSex_QSTN"  || lastSurveyQuestion == "WhoLivesElsewhere_QSTN" || lastSurveyQuestion == "WhyLiveElsewhere_QSTN" || lastSurveyQuestion == "RevAge_QSTN" || lastSurveyQuestion == "RevRelationshipResp_QSTN" || lastSurveyQuestion == "ChangeRelationSD_QSTN" || lastSurveyQuestion == "RevSex_QSTN" || lastSurveyQuestion == "ChangeRelationRSSD_QSTN" || lastSurveyQuestion == "RelationshipCheckRS_QSTN" || lastSurveyQuestion == "ChangeRelationshipRS_QSTN" || lastSurveyQuestion == "ChangeAge_QSTN" || lastSurveyQuestion == "ChangeRelationship_QSTN" || lastSurveyQuestion == "ChangeRelationOT_QSTN" || lastSurveyQuestion == "ChangeRelationSD_QSTN" || lastSurveyQuestion == "ChangeRelationRSOT_QSTN" || lastSurveyQuestion == "ChangeDOB_QSTN" || lastSurveyQuestion == "RevDOB_QSTN" || lastSurveyQuestion == "RevDetailedOriginMENA_QSTN" || lastSurveyQuestion == "RevDetailedOriginSOR_QSTN" || lastSurveyQuestion == "BabyFlag_QSTN" || lastSurveyQuestion == "Occupancy_QSTN" || lastSurveyQuestion == "VacantDescription_QSTN" || lastSurveyQuestion == "OtherVacant_QSTN" || lastSurveyQuestion == "ExitPopStatus_QSTN" || lastSurveyQuestion == "SpecificUnitStatus_QSTN") {
        cpQuestFlags.put("ExitSurveyAction","NoComplete_QSTN");
        cpQuestFlags.put("IsInExitSurveyFlow",true);
      }
    }
    var exitSurveyAction = cpQuestFlags.get("ExitSurveyAction").getValue();
  }
}

/*
* Pre function for Change Age
* Created by David Bourque
*/

function EnumCB_ChangeAge_PRE(){
  if(pega.mobile.isHybrid){
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isGoingBack = cpQuestFlags.get("IsGoingBack").getValue();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    if (isGoingBack+"" == "true") {
      var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
      var currentHHIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
      if (previousQuestion == "DOB_QSTN") {
        currentHHIndex = currentHHIndex -1;
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      } else {
        currentHHIndex = cpHouseholdRoster.get("HouseholdMember").size();
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      }
      CB.getMemberFromRoster(currentHHIndex);
    }
    CB.toggleFlag("ExitSurveyEnabled","true");
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("ChangeAge");
  }
}

/*
* Post function for Change Age
* Created by David Bourque
*/

function EnumCB_ChangeAge_POST(){
  if(pega.mobile.isHybrid){
    ENUMCB.ChangeAge_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    if (!workPage.hasMessages()) {
      var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if (cpHouseholdMember && cpHouseholdRoster && cpQuestFlags) {
        var age = "";
        var dkRefused = cpHouseholdMember.get("DKRefused.ChangeAge");
        if (dkRefused && (dkRefused.getValue() == "D" || dkRefused.getValue() == "R")) {
          age = dkRefused.getValue();
          responsePage.put("P_AGE_CH_INT",age);
        } else {
          age = responsePage.get("P_AGE_CH_INT").getValue();
        }
        cpHouseholdMember.put("Age",age);
        ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeAge", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CH_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CH_REF_IND");
        var params = {isFirstTimeProp: "IsFirstTimeDOB"};
        ENUMCB.updateMemberIndexPost(params);
        ENUMCB.AreParentsYoungerthanChildren();
      }
    }
  }
}

/**
*	Generic PRE action for ChangeRelationshipRS, ChangeRelationRSSD, and ChangeRelationRSOT
*	Created by: Aansh Kapadia
**/

ENUMCB.ChangeRelationshipRSFlow_PRE = function() {
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");

  /* Edge case when previous button is hit from DOB or RelationshipCheckRS */
  if (isGoingBack+"" == "true") {
    var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
    var currentHHIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    if (previousQuestion == "RelationshipCheckRS_QSTN") {
      var relationshipSexIndex = questFlags.get("RelationshipSexIndex");
      if (relationshipSexIndex) {
        relationshipSexIndex = parseInt(relationshipSexIndex.getValue());
      } else {
        relationshipSexIndex = 0;
      } 
      relationshipSexIndex = relationshipSexIndex-1;
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);

      /*  Set member in HHMTemp*/
      var relationshipSexMemberIndices = questFlags.get("RelationshipSexMemberList("+relationshipSexIndex+")");
      var HHMemberIndex = parseInt(relationshipSexMemberIndices.get("pyTempInteger").getValue());  
      cpHouseholdRoster.put("CurrentHHMemberIndex", HHMemberIndex);
      var curMemberIndex = cpHouseholdRoster.get("CurrentHHMemberIndex").getValue();
      CB.getMemberFromRoster(curMemberIndex);

    } else if(previousQuestion == "DOB_QSTN"){
      var relationshipSexIndex = questFlags.get("RelationshipSexIndex");
      if (relationshipSexIndex) {
        relationshipSexIndex = relationshipSexIndex.getValue();
      } else {
        relationshipSexIndex = 0;
      } 
      relationshipSexIndex = questFlags.get("RelationshipSexMemberList").size();
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);

      /*  Set member in HHMTemp*/
      var relationshipSexMemberIndices = questFlags.get("RelationshipSexMemberList("+relationshipSexIndex+")");
      var HHMemberIndex = parseInt(relationshipSexMemberIndices.get("pyTempInteger").getValue());  
      cpHouseholdRoster.put("CurrentHHMemberIndex", HHMemberIndex);
      var curMemberIndex = cpHouseholdRoster.get("CurrentHHMemberIndex").getValue();
      CB.getMemberFromRoster(curMemberIndex);
    }
  }
}

/**
*	Pre action for ChangeRelationshipRS
*	Created by: Aansh Kapadia
**/
function EnumCB_ChangeRelationshipRS_PRE(){
  ENUMCB.ChangeRelationshipRSFlow_PRE();
  CB.toggleFlag("ExitSurveyEnabled","true");
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("ChangeRelationshipRS"); 
}

/**
*	Pre action for ChangeRelationRSSD
*	Created by: Aansh Kapadia
**/
function EnumCB_ChangeRelationRSSD_PRE(){
  ENUMCB.ChangeRelationshipRSFlow_PRE();
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("ChangeRelationRSSD");
  CB.toggleFlag("ExitSurveyEnabled","true");
}

/**
*	Pre action for ChangeRelationRSOT
*	Created by: Aansh Kapadia
**/
function EnumCB_ChangeRelationRSOT_PRE(){
  ENUMCB.ChangeRelationshipRSFlow_PRE();
  CB.toggleFlag("ExitSurveyEnabled","true");
  CB.toggleFlag("DKRFEnabled", "true");
  ENUMCB.updateDKRefVisibility("ChangeRelationRSOT"); 
}

/**
*	Post action for ChangeRelationshipRS_QSTN
*	Created by: Aansh Kapadia, Jack McCloskey
**/
function EnumCB_ChangeRelationshipRS_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();

    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationshipRS", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationshipRS");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationshipRS");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationshipRS", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var memberTempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var respProp = memberTempPage.get("ChangeRelationshipRS");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      if(respProp == "SD") {
        questFlags.put("NextSurveyQuestion", "ChangeRelationSD_QSTN");
        var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
        CB.setMemberInRoster(curMemberIndex,false);
      }
      else if(respProp == "OT") {
        questFlags.put("NextSurveyQuestion", "ChangeRelationOT_QSTN");
        var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
        CB.setMemberInRoster(curMemberIndex,false);
      }
      else{
        var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE");
        respPage.setValue(respProp);
        questFlags.put("NextSurveyQuestion", "");

        var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
        var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
        ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationshipRS","D_RelationshipOptions_ALL","ChangeRelationshipRS");
        CB.setMemberInRoster(currentHHMemberIndex,false);

        var relationshipSexIndex = questFlags.get("RelationshipSexIndex");
        if (relationshipSexIndex) {
          relationshipSexIndex = relationshipSexIndex.getValue();
        } else {
          relationshipSexIndex = 0;
        } 

        relationshipSexIndex = relationshipSexIndex+1;
        questFlags.put("RelationshipSexIndex", relationshipSexIndex);
      }
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_ChangeRelationshipRS_POST:" + e.message);*/
  }
}

/**
*	Post action for ChangeRelationRSSD_QSTN
*	Created by: Aansh Kapadia
**/
function EnumCB_ChangeRelationRSSD_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();

    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSSD", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationRSSD");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSSD");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationRSSD", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var memberTempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var respProp = memberTempPage.get("ChangeRelationRSSD");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");

      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSSD");
      respPage.setValue(respProp);
      questFlags.put("NextSurveyQuestion", "");

      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());

      var relationshipSexIndex = questFlags.get("RelationshipSexIndex");
      if (relationshipSexIndex) {
        relationshipSexIndex = relationshipSexIndex.getValue();
      } else {
        relationshipSexIndex = 0;
      } 

      /* if DK/Ref has been selected on this screen: default to other biological son/daughter */
      var cpHMTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var dkrefProp = cpHMTemp.get("DKRefused.ChangeRelationRSSD");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpHMTemp.put("ChangeRelationRSSD", 5);
        alert("ChangeRelationRSSD: 5");
      }
      ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationRSSD","D_RelationSDOptions","ChangeRelationRSSD");
      CB.setMemberInRoster(currentHHMemberIndex,false);

      relationshipSexIndex = relationshipSexIndex+1;
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_ChangeRelationRSSD_POST:" + e.message);*/
  }
}

/**
*	Post action for ChangeRelationRSOT_QSTN
*	Created by: Aansh Kapadia
**/
function EnumCB_ChangeRelationRSOT_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();

    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSOT", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationRSOT");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSOT");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationRSOT", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var memberTempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var respProp = memberTempPage.get("ChangeRelationRSOT");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");

      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.ChangeRelationRSOT");
      respPage.setValue(respProp);
      questFlags.put("NextSurveyQuestion", "");

      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());


      var relationshipSexIndex = questFlags.get("RelationshipSexIndex");
      if (relationshipSexIndex) {
        relationshipSexIndex = relationshipSexIndex.getValue();
      } else {
        relationshipSexIndex = 0;
      } 

      /* if DKRef has been selected on this screen: default to other non-relative */
      var cpHMTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var dkrefProp = cpHMTemp.get("DKRefused.ChangeRelationRSOT");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpHMTemp.put("ChangeRelationRSOT", 16);
        alert("ChangeRelationRSOT: 16");
      }
      ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationRSOT","D_RelationOTOptions","ChangeRelationRSOT");
      CB.setMemberInRoster(currentHHMemberIndex,false);

      relationshipSexIndex = relationshipSexIndex+1;
      questFlags.put("RelationshipSexIndex", relationshipSexIndex);
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_ChangeRelationRSOT_POST:" + e.message);*/
  }
}

/**
*	Pre action for  ChangeRelationship_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_RelationshipChangeResp_PRE(){

  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  if(cpQuestFlags && cpHouseholdRoster && cpHouseholdMemberList){

    if(cpQuestFlags.get("IsGoingForward").getValue() == "true"){
      cpQuestFlags.put("SkipDec", "false");
    }
    var curRosterSize = cpHouseholdMemberList.size();
    var params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
    var curMemberIndex;
    if(cpQuestFlags.get("SkipDec").getValue() == "false"){
      curMemberIndex = ENUMCB.updateMemberIndexPre(params);
    }else{
      cpQuestFlags.put("SkipDec", "false");
    }
    var curMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember("+curMemberIndex+")");
    var referenceFlag = curMember.get("ReferencePersonFlag").getValue();

    /*If the household member is the reference person, increment/decrement*/
    if(referenceFlag == true){
      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        curMemberIndex = curMemberIndex - 1;
        if(curMemberIndex == 0){
          curMemberIndex = curRosterSize;
        }
      }else{
        curMemberIndex = curMemberIndex + 1;
      }
      cpHouseholdRoster.put("CurrentHHMemberIndex", curMemberIndex);
    }

    CB.getMemberFromRoster(curMemberIndex);

    /*DKRef*/
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("RelationshipResp");
  }
}


/**
*	Post action for ChangeRelationship_QSTN
*	Created by: Dillon Irish,  
**/
function EnumCB_RelationshipChangeResp_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var respProp = respPage.get("P_REL_CODE");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if(respProp == "SD") {
        questFlags.put("NextSurveyQuestion", "RelationSD_QSTN");
      }
      else if(respProp == "OT") {
        questFlags.put("NextSurveyQuestion", "RelationOT_QSTN");
      }
      else{
        ENUMCB.updateMemberIndexPost(params);
        questFlags.put("NextSurveyQuestion", "");
      }
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationshipResp_POST:" + e.message);*/
  }
}
function EnumCB_RelationshipChangeResp_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE", "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_REL_CODE");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 

      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var respProp = respPage.get("P_REL_CODE");
      if(respProp) {
        respProp = respProp.getValue();
      }
      else {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if(respProp == "SD") {
        questFlags.put("NextSurveyQuestion", "RelationSD_QSTN");
      }
      else if(respProp == "OT") {
        questFlags.put("NextSurveyQuestion", "RelationOT_QSTN");
      }
      else{
        ENUMCB.updateMemberIndexPost(params);
        questFlags.put("NextSurveyQuestion", "");
      }
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationshipChangeResp_POST:" + e.message);*/
  }
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.RelationshipCheck_VLDN();
  if (!workPage.hasMessages()) {
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    if (cpQuestFlags && cpHouseholdRoster && cpHHMemberTemp) {
      var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
      CB.setMemberInRoster(currentHHMemberIndex,false);
      var isRelationshipCorrect = cpHHMemberTemp.get("IsRelationshipCorrect").getValue();
      var dkRefProp = cpHHMemberTemp.get("DKRefused.RelationshipCheck")
      if (dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      } else {
        dkRefProp = "";
      }
      if (isRelationshipCorrect == "true" || dkRefProp == "D" || dkRefProp == "R") {
        cpQuestFlags.put("IsRelationshipCorrect","true");
        currentHHMemberIndex = currentHHMemberIndex + 1;
        var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
        cpQuestFlags.put("IsEnteringRelationshipCheck","false");
        for (currentHHMemberIndex; currentHHMemberIndex <= rosterSize; currentHHMemberIndex++) {
          var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+currentHHMemberIndex+")");
          var cpIsParentYoungerThanReference = currentRosterMember.get("IsParentYoungerThanReference");
          var cpIsChildOlderThanReference = currentRosterMember.get("IsChildOlderThanReference");
          if(cpIsParentYoungerThanReference && cpIsChildOlderThanReference) {
            if(cpIsParentYoungerThanReference.getValue() == "true" || cpIsChildOlderThanReference.getValue() == "true") {
              cpHHMemberTemp.adoptJSON(currentRosterMember.getJSON());
              cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHMemberIndex);
              cpQuestFlags.put("IsEnteringRelationshipCheck","true");
              break;
            } 
          }
        }
      } else {
        cpQuestFlags.put("IsRelationshipCorrect","false");
      }
    }
  }

}
/*
* Pre Action for WhyLiveElsewhere_QSTN 
* Created by:Ebenezer Owoeye
*/
function EnumCB_WhyLiveElsewhere_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");  
  CB.toggleFlag("ExitSurveyEnabled", "true");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var WhyLiveElsewhereSize =  pega.ui.ClientCache.find("pyWorkPage.QuestFlags.WhyLiveElsewhereSize").getValue();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");  
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var WhyLiveElsewhereIndex = questFlags.get("WhyLiveElsewhereIndex");
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
  if(!softEditPage) {
    responsePage.put("SoftEditVLDN", {});
    softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
  }
  softEditPage.put("WhyLiveElseWhereFlag", "false");

  if(WhyLiveElsewhereIndex) {
    WhyLiveElsewhereIndex = WhyLiveElsewhereIndex.getValue();
  }
  else {
    WhyLiveElsewhereIndex = 1;
    questFlags.put("WhyLiveElsewhereIndex",WhyLiveElsewhereIndex);
  }

  /*Arrived here from click of Previous*/
  if(isGoingBack== "true"){
    if(previousQuestion == "WhyLiveElsewhere_QSTN"){
      WhyLiveElsewhereIndex=WhyLiveElsewhereIndex-1;
      if(WhyLiveElsewhereIndex == 0) {
        WhyLiveElsewhereIndex = WhyLiveElsewhereSize;
      }
      questFlags.put("WhyLiveElsewhereIndex", WhyLiveElsewhereIndex);
    }
    if(previousQuestion == "Review_QSTN"){
      WhyLiveElsewhereIndex=WhyLiveElsewhereSize;
      if(WhyLiveElsewhereIndex == 0) {
        WhyLiveElsewhereIndex = WhyLiveElsewhereSize;
      }
      questFlags.put("WhyLiveElsewhereIndex", WhyLiveElsewhereIndex);
    }
  }
  /*Arrived here from click of Next*/
  else{
    if(previousQuestion == "WhoLivesElsewhere_QSTN"){
      WhyLiveElsewhereIndex = 1; /*Start with first index*/
      questFlags.put("WhyLiveElsewhereIndex", WhyLiveElsewhereIndex);
    }
  }	
  var WhyLiveElsewhereCurMember = pega.ui.ClientCache.find("pyWorkPage.QuestFlags.WhyLiveElsewhereIndexList("+WhyLiveElsewhereIndex+")");
  var curMemberIndexOnRoster = parseInt(WhyLiveElsewhereCurMember.get("pyTempInteger").getValue(),10);
  householdRoster.put("CurrentHHMemberIndex", curMemberIndexOnRoster);
  CB.getMemberFromRoster(curMemberIndexOnRoster);
  ENUMCB.updateDKRefVisibility("WhyLiveElsewhere");
}

/**
*	Pre action for ChangeRelationship_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_ChangeRelationship_PRE(){

  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHouseholdMemberList = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  if(cpQuestFlags && cpHouseholdRoster && cpHouseholdMemberList){

    if(cpQuestFlags.get("SkipDec").getValue() == "false" && cpQuestFlags.get("IsGoingBack").getValue() == "true"){
      ENUMCB.getNextRelCheckPre();
    }else{
      cpQuestFlags.put("SkipDec", "true");
    }
    CB.toggleFlag("ExitSurveyEnabled","true");
    /*DKRef*/
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("RelationshipResp");
  }
}


/**
*	Post action for ChangeRelationship_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_ChangeRelationship_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationshipValue", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationship");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationshipValue");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      /*ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipResp", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); */
      var tempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var changeRelationshipValue = tempPage.get("ChangeRelationshipValue");
      questFlags.put("SkipDec", "false");
      if(changeRelationshipValue) {
        changeRelationshipValue = changeRelationshipValue.getValue();
      }
      else {
        changeRelationshipValue = "";
      }
      if(changeRelationshipValue == "SD") {
        questFlags.put("NextSurveyQuestion", "RelationSD_QSTN");
      }
      else if(changeRelationshipValue == "OT") {
        questFlags.put("NextSurveyQuestion", "RelationOT_QSTN");
      }
      else{
        respPage.put("P_REL_CODE", changeRelationshipValue);
        ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationshipValue","D_RelationshipOptions_ALL","ChangeRelationship");
        ENUMCB.getNextRelCheckPost();
        questFlags.put("NextSurveyQuestion", "");
      }
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationshipResp_POST:" + e.message);*/
  }
}

/**
* Decrements the roster until a householdmember with a "failed" relationship is found, sets this memeber in HouseholdMemberTemp
* Created by: Dillon Irish
**/
ENUMCB.getNextRelCheckPre = function() {
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var cpRespondent = pega.ui.ClientCache.find("pyWorkPage.Respondent");
  var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue()) - 1;
  var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();

  if (currentHHMemberIndex <= 0) {
    currentHHMemberIndex = rosterSize;
  }
  for (currentHHMemberIndex; currentHHMemberIndex > 0; currentHHMemberIndex--) {
    var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+currentHHMemberIndex+")");
    var cpIsParentYoungerThanReference = currentRosterMember.get("IsParentYoungerThanReference");
    var cpIsChildOlderThanReference = currentRosterMember.get("IsChildOlderThanReference");
    if(cpIsParentYoungerThanReference && cpIsChildOlderThanReference) {
      if(cpIsParentYoungerThanReference.getValue() == "true" || cpIsChildOlderThanReference.getValue() == "true") {
        cpHHMemberTemp.adoptJSON(currentRosterMember.getJSON());
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHMemberIndex);
        break;
      }
    }
  }
}

ENUMCB.getNextRelCheckPost = function() {
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var cpHHMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
  CB.setMemberInRoster(currentHHMemberIndex,false);
  currentHHMemberIndex = currentHHMemberIndex + 1;
  var rosterSize = cpHouseholdRoster.get("HouseholdMember").size();
  cpQuestFlags.put("IsEnteringRelationshipCheck","false");
  for (currentHHMemberIndex; currentHHMemberIndex <= rosterSize; currentHHMemberIndex++) {
    var currentRosterMember = cpHouseholdRoster.get("HouseholdMember("+currentHHMemberIndex+")");
    var cpIsParentYoungerThanReference = currentRosterMember.get("IsParentYoungerThanReference");
    var cpIsChildOlderThanReference = currentRosterMember.get("IsChildOlderThanReference");
    if(cpIsParentYoungerThanReference && cpIsChildOlderThanReference) {
      if(cpIsParentYoungerThanReference.getValue() == "true" || cpIsChildOlderThanReference.getValue() == "true") {
        cpHHMemberTemp.adoptJSON(currentRosterMember.getJSON());
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHMemberIndex);
        cpQuestFlags.put("IsEnteringRelationshipCheck","true");
        break;
      } 
    }
  }
}

/*
*	Created by: Kyle Gravel
*	Used by ChangeDOB_QSTN
*/
function EnumCB_ChangeDOB_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","true");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var rosterSize = questFlags.get("CurrentRosterSize").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());
  if(isGoingBack == "true") {
    if(previousQuestion == "DOB_QSTN"){
      currentHHMemberIndex = currentHHMemberIndex - 1;
      householdRoster.put("CurrentHHMemberIndex", currentHHMemberIndex);
      CB.getMemberFromRoster(currentHHMemberIndex);
    }
    else if(previousQuestion == "Race_QSTN") {
      currentHHMemberIndex = rosterSize;
      householdRoster.put("CurrentHHMemberIndex", currentHHMemberIndex);
      CB.getMemberFromRoster(currentHHMemberIndex);
    }
  }

  /*Convert DOB to String */
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  /*Find birth month*/
  var birthMonth = respPage.get("P_BIRTH_MONTH_INT");
  if(birthMonth) {
    birthMonth = birthMonth.getValue();
    var birthMonthString = CB.getMonthName(birthMonth);
  }
  else {
    birthMonth = "";
  }
  /*Find Birth Day*/
  var birthDay = respPage.get("P_BIRTH_DAY_INT");
  if(birthDay) {
    birthDay = birthDay.getValue();
  }
  else{
    birthDay = "";
  }
  /*Find Birth Year*/
  var birthYear = respPage.get("P_BIRTH_YEAR_INT");
  if(birthYear){
    birthYear = birthYear.getValue();
  }
  else {
    birthYear = "";
  }

  /*add props to dateString*/
  var dateString = birthMonthString + " " + birthDay + ", " + birthYear;
  respPage.put("DOBString",dateString);

  ENUMCB.DOBDKRefVisibility("ChangeDOBDay", "ChangeDOBMonth", "ChangeDOBYear");
}

/*
*	Created by: Kyle Gravel
*	Used by ChangeDOB_QSTN
*/
function EnumCB_ChangeDOB_POST() {
  try {   
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
    if(!softEditPage) {
      respPage.put("SoftEditVLDN",{});
      softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
    }
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
    if(currentHHMember) {
      currentHHMember = currentHHMember.getValue();
    }
    else {
      currentHHMember = "";
    }

    var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

    var dkRefMonth = dkRefused.get("ChangeDOBMonth");
    if(dkRefMonth) {
      dkRefMonth = dkRefMonth.getValue();
    }
    else {
      dkRefMonth = "";
    }
    var dkRefDay = dkRefused.get("ChangeDOBDay");
    if(dkRefDay) {
      dkRefDay = dkRefDay.getValue();
    }
    else {
      dkRefDay = "";
    }
    var dkRefYear = dkRefused.get("ChangeDOBYear");
    if(dkRefYear) {
      dkRefYear = dkRefYear.getValue();
    }
    else {
      dkRefYear = "";
    }

    var birthMonth = respPage.get("P_BIRTH_MONTH_CH_INT");
    if(birthMonth) {
      birthMonth = birthMonth.getValue();
    }
    else {
      birthMonth = "";
    }
    var birthDay = respPage.get("P_BIRTH_DAY_CH_INT");
    if(birthDay) {
      birthDay = birthDay.getValue();
    }
    else {
      birthDay = "";
    }
    var birthYear = respPage.get("P_BIRTH_YEAR_CH_INT");
    if(birthYear) {
      birthYear = birthYear.getValue();
    }
    else {
      birthYear = "";
    }

    /*Begin DOB Validation*/
    if(!ENUMCB_DOB_VLDN(workPage, birthMonth, birthDay, birthYear, dkRefMonth, dkRefDay, dkRefYear)) {
      var parsedMonth = parseInt(birthMonth, 10);
      var parsedDay = parseInt(birthDay, 10);
      var parsedYear = parseInt(birthYear, 10);   

      var todayYear = parseInt(workPage.get("CensusYear").getValue());
      var censusDate = workPage.get("CensusDate").getValue();

      /**If the soft edit flag does not exist, initialize it to false **/
      var changeDOBFlag = softEditPage.get("ChangeDOBFlag");
      if(changeDOBFlag) {
        changeDOBFlag = changeDOBFlag.getValue();
      }
      else {
        changeDOBFlag = false;
      }

      if((parsedYear == todayYear && parsedMonth == 4 && parsedDay > 1) || (parsedYear == todayYear && parsedMonth > 4)) {
        ENUMCB.DOBSoft_VLDN("ChangeDOBFlag");
        changeDOBFlag = softEditPage.get("ChangeDOBFlag").getValue();
        if(changeDOBFlag == false) {
          if(currentHHMember < householdMember.size()) {
            CB.setMemberInRoster(currentHHMember);
            currentHHMember = currentHHMember + 1;
            householdRoster.put("CurrentHHMemberIndex",currentHHMember);
          }
          else {
            CB.setMemberInRoster(currentHHMember);
            currentHHMember = currentHHMember + 1;
            householdRoster.put("CurrentHHMemberIndex",currentHHMember);
          }
        }
      }

      else if(parsedMonth != "" && parsedYear > 1891 && parsedYear <= todayYear && (parsedMonth != 4 || (parsedMonth == 4 && parsedDay != "")) && currentHHMember < householdMember.size()) {  
        var putNextQuestion = questFlags.put("NextSurveyQuestion", "ConfirmAge2_QSTN");
        var age = ENUMCB.calculateAge(parsedMonth, parsedDay, parsedYear, censusDate);
        respPage.put("P_AGE_CH_INT", age);
        var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
        householdMemberTemp.put("Age",age);
      }

      else if (!(parsedMonth != "" && parsedYear > 1891 && parsedYear <= todayYear && (parsedMonth != 4 || (parsedMonth == 4 && parsedDay != "")))) {
        var putNextQuestion = questFlags.put("NextSurveyQuestion", "Age2_QSTN");
      }   
      else {
        CB.setMemberInRoster(currentHHMember);
        currentHHMember = currentHHMember + 1;
        householdRoster.put("CurrentHHMemberIndex",currentHHMember);
        var putNextQuestion = questFlags.put("NextSurveyQuestion", "");
      }

      if(dkRefMonth == "D") {
        birthMonth = "DK";
      }
      else if(dkRefMonth == "R") {
        birthMonth = "REF";
      }
      if(dkRefDay == "D") {
        birthDay = "DK";
      }
      else if(dkRefDay == "R") {
        birthDay = "REF";
      }
      if(dkRefYear == "D") {
        birthYear = "DK";
      }
      else if(dkRefYear == "R") {
        birthYear = "REF";
      }

      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      householdMemberTemp.put("DOBMonth",birthMonth);
      householdMemberTemp.put("DOBDay",birthDay);
      householdMemberTemp.put("DOBYear",birthYear);

      ENUMCB.AreParentsYoungerthanChildren();

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeDOBMonth", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_DK_CH_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_REF_CH_IND");

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeDOBDay", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_DK_CH_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_REF_CH_IND");

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeDOBYear", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_DK_CH_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_REF_CH_IND");

    }
  }
  catch(e) {
    alert(e.message);
  }
}


/*
*		Creatd by: Kyle Gravel
*		Placeholder: Get the correct household member on previous
*/
function EnumCB_Age2_PRE(){  
  var workPG = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPG.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue(),10);

  var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack");
  if(isGoingBack) {
    isGoingBack = isGoingBack.getValue();
  }
  else {
    isGoingBack = "";
  }

  if(isGoingBack == "true") {    
    if(previousQuestion == "DOB_QSTN") {
      currentHHMember = currentHHMember - 1;
    }
    else if(previousQuestion == "RACE_QSTN") {
      currentHHMember = householdMember.size();
    }	

    householdRoster.put("CurrentHHMemberIndex",currentHHMember);
    CB.getMemberFromRoster(currentHHMember);
  }

}

/*
*		Created by: Kyle Gravel
*		Placeholder: Currently increment index 
*/
function EnumCB_Age2_POST(){

  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
  if(currentHHMember) {
    currentHHMember = currentHHMember.getValue();
  }
  CB.setMemberInRoster(currentHHMember,false);
  currentHHMember = currentHHMember + 1;
  householdRoster.put("CurrentHHMemberIndex",currentHHMember);

}

/*
*		Creatd by: Kyle Gravel
*		Placeholder: Get the correct household member on previous
*/
function EnumCB_ConfirmAge2_PRE(){

  var workPG = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPG.get("CurrentSurveyQuestion").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue(),10);

  var householdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  if(previousQuestion == "DOB_QSTN") {
    currentHHMember = currentHHMember - 1;
    householdRoster.put("CurrentHHMemberIndex",currentHHMember);
    CB.getMemberFromRoster(currentHHMember);
  }
  else if(previousQuestion == "RACE_QSTN") {
    currentHHMember = householdMember.size();
    householdRoster.put("CurrentHHMemberIndex",currentHHMember);
    CB.getMemberFromRoster(currentHHMember);
  }
}

/*
*		Created by: Kyle Gravel
*		Placeholder: Currently increments roster member
*/
function EnumCB_ConfirmAge2_POST(){

  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
  if(currentHHMember) {
    currentHHMember = currentHHMember.getValue();
  }
  CB.setMemberInRoster(currentHHMember,false);;
  currentHHMember = currentHHMember + 1;
  householdRoster.put("CurrentHHMemberIndex",currentHHMember);

}

/*
*		Created by: Kyle Gravel
*		Placeholder: Currently grabs proper roster member
*/
function EnumCB_RevRelationSD_PRE(){
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevRelationSD");

}

/*
*		Created by: Kyle Gravel
*		Used by RevRelationSD_QSTN
*/
function EnumCB_RevRelationSD_POST(){
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationSD", "pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationSD");
  } 
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationSD");
  }

  var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var workPG = pega.ui.ClientCache.find("pyWorkPage");
  if(!workPG.hasMessages()) {
    var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var revRelationshipCode = householdMemberTemp.get("RevRelationshipCode");
    revRelationshipCode = revRelationshipCode ? revRelationshipCode.getValue() : "";

    var revRelationshipOther = householdMemberTemp.get("RevRelationshipOther");
    revRelationshipOther = revRelationshipOther ? revRelationshipOther.getValue() : "";

    var dkRefRelationSD = dkRefused.get("RevRelationSD");
    dkRefRelationSD = dkRefRelationSD ? dkRefRelationSD.getValue() : "";

    if((revRelationshipCode == "SD" || revRelationshipOther == "SD") && dkRefRelationSD != "") {
      responsePage.put("P_REL_SON_DAUG_RV_IND","1");
      responsePage.put("P_REL_CODE_RV","5");
    }
    else {
      var revRelationSD = householdMemberTemp.get("RevRelationSD");
      revRelationSD = revRelationSD ? revRelationSD.getValue() : "";

      if(revRelationSD == "5") {
        responsePage.put("P_REL_CODE_RV","5");
        responsePage.put("P_REL_CHILD_BIO_RV_IND","1");
      }
      else {
        responsePage.put("P_REL_CHILD_BIO_RV_IND","0");
      }

      if(revRelationSD == "6") {
        responsePage.put("P_REL_CODE_RV","6");
        responsePage.put("P_REL_CHILD_ADOPTED_RV_IND","1");
      }
      else {
        responsePage.put("P_REL_CHILD_ADOPTED_RV_IND","0");
      }

      if(revRelationSD == "7") {
        responsePage.put("P_REL_CODE_RV","7");
        responsePage.put("P_REL_CHILD_STEP_RV_IND","1");
      }
      else {
        responsePage.put("P_REL_CHILD_STEP_RV_IND","0");
      }

      if(revRelationSD == "15") {
        responsePage.put("P_REL_CODE_RV","15");
        responsePage.put("P_REL_CHILD_FOSTER_RV_IND","1");
      }
      else {
        responsePage.put("P_REL_CHILD_FOSTER_RV_IND","0");
      }		
    }
  }
  ENUMCB.setRelTextInHouseholdMemberTemp("RevRelationSD","D_RelationSDOptions","RevRelationSD");

  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
  if(currentHHMember) {
    currentHHMember = currentHHMember.getValue();
  }
  CB.setMemberInRoster(currentHHMember,false);	
}

/*
*		Created by: Kyle Gravel
*		Updated by: Mark Coats
*       No need to grab roster member - HouseholdMemberTemp setup when you come in in the review process.
*          also - do NOT increment/decrement index - that is being handled in REVIEW.
*/
function EnumCB_RevRelationOT_PRE(){
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevRelationOT");
  var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var pRelParent = cpResponse.get("P_REL_PARENT_RV_IND");
  if( pRelParent )
  {
    pRelParent = pRelParent.getValue();
  }
  if( (!pRelParent) || (pRelParent == "") )
  {
    cpResponse.put("P_REL_PARENT_RV_IND", "0");
    cpResponse.put("REL_SIBLING_RV_IND", "0");
    cpResponse.put("P_REL_INLAW_PARENT_RV_IND", "0");
    cpResponse.put("P_REL_INLAW_CHILD_RV_IND", "0");
    cpResponse.put("P_REL_OTHER_REL_RV_IND", "0");
    cpResponse.put("P_REL_CHILD_FOSTER_RV_IND", "0");
    cpResponse.put("P_REL_OTHER_NONREL_RV_IND", "0");
    cpResponse.put("P_REL_DK_RV_IND", "0");
    cpResponse.put("P_REL_REF_RV_IND", "0");
  }
}

/*
*		Created by: Kyle Gravel
*		Updated by: Mark Coats
*		In the review flow, we do not increment the index. We do update the roster and the appropriate response indicators
*		based on what was selected.
*/
function EnumCB_RevRelationOT_POST(){

  try
  {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ReviewRelationOTCode",
                                   "pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationOT");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ReviewRelationOTCode");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());

      var params = {isFirstTimeProp: "IsFirstTimeRevRelationOT"};
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationOT", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_RV_IND"); 

      /*
	   * Get the HouseholdMemberTemp and Response pages so we can get the RevRelationshipCode and properly set the indicators.
	   * Get the quest flags so we can properly set the next screen - in case they picked OT or SD.
	   */
      var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");	  
      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");	  
      var respProp = cpHouseholdMemberTemp.get("ReviewRelationOTCode");
      if(respProp)
      {
        respProp = respProp.getValue();
      }
      else
      {
        respProp = "";
      }	  

      var dkRefRelationOT = dkRefused.get("RevRelationOT");
      dkRefRelationOT = dkRefRelationOT ? dkRefRelationOT.getValue() : "";

      if(dkRefRelationOT != "") {
        respPage.put("P_REL_PARENT_RV_IND","1");
        respPage.put("P_REL_CODE_RV","16");
      }

      /*
	   * Now appropriately set the RV_IND flags based on the response.
	   */
      if(respProp == "9")
      {
        respPage.put( "P_REL_PARENT_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_PARENT_RV_IND", "0" );
      }
      if(respProp == "8")
      {
        respPage.put( "P_REL_SIBLING_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_SIBLING_RV_IND", "0" );
      }
      if(respProp == "11")
      {
        respPage.put( "P_REL_INLAW_PARENT_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_INLAW_PARENT_RV_IND", "0" );
      }
      if(respProp == "12")
      {
        respPage.put( "P_REL_INLAW_CHILD_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_INLAW_CHILD_RV_IND", "0" );
      }
      if(respProp == "13")
      {
        respPage.put( "P_REL_OTHER_REL_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_OTHER_REL_RV_IND", "0" );
      }
      if(respProp == "15")
      {
        respPage.put( "P_REL_CHILD_FOSTER_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_CHILD_FOSTER_RV_IND", "0" );
      }
      if(respProp == "16")
      {
        respPage.put( "P_REL_OTHER_NONREL_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_OTHER_NONREL_RV_IND", "0" );
      }	  
      /*
	   * Update the rel text in householdmembertemp and then update the member in the roster.
	   */
      ENUMCB.setRelTextInHouseholdMemberTemp("ReviewRelationOTCode","D_RelationOTOptions","RevRelationOT");
      CB.setMemberInRoster(curMemberIndex);
    }
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RevRelationOT_POST:" + e.message);*/
  }
}

/*
* Post Action for WhyLiveElsewhere_QSTN 
* Created by:Ebenezer Owoeye
*/
function EnumCB_WhyLiveElsewhere_POST() {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var WhyLiveElsewhereFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.WhyLiveElsewhere");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var ElsewhereIsAtRelatives = WhyLiveElsewhereFlags.get("IsAtRelatives").getValue();
  var ElsewhereIsAtCollege = WhyLiveElsewhereFlags.get("IsAtCollege").getValue();
  var ElsewhereIsAtMilitary = WhyLiveElsewhereFlags.get("IsAtMilitary").getValue();
  var ElsewhereIsAtJob = WhyLiveElsewhereFlags.get("IsAtJob").getValue();
  var ElsewhereIsAtNursingHome = WhyLiveElsewhereFlags.get("IsAtNursingHome").getValue();
  var ElsewhereIsAtJail = WhyLiveElsewhereFlags.get("IsAtJail").getValue();
  var ElsewhereIsAtSeasonal = WhyLiveElsewhereFlags.get("IsAtSeasonal").getValue();
  var ElsewhereIsOtherReason = WhyLiveElsewhereFlags.get("IsOtherReason").getValue();

  var numberSelected = 0;

  if(ElsewhereIsAtRelatives) {
    respPage.put("P_LOC_ELSE_RELATIVES_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_RELATIVES_IND", "0");
  }
  if(ElsewhereIsAtCollege) {
    respPage.put("P_LOC_ELSE_COLLEGE_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_COLLEGE_IND", "0");
  }
  if(ElsewhereIsAtMilitary) {
    respPage.put("P_LOC_ELSE_MILITARY_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_MILITARY_IND", "0"); 
  }
  if(ElsewhereIsAtJob) {
    respPage.put("P_LOC_ELSE_JOB_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_JOB_IND", "0");
  }
  if(ElsewhereIsAtNursingHome) {
    respPage.put("P_LOC_ELSE_NURSINGHOME_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_NURSINGHOME_IND", "0");
  }
  if(ElsewhereIsAtJail) {
    respPage.put("P_LOC_ELSE_JAIL_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_JAIL_IND", "0");
  }
  if(ElsewhereIsAtSeasonal) {
    respPage.put("P_LOC_ELSE_SEASONAL_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_SEASONAL_IND", "0");
  }
  if(ElsewhereIsOtherReason) {
    respPage.put("P_LOC_ELSE_OTHER_IND", "1");
    numberSelected++;
  }
  else {
    respPage.put("P_LOC_ELSE_OTHER_IND", "0");
  }
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.WhyLiveElsewhere_VLDN(numberSelected);
  if (!workPage.hasMessages()) {
    ENUMCB.updateDisabledDKRefColor();
    var whyLiveElsewhereIndex = questFlags.get("WhyLiveElsewhereIndex");
    if(whyLiveElsewhereIndex) {
      whyLiveElsewhereIndex = whyLiveElsewhereIndex.getValue();
    }
    else {
      whyLiveElsewhereIndex = "";
    }
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndexOnRoster = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue(),10);
    CB.setMemberInRoster(curMemberIndexOnRoster, false);
    whyLiveElsewhereIndex = whyLiveElsewhereIndex + 1;
    questFlags.put("WhyLiveElsewhereIndex", whyLiveElsewhereIndex);
  }
}

/*
* Disable dkRefused when “For what reason?” is available on WhyLiveElsewhere_QSTN 
* Created by:Ebenezer Owoeye
*/
ENUMCB.UpdateDKRefElsewhere = function(propValue) {
  if(propValue == "true") {  
    CB.toggleFlag("DKRFEnabled", "false"); 
    CB.toggleFlag("IsDKRefVisible", "false");
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    dkRefused.put("WhyLiveElsewhere", "");
  }	
  else {
    ENUMCB.updateDisabledDKRefColor();
  }
}

/**
*	Pre action for ChangeRelationOT_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_ChangeRelationOT_PRE(){
  if(pega.mobile.isHybrid){

    var pRelCodeClear = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    if(pRelCodeClear && cpHouseholdMember && cpHouseholdRoster && cpQuestFlags){

      cpQuestFlags.put("SkipDec", "true");

      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        ENUMCB.getNextRelCheckPre();
      }
      CB.toggleFlag("ExitSurveyEnabled","true");
      /*DKRef*/
      CB.toggleFlag("DKRFEnabled", "true");
      ENUMCB.updateDKRefVisibility("ChangeRelationOT");
    }
  }
}


/**
*	Post action for ChangeRelationOT_QSTN
*	Created by: Dillon Irish
**/
function EnumCB_ChangeRelationOT_POST() {
  try {
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationOTValue", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationOT");
    } 
    else {
      ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationOTValue");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var cpHouseholdTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if(cpResponse && cpHouseholdTemp){
        cpQuestFlags.put("SkipDec", "false");
        var changeRelationOTValue = cpHouseholdTemp.get("ChangeRelationOTValue").getValue();
        cpResponse.put("P_REL_CODE", changeRelationOTValue);
      }
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var params = "";
      if (cpHouseholdRoster.get("ReferencePerson.RespondantFlag").getValue() == "true") {
        params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      }
      else{
        params =	{isFirstTimeProp: "IsFirstTimeRelOther"};
      }
      var dkrefProp = cpHouseholdTemp.get("DKRefused.ChangeRelationOT");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpResponse.put("P_REL_CODE", 16);
      }
      ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationOTValue","D_RelationOTOptions","ChangeRelationOT");
      ENUMCB.getNextRelCheckPost();
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationOT", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationOT_POST:" + e.message);*/
  }
}
/**
* Pre function for ChangeRelation SD
* Created by Dillon Irish
**/

function EnumCB_ChangeRelationSD_PRE(){
  if(pega.mobile.isHybrid){
    var pRelCodeClear = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

    if(pRelCodeClear && cpHouseholdMember && cpHouseholdRoster && cpQuestFlags){
      cpQuestFlags.put("SkipDec", "true");

      if(cpQuestFlags.get("IsGoingBack").getValue() == "true"){
        ENUMCB.getNextRelCheckPre();
      }

      /*DKRef*/
      CB.toggleFlag("DKRFEnabled", "true");
      ENUMCB.updateDKRefVisibility("ChangeRelationSD");
      CB.toggleFlag("ExitSurveyEnabled","true");
    }
  }
}

/**
* Post function for ChangeRelationSD
* Created by Dillon Irish
**/

function EnumCB_ChangeRelationSD_POST() {
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationSDValue", "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationSD");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.ChangeRelationSDValue");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {
      var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
      var cpHouseholdTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if(cpResponse && cpHouseholdTemp){
        cpQuestFlags.put("SkipDec", "false");
        var changeRelationSDValue = cpHouseholdTemp.get("ChangeRelationSDValue").getValue();
        cpResponse.put("P_REL_CODE", changeRelationSDValue);
      }
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var params = "";
      if (cpHouseholdRoster.get("ReferencePerson.RespondantFlag").getValue()+"" == "true") {
        params = {isFirstTimeProp: "IsFirstTimeRelationshipResp"};
      }
      else{
        params = {isFirstTimeProp: "IsFirstTimeRelOther"};
      }
      var dkrefProp = cpHouseholdTemp.get("DKRefused.ChangeRelationSD");
      if (dkrefProp && (dkrefProp.getValue() == "D" || dkrefProp.getValue() == "R")) {
        cpResponse.put("P_REL_CODE","5");
      }

      ENUMCB.setRelTextInHouseholdMemberTemp("ChangeRelationSDValue","D_RelationSDOptions","ChangeRelationSD");
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeRelationSD", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_IND"); 
      ENUMCB.getNextRelCheckPost();
    }



  }  
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RelationSD_POST:" + e.message);*/
  }
}
/*
* Post function for Age
* Created by David Bourque
*/

function EnumCB_Age_POST(){
  if(pega.mobile.isHybrid){
    ENUMCB.Age_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    if (!workPage.hasMessages()) {
      var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if (cpHouseholdMember && cpHouseholdRoster && cpQuestFlags) {
        var age = "";
        var dkRefused = cpHouseholdMember.get("DKRefused.Age");
        if (dkRefused && (dkRefused.getValue() == "D" || dkRefused.getValue() == "R")) {
          age = dkRefused.getValue();
          responsePage.put("P_AGE_INT",age);
        } else {
          age = responsePage.get("P_AGE_INT").getValue();
        }
        cpHouseholdMember.put("Age",age);
        ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.Age", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_REF_IND");
        params = {isFirstTimeProp: "IsFirstTimeDOB"};
        ENUMCB.updateMemberIndexPost(params);
        ENUMCB.AreParentsYoungerthanChildren();
      }
    }
  }
}

/*
* Pre function for Age
* Created by David Bourque
*/

function EnumCB_Age_PRE(){
  if(pega.mobile.isHybrid){
    CB.toggleFlag("ExitSurveyEnabled","true");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isGoingBack = cpQuestFlags.get("IsGoingBack").getValue();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    if (isGoingBack+"" == "true") {
      var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
      var currentHHIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
      if (previousQuestion == "DOB_QSTN") {
        currentHHIndex = currentHHIndex -1;
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      } else {
        currentHHIndex = cpHouseholdRoster.get("HouseholdMember").size();
        cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      }
      CB.getMemberFromRoster(currentHHIndex);
    }
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("Age");
  }
}

/**
*	Pre action for RevRelationshipResp_QSTN
*	Created by: Mark Coats
**/
function EnumCB_RevRelationshipResp_PRE(){		

  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("RevRelationshipResp");
  var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var pRelOppSpouse = cpResponse.get("P_REL_SPOUSE_OPP_RV_IND");
  if( pRelOppSpouse )
  {
    pRelOppSpouse = pRelOppSpouse.getValue();
  }
  if( (!pRelOppSpouse) || (pRelOppSpouse == "") )
  {
    cpResponse.put("P_REL_SPOUSE_OPP_RV_IND", "0");
    cpResponse.put("P_REL_SPOUSE_SAME_RV_IND", "0");
    cpResponse.put("P_REL_PARTNER_OPP_RV_IND", "0");
    cpResponse.put("P_REL_PARTNER_SAME_RV_IND", "0");
    cpResponse.put("P_REL_SON_DAUG_RV_IND", "0");
    cpResponse.put("P_REL_OTHER_RV_IND", "0");
    cpResponse.put("P_REL_GRANDCHILD_RV_IND", "0");
    cpResponse.put("P_REL_HOUSEROOMMATE_RV_IND", "0");
    cpResponse.put("P_REL_DK_RV_IND", "0");
    cpResponse.put("P_REL_REF_RV_IND", "0");
  }
}

/**
*	Post action for RevRelationshipResp_QSTN
*	Created by: Mark Coats
**/
function EnumCB_RevRelationshipResp_POST() {
  try {
    /*
     * Debug - uncomment to see DK/Refused coming in.
     *
    var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var cpDKRefRevRelationshipResp = cpDKRefused.get("RevRelationshipResp");
    if( cpDKRefRevRelationshipResp )
    {
        cpDKRefRevRelationshipResp = cpDKRefRevRelationshipResp.getValue();
        alert( "Coming to POST with cpDKRefRevRelationshipResp = " + cpDKRefRevRelationshipResp)
    }
    */
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationshipCode",
                                   "pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationshipResp");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationshipCode");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages()) {

      var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var curMemberIndex = parseInt(householdRoster.get("CurrentHHMemberIndex").getValue());

      var params = {isFirstTimeProp: "IsFirstTimeRevRelationshipResp"};
      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationshipResp", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_RV_IND"); 

      /*
	   * Get the HouseholdMemberTemp and Response pages so we can get the RevRelationshipCode and properly set the indicators.
	   * Get the quest flags so we can properly set the next screen - in case they picked OT or SD.
	   */
      var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");	  
      var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");	  
      var respProp = cpHouseholdMemberTemp.get("RevRelationshipCode");
      if(respProp)
      {
        respProp = respProp.getValue();
      }
      else
      {
        respProp = "";
      }
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

      /*
	   * Now appropriately set the next question and the RV_IND flags based on the response.
	   */
      questFlags.put("NextSurveyQuestion", "");
      if(respProp == "1")
      {
        respPage.put( "P_REL_SPOUSE_OPP_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_SPOUSE_OPP_RV_IND", "0" );
      }
      if(respProp == "2")
      {
        respPage.put( "P_REL_PARTNER_OPP_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_PARTNER_OPP_RV_IND", "0" );
      }
      if(respProp == "3")
      {
        respPage.put( "P_REL_SPOUSE_SAME_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_SPOUSE_SAME_RV_IND", "0" );
      }
      if(respProp == "4")
      {
        respPage.put( "P_REL_PARTNER_SAME_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_PARTNER_SAME_RV_IND", "0" );
      }
      if(respProp == "10")
      {
        respPage.put( "P_REL_GRANDCHILD_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_GRANDCHILD_RV_IND", "0" );
      }
      if(respProp == "14")
      {
        respPage.put( "P_REL_HOUSEROOMMATE_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_HOUSEROOMMATE_RV_IND", "0" );
      }
      if(respProp == "OT")
      {
        questFlags.put("NextSurveyQuestion", "RevRelationOT_QSTN");
        respPage.put( "P_REL_OTHER_RV_IND", "1" );
      }
      else
      {
        respPage.put( "P_REL_OTHER_RV_IND", "0" );
      }      
      if(respProp == "SD")
      {
        questFlags.put("NextSurveyQuestion", "RevRelationSD_QSTN");
        respPage.put( "P_REL_SON_DAUG_RV_IND", "1" );
      }      
      else
      {
        respPage.put( "P_REL_SON_DAUG_RV_IND", "0" );
      }

      /*
	   * Update the rel text in householdmembertemp and then update the member in the roster.
	   */
      ENUMCB.setRelTextInHouseholdMemberTemp("RevRelationshipCode","D_RelationshipOptions_ALL","RevRelationshipResp");
      CB.setMemberInRoster(curMemberIndex);
    } 
  }
  catch (e) {
    /*alert("ENUMCB Error - EnumCB_RevRelationshipResp_POST:" + e.message);*/
  }
}

/*
*	Created by: Kyle Gravel
*	PRE Action on Rev Relationship Other
*/
function EnumCB_RevRelationshipOther_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevRelationshipOther"); 
}
/*
*	Created by: Kyle Gravel
*	POST Action on Rev Relationship Other
*
*/
function EnumCB_RevRelationshipOther_POST() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();

  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationshipOther", "pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationshipOther");
  } 
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.RevRelationshipOther");
  }
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {

    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevRelationshipOther", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_REL_REF_RV_IND"); 

    var memberTempPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var respProp = memberTempPage.get("RevRelationshipOther");
    respProp = respProp ? respProp.getValue() : "";   
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");

    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    questFlags.put("NextSurveyQuestion", "");

    if(respProp == "1") {
      respPage.put( "P_REL_SPOUSE_OPP_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_SPOUSE_OPP_RV_IND", "0" );
    }
    if(respProp == "2") {
      respPage.put( "P_REL_PARTNER_OPP_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_PARTNER_OPP_RV_IND", "0" );
    }
    if(respProp == "3") {
      respPage.put( "P_REL_SPOUSE_SAME_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_SPOUSE_SAME_RV_IND", "0" );
    }
    if(respProp == "4") {
      respPage.put( "P_REL_PARTNER_SAME_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_PARTNER_SAME_RV_IND", "0" );
    }
    if(respProp == "10") {
      respPage.put( "P_REL_GRANDCHILD_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_GRANDCHILD_RV_IND", "0" );
    }
    if(respProp == "14") {
      respPage.put( "P_REL_HOUSEROOMMATE_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_HOUSEROOMMATE_RV_IND", "0" );
    }
    if(respProp == "OT") {
      questFlags.put("NextSurveyQuestion", "RevRelationOT_QSTN");
      respPage.put( "P_REL_OTHER_RV_IND", "1" );
    }
    else {
      respPage.put( "P_REL_OTHER_RV_IND", "0" );
    }      
    if(respProp == "SD") {
      questFlags.put("NextSurveyQuestion", "RevRelationSD_QSTN");
      respPage.put( "P_REL_SON_DAUG_RV_IND", "1" );
    }      
    else {
      respPage.put( "P_REL_SON_DAUG_RV_IND", "0" );
    }

    ENUMCB.setRelTextInHouseholdMemberTemp("RevRelationshipOther","D_RelationshipOptions_ALL","RevRelationshipOther");

    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
    currentHHMember = currentHHMember ? currentHHMember.getValue(): "";

    CB.setMemberInRoster(currentHHMember,false);
  }   
}
/**	
 *	Pre action for Rev_DOB_QSTN
 *	Created by:AXJ
 **/
function EnumCB_RevDOB_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.DOBDKRefVisibility("RevDOBDay", "RevDOBMonth", "RevDOBYear"); 
}

ENUMCB.DOBDKRefVisibility = function(dayProp, monthProp, yearProp) {
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var day = dkRefused.get(dayProp);
  var month = dkRefused.get(monthProp);
  var year = dkRefused.get(yearProp);
  day = day ? day.getValue() : "";
  month = month ? month.getValue() : "";
  year = year ? year.getValue() : "";
  if(day != "" || month != "" || year != "") {
    CB.toggleFlag("IsDKRefVisible", "true");
  }
  else {
    CB.toggleFlag("IsDKRefVisible", "false");
  }
}
/**	
 *	Post action for Rev_DOB_QSTN
 *	Created by:AXJ
 **/
function EnumCB_RevDOB_POST() {
  try {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
    if(!softEditPage) {
      respPage.put("SoftEditVLDN",{});
      softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
    }
    var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var currentHHMember = householdRoster.get("CurrentHHMemberIndex");
    if(currentHHMember) {
      currentHHMember = currentHHMember.getValue();
    }  
    else {
      currentHHMember = "";
    }

    var dkRefMonth = dkRefused.get("RevDOBMonth");
    if(dkRefMonth) {
      dkRefMonth = dkRefMonth.getValue();
    }
    else {
      dkRefMonth = "";
    } 
    var dkRefDay = dkRefused.get("RevDOBDay");
    if(dkRefDay) {
      dkRefDay = dkRefDay.getValue();
    }
    else {
      dkRefDay = "";
    }
    var dkRefYear = dkRefused.get("RevDOBYear");
    if(dkRefYear) {
      dkRefYear = dkRefYear.getValue();
    }
    else {
      dkRefYear = "";
    }

    var birthMonth = respPage.get("P_BIRTH_MONTH_RV_INT");
    if(birthMonth) {
      birthMonth = birthMonth.getValue();
    }
    else {
      birthMonth = "";
    }
    var birthDay = respPage.get("P_BIRTH_DAY_RV_INT");
    if(birthDay) {
      birthDay = birthDay.getValue();
    } 
    else {
      birthDay = "";
    }  
    var birthYear = respPage.get("P_BIRTH_YEAR_RV_INT");
    if(birthYear) {
      birthYear = birthYear.getValue();
    }
    else {
      birthYear = "";
    } 

    /*Begin DOB Validation*/
    if(!ENUMCB_DOB_VLDN(workPage, birthMonth, birthDay, birthYear, dkRefMonth, dkRefDay, dkRefYear)) {
      var parsedMonth = parseInt(birthMonth, 10);
      var parsedDay = parseInt(birthDay, 10);
      var parsedYear = parseInt(birthYear, 10);     
      var todayYear = parseInt(workPage.get("CensusYear").getValue());
      var censusDate = workPage.get("CensusDate").getValue();

      /**If the soft edit flag does not exist, initialize it to false **/
      var changeDOBFlag = softEditPage.get("RevDOBFlag");
      if(changeDOBFlag) {
        changeDOBFlag = changeDOBFlag.getValue();
      }
      else {
        changeDOBFlag = false;
      }

      if((parsedYear == todayYear && parsedMonth == 4 && parsedDay > 1) || (parsedYear == todayYear && parsedMonth > 4)) {
        ENUMCB.DOBSoft_VLDN("RevDOBFlag");
        changeDOBFlag = softEditPage.get("RevDOBFlag").getValue();
      }

      var age = ENUMCB.calculateAge(parsedMonth, parsedDay, parsedYear, censusDate);
      respPage.put("P_AGE_RV_INT", age);
      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      householdMemberTemp.put("Age",age);

      if(dkRefMonth == "D") {
        birthMonth = "DK";
      }
      else if(dkRefMonth == "R") {
        birthMonth = "REF";
      }
      if(dkRefDay == "D") {
        birthDay = "DK";
      }
      else if(dkRefDay == "R") {
        birthDay = "REF";
      }
      if(dkRefYear == "D") {
        birthYear = "DK";
      }
      else if(dkRefYear == "R") {
        birthYear = "REF";
      }
      var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      householdMemberTemp.put("DOBMonth",birthMonth);
      householdMemberTemp.put("DOBDay",birthDay);
      householdMemberTemp.put("DOBYear",birthYear);

      CB.setMemberInRoster(currentHHMember);
      /*  
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDOBMonth", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_MONTH_REF_RV_IND");

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDOBDay", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_DAY_REF_RV_IND");

      ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDOBYear", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_YEAR_REF_RV_IND");
      */
    }
  }
  catch (e) {
    alert("ENUMCB Error - EnumCB_Rev_DOB_POST:" + e.message);
  }
}

/**
* Created by Mike Hartel
* Sets correct index and gets the member from Roster for the Ethnicity screens. If you are going forward the HouseholdMemberTemp doesnt need to be changed because its the same member from the RACE_QSTN
*
**/
ENUMCB.getMemberForEthnicityQuestion = function() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = questFlags.get("IsGoingBack").getValue();
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  var memberIndexProp = householdRoster.get("CurrentHHMemberIndex");
  var householdMembers = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");

  var memberIndex = (memberIndexProp) ? memberIndexProp.getValue() :1;
  /* got here from Previous*/
  if(isGoingBack == "true"){
    if(previousQuestion == "Race_QSTN") {   
      memberIndex = memberIndex - 1;
      householdRoster.put("CurrentHHMemberIndex", memberIndex);    
      CB.getMemberFromRoster(memberIndex); 
    }  
    else if(previousQuestion == "WhoLivesElsewhere_QSTN"){
      memberIndex = householdMembers.size();
      householdRoster.put("CurrentHHMemberIndex", memberIndex);    
      CB.getMemberFromRoster(memberIndex); 
    } 	
  }  
}

/**
*	Pre action for Rev Age
*	Created by: David Bourque
**/
function EnumCB_RevAge_PRE(){
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("RevAge"); 
}

/*
* Post function for Rev Age
* Created by David Bourque
*/

function EnumCB_RevAge_POST(){
  if(pega.mobile.isHybrid){
    ENUMCB.RevAge_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    if (!workPage.hasMessages()) {
      var cpHouseholdMember = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
      var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
      var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      if (cpHouseholdMember && cpHouseholdRoster && cpQuestFlags) {
        var age = "";
        var dkRefused = cpHouseholdMember.get("DKRefused.RevAge");
        if (dkRefused && (dkRefused.getValue() == "D" || dkRefused.getValue() == "R")) {
          age = dkRefused.getValue();
          responsePage.put("P_AGE_RV_INT",age);
        } else {
          age = responsePage.get("P_AGE_RV_INT").getValue();
        }
        cpHouseholdMember.put("Age",age);
        ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevAge", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_RV_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_AGE_RV_REF_IND");
        var currentHHMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
        CB.setMemberInRoster(currentHHMemberIndex,false);
      }
    }
  }
}

/*
* Function used to clear the checkboxes on Review Screen
* Created by David Bourque
*/

ENUMCB.clearReviewCheckboxes = function() {
  var softEditVLDN = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
  if (softEditVLDN) {
    softEditVLDN.put("ReviewRelationship","false");
    softEditVLDN.put("ReviewSex","false");
    softEditVLDN.put("ReviewDoB","false");
    softEditVLDN.put("ReviewAgeBornAfter","false");
    softEditVLDN.put("ReviewAgeLessThanOneYear","false");
    softEditVLDN.put("ReviewAge","false");
    softEditVLDN.put("ReviewRace","false");
    softEditVLDN.put("ReviewNoChanges","false");
  }
}

/*
* Pre Function for Rev Race
* Created by David Bourque
*/
function EnumCB_RevRace_PRE() {
  if(pega.mobile.isHybrid) {
    /* Reset flag used to tell if screen has been answered */
    var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    questFlagsPage.put("IsRevRaceAnswered","");
    CB.toggleFlag("DKRFEnabled", "true");
    ENUMCB.updateDKRefVisibility("RevRace");
    CB.toggleFlag("ExitSurveyEnabled","true");
  }
}

/*
* Post Function for Rev Race
* Created by David Bourque
*/
function EnumCB_RevRace_POST() {
  /*Retrieve Roster, Questflags, and Response*/
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var cpRaceFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  if(cpResponse && cpQuestFlags && cpRaceFlags ){
    /*Retrieve Race properties and check if null*/
    var white, hisp, black, asian, aian, mena, nhpi, sor = "";
    var cpWhiteFlag = cpRaceFlags.get("IsRaceWhite");
    if(cpWhiteFlag){
      white = "" + cpWhiteFlag.getValue();
      if(white=="true"){
        cpResponse.put("P_RACE_WHITE_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_WHITE_RV_IND", "0");
      }
    }
    var cpHispFlag = cpRaceFlags.get("IsRaceHispanic");
    if(cpHispFlag){
      hisp = "" + cpHispFlag.getValue();
      if(hisp=="true"){
        cpResponse.put("P_RACE_HISP_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_HISP_RV_IND", "0");
      }
    }
    var cpBlackFlag = cpRaceFlags.get("IsRaceBlack");
    if(cpBlackFlag){
      black = "" + cpBlackFlag.getValue();
      if(black=="true"){
        cpResponse.put("P_RACE_BLACK_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_BLACK_RV_IND", "0");
      }
    }
    var cpAsianFlag = cpRaceFlags.get("IsRaceAsian");
    if(cpAsianFlag){
      asian = "" + cpAsianFlag.getValue();
      if(asian=="true"){
        cpResponse.put("P_RACE_ASIAN_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_ASIAN_RV_IND", "0");
      }
    }
    var cpAianFlag = cpRaceFlags.get("IsRaceAIAN");
    if(cpAianFlag){
      aian = "" + cpAianFlag.getValue();
      if(aian=="true"){
        cpResponse.put("P_RACE_AIAN_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_AIAN_RV_IND", "0");
      }
    }
    var cpMenaFlag = cpRaceFlags.get("IsRaceMENA");
    if(cpMenaFlag){
      mena = "" + cpMenaFlag.getValue();
      if(mena=="true"){
        cpResponse.put("P_RACE_MENA_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_MENA_RV_IND", "0");
      }
    }
    var cpNhpiFlag = cpRaceFlags.get("IsRaceNHPI");
    if(cpNhpiFlag){
      nhpi = "" + cpNhpiFlag.getValue();
      if(nhpi=="true"){
        cpResponse.put("P_RACE_NHPI_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_NHPI_RV_IND", "0");
      }
    }
    var cpSorFlag = cpRaceFlags.get("IsRaceOther");
    if(cpSorFlag){
      sor = "" + cpSorFlag.getValue();
      if(sor=="true"){
        cpResponse.put("P_RACE_SOR_RV_IND", "1");
      }else{
        cpResponse.put("P_RACE_SOR_RV_IND", "0");
      }
    }

    /*Check if any values were chosen and set isRaceAnswered flag appropriately*/
    if(white=="true"|| hisp=="true" || black=="true" || asian=="true" || aian=="true" || mena=="true" || nhpi=="true" || sor=="true"){
      cpQuestFlags.put("IsRevRaceAnswered", "true");
    }
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if (isDKRefVisible) {
      ENUMCB.Required("pyWorkPage.QuestFlags.IsRevRaceAnswered","pyWorkPage.HouseholdMemberTemp.DKRefused.RevRace");
    } else {
      ENUMCB.Required("pyWorkPage.QuestFlags.IsRevRaceAnswered");
    }
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevRace", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE_REF_RV_IND");
    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
  }else{
    console.log("ENUMCB Error - " + "Unable to find the Response, QuestFlags, and/or Roster Pages");  
  }
}

/*
* Function to move race and rev race answers into Review Race Page
* Takes in string to tell which page to copy
* Created by David Bourque
*/

ENUMCB.setReviewRacePage = function(page) {
  var ethnicityPage = "";
  if (page == "RaceEthnicity") {
    ethnicityPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RaceEthnicity");
  } else {
    ethnicityPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
  }
  var reviewEthnicityPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.ReviewRaceEthnicity");
  if (!reviewEthnicityPage) {
    var cpHouseholdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    reviewEthnicityPage = cpHouseholdMemberTemp.put("ReviewRaceEthnicity",{});
  }
  reviewEthnicityPage.adoptJSON(ethnicityPage.getJSON());
}

/*
*	Created by: Kyle Gravel
*	used by NoComplete_QSTN
*	Pre Action currently populates datapage with proper options
*/
function EnumCB_NoComplete_PRE() {  
  /*prime dp*/
  ENUMCB.primeNoCompleteOptionsDP();
  /*Disable DKRF and ExitSurvey*/
  CB.toggleFlag("DKRFEnabled", "false");
  CB.toggleFlag("ExitSurveyEnabled", "false");
}

/*
*	Created by: Kyle Gravel
*	Used by NoComplete_QSTN Post action
*/
function EnumCB_NoComplete_POST() { 
  /*First, run validation function*/
  ENUMCB.NoComplete_VLDN();

  /*Find ATTACTUAL and RESP_TYPE_CODE*/
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response")
  /*get ATTACTUAL VALUE*/
  var attActual = responsePage.get("ATTACTUAL");
  attActual = attActual ? attActual.getValue() : "";
  /*get RESP_TYPE_CODE*/
  var respTypeCode = responsePage.get("RESP_TYPE_CODE");
  respTypeCode = respTypeCode ? respTypeCode.getValue() : "";
  /*get NRFU_INCOMPLETE_CODE*/
  var incompleteCode = responsePage.get("NRFU_INCOMPLETE_CODE");
  incompleteCode = incompleteCode ? incompleteCode.getValue() : "";
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  /*IF ATTACTUAL == PV and RESP_TYPE_CODE == HH*/
  if(attActual == "PV" && respTypeCode == "HH") {
    /*Best Time*/
    if(incompleteCode == "1" || incompleteCode == "2") {
      questFlags.put("NextSurveyQuestion","BestTime_QSTN");
    }
    /*Language barrier*/
    else if(incompleteCode == "3") {
      questFlags.put("NextSurveyQuestion","LanguageBarrier_QSTN");
    }
    /*Strategies*/
    else if(incompleteCode == "4" || incompleteCode == "6" || incompleteCode == "7" || incompleteCode == "9") {
      questFlags.put("NextSurveyQuestion","Strategies_QSTN");
    }
    /*Refusal Reason*/
    else if(incompleteCode == "5") {
      questFlags.put("NextSurveyQuestion","RefusalReason_QSTN");
    }
    /*Unable to Attempt*/
    else if(incompleteCode == "8") {
      questFlags.put("NextSurveyQuestion","UnableToAttempt_QSTN");
    }

  }
  /*IF ATTACTUAL == PV and RESP_TYPE_CODE == proxy*/
  else if(attActual == "PV" && respTypeCode == "proxy") {
    /*Type of Proxy*/
    if(incompleteCode == "1" || incompleteCode == "2" || incompleteCode == "4" || incompleteCode == "7" || incompleteCode == "9") {
      questFlags.put("NextSurveyQuestion","TypeOfProxy_QSTN");
    }
    /*Language Barrier*/
    else if(incompleteCode == "3") {
      questFlags.put("NextSurveyQuestion","LanguageBarrier_QSTN");
    }
    /*Refusal Reason*/
    else if(incompleteCode == "5") {
      questFlags.put("NextSurveyQuestion","RefusalReason_QSTN");
    }
    /*Unable to Attempt*/
    else if(incompleteCode == "8") {
      questFlags.put("NextSurveyQuestion","UnableToAttempt_QSTN");
    }
  }
  /*Else*/
  else {
    /*BestTime*/
    if(incompleteCode == "1" || incompleteCode == "2") {
      questFlags.put("NextSurveyQuestion","BestTime_QSTN");
    }
    /*Case Notes*/
    else if(incompleteCode == "3" || incompleteCode == "4" || incompleteCode == "9") {
      questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
    }
    /*Refusal Reason*/
    else if(incompleteCode == "5") {
      questFlags.put("NextSurveyQuestion","RefusalReason_QSTN");
    }
  }
}

/*
*	Created by: Kyle Gravel 
*	Primes D_NoCompleteOptions datapage
*	Used by EnumCB_NoComplete_PRE
*/
ENUMCB.primeNoCompleteOptionsDP = function() {

  /*Grab all answer field values: USED FOR LOCALIZATION*/
  var noCompleteANSW = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete_ANSW");
  var noCompleteANSW1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete1_ANSW");
  var noCompleteANSW2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete2_ANSW");
  var noCompleteANSW3 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete3_ANSW");
  var noCompleteANSW4 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete4_ANSW");
  var noCompleteANSW5 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete5_ANSW");
  var noCompleteANSW6 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete6_ANSW");
  var noCompleteANSW7 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete7_ANSW");
  var noCompleteANSW8 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "NoComplete8_ANSW");

  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  /*get ATTACTUAL VALUE*/
  var attActual = cpResponse.get("ATTACTUAL");
  attActual = attActual ? attActual.getValue() : "";
  /*get RESP_TYPE_CODE*/
  var respTypeCode = cpResponse.get("RESP_TYPE_CODE");
  respTypeCode = respTypeCode ? respTypeCode.getValue() : "";
  var noCompleteDP = pega.ui.ClientCache.find("D_NoCompleteOptions").put("pxResults",[]); 
  var noCompletePage1 = pega.ui.ClientCache.createPage("NoCompletePage1");

  /*set Eligible respondent not avaialable as first option*/
  noCompletePage1.put("pyLabel", noCompleteANSW);
  noCompletePage1.put("pyValue", "1");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
  /*set inconvenient time as next*/
  noCompletePage1.put("pyLabel", noCompleteANSW1);
  noCompletePage1.put("pyValue", "2");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
  /*Set language barrier*/
  noCompletePage1.put("pyLabel", noCompleteANSW2);
  noCompletePage1.put("pyValue", "3");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
  /*set hearing barrier*/
  noCompletePage1.put("pyLabel", noCompleteANSW3);
  noCompletePage1.put("pyValue", "4");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
  /*set refusal by respondent*/
  noCompletePage1.put("pyLabel", noCompleteANSW4);
  noCompletePage1.put("pyValue", "5");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());

  if(attActual == "PV" && respTypeCode == "HH") {
    /*First set Hands the enum completed form */
    noCompletePage1.put("pyLabel", noCompleteANSW5);
    noCompletePage1.put("pyValue", "6");
    noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
    /*Then set Dangerous Address*/
    noCompletePage1.put("pyLabel", noCompleteANSW6);
    noCompletePage1.put("pyValue", "7");
    noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
    /*Then Set Not a Housing unit*/
    noCompletePage1.put("pyLabel", noCompleteANSW7);
    noCompletePage1.put("pyValue", "8");
    noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
  }

  if(attActual == "PV" && respTypeCode == "proxy"){
    /*First set Dangerous Address*/
    noCompletePage1.put("pyLabel", noCompleteANSW6);
    noCompletePage1.put("pyValue", "7");
    noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());
    /*Then Set Not a housing unit*/
    noCompletePage1.put("pyLabel", noCompleteANSW7);
    noCompletePage1.put("pyValue", "8");
    noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());      
  }
  /*Set Other*/
  noCompletePage1.put("pyLabel", noCompleteANSW8);
  noCompletePage1.put("pyValue", "9");
  noCompleteDP.add().adoptJSON(noCompletePage1.getJSON());

}




/**
*	Function for Rev black pre action
*	Created by Ramin M
**/
function EnumCB_RevDetailedOriginBlack_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled", "true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginBlack");
}

/**
*	Function for Rev black post action
*	Created by Ramin M, Jack McCloskey
**/
function EnumCB_RevDetailedOriginBlack_POST() {
  ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginBlack");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if (!workPage.hasMessages()) {
    var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
    var ethBlackAfAm = ethFlags.get("IsEthnicityBlackAfricanAmerican").getValue();
    var ethBlackEthiopian = ethFlags.get("IsEthnicityBlackEthiopian").getValue();
    var ethBlackHaitian = ethFlags.get("IsEthnicityBlackHaitian").getValue();
    var ethBlackJamaican = ethFlags.get("IsEthnicityBlackJamaican").getValue();
    var ethBlackNigerian = ethFlags.get("IsEthnicityBlackNigerian").getValue();
    var ethBlackSomali = ethFlags.get("IsEthnicityBlackSomali").getValue();
    var writeInValue = respPage.get("P_RACE2_BLACK_RV_TEXT").getValue();
    var numberSelected = 0;

    if(ethBlackAfAm) {
      respPage.put("P_RACE2_AFAM_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_AFAM_IND", "0");
    }
    if(ethBlackEthiopian) {
      respPage.put("P_RACE2_ETHIOPIAN_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_ETHIOPIAN_IND", "0");
    }
    if(ethBlackHaitian) {
      respPage.put("P_RACE2_HAITIAN_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_HAITIAN_IND", "0");
    }
    if(ethBlackJamaican) {
      respPage.put("P_RACE2_JAMAICAN_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_JAMAICAN_IND", "0");
    }
    if(ethBlackNigerian) {
      respPage.put("P_RACE2_NIGERIAN_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_NIGERIAN_IND", "0");
    }
    if(ethBlackSomali) {
      respPage.put("P_RACE2_SOMALI_IND", "1");
      numberSelected++;
    }
    else {
      respPage.put("P_RACE2_SOMALI_IND", "0");
    }
    if(writeInValue != "") {
      numberSelected++;
    }

    ethFlags.put("IsEthnicityBlackWriteIn", writeInValue);
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginBlack", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_BLACK_DK_RV_IND", "pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_BLACK_REF_RV_IND");  
    ENUMCB.DetailedOrigin_VLDN(numberSelected, "RevDetailedOriginBlack");
    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);

  }
}
/**
*	Function for rev SOR pre action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginSOR_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("RevDetailedOriginSOR");
}

/**
*	Function for rev SOR post action
*	Created by Dillon Irish
**/
function EnumCB_RevDetailedOriginSOR_POST() {
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_RACE2_SOR_RV_TEXT", "pyWorkPage.HouseholdMemberTemp.DKRefused.RevDetailedOriginSOR");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  if (!workPage.hasMessages()) {
    var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
    var dkRefProp = dkRefused.get("RevDetailedOriginSOR");

    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
    if(dkRefProp == "D") {
      respPage.put("P_RACE2_SOR_DK_RV_IND", "1");
      respPage.put("P_RACE2_SOR_REF_RV_IND", "0");
    }
    else if(dkRefProp == "R") {
      respPage.put("P_RACE2_SOR_DK_RV_IND", "0");
      respPage.put("P_RACE2_SOR_REF_RV_IND", "1");
    }

    var ethFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.RevRaceEthnicity");
    var writeInValue = respPage.get("P_RACE2_SOR_RV_TEXT").getValue();
    ethFlags.put("IsEthnicityOtherWriteIn", writeInValue);

    ENUMCB.setReviewRacePage("RevRaceEthnicity");
    var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
    var curMemberIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    CB.setMemberInRoster(curMemberIndex,false);
  }
}

/**
* Pre function for Language Barrier QSTN
* Created by: Dillon Irish
**/

function EnumCB_LanguageBarrier_PRE(){
	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
	questFlags.put("LanguageBarrierOtherCheckbox", false);
}


/**
* Post function for Language Barrier QSTN
* Created by: Dillon Irish
**/
  
function EnumCB_LanguageBarrier_POST () {
	var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
	var languageList = pega.ui.ClientCache.find("D_LanguageList.pxResults").iterator();
	var listForCounter = pega.ui.ClientCache.find("D_LanguageList.pxResults").iterator();
	var counter = 0;
	respPage.put("NRFU_RESP_LANG_CODE", []);
	var NRFU_RESP_LANG_CODE = respPage.get("NRFU_RESP_LANG_CODE");
	var NRFU_RESP_LANG_CODEIterator = NRFU_RESP_LANG_CODE.iterator();
	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
	var languageOtherCheckbox = questFlags.get("LanguageBarrierOtherCheckbox").getValue();
	
	if(languageOtherCheckbox == true){
		counter += 1;
	}

	while(listForCounter.hasNext()) {  
		var thisPage = listForCounter.next();
		if (thisPage.get("pySelected").getValue() == true) {
			counter += 1;
		}
	}
	
	var pyWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  
    if(counter == 0) {
    	pyWorkPage.addMessage(errorMessage);
    }
	
	if (!pyWorkPage.hasMessages()) {
		while(languageList.hasNext()) {  
			var thisPage = languageList.next();
			if (thisPage.get("pySelected").getValue() == true) {
			  var code = thisPage.get("Code").getValue();
			  var lanPage = pega.ui.ClientCache.createPage("LanguageCodes");

			  lanPage.put("SOLICIT_LANGUAGE_CODE", code);
			  NRFU_RESP_LANG_CODE.add().adoptJSON(lanPage.getJSON());
			}
		}
	}
}

/**
*	Pre Function for Language Barrier Resp QSTN
*	Created by Aansh Kapadia
**/
function EnumCB_LanguageBarrierResp_PRE() {
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","false");
  ENUMCB.updateDKRefVisibility("LanguageBarrierResp");

  var languageList = pega.ui.ClientCache.find("D_LanguageList.pxResults").iterator();
  while(languageList.hasNext()) {  
    var thisPage = languageList.next();
    if (thisPage.get("pySelected").getValue()) {
      thisPage.put("pySelected", '');
    }
  }
}

/**
* Post function for Language Barrier Resp QSTN
* Created by: Aansh Kapadia
**/

function EnumCB_LanguageBarrierResp_POST () {
  var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
  var languageList = pega.ui.ClientCache.find("D_LanguageList.pxResults").iterator();
  var counter = 0;

  respPage.put("NRFU_RESP_LANG_CODE", []);

  var NRFU_RESP_LANG_CODE = respPage.get("NRFU_RESP_LANG_CODE");
  var NRFU_RESP_LANG_CODEIterator = NRFU_RESP_LANG_CODE.iterator();

  while(languageList.hasNext()) {  
    var thisPage = languageList.next();
    if (thisPage.get("pySelected").getValue() == true) {
      var code = thisPage.get("Code").getValue();
      var lanPage = pega.ui.ClientCache.find("LanguageCodes");
      counter += 1;

      lanPage.put("SOLICIT_LANGUAGE_CODE", code);
      NRFU_RESP_LANG_CODE.add().adoptJSON(lanPage.getJSON());
    }
  }
  ENUMCB.LanguageBarrierResp_VLDN(counter, "LanguageBarrierResp");
  ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.LanguageBarrierResp", "pyWorkPage.HouseholdMemberTemp.Response.NRFU_RESP_LANG_CODE_DK", "pyWorkPage.HouseholdMemberTemp.Response.NRFU_RESP_LANG_CODE_REF"); 
}


/*
*	Post Action for Unable to Attempt 
*	Created by: David Bourque
*/
function EnumCB_UnableToAttempt_POST(){
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.UnableToAttempt_VLDN();
  if (!workPage.hasMessages()) {
    var cpResponse = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var answer = parseInt(cpResponse.get("NRFU_UNABLE_CODE").getValue());
    if (answer == 9) {
      cpQuestFlags.put("NextSurveyQuestion","Strategies_QSTN");
    } else if (answer == 10) {
      cpQuestFlags.put("NextSurveyQuestion","ExitPopStatus_QSTN");
    } else {
      cpQuestFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
    }
  }
}

/*
*	Pre Action for Unable to Attempt 
*	Created by: David Bourque
*/
function EnumCB_UnableToAttempt_PRE(){
  CB.toggleFlag("DKRFEnabled", "false");
  CB.toggleFlag("ExitSurveyEnabled","false");
}

/*
*	Pre Action for Strategies_QSTN
*	Created by Ebenezer Owoeye
*/
function EnumCB_Strategies_PRE() {
  CB.toggleFlag("DKRFEnabled","false");
  CB.toggleFlag("ExitSurveyEnabled","false");
}

/*
*	Post Action for Strategies_QSTN
*	Created by Ebenezer Owoeye
*/
function EnumCB_Strategies_POST() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.HasLeftNoticeOfVisit");
  if (!workPage.hasMessages()) {
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var answer = responsePage.get("HasLeftNoticeOfVisit").getValue();
    if (answer == "1") {
      responsePage.put("NRFU_LEFTNOTICE_YES_IND","1");
      responsePage.put("NRFU_LEFTNOTICE_NO_IND","0");
    } else {
      responsePage.put("NRFU_LEFTNOTICE_YES_IND","0");
      responsePage.put("NRFU_LEFTNOTICE_NO_IND","1");
    }
  }
}




/*
*	Pre Action for Who_QSTN
*	Created by Jared Nichols
*/

function EnumCB_Who_PRE() {
  CB.toggleFlag("DKRFEnabled","true");
  CB.toggleFlag("ExitSurveyEnabled","true");
}

/*
*	Post Action for Who_QSTN
*	Created by Jared Nichols
*/

function EnumCB_Who_POST() {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if (isDKRefVisible == "true") {
		ENUMCB.Required("pyWorkPage.Respondent.DoesKnowResident", "pyWorkPage.Respondent.DKRefused.Who");
	} else {
		ENUMCB.Required("pyWorkPage.Respondent.DoesKnowResident");
	}
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	if (!workPage.hasMessages()) {
		var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      	var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent")
		var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
		var answer = respondentPage.get("DoesKnowResident").getValue();
			if (answer == "1") {
				questFlags.put("NextSurveyQuestion", "PopCount_QSTN");
				responsePage.put("NRFU_WHO_CODE", "1");
			} 
              else if (answer == "0") {
				questFlags.put("NextSurveyQuestion", "ExitPopStatus_QSTN");
				responsePage.put("NRFU_WHO_CODE", "2");
			} else {
				questFlags.put("NextSurveyQuestion", "ExitPopStatus_QSTN");
				responsePage.put("NRFU_WHO_CODE", "9");
			}
	}
 }
/**
*	Pre Function for Anyone Question
*	Created by Mark Coats
**/
function EnumCB_Anyone_PRE()
{
  /*DKRef*/
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibility("Anyone");
}

/**
* Post function for Anyone Resp QSTN
* Created by: Mark Coats
**/

function EnumCB_Anyone_POST()
{
  try
  {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.Respondent.AnyoneLiveThere",
                                   "pyWorkPage.Respondent.DKRefused.Anyone");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.Respondent.AnyoneLiveThere");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages())
    {
      var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
      ENUMCB.setDKRefResponse("pyWorkPage.Respondent.DKRefused.Anyone", "pyWorkPage.Respondent.Response.H_OCC_DK_PRX_IND", "pyWorkPage.Respondent.Response.H_OCC_REF_PRX_IND");
      var dkRefused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
      var respondentPage = pega.ui.ClientCache.find("pyWorkPage.Respondent");
      var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
      if(respondentPage && questFlags && respPage)
      {
          respPage.put("H_OCC_YES_PRX_IND", "0");
          respPage.put("H_OCC_NO_PRX_IND", "0");
          respPage.put("H_OCC_NOT_HUNIT_IND", "0");
          questFlags.put("NextSurveyQuestion", "");
          if(dkRefused)
          {
              var cpDKRefused = dkRefused.get("Anyone")? dkRefused.get("Anyone").getValue() : "";
              if((cpDKRefused == "R") || (cpDKRefused == "D"))
              {
				 questFlags.put("NextSurveyQuestion", "NoComplete_QSTN");
                 questFlags.put("ExitSurveyAction", "NoComplete_QSTN");
              }
          }
          var anyoneLiveThere = respondentPage.get("AnyoneLiveThere");
          if(anyoneLiveThere)
          {
              var cpAnyoneLiveThere = anyoneLiveThere.getValue();
              if(cpAnyoneLiveThere == "Y")
              {
                  questFlags.put("NextSurveyQuestion", "Who_QSTN");
                  respPage.put("H_OCC_YES_PRX_IND", "1");
              }
              else if(cpAnyoneLiveThere == "N")
              {
                  questFlags.put("NextSurveyQuestion", "Occupancy_QSTN");
                  respPage.put("H_OCC_NO_PRX_IND", "1");
              }
              else if(cpAnyoneLiveThere == "U")
              {
                  questFlags.put("NextSurveyQuestion", "SpecificUnitStatus_QSTN");
                  respPage.put("H_OCC_NOT_HUNIT_IND", "1");
              }
          }
      }
    }
  }
  catch(Err)
  {
     alert(Err.message);
  }
}

/*
*	Pre Action for Baby Flag
*	Created by: David Bourque
*/
function EnumCB_BabyFlag_PRE(){
  CB.toggleFlag("DKRFEnabled", "false");
  CB.toggleFlag("ExitSurveyEnabled","true");
  var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isGoingBack = cpQuestFlags.get("IsGoingBack").getValue();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var cpHouseholdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
  if (isGoingBack+"" == "true") {
    var previousQuestion = workPage.get("CurrentSurveyQuestion").getValue();
    var currentHHIndex = parseInt(cpHouseholdRoster.get("CurrentHHMemberIndex").getValue());
    if (previousQuestion == "DOB_QSTN") {
      currentHHIndex = currentHHIndex -1;
      cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      CB.getMemberFromRoster(currentHHIndex);
    } else if (previousQuestion == "Race_QSTN" || previousQuestion == "RelationshipCheck_QSTN") {
      currentHHIndex = cpHouseholdRoster.get("HouseholdMember").size();
      cpHouseholdRoster.put("CurrentHHMemberIndex",currentHHIndex);
      CB.getMemberFromRoster(currentHHIndex);
    }
  }
}

/*
*	Post Action for Baby Flag
*	Created by: David Bourque
*/
function EnumCB_BabyFlag_POST(){
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_BIRTH_ACD_YES_IND");
  if (!workPage.hasMessages()) {
    var cpTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
    var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var answer = cpResponse.get("P_BIRTH_ACD_YES_IND").getValue();
    if (answer == "1") {
      cpResponse.put("P_BIRTH_ACD_YES_IND","1");
      cpResponse.put("P_BIRTH_ACD_NO_IND","0");
      cpTemp.put("Age",-1);
      cpQuestFlags.put("NextSurveyQuestion","");
      var params = {isFirstTimeProp:"IsFirstTimeDOB"};
      ENUMCB.updateMemberIndexPost(params);
      ENUMCB.AreParentsYoungerthanChildren();
    } else {
      cpResponse.put("P_BIRTH_ACD_YES_IND","0");
      cpResponse.put("P_BIRTH_ACD_NO_IND","1");
      cpQuestFlags.put("NextSurveyQuestion","ChangeDOB_QSTN");
    }
  }
}

/*
* Function to clear text box for PersonalNonContact screen on click of radio button
* By: Aditi Ashok
*/
ENUMCB.personalNonContact_clearTextBox = function () {
  	var workPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");  
  	var clearProperty = workPage.get("PERSONAL_NON_CONTACT_CODE_SPECIFY");
	clearProperty = (clearProperty) ? clearProperty.getValue() : "";
  	clearProperty = "";
	workPage.put("PERSONAL_NON_CONTACT_CODE_SPECIFY","");	
    pega.u.d.setProperty("pyWorkPage.Respondent.Response.PERSONAL_NON_CONTACT_CODE_SPECIFY", "");
}

/* 
* Pre action for PersonalNonContact Screen 
* By: Aditi Ashok
*/
function EnumCB_PersonalNonContact_PRE () {
	CB.toggleFlag("ExitSurveyEnabled","false");
	CB.toggleFlag("DKRFEnabled","false")
}

/* 
* Post action for PersonalNonContact Screen 
* By: Aditi Ashok
*/
function EnumCB_PersonalNonContact_POST () {
	var response = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
	var nonContactCode = response.get("PERSONAL_NON_CONTACT_CODE");
  	var nonContactCodeSpecify = response.get("PERSONAL_NON_CONTACT_CODE_SPECIFY");
	
  	nonContactCode = (nonContactCode) ? nonContactCode.getValue(): "";
  	nonContactCodeSpecify = (nonContactCodeSpecify) ? nonContactCodeSpecify.getValue():"";
  
	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  
 
  	ENUMCB.Required("pyWorkPage.Respondent.Response.PERSONAL_NON_CONTACT_CODE", "", "Please select a category."); 
  	if (nonContactCode == "1" || nonContactCode == "2") {
      	/*Text box validation */
      	ENUMCB.Required("pyWorkPage.Respondent.Response.PERSONAL_NON_CONTACT_CODE_SPECIFY", "", "Please provide a description.");
    }
	
	/* Branching */
	if (nonContactCode == "2") {
		/* Appears nonresidential */
		questFlags.put("NextSurveyQuestion", "CaseNotes_QSTN");
	} else {
		questFlags.put("NextSurveyQuestion", "Strategies_QSTN");
	}
}

/*
* Pre action for Occupancy_QSTN
* Created by: Jason Wong
*/
function EnumCB_Occupancy_PRE() {
	ENUMCB.updateDKRefVisibility("Occupancy", "pyWorkPage.Respondent.DKRefused");
	CB.toggleFlag("ExitSurveyEnabled","true");
	CB.toggleFlag("DKRFEnabled","true");
	
}

/*
* Post action for Occupancy_QSTN
* Created by: Jason Wong
*/
function EnumCB_Occupancy_POST() {
	/* Call validation to check if an answer was selected */
	ENUMCB.Occupancy_VLDN();
	
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
  
  	/* If there are no error messages from validation, continue */
  	if(!workPage.hasMessages()) { 	
      var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
      var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
      var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

      var respOccupancyCode = workPage.get("Respondent.Occupancy").getValue();

      /* Occupancy Code = Vacant */
      if(respOccupancyCode == "1") {
          responsePage.put("NRFU_OCCUPANCY_CODE","1");
          responsePage.put("H_NOT_HUNIT_STATUS_CODE","vacant");
          dkRefPage.put("Popcount", "0");

          questFlags.put("NextSurveyQuestion","VacantDescription_QSTN");

      }
      /* Occupancy Code = Not a housing unit */
      else if (respOccupancyCode == "2") {
          responsePage.put("NRFU_OCCUPANCY_CODE","2");
          responsePage.put("H_NOT_HUNIT_STATUS_CODE","nothu");
          dkRefPage.put("Popcount", "0");

          questFlags.put("NextSurveyQuestion","SpecificUnitStatus_QSTN");
      }	
      /* DK/Ref selected */
      else {
          var dkRefResponse = dkRefPage.get("Occupancy").getValue();

          /* Reponse = DK */
          if(dkRefResponse=="D") {
              responsePage.put("NRFU_OCCUPANCY_CODE","8");
          } 
          /* Response = Refused */
          else {
              responsePage.put("NRFU_OCCUPANCY_CODE","9");
          }

          responsePage.put("H_NOT_HUNIT_STATUS_CODE","null");
          dkRefPage.put("Popcount", "0");	

          questFlags.put("NextSurveyQuestion","NoComplete_QSTN");
      }
    }
}
/**
*	Pre Function for Language Phone Question
*	Created by Mark Coats
**/
function EnumCB_LanguagePhone_PRE()
{
  /*DKRef*/
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","false");
  ENUMCB.updateDKRefVisibility("LanguagePhone");
}

/**
* Post function for Language Phone QSTN
* Created by: Mark Coats
**/

function EnumCB_LanguagePhone_POST()
{
  try
  {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var validation = "";
    if (isDKRefVisible == "true") {
      validation = ENUMCB.Required("pyWorkPage.Respondent.LanguagePhoneNumber",
                                   "pyWorkPage.Respondent.DKRefused.LanguagePhone");
    } 
    else {
      validation = ENUMCB.Required("pyWorkPage.Respondent.LanguagePhoneNumber");
    }
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if (!workPage.hasMessages())
    {
	    var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
        var respCode = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
        var respondent = pega.ui.ClientCache.find("pyWorkPage.Respondent");
        if(questFlags && respCode && respondent)
        {
            var cpLangPhoneNumber = respondent.get("LanguagePhoneNumber") ? respondent.get("LanguagePhoneNumber").getValue() : "";
            var areaCode = cpLangPhoneNumber.substring(1,4);
  			var prefixCode = cpLangPhoneNumber.substring(6,9);
  			var phoneNumber = cpLangPhoneNumber.substring(10);
            respCode.put("ADR_PRV_PH_AREA_ID", areaCode);
            respCode.put("ADR_PRV_PH_PREFIX_ID", prefixCode);
            respCode.put("ADR_PRV_PH_SUFFIX_ID", phoneNumber);
            var attType = respCode.get("ATTACTUAL");
            var cpAttType = attType? attType.getValue(): "";
            var typeCode = respCode.get("RESP_TYPE_CODE");
            var cpTypeCode = typeCode? typeCode.getValue() : "";
            if( (cpTypeCode == "HH") && (cpAttType == "PV"))
            {
                questFlags.put("NextSurveyQuestion", "Strategies_QSTN")
            }
            else
            {
        		questFlags.put("NextSurveyQuestion", "CaseNotes_QSTN");
            }
        }
    }
  }
  catch(Err)
  {
     alert(Err.message);
  }
}

/* 
* Pre action for Specific Unit Status Screen 
* By: Aditi Ashok
*/
function EnumCB_SpecificUnitStatus_PRE () {
	CB.toggleFlag("ExitSurveyEnabled","true");
	CB.toggleFlag("DKRFEnabled","true");
  	ENUMCB.updateDKRefVisibility("SpecificUnitStatus");
}

/* 
* Post action for Specific Unit Status Screen 
* By: Aditi Ashok
*/
function EnumCB_SpecificUnitStatus_POST () {
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
  	var response = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  	var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  	  
	/* validation */
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if (isDKRefVisible == "true") {
      ENUMCB.Required("pyWorkPage.Respondent.Response.NOT_HOUSING_UNIT_STATUS_CODE", "pyWorkPage.Respondent.DKRefused.SpecificUnitStatus");
      response.put("H_NOT_HUNIT_STATUS_CODE","nothu");
	  dkRefPage.put("Popcount", "0");
    } 
    else {
      ENUMCB.Required("pyWorkPage.Respondent.Response.NOT_HOUSING_UNIT_STATUS_CODE", "", "Please provide an answer to the question.");
      dkRefPage.put("Popcount", "0");
    }
  	
   	if (!workPage.hasMessages()) {
  		ENUMCB.setDKRefResponse("pyWorkPage.Respondent.DKRefused.SpecificUnitStatus", "pyWorkPage.Respondent.Response.SPECIFIC_UNIT_STATUS_DK_IND", 
                            "pyWorkPage.Respondent.Response.SPECIFIC_UNIT_STATUS_REF_IND");
  		questFlags.put("NextSurveyQuestion", "ProxyName_QSTN");  	
    }
}

/*
* Function to clear text box for SpecificUnitStatus screen on click of radio button
* By: Aditi Ashok
*/
ENUMCB.specificUnitStatus_clearTextBox = function () {
  	var workPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");  
  	var clearProperty = workPage.get("NOT_HOUSING_UNIT_STATUS_CODE_SPECIFY");
	clearProperty = (clearProperty) ? clearProperty.getValue() : "";
  	clearProperty = "";
	workPage.put("NOT_HOUSING_UNIT_STATUS_CODE_SPECIFY","");	
    pega.u.d.setProperty("pyWorkPage.Respondent.Response.NOT_HOUSING_UNIT_STATUS_CODE_SPECIFY", "");
}

/*
*	Created by: Kyle Gravel
*	Pre/Post Processing for VacancyDescription_QSTN
*/
function ENUMCB_VacantDescription_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","true");
  CB.toggleFlag("DKRFEnabled","true");
  ENUMCB.updateDKRefVisibility("VacancyDescription","pyWorkPage.Respondent.DKRefused");
}

function ENUMCB_VacantDescription_POST() {
  /*Validate that VacancyDescription has value and throw hard edit if not*/
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.VacancyDescription", "pyWorkPage.Respondent.DKRefused.VacancyDescription");
  } 
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.VacancyDescription");
  }

  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var vacancyDescription = householdMemberTemp.get("VacancyDescription");
  vacancyDescription = vacancyDescription ? vacancyDescription.getValue() : "";
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  
  /*Set response props*/
  if(vacancyDescription == "1") {
    responsePage.put("H_VAC_FORRENT_IND","1");
  }
  else {
    responsePage.put("H_VAC_FORRENT_IND","0");
  }
  if(vacancyDescription == "2") {
    responsePage.put("H_VAC_RENTNOTOCC_IND","1");
  }
  else {
    responsePage.put("H_VAC_RENTNOTOCC_IND","0");
  }
  if(vacancyDescription == "3") {
    responsePage.put("H_VAC_FORSALE_IND","1");
  }
  else {
    responsePage.put("H_VAC_FORSALE_IND","0");
  }
  if(vacancyDescription == "4") {
    responsePage.put("H_VAC_SOLDNOTOCC_IND","1");
  }
  else {
    responsePage.put("H_VAC_SOLDNOTOCC_IND","0");
  }
  if(vacancyDescription == "5") {
    responsePage.put("H_VAC_SEASON_IND","1");
  }
  else {
    responsePage.put("H_VAC_SEASON_IND","0");
  }
  if(vacancyDescription == "6") {
    responsePage.put("H_VAC_MIGRANT_IND","1");
  }
  else {
    responsePage.put("H_VAC_MIGRANT_IND","0");
  }
  if(vacancyDescription == "7") {
    responsePage.put("H_VAC_OTHER_IND","1");
    questFlags.put("NextSurveyQuestion","OtherVacant_QSTN");
  }
  else {
    responsePage.put("H_VAC_OTHER_IND","0");
    questFlags.put("NextSurveyQuestion","ProxyName_QSTN");
  }
  /*Set Pop Count to zero according to special instructions*/
  responsePage.put("H_SIZE_STATED_INT",0);
}

/*
*	Pre/Post functionality for OtherVacant_QSTN
*	Created by: Kyle Gravel, Joe Paul
*	
*/
function ENUMCB_OtherVacant_PRE() {
  CB.toggleFlag("ExitSurveyEnabled","true");
  CB.toggleFlag("DKRFEnabled","true");
  ENUMCB.updateDKRefVisibility("OtherVacant");
}

function ENUMCB_OtherVacant_POST() {
  /*Validate that VacancyDescription has value and throw hard edit if not*/
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.OtherVacancyDescription", "pyWorkPage.Respondent.DKRefused.OtherVacant");
  } 
  else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.OtherVacancyDescription");
  }

  var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp");
  var otherVacant = householdMemberTemp.get("OtherVacancyDescription");
  otherVacant = otherVacant ? otherVacant.getValue() : "";
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  /*Set response props
  if(vacancyDescription == "1") {
    responsePage.put("H_VAC_FORRENT_IND","1");
  }
  else {
    responsePage.put("H_VAC_FORRENT_IND","0");
  }
  if(vacancyDescription == "2") {
    responsePage.put("H_VAC_RENTNOTOCC_IND","1");
  }
  else {
    responsePage.put("H_VAC_RENTNOTOCC_IND","0");
  }
  if(vacancyDescription == "3") {
    responsePage.put("H_VAC_FORSALE_IND","1");
  }
  else {
    responsePage.put("H_VAC_FORSALE_IND","0");
  }
  if(vacancyDescription == "4") {
    responsePage.put("H_VAC_SOLDNOTOCC_IND","1");
  }
  else {
    responsePage.put("H_VAC_SOLDNOTOCC_IND","0");
  }
  if(vacancyDescription == "5") {
    responsePage.put("H_VAC_SEASON_IND","1");
  }
  else {
    responsePage.put("H_VAC_SEASON_IND","0");
  }
  if(vacancyDescription == "6") {
    responsePage.put("H_VAC_MIGRANT_IND","1");
  }
  else {
    responsePage.put("H_VAC_MIGRANT_IND","0");
  }
  if(vacancyDescription == "7") {
    responsePage.put("H_VAC_OTHER_IND","1");
  }
  else {
    responsePage.put("H_VAC_OTHER_IND","0");
  }
	*/
  questFlags.put("NextSurveyQuestion","ProxyName_QSTN");
}

/* 
* Used to clear props in Exit Pop Status Screen
* Created by David Bourque
*/

ENUMCB.clearCorrPropExitPopStatus = function(propVal) {
  if (propVal == 2 || propVal == 3) {
    ENUMCB.clearCorrProp("pyWorkPage.Respondent.Response.H_SIZE_EST_NRFU_INT",propVal);
  }
}

/* 
* Used to set props in Exit Pop Status Screen
* Created by David Bourque
*/

ENUMCB.setExitPopUnitStatus = function(propVal) {
  if (propVal != "") {
    $('#H_NRFU_STATUS_EXIT_CODE1').click();
    ENUMCB.clearCorrProp("pyWorkPage.Respondent.DKRefused.ExitPopStatusUnitStatus",propVal);
  }
}

/*
*	used by RefusalReason_QSTN
*/
function EnumCB_RefusalReason_PRE() {  
  
  /*Disable DKRF and ExitSurvey*/
  CB.toggleFlag("DKRFEnabled", "false");
  CB.toggleFlag("ExitSurveyEnabled", "false");
}

/*
*	Used by RefusalReason_QSTN Post action
*/
function EnumCB_RefusalReason_POST() { 
  
  /*Get pages */
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response")
  var refusalReasonPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.RefusalReason");
  
   /*First, run validation function*/
  ENUMCB.RefusalReason_VLDN();
  if (refusalReasonPG.hasMessages()) {
    return;
  }
  
  
  /*get ATTACTUAL VALUE*/
  var attActual = responsePage.get("ATTACTUAL");
  attActual = attActual ? attActual.getValue() : "";
  /*get RESP_TYPE_CODE*/
  var respTypeCode = responsePage.get("RESP_TYPE_CODE");
  respTypeCode = respTypeCode ? respTypeCode.getValue() : "";
  /*get NRFU_INCOMPLETE_CODE*/
  var incompleteCode = responsePage.get("NRFU_INCOMPLETE_CODE");
  incompleteCode = incompleteCode ? incompleteCode.getValue() : "";
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");

  /*IF ATTACTUAL == PV and RESP_TYPE_CODE == HH*/
  if(attActual == "PV" && respTypeCode == "HH") {
     questFlags.put("NextSurveyQuestion","Strategies_QSTN");
  } else if(attActual == "T" && respTypeCode == "HH") {
    questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
  } else if(respTypeCode == "proxy") {
    questFlags.put("NextSurveyQuestion","TypeOfProxy_QSTN");
  } else {
    /* Default */
  }
}

/*
*	Pre Action for Exit Pop Status
*	Created by: David Bourque
*/
function EnumCB_ExitPopStatus_PRE(){
  CB.toggleFlag("DKRFEnabled", "true");
  CB.toggleFlag("ExitSurveyEnabled","true");
  ENUMCB.updateDKRefVisibilityfor2PropertiesRespondent("ExitPopStatusNumber","ExitPopStatusUnitStatus");
  var cpResponse = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var exitNumber = cpResponse.get("H_SIZE_EST_NRFU_INT");
  if (exitNumber && parseInt(exitNumber.getValue()) == 0) {
    cpResponse.put("H_SIZE_EST_NRFU_INT","");
  }
}

/*
*	Post Action for Exit Pop Status
*	Created by: David Bourque
*/
function EnumCB_ExitPopStatus_POST(){
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  ENUMCB.ExitPopStatus_VLDN();
  if (!workPage.hasMessages()) {
    var cpResponse = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
    var cpQuestFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
    var isCensusDayAddress = cpResponse.get("IsCensusDayAddress");
    var nrfuWhoCode = cpResponse.get("NRFU_WHO_CODE");
    var whoDKRefused = cpDKRefused.get("Who");
    if (isCensusDayAddress && isCensusDayAddress.getValue() == "0") {
      cpQuestFlags.put("NextSurveyQuestion","InMoverDone_QSTN");
    } else if ((whoDKRefused && whoDKRefused.getValue() == "R") || (nrfuWhoCode && nrfuWhoCode.getValue() == "2")) {
      cpQuestFlags.put("NextSurveyQuestion","Goodbye_QSTN");
    } else {
      cpQuestFlags.put("NextSurveyQuestion","NoComplete_QSTN");
    }

    var unitStatus = cpResponse.get("H_NRFU_STATUS_EXIT_CODE");
    var exitNumber = cpResponse.get("H_SIZE_EST_NRFU_INT");
    if (unitStatus && (unitStatus.getValue() == "2" || unitStatus.getValue() == "3")) {
      cpResponse.put("H_SIZE_EST_NRFU_INT",0);
    }
    if (exitNumber && parseInt(exitNumber.getValue()) >= 1 && parseInt(exitNumber.getValue()) <= 99) {
      cpResponse.put("H_NRFU_STATUS_EXIT_CODE",1);
    }
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ExitPopStatusNumber", "pyWorkPage.HouseholdMemberTemp.Response.H_SIZE_EST_NRFU_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.H_SIZE_EST_NRFU_REF_IND");
    ENUMCB.setDKRefResponse("pyWorkPage.HouseholdMemberTemp.DKRefused.ExitPopStatusUnitStatus", "pyWorkPage.HouseholdMemberTemp.Response.H_NRFU_STATUS_DK_IND", "pyWorkPage.HouseholdMemberTemp.Response.H_NRFU_STATUS_REF_IND");
  }
}

/*
* Updates the DKRef visibility when Screen has two dk/refused porperties using Respondent Page
* Created by David Bourque
*/ 

ENUMCB.updateDKRefVisibilityfor2PropertiesRespondent = function(firstProp, secondProp) {
  var dkRefused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
  var firstdkref = dkRefused.get(firstProp);
  var seconddkref = dkRefused.get(secondProp);
  firstdkref = firstdkref ? firstdkref.getValue() : "";
  seconddkref = seconddkref ? seconddkref.getValue() : "";
  if(firstdkref != "" || seconddkref != "") {
    CB.toggleFlag("IsDKRefVisible", "true");
  }
  else {
    CB.toggleFlag("IsDKRefVisible", "false");
  }
}




/*
* Pre Action for ProxyName_QSTN
*/
function EnumCB_ProxyName_PRE() {
  CB.toggleFlag("DKRFEnabled", "true"); 
  CB.toggleFlag("ExitSurveyEnabled", "false");
}
/*
*/
function EnumCB_ProxyName_POST() {
  if(pega.mobile.isHybrid) {
    ENUMCB.updateDisabledDKRefColor();
    ENUMCB_ProxyName_VLDN();
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    /**This block enables the DKRef a long as there are no error messages and we can move forward **/
    if(!workPage.hasMessages()) {
      CB.toggleFlag("DKRFEnabled","true");
    }
  }
}
  /**
* Post action for Resp Phone to copy temp phone into RESP_PH_NUMBER_TEXT
*
* Created by: 
*/
 
  
function EnumCB_ProxyPhone_PRE() {
  if(pega.mobile.isHybrid) {
    ENUMCB.updateDKRefVisibility("RespPhone", "pyWorkPage.Respondent.DKRefused");
    CB.toggleFlag("DKRFEnabled", "true");
    CB.toggleFlag("ExitSurveyEnabled", "true");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var phone = respPage.get("RESP_PH_NUMBER_TEXT");
    phone = phone ? phone.getValue() : "";
    var telephone = pega.ui.ClientCache.find("pyWorkPage.Respondent.TelephoneInfo.TelephoneNumber(1)");
    var answerSelected = telephone.get("CountryCode");
   if(!answerSelected) {
      var D_RespPhoneOptions = pega.ui.ClientCache.find("D_RespPhoneOptions");
      var phoneNumbers = pega.ui.ClientCache.find("D_RespPhoneOptions").put("pxResults",[]); 
      if(phone != "") {
        var phonePage = pega.ui.ClientCache.createPage("phonePage");
        phonePage.put("pyLabel", phone);
        phonePage.put("pyValue", phone);
        phoneNumbers.add().adoptJSON(phonePage.getJSON());
      }
      var addPhonePage = pega.ui.ClientCache.createPage("addPhone");
      addPhonePage.put("pyLabel", "Add Number");
      addPhonePage.put("pyValue", "-1");
      phoneNumbers.add().adoptJSON(addPhonePage.getJSON());
    }
  }
}
  /**
* Post action for Resp Phone to copy temp phone into RESP_PH_NUMBER_TEXT
*
* Created by: 
*/


 function EnumCB_ProxyPhone_POST() {
   
    alert("ProxyPhone Validation 0");
   
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var selection = workPage.get("Respondent.TelephoneInfo.TelephoneNumber(1).CountryCode");
  
    
    alert("ProxyPhone Validation 1");
    
    if(!selection) {
      var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
      workPage.addMessage(errorMessage);
    }
    
      alert("ProxyPhone Validation 2");
  
    
    selection = selection.getValue();
    if(selection == "-1") {
      var temp = workPage.get("Respondent.TelephoneInfo.TelephoneNumber(1).Extension").getValue();
      var persistTempVal = respPage.put("RESP_PH_NUMBER_TEXT", temp);
    }
    else{
      respPage.put("RESP_PH_NUMBER_TEXT", selection);
    }
    var respPhone = respPage.get("RESP_PH_NUMBER_TEXT");
    var respPhoneValue = respPhone.getValue();
    
    alert("ProxyPhone Validation 3");
    
    
    ENUMCB_ProxyPhone_VLDN(workPage, respPhoneValue);
    ENUMCB.setDKRefResponse("pyWorkPage.Respondent.DKRefused.RespPhone", "pyWorkPage.Respondent.Response.RESP_PH_DK_IND", "pyWorkPage.Respondent.Response.RESP_PH_REF_IND");
  }

 

/*
*	Used by CaseNotes_QSTN on Pre action
*	Created by: Jack McCloskey
*/
function EnumCB_CaseNotes_PRE(){  
  try {
    /*Prepare Temp Page to add to case notes list*/
    var CaseNotesPage = pega.ui.ClientCache.createPage("caseNotesPage");
  }
  catch(e) {
    alert(e.message);
  }
}

/*
*	Pre Action for ScanBarcode_QSTN
*	Created by Ebenezer Owoeye
*/
function EnumCB_ScanBarcode_PRE() {
  CB.toggleFlag("DKRFEnabled","false");
  CB.toggleFlag("ExitSurveyEnabled","false");
}

/** 
*   Post Action for ScanBarcode_QSTN
*	Created by: Ebenezer Owoeye
**/
function EnumCB_ScanBarcode_POST() {
  try {
    var idProp = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_NOV_BARCODE_ID");
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    if(idProp) {
      idProp = idProp.getValue();
    }
    else {
      idProp = "";
    }
    if(idProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        workPage.addMessage(errorMessage);
      }
      else if(idProp.length < 14) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ScanBarcode_HARD");
        workPage.addMessage(errorMessage);
      } 
	  
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}

/*
* Created By: Kyle Gravel
*	Used by TypeOfProxy_QSTN
*	Pre Action Primes Datapage with correct responses
*/

function ENUMCB_TypeOfProxy_PRE() {
  CB.toggleFlag("DKRFEnabled","true");
  CB.toggleFlag("ExitSurveyEnabled","false");
  ENUMCB.primeTypeOfProxyOptions();
  ENUMCB.updateDKRefVisibility("TypeOfProxy","pyWorkPage.Respondent.DKRefused");
}

/*function is responsible for loading all values into D_TypeOfProxyOptions datapage*/
ENUMCB.primeTypeOfProxyOptions = function() {
  /*grab LastSurveyQuestion from pyWorkPage*/
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var lastSurveyQuestion = workPage.get("CurrentSurveyQuestion");
  lastSurveyQuestion = lastSurveyQuestion ? lastSurveyQuestion.getValue() : "";
  /*Format date for response prop*/
  var censusDate = workPage.get("CensusDate");
  censusDate = censusDate ? censusDate.getValue() : "";
  var yearString = censusDate.substring(0,4);
  var monthString = censusDate.substring(5,6);
  var dayString = censusDate.substring(7,8);
  var dateString = monthString + "/" + dayString + "/" + yearString;    
  /*grab all field values for answers*/
  var typeOfProxyANSW = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy_ANSW");
  var typeOfProxyANSW1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy1_ANSW");
  var typeOfProxyANSW2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy2_ANSW");
  var typeOfProxyANSW3 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy3_ANSW");
  var typeOfProxyANSW4 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy4_ANSW");
  var typeOfProxyANSWTEMP = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy5_ANSW");
  var typeOfProxyANSW5 = typeOfProxyANSWTEMP + " " + dateString + ")";  
  var typeOfProxyANSW6 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy6_ANSW");
  var typeOfProxyANSW7 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy7_ANSW");
  var typeOfProxyANSW8 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy8_ANSW");
  var typeOfProxyANSW9 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "TypeOfProxy9_ANSW");
  /*grab datapage*/
  var typeOfProxyDP = pega.ui.ClientCache.find("D_TypeOfProxyOptions").put("pxResults",[]);
  /*create temp page to load dp*/
  var typeOfProxyTemp = pega.ui.ClientCache.createPage("TypeOfProxyTemp");

  /*load neighbor*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW);
  typeOfProxyTemp.put("pyValue","1");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load landlord or property manager*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW1);
  typeOfProxyTemp.put("pyValue","2");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load real estate agent*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW2);
  typeOfProxyTemp.put("pyValue","3");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load relative or householdmember*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW3);
  typeOfProxyTemp.put("pyValue","4");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load caregiver or health provider*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW4);
  typeOfProxyTemp.put("pyValue","5");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load in mover*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW5);
  typeOfProxyTemp.put("pyValue","6");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load government office or worker*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW6);
  typeOfProxyTemp.put("pyValue","7");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  /*load utility worker*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW7);
  typeOfProxyTemp.put("pyValue","8");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  if(lastSurveyQuestion == "ProxyAddress_QSTN") {
    /*load Enumerator personal knowledge*/
    typeOfProxyTemp.put("pyLabel",typeOfProxyANSW8);
    typeOfProxyTemp.put("pyValue","9");
    typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
  }
  /*load other*/
  typeOfProxyTemp.put("pyLabel",typeOfProxyANSW9);
  typeOfProxyTemp.put("pyValue","10");
  typeOfProxyDP.add().adoptJSON(typeOfProxyTemp.getJSON());
}

/*
*	Created by Kyle Gravel
*	Post function for TypeOfProxy
*/
function ENUMCB_TypeOfProxy_POST() {
  /*Run required validation*/
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.Respondent.Response.RESP_PRX_TYPE_CODE", "pyWorkPage.Respondent.DKRefused.TypeOfProxy");
  } 
  else {
    ENUMCB.Required("pyWorkPage.Respondent.Response.RESP_PRX_TYPE_CODE");
  }
  /*Run Specify validation*/
  ENUMCB.TypeOfProxy_VLDN();
  /*Grab last survey question from pyWorkPage to get LastSurveyQuestion for branching*/
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var lastSurveyQuestion = workPage.get("LastSurveyQuestion");
  lastSurveyQuestion = lastSurveyQuestion ? lastSurveyQuestion.getValue() : "";
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  /*If last survey question = ProxyAddress, go to BestTime : else go to CaseNotes*/
  if(lastSurveyQuestion == "ProxyAddress_QSTN") {
    questFlags.put("NextSurveyQuestion","BestTime_QSTN");
  }
  else {
    questFlags.put("NextSurveyQuestion","CaseNotes_QSTN");
  }
}

/**
* Pre Function for Proxy Address
* Created by Dillon Irish
**/
function EnumCB_ProxyAddress_PRE() {
	CB.toggleFlag("DKREFEnabled", "true");
	ENUMCB.updateDKRefVisibility("ProxyAddress");
}

/**
* Post Function for Proxy Address
* Created by Dillon Irish
**/
function EnumCB_ProxyAddress_POST() {
	var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var cpProxyAddress = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ProxyAddress");
	var cpResponse = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
	
	if(cpWorkPage && cpProxyAddress && cpResponse){
		var addressType = cpProxyAddress.get("AddrType").getValue();
		ENUMCB.ProxyAddress_VLDN(addressType);
		if (!cpWorkPage.hasMessages()) {
			/*Stateside Address*/
			if(addressType == 'USSA' || addressType == 'USPO' || addressType == 'USRR'){
				cpResponse.put("RESP_PRX_CITY_TEXT", cpProxyAddress.get("CITY").getValue());
				cpResponse.put("RESP_PRX_STATE_TEXT", cpProxyAddress.get("STATE").getValue());
				cpResponse.put("RESP_PRX_ZIP_TEXT", cpProxyAddress.get("LOCZIP").getValue());
				
				if(addressType == 'USSA'){
					cpResponse.put("RESP_PRX_STRNUM_PRI_TEXT", cpProxyAddress.get("LOCHN1").getValue());
					cpResponse.put("RESP_PRX_STRNAME_1_PRI_TEXT", cpProxyAddress.get("StreetName").getValue());
					cpResponse.put("RESP_PRX_UNIT_TEXT", cpProxyAddress.get("LOCWSID1").getValue());
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
				
				if(addressType == 'USPO'){
					cpResponse.put("RESP_PRX_POBOX_TEXT", cpProxyAddress.get("POBOX").getValue());
				}
				
				if(addressType == 'USRR'){
					cpResponse.put("RESP_PRX_RR_DESC_TEXT", cpProxyAddress.get("RRDescriptor").getValue());
					/** cpResponse.put("RESP_PRX_RR_NUM_TEXT", cpProxyAddress.get("RRNumber").getValue()); Need RESPONSE property from BAs **/
					/** cpResponse.put("RESP_PRX_RR_BOXID_TEXT", cpProxyAddress.get("RRBoxIDNumber").getValue()); Need RESPONSE property from BAs **/
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
			}else{ /*Puerto Rico*/
				cpResponse.put("RESP_PRX_PR_MUNI_NAME", cpProxyAddress.get("Municipio").getValue());
				cpResponse.put("RESP_PRX_STATE_TEXT", cpProxyAddress.get("STATE").getValue());
				cpResponse.put("RESP_PRX_ZIP_TEXT", cpProxyAddress.get("LOCZIP").getValue());
				
				if(addressType == 'PRGA'){
					cpResponse.put("RESP_PRX_STRNUM_PRI_TEXT", cpProxyAddress.get("LOCHN1").getValue());
					cpResponse.put("RESP_PRX_STRNAME_1_PRI_TEXT", cpProxyAddress.get("StreetName").getValue());
					cpResponse.put("RESP_PRX_UNIT_TEXT", cpProxyAddress.get("LOCWSID1").getValue());
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
				
				if(addressType == 'PRUA'){
					cpResponse.put("RESP_PRX_PR_URB_NAME", cpProxyAddress.get("LOCURB").getValue());
					cpResponse.put("RESP_PRX_STRNUM_PRI_TEXT", cpProxyAddress.get("LOCHN1").getValue());
					cpResponse.put("RESP_PRX_STRNAME_1_PRI_TEXT", cpProxyAddress.get("StreetName").getValue());
					cpResponse.put("RESP_PRX_UNIT_TEXT", cpProxyAddress.get("LOCWSID1").getValue());
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
				
				if(addressType == 'PRAC'){
					cpResponse.put("RESP_PRX_BUILDING_NAME", cpProxyAddress.get("LOCAPTCOMPLEX").getValue());
					cpResponse.put("RESP_PRX_STRNUM_PRI_TEXT", cpProxyAddress.get("LOCHN1").getValue());
					cpResponse.put("RESP_PRX_STRNAME_1_PRI_TEXT", cpProxyAddress.get("StreetName").getValue());
					/** cpResponse.put("RESP_PRX_BUILDING_DESC", cpProxyAddress.get("LOCBLDGDESC").getValue()); Need RESPONSE property from BAs **/
					/** cpResponse.put("RESP_PRX_BUILDING_NUM_TEXT", cpProxyAddress.get("LOCBLDGID").getValue()); Confirm RESPONSE property with BAs **/
					cpResponse.put("RESP_PRX_UNIT_TEXT", cpProxyAddress.get("LOCWSID1").getValue());
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
				
				if(addressType == 'PRAA'){
					cpResponse.put("RESP_PRX_PR_AREA_NAME", cpProxyAddress.get("LOCAREANM1").getValue());
					/** cpResponse.put("RESP_PRX_PR_AREA_2_NAME", cpProxyAddress.get("LOCAREANM2").getValue()); Need RESPONSE property from BAs **/
					cpResponse.put("RESP_PRX_STRNUM_PRI_TEXT", cpProxyAddress.get("LOCHN1").getValue());
					cpResponse.put("RESP_PRX_STRNAME_1_PRI_TEXT", cpProxyAddress.get("StreetName").getValue());
					cpResponse.put("RESP_PRX_UNIT_TEXT", cpProxyAddress.get("LOCWSID1").getValue());
					cpResponse.put("RESP_PRX_PR_KMHM_TEXT", cpProxyAddress.get("KMHM").getValue());
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
				
				if(addressType == 'PRPO'){
					cpResponse.put("RESP_PRX_POBOX_TEXT", cpProxyAddress.get("POBOX").getValue());
				}
				
				if(addressType == 'PRRR'){
					cpResponse.put("RESP_PRX_RR_DESC_TEXT", cpProxyAddress.get("RRDescriptor").getValue());
					/** cpResponse.put("RESP_PRX_RR_NUM_TEXT", cpProxyAddress.get("RRNumber").getValue()); Need RESPONSE property from BAs **/
					/** cpResponse.put("RESP_PRX_RR_BOXID_TEXT", cpProxyAddress.get("RRBoxIDNumber").getValue()); Need RESPONSE property from BAs **/
					cpResponse.put("RESP_PRX_PHYS_DESC_TEXT", cpProxyAddress.get("LOCDESC").getValue());
				}
			}
		}
	}
}