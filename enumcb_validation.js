﻿/************************ Offlne validation ********************
***                       This script holds a helper function and how to use the
***                       helper function and some common functions
***
*****************************************************************/
/*namespace*/
var ENUMCB = ENUMCB || {};
/*******************************************************************************************
****      The following helper method simplifies creating custom client-side edit validation
****      START helper
********************************************************************************************/
ENUMCB.ENMCreateCustomEditValidation = function (validationType,handler) {

	try {
        if (typeof validationType != "string" || typeof handler != "function") {
          throw "Usage: ENUMCB.ENMCreateCustomEditValidation(string,function)";
        }
        if (!ENMCustomEditValidation) {
          var ENMCustomEditValidation = {};
        }
        ENMCustomEditValidation[validationType] = new validation_ValidationType(validationType,handler);
        ENMCustomEditValidation[validationType].addEventFunction("onchange",handler);
	 } catch(e) {
	  		/*log the error*/
		   console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation error: " + e.message);
	 }
}
/***************** END helper  ************************************************/

/* ENUMCB.validateNames
** Helper function to validate respondent name fields
** Returns true if messages were added, false otherwise
*/
ENUMCB.validateNames = function(workPage, firstName, middleName, lastName, firstMessage, secondMessage) {

        
  try {
      if(firstName) {
        firstName = firstName.getValue();
      }
      else {
        firstName = "";
      }
      if(middleName) {
        middleName = middleName.getValue();
      }
      else {
        middleName = "";
      }
      if(lastName) {
        lastName = lastName.getValue();
      }
      else {
        lastName = "";
      }
    
   
   
      if(firstName == "" && lastName == "" && middleName == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", firstMessage);
        workPage.addMessage(errorMessage);
        return true;
      }
      else {
            
        var fullName = "";

        if(firstName != "") {
          var temp= firstName;
          firstName = temp.replace(" ", "");
          fullName = fullName + firstName;
              
        }
        if(lastName != "") {
          var temp = lastName;
          lastName = temp.replace(" ", "");
          fullName = fullName + lastName;
        }
 	     
        if(fullName.length < 3) {
          var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", secondMessage);
          workPage.addMessage(errorMessage);
          return true;
        }
      }
      return false;
  } catch (e) {
    console.log("Unexpected error in ENUMCB.validateNames " + e.message);
  }
}


/**************************************************************************************
**  Information Screen Name or # 1 ** Note these are just examples
**           ""FirstName" is the property in screen name
***************************************************************************************/
ENUMCB.ENMCreateCustomEditValidation("FirstName", function(object) {
		   try {
				if (!object.value){
					return (new validation_Error(object, "Please enter a valid First Name"));
				}
			} catch(e) {
				/*log the error*/
				console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(FirstName) error: " + e.message);
			}
});


/*Example for checking format*/
ENUMCB.ENMCreateCustomEditValidation("MedicareClaimNo", function(object) {
		   try {
				var medicareNum =  new RegExp("^([0-9]{9}([A-Za-z]{1}[0-9A-Za-z]{0,2}|[A-Za-z]{1})|[A-Za-z]{1,3}([0-9]{6}|[0-9]{9}))$");
				if (!medicareNum.test(object.value)) {
					/*alert("Please enter a valid Medicare Claim Number");*/
					return (new validation_Error(object, "Please enter a valid Medicare Claim Number"));
				}
			} catch(e) {
				/*log the error*/
				console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(MedicareClaimNo) error: " + e.message);
			}
});


/************************************************************
**** Example on how to read a property
*************************************************************/
ENUMCB.ENMCreateCustomEditValidation("EffectiveDateA", function(object) {
		try {
			/*use this api to get a property value "pega.ui.d.getProperty" - Page name + property name and the parent is
			* always going to be pyWorkPage it might be different in 7.2.1 */
			var effectiveDateB = pega.ui.d.getProperty(".ApplicantInfo.EffectiveDateB","pyWorkPage");
			if (!effectiveDateB && !object.value) {
				/*alert("Please enter either a valid Part A or Part B effective date");*/
				$("#Effective-Date-Main").addClass("labelError");
				return (new validation_Error(object, "Please enter either a valid Part A or Part B effective date"));
			} else {
				$("#Effective-Date-Main").removeClass("labelError");
		   }
		} catch(e) {
			/*log the error - we can also use throw, but console.log helps in debugging*/
			console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(EffectiveDateA) error: " + e.message);
		}
});

/**************************************************************************************
** Application Information Screen # 2
** how to check for a value for a given field
***************************************************************************************/
/*ApplicantAddnlInfo*/
ENUMCB.ENMCreateCustomEditValidation("PrimaryStreetAddress", function(object) {
	try {
		var dataValue = object.value.toUpperCase();
		/*for validating street address, we can do like this or for localization we can also
		* data pages, for that we can use a common method to check the appropriate value from this object */
		var strAddress = "P.O Box, PO BOX, P.O.BOX, P OBOX, P O BOX, POBOX, P.O.BOX, P.O. BOX, P. O. BOX, PO#, PO, P O Box, PO BOX, P. O Box, P.O.Box, P. O. Box, P.O. Box";
		var streetRegExp = new RegExp(dataValue);
		console.log("Inside address: " + dataValue);
		if (streetRegExp.test(strAddress)) {
			console.log("Please enter a valid address: " + dataValue);
			return (new validation_Error(object, "Please enter a valid address"));
		}
	} catch(e) {
		/*log the error*/
		  console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(PrimaryStreetAddress) error: " + e.message);
	}
});

/*ContactInformation.PrimaryPhone*/
/**************** Phone format *********************/
ENUMCB.ENMCreateCustomEditValidation("ContactPrimaryPhone", function(object) {
		   try {
				var newPhone = CB.phoneFormat(object.value);
				console.log("New Phone: " + newPhone);
				if (!CB.LeapPhoneFormat(newPhone)) {
				  /*alert("Please enter a valid primary telephone number");*/
				  return (new validation_Error(object, "Please enter a valid primary telephone number"));
				}
				 /*set the value in applicationInfo*/
				if (newPhone != object.value) {
				  object.value = newPhone;
				  pega.ui.ClientCache.find("pyWorkPage.ApplicationInfo").put(object.id, newPhone);
				  var appPhone = CB.getApplicationInfo(object.id);
				  console.log("After setting the Application Property : " + appPhone);
				}
		} catch(e) {
			/*log the error*/
		  console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(ContactPrimaryPhone) error: " + e.message);
		}
});


/*RepInfo.RepEmail **** Email format ************/
ENUMCB.ENMCreateCustomEditValidation("RepEmail", function(object) {
		try {
			if (!object.value)               return;
			var emailValue = object.value;
			if (emailValue.length <= 50 && !CB.LeapEmailFormat(emailValue)) {
				 /* alert("Please enter a valid email address"); */
				  return (new validation_Error(object, "Please enter a valid email address"));
			}
		} catch(e) {
			  /*log the error*/
				console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(RepEmail) error: " + e.message);
		}
});


/*********************** PLEASE DO NOT USE THESE JSON METHODS ******************
***        var vforms = JSON.parse(pega.ui.property.getFormJSON());
***                       var electionPeriod = vforms.pyWorkPage.ApplicationInfo.ElectionPeriod;
*********************************************************************************/
/*********************************************************************************
***                       Check box value
***
**********************************************************************************/
/* on a screen if you have a single section and need to get the checkbox value (you are normal object.value will not work), you
* can use the following API
* var pDisclaimer = document.getElementsByName("$PpyWorkPage$pApplicationInfo$pPremiumPayDisclaimer")[1].checked;
* if you have multiple sections in a screen then the API will be different to get the check box value
* follow the below code
* AccountDetailsInfo.IsAccountAuthorization*/
ENUMCB.ENMCreateCustomEditValidation("IsAccountAuthorization", function(object) {
		   try {
				var payOption = CB.getApplicationInfo("PremiumPaymentOption");
				var checkboxName = object.name;
				var hiddenInput = document.getElementsByName(checkboxName)[0];/*hidden input*/
				var checkboxValue = document.getElementsByName(checkboxName)[1].checked;/*checkbox value*/
				if (payOption == "Electronic Funds Transfer - EFT") {
					if (!checkboxValue) { /* Evaluate client conditions even when custom validation fails */
						hiddenInput.value = "false";
						pega.u.d.evaluateClientConditions();
						return (new validation_Error(object, "Please select the account authorization."));
					}
				}
		   } catch(e) {
				/*log the error*/
				console.log("Unexpected ENUMCB.ENMCreateCustomEditValidation(IsAccountAuthorization) error: " + e.message);
			}
});

/**
*	Function called by the EnumCB_RespPhone_POST() to validate the resp phone screen
*	Created by: Omar Mohammed
**/
function ENUMCB_RespPhone_VLDN(primaryPage, value) { 
  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var dkRefProp = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused.RespPhone");
    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
    if(isDKRefVisible == "true") {
      if(value == "" && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 14 && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespPhone_HARD");
        primaryPage.addMessage(errorMessage);
      }
    }
    else {   
      if(value == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 14) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespPhone_HARD");
        primaryPage.addMessage(errorMessage);
      } 
    }
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}

function ENUMCB_ProxyName_VLDN(primaryPage, value) {

  try {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var dkRefProp = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused.RespPhone");
    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
    if(isDKRefVisible == "true") {
      if(value == "" && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 14 && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ProxyName_HARD");
        primaryPage.addMessage(errorMessage);
      }
    }
    else {   
      if(value == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 14) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ProxyName_HARD");
        primaryPage.addMessage(errorMessage);
      } 
    }
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}
function ENUMCB_ProxyPhone_VLDN(primaryPage, value) { 
  try {
    
    alert("Prxy Ph val 1");
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var dkRefProp = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused.RespPhone");
    if(dkRefProp) {
      dkRefProp = dkRefProp.getValue();
    }
    else {
      dkRefProp = "";
    }
      alert("Prxy Ph val 2");
    if(isDKRefVisible == "true") {
      if(value == "" && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 10 && dkRefProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespPhone_HARD");
        primaryPage.addMessage(errorMessage);
      }
    }
    else {  
        alert("Prxy Ph val 3");
      if(value == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 10) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RespPhone_HARD");
        primaryPage.addMessage(errorMessage);
      } 
    }
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}
/** 
*   Function called by the EnumCB_RespName_POST() to validate the resp name screen
*	Created by: Omar Mohammed
**/
function ENUMCB_RespName_VLDN() {
  
  try {
    	var workPage = pega.ui.ClientCache.find("pyWorkPage");
        var householdMember = pega.ui.ClientCache.find("pyWorkPage.Respondent");
        var setRespondentFlag = householdMember.put("RespondantFlag", true);

        var respondentFlag = householdMember.get("RespondantFlag").getValue();

        var firstName = workPage.get("Respondent.Response.RESP_FIRST_NAME");
        var middleName = workPage.get("Respondent.Response.RESP_MIDDLE_NAME");
        var lastName = workPage.get("Respondent.Response.RESP_LAST_NAME"); 
   /* console.log("(#### Inside Enum_RESPNAMe_VLDN " + firstName + " - " + middleName + " " + lastName);*/
  		ENUMCB.validateNames(workPage, firstName, middleName, lastName, "RespName_HARD", "RespName1_HARD");
    /*console.log("After ENUMCB VAlidate names");*/
    
  } catch (e) {
    	console.log("***** Error in ENUMCB_RespName_VLDN " + e.message);
  }
  
}

/** 
*   Function called by the EnumCB_ProxyName_POST() to validate the resp name screen
*	Created by: 
**/
function ENUMCB_ProxyName_VLDN() {
  
  try {
    	var workPage = pega.ui.ClientCache.find("pyWorkPage");
        var householdMember = pega.ui.ClientCache.find("pyWorkPage.Respondent");
        var setRespondentFlag = householdMember.put("RespondantFlag", true);

        var respondentFlag = householdMember.get("RespondantFlag").getValue();

        var firstName = workPage.get("Respondent.Response.RESP_FIRST_NAME");
        var middleName = workPage.get("Respondent.Response.RESP_MIDDLE_NAME");
        var lastName = workPage.get("Respondent.Response.RESP_LAST_NAME"); 
   /* console.log("(#### Inside Enum_ProxyName_VLDN " + firstName + " - " + middleName + " " + lastName);*/
  		ENUMCB.validateNames(workPage, firstName, middleName, lastName, "ProxyName_HARD", "ProxyName_HARD");
    /*console.log("After ENUMCB VAlidate names");*/
    
  } catch (e) {
    	console.log("***** Error in ENUMCB_ProxyName_VLDN " + e.message);
  }
  
}
/**
*	Validation for DOB
*	Created by: Omar Mohammed
*/
function ENUMCB_DOB_VLDN(workPage, birthMonth, birthDay, birthYear, dkRefMonth, dkRefDay, dkRefYear) {
  var todayYear = parseInt(workPage.get("CensusYear").getValue());
  var parsedMonth = parseInt(birthMonth, 10);
  var parsedDay = parseInt(birthDay, 10);
  var parsedYear = parseInt(birthYear, 10);
  var firstErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB_HARD");
  var secondErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB1_HARD");
  var thirdErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB2_HARD");
  if(birthMonth == "" && birthDay === "" && birthYear === "" && dkRefMonth == "" && dkRefDay == "" && dkRefYear == "") {
    workPage.addMessage(firstErrorMessage);
    return true;
  }
  else if(birthYear === "" && dkRefYear =="") {
    workPage.addMessage(firstErrorMessage);
    return true;
  }
  else if(birthYear && birthMonth == "" && dkRefMonth == "") {
    workPage.addMessage(firstErrorMessage);
    return true;
  }
  else if(birthYear && parsedMonth == 4 && birthDay === "" && dkRefDay =="") {
    workPage.addMessage(firstErrorMessage);
    return true;
  }
  else if(parsedMonth == 4 && parsedYear == 1892 && parsedDay < 2) {
    workPage.addMessage(thirdErrorMessage);
    return true;
  }
  else if(parsedMonth < 4 && parsedYear == 1892) {
    workPage.addMessage(thirdErrorMessage);
    return true;
  }
  else if(parsedYear > todayYear || parsedYear <= 1891) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  else {
    if(ENUMCB.validateDay(workPage, parsedMonth, parsedDay, parsedYear)) {
      return true;
    }
    else {
      return false;
    }
  }
  return false;
}

ENUMCB.validateDay = function(workPage, birthMonth, birthDay, birthYear) {
  var firstErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB_HARD");
  var secondErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB1_HARD");
  var thirdErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "DOB2_HARD");

  if(birthMonth < 1 || birthMonth > 12) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  else if((birthMonth == 4 || birthMonth == 6 || birthMonth == 9 || birthMonth == 11) && (birthDay < 1 || birthDay > 30)) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  else if((birthMonth == 1 || birthMonth == 3 || birthMonth == 5 || birthMonth == 7 || birthMonth == 8 || birthMonth == 10 || birthMonth == 12) && (birthDay < 1 || birthDay > 31)) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  else if((birthMonth == 2) && (birthYear == 1900 || birthYear % 4 != 0) && (birthDay < 1 || birthDay > 28)) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  else if((birthMonth == 2) && (birthYear != 1900 && birthYear % 4 == 0) && (birthDay < 1 || birthDay > 29)) {
    workPage.addMessage(secondErrorMessage);
    return true;
  }
  
}

/*
*	Checks on properties that are required
*   Returns true if it has set validation messages, otherwise false
*/
ENUMCB.Required = function(propPath, DKRefProp, fieldValue) {
  DKRefProp = DKRefProp || "";
  fieldValue = fieldValue || "PleaseProvideAnAnswer";
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var findProp = pega.ui.ClientCache.find(propPath);
  var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", fieldValue);
  if(findProp) {
    findProp = findProp.getValue();
  }
  else {
    findProp = "";
  }
  if(DKRefProp != "") {
    var DKRefused = pega.ui.ClientCache.find(DKRefProp);
    if(DKRefused) {
      DKRefused = DKRefused.getValue();
    }
    else {
      DKRefused = "";
    }
    if(findProp == "" && DKRefused == "") {
      workPage.addMessage(errorMessage);
    }
  }
  else {
    if(findProp == ""){
      workPage.addMessage(errorMessage);
    }
  }
}

/*
* Validation function for Popcount screen
* Created by Qaiser Fayyaz
*/
function EnumCB_Popcount_VLDN(pyWorkPage) {   
  
  try{   
    var softEditPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");  
    var popcountFlagProp = softEditPage.get("PopcountFlag");    
    var popcountFlag=popcountFlagProp.getValue();
 
    var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
    var householdSizeProp = responsePage.get("H_SIZE_STATED_INT");
    if(householdSizeProp){
      var householdSize = householdSizeProp.getValue();   
      
    }
    else {
      householdSize = "";
         
    }
	
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if(isDKRefVisible == "true") {
      var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
      var dkRefProp = dkRefPage.get("Popcount");
      if(dkRefProp) {
        dkRefProp = dkRefProp.getValue();
      }
      else {
        dkRefProp = "";
      }    
	  if((!householdSizeProp|| householdSize=="") && dkRefProp == ""){       
	    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PopCount_HARD");
        pyWorkPage.addMessage(errorMessage);
        var softEditPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");
        var setProp = softEditPG.put("PopcountFlag", "false");
        var getProp = softEditPG.get("PopcountFlag").getValue();
      }
      else if(dkRefProp == "") {
        ENUMCB.validatePopcount(pyWorkPage);
      }
    }	
    else {
    
      ENUMCB.validatePopcount(pyWorkPage);
    }
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}

ENUMCB.validatePopcount = function(pyWorkPage) {
  var softEditPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");  
  var popcountFlagProp = softEditPage.get("PopcountFlag");    
  var popcountFlag=popcountFlagProp.getValue();
  var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var householdSizeProp = responsePage.get("H_SIZE_STATED_INT");
  if(householdSizeProp){
    var householdSize = householdSizeProp.getValue();   
  }
  else {
    householdSize = "";
  }
  var locationCode = responsePage.get("RESPONSE_LOCATION_CODE").getValue();
  
  if(isNaN(householdSize)|| householdSize==""){
    var errorMessage = "";
    if(isNaN(householdSize)) {
      errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PopCountNonNum_HARD");
    } else {
      errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
    }
    pyWorkPage.addMessage(errorMessage);
    var softEditPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");
    var setProp = softEditPG.put("PopcountFlag", "false");
    var getProp = softEditPG.get("PopcountFlag").getValue();
  }
  if(popcountFlag=="false"){	  
    if((!householdSizeProp || householdSize == "0") && locationCode == "1") {          
	  var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PopCountNotProxyResp_SOFT");
      pyWorkPage.addMessage(errorMessage);
      var softEditPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");
      var setProp = softEditPG.put("PopcountFlag", "true");
      var getProp = softEditPG.get("PopcountFlag").getValue();
    }
    if((!householdSizeProp || householdSize == "0") && locationCode == "2") {
      var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PopCountProxyResp_SOFT");
      pyWorkPage.addMessage(errorMessage);
      var softEditPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.SoftEditVLDN");
      var setProp = softEditPG.put("PopcountFlag", "true");
      var getProp = softEditPG.get("PopcountFlag").getValue();
    }
  }
}

ENUMCB.WhoLivesElsewhere_VLDN = function(numberSelected) {

  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if(isDKRefVisible) {
    ENUMCB.Required("pyWorkPage.Respondent.Response.P_LOC_OCD_ELSEWHERE_IND", "pyWorkPage.Respondent.DKRefused.Elsewhere");
  }
  else {
    ENUMCB.Required("pyWorkPage.Respondent.Response.P_LOC_OCD_ELSEWHERE_IND");
  }
  var respPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var respProp = respPage.get("P_LOC_OCD_ELSEWHERE_IND");
  var householdRoster = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var householdRosterSize = householdRoster.size();
  if(respProp) {
    respProp = respProp.getValue();
  }
  else {
    respProp = "";
  }
    if(respProp == "1" && numberSelected == 0 && householdRosterSize > 1) {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "WhoLivesElsewhere_HARD");
    workPage.addMessage(errorMessage);
  }
}

ENUMCB.Undercount_VLDN = function() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if (questFlagsPage) {
	var undercountPreviousCounter = questFlagsPage.get("UndercountPreviousCounter");
	var hasAdditionalUndercount = questFlagsPage.get("HasAdditionalUndercount");
    
	/*  for Validation     HouseholdMemberTemp   */   
	var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 
	if (householdMemberTemp){    
	  var firstName = workPage.get("HouseholdMemberTemp.Response.P_FIRST_NAME");
	  var middleName = workPage.get("HouseholdMemberTemp.Response.P_MIDDLE_NAME");
	  var lastName = workPage.get("HouseholdMemberTemp.Response.P_LAST_NAME"); 
      var isDKRefVisible = ENUMCB.getIsDKRefVisible();
      if(isDKRefVisible == "true") {
        if (ENUMCB.Required("pyWorkPage.QuestFlags.HasAdditionalUndercount", "pyWorkPage.HouseholdMemberTemp.DKRefused.Undercount")) {
          return true;
        }
      } 
      else {
        if (ENUMCB.Required("pyWorkPage.QuestFlags.HasAdditionalUndercount")) {
		  return true;
		}
      }
      if (hasAdditionalUndercount.getValue()  == "true") {
		if(ENUMCB.validateNames(workPage, firstName, middleName, lastName, "RespName1_HARD","RespName1_HARD")) {
			return true;
		}
        else { 
          return false;
		}
      }	
	} 		
  }
  else {
	return false;
  }
}
ENUMCB.EligibleRespondent_VLDN = function() {
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var isDKRefVisible = questFlags.get("IsDKRefVisible");
  if(isDKRefVisible) {
    isDKRefVisible = isDKRefVisible.getValue();
  }
  else {
    isDKRefVisible = "";
  }
  if(isDKRefVisible == "true") {
    ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_RESP_ELIG_CODE", "pyWorkPage.Respondent.DKRefused.EligibleResp");
  }
  else {
    ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_RESP_ELIG_CODE"); 
  }
  
}

/**
*	Validate detailed origin white
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityWhite_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate detailed origin nhpi
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityNHPI_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate detailed origin mena
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityMENA_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate detailed origin black
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityBlack_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate detailed origin hispanic
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityHispanic_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate detailed origin asian
*	Created by Omar Mohammed
**/
ENUMCB.EthnicityAsian_VLDN = function(numberSelected) {
  ENUMCB.validateEthnicities(numberSelected);
}

/**
*	Validate any of the ethnicities pages
*	Created by Omar Mohammed
**/
ENUMCB.validateEthnicities = function(numberSelected) {
  if(numberSelected == 0) {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
    workPage.addMessage(errorMessage);
  }
}

/**
*	Validation of Roster Review
*	Created by Jack McCloskey
**/

ENUMCB.RosterReview_VLDN = function() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage"); 
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var householdRosterMember= pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember");
  var hasRosterChanges = questFlagsPage.get("HasRosterChanges");
  var isEditingRoster = questFlagsPage.get("IsEditingRoster");
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if(isDKRefVisible == "true") {
    if(ENUMCB.Required("pyWorkPage.QuestFlags.HasRosterChanges", "pyWorkPage.HouseholdMemberTemp.DKRefused.RosterReview", "PleaseProvideAnAnswer")) {
      return true;
    } 
  }
  else { 
    if (ENUMCB.Required("pyWorkPage.QuestFlags.HasRosterChanges", "", "PleaseProvideAnAnswer")){
	  return true;  
    } 
  }
 
  if (householdRosterMember){

    /* get roster size */
    var sizeOfIndex  = householdRosterMember.size();

	/* check max roster size */
	if(sizeOfIndex >= 99 && hasRosterChanges.getValue() == "true") {
      	if (isEditingRoster) {
          if (isEditingRoster.getValue()+"" == "true") {
            return false;
          }
        }
		errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "CannotAddMore_INST");
        workPage.addMessage(errorMessage);
		return true;
		}
    }
	return false;
}

/**
*	Validation of Roster  Add
*	Created by  Ramin , Jack
**/
ENUMCB.RosterName_VLDN = function() {

  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if (questFlagsPage)
  {

    /*  for Validation     HouseholdMemberTemp   */   
    var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 
    if (householdMemberTemp){    
      var firstName = workPage.get("HouseholdMemberTemp.Response.P_FIRST_NAME");
      var middleName = workPage.get("HouseholdMemberTemp.Response.P_MIDDLE_NAME");
      var lastName = workPage.get("HouseholdMemberTemp.Response.P_LAST_NAME"); 

      if(ENUMCB.validateNames(workPage, firstName, middleName, lastName, "RespName1_HARD","RespName1_HARD"))
      {
        return true;
      }else
      { 
        return false;
      }
    } 

  }else
  {
    return false;
  }
}

/**
*	Validation for People
*	Created by Domenic Giancola and David Bourque
**/

ENUMCB.People_VLDN = function() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlagsPage = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  if (questFlagsPage) {
    var hasAdditionalPeople = questFlagsPage.get("HasAdditionalPeople");

    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    if (isDKRefVisible) {
      if (ENUMCB.Required("pyWorkPage.QuestFlags.HasAdditionalPeople","pyWorkPage.HouseholdMemberTemp.DKRefused.People","People_HARD")) {
        return true;
      }
    } 
    else {
      if (ENUMCB.Required("pyWorkPage.QuestFlags.HasAdditionalPeople","","People_HARD")) {
        return true;
      }
    }


    var householdMemberTemp = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp"); 
    if (householdMemberTemp) {    
      var firstName = workPage.get("HouseholdMemberTemp.Response.P_FIRST_NAME");
      var middleName = workPage.get("HouseholdMemberTemp.Response.P_MIDDLE_NAME");
      var lastName = workPage.get("HouseholdMemberTemp.Response.P_LAST_NAME"); 

      if (hasAdditionalPeople.getValue()  == "true") {
        if(ENUMCB.validateNames(workPage, firstName, middleName, lastName, "RespName1_HARD","RespName1_HARD")) {
          return true;
        }
      }
    }
    var isNotEnoughPeople = questFlagsPage.get("IsNotEnoughPeople");
    if (isNotEnoughPeople.getValue() == "false") {
      var currentRosterSize = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.HouseholdMember").size();
      var cpRespondent = workPage.get("Respondent");
      var H_SIZE_STATED_INT = parseInt(cpRespondent.get("Response.H_SIZE_STATED_INT").getValue());
      var peoplePreviousCounter = parseInt(questFlagsPage.get("PeoplePreviousCounter").getValue());
      if(hasAdditionalPeople.getValue() == "false" && currentRosterSize != H_SIZE_STATED_INT && peoplePreviousCounter <= 0){
        isNotEnoughPeople.setValue("true");
        var people_soft = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "People_SOFT");
        var people_soft1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "People_SOFT1");
        var people_soft3 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "People_SOFT2");
        var people_soft2;
        if (currentRosterSize == 1) {
          people_soft2 = "person";
        }
        else {
          people_soft2 = "people";
        }
        var errorMessage = people_soft + " " + H_SIZE_STATED_INT + people_soft1 + " " + currentRosterSize + " " + people_soft2 + people_soft3;
        workPage.addMessage(errorMessage);
        return true;
      }
      else {
        return false;
      }
    } 
    else {
      isNotEnoughPeople.setValue("false");
      return false;
    }  
    return false;
  }
  else {
    return false;
  }
}

/*
*	Validation for LanguageQuestion
*	Created by Aansh Kapadia
*/
ENUMCB.language_VLDN = function (languageIndex) {
  	var pyWorkPage = pega.ui.ClientCache.find("pyWorkPage");
  	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
	var languageOtherCheckbox = questFlags.get("LanguageOtherCheckbox").getValue();
  
    if(languageOtherCheckbox == false && languageIndex == 0) {
    	pyWorkPage.addMessage(errorMessage);
    } 
  	if (languageOtherCheckbox == true) {
      	var languageOtherText = questFlags.get("LanguageOtherText").getValue();
      	if(languageOtherText.length < 3) {
          var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "LanguageOther_HARD");
          pyWorkPage.addMessage(errorMessage);
        }
    }
}

/*
*	Validation for Owner and Renter Questions
*	Created by Kyle Gravel
*/
ENUMCB.validateOwnerRenter = function (ownerRenterIndex, dkRefProperty) {
  	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
	var respondentPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster");
	var isNoOwnerRenterSelected = respondentPage.get("IsNoOwnerRenterSelected").getValue();
	var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if(isDKRefVisible == "true") {
		var dkRefPage = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
		var ownerRenterDKRef = dkRefPage.get(dkRefProperty);
		if(!ownerRenterDKRef) {
          ownerRenterDKRef = "";
		}
		else {
          ownerRenterDKRef = ownerRenterDKRef.getValue();
		}
		if(ownerRenterDKRef == "" && isNoOwnerRenterSelected == false && ownerRenterIndex == 0) {
				workPage.addMessage(errorMessage);
		}
	}
	else {
      if(isNoOwnerRenterSelected == false && ownerRenterIndex == 0) {
			workPage.addMessage(errorMessage);
      }
	}
}

/*
* Validation for BestTime question
* Created by: Aditi Ashok
*/
ENUMCB.BestTime_VLDN = function (count) {
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var DKRef = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  	var BestTimeDKRef = DKRef.get("BestTime");
    
  	if (BestTimeDKRef) {
		BestTimeDKRef = BestTimeDKRef.getValue();
    } 
  	else {
      	BestTimeDKRef = "";
    }
    
  	if (isDKRefVisible == "true") {
        if (count == 0 && BestTimeDKRef == "") {
            workPage.addMessage(errorMessage);
        } 
    } 
  	else {
        if (count == 0) {
          workPage.addMessage(errorMessage);
        }
    }
}

/**
*	Validation of IDInterpreter   Other
*	Created by  Ramin  
**/
ENUMCB.IDInterpreter_VLDN = function(otherName) {
  var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "IDInterpreterOther_HARD");
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  
  if(otherName) {
    otherName = otherName.getValue();
  }
  else {
    otherName = "";
  }

  if(otherName == "" ) {
    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "IDInterpreterOther_HARD");
    workPage.addMessage(errorMessage);
    return false;
  }
  else {

        var oName = "";
        if(otherName != "") {
          var temp= otherName;
          otherName = temp.replace(" ", "");
          oName = oName + otherName;
        }

        if(oName.length < 3) {
          var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "IDInterpreterOther_HARD");
          workPage.addMessage(errorMessage);
          return false;
        }

    	return true;
  	}
  return false;
}


/*
*  Validation for Relationship Check Screen
*  Created by David Bourque
*/

ENUMCB.RelationshipCheck_VLDN = function() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  if (isDKRefVisible) {
    if (ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.IsRelationshipCorrect","pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipCheck","RelationshipCheck_HARD")) {
      return true;
    }
  } 
  else {
    if (ENUMCB.Required("pyWorkPage.QuestFlags.HasAdditionalPeople","","RelationshipCheck_HARD")) {
      return true;
    }
  }
  return false;
}

/*
* Validation for RelationshipCheckRS 
* Created By: Aditi Ashok
*/

ENUMCB.RelationshipCheckRS_VLDN = function () {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if (isDKRefVisible == "true") {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.IsRelationshipCorrect", 
                        "pyWorkPage.HouseholdMemberTemp.DKRefused.RelationshipCheckRS");
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.IsRelationshipCorrect");
	}
	
}

/*
*
* Validation for Confirm Sex screen
* By: Aditi Ashok
*
*/ 
ENUMCB.ConfirmSex_VLDN = function () {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if (isDKRefVisible == "true") {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_SEX_CONF_YES_IND", 
                        "pyWorkPage.HouseholdMemberTemp.DKRefused.ConfirmSex");
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_SEX_CONF_YES_IND");
	}
}


/*
* Validation for Sex screen
* By: AXJ
*/ 
ENUMCB.Sex_VLDN = function () {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if (isDKRefVisible == "true") {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.SexMaleFemale", 
                        "pyWorkPage.HouseholdMemberTemp.DKRefused.Sex");
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.SexMaleFemale");
	}
}

/*
* Validation for Change Sex screen
* By: AXJ
*/ 
ENUMCB.ChangeSex_VLDN = function () {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	if (isDKRefVisible) {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.SexMaleFemaleConsistencyEdit", 
                        "pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeSex");
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.SexMaleFemaleConsistencyEdit");
	}
}

/*
* Validation function for Change Age
* Created by David Bourque
*/

ENUMCB.ChangeAge_VLDN = function() {
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  var censusDate = workPage.get("CensusDate");
  var requiredError = "";
  if (censusDate) {
    censusDate = censusDate.getValue();
    var censusYear = parseInt(censusDate.substring(0,4));
    var censusMonth = parseInt(censusDate.substring(4,6));
    var censusDay = parseInt(censusDate.substring(6));
    censusDate = CB.getLocalizedDate(censusDay,censusMonth,censusYear);
    var changeAgeHARD1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge2_HARD");
    var changeAgeHARD2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge3_HARD");
    requiredError = changeAgeHARD1 + " " + censusDate + changeAgeHARD2;
  }
  if (isDKRefVisible) {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CH_INT","pyWorkPage.HouseholdMemberTemp.DKRefused.ChangeAge",requiredError);
  } else {
    ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CH_INT","",requiredError);
  }
  if (!workPage.hasMessages()) {
    var age = parseInt(pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_CH_INT").getValue());
    if (age < 0 || age > 125) {
      var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge1_HARD");
      workPage.addMessage(errorMessage);
    }
  }
}
/**
* Validation for Why Live Elsewhere screen
* Created by Ebenezer Owoeye
**/
ENUMCB.WhyLiveElsewhere_VLDN = function(numberSelected) {
    try {
        var isDKRefVisible = ENUMCB.getIsDKRefVisible();
        var respPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response");
        var softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
        if (softEditPage) {
            var WhyLiveElseWhereFlagProp = softEditPage.get("WhyLiveElseWhereFlag");
        } else{
       		respPage.put("SoftEditVLDN",{});
          	softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN"); 
			softEditPage.put("WhyLiveElseWhereFlag", "false");
          var WhyLiveElseWhereFlagProp = softEditPage.get("WhyLiveElseWhereFlag");
        }
        
        var WhyLiveElseWhereFlag = WhyLiveElseWhereFlagProp.getValue();
        var WhyLiveElsewhereFlags = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.WhyLiveElsewhere");
        var ElsewhereIsOtherReason = WhyLiveElsewhereFlags.get("IsOtherReason");
        if (ElsewhereIsOtherReason) {
            ElsewhereIsOtherReason = ElsewhereIsOtherReason.getValue();
        } else {
            ElsewhereIsOtherReason = "";
        }
        var dkRefused = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
        var dkRefProp = dkRefused.get("WhyLiveElsewhere");
        if (dkRefProp) {
            dkRefProp = dkRefProp.getValue();
        } else {
            dkRefProp = "";
        }
        var writeInValue = respPage.get("P_LOC_ELSE_OTHER_TEXT");
        if (writeInValue) {
            writeInValue = writeInValue.getValue();
        } else {
            writeInValue = "";
        }
        if (isDKRefVisible == "true") {
            if (numberSelected == 0 && dkRefProp == "") {
                var workPage = pega.ui.ClientCache.find("pyWorkPage");
                var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
                workPage.addMessage(errorMessage);
            }
        } else {
            if (numberSelected == 0) {
                var workPage = pega.ui.ClientCache.find("pyWorkPage");
                var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
                workPage.addMessage(errorMessage);
            } else if (ElsewhereIsOtherReason == true && writeInValue == "") {
                if (WhyLiveElseWhereFlag == "false") {
                    var workPage = pega.ui.ClientCache.find("pyWorkPage");
                    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "WhyLiveElsewhere_SOFT");
                    workPage.addMessage(errorMessage);
                    var softEditPG = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
                    var setProp = softEditPG.put("WhyLiveElseWhereFlag", "true");
                    var getProp = softEditPG.get("WhyLiveElseWhereFlag").getValue();
                }
            }
        }
    }
	catch (e) {
    	console.log("***ENUMCB Error - " + e.message);
    	alert("***ENUMCB Error - " + e.message);
	}
}

/*
*	Created by: Kyle Gravel
*	used by ChangeDOB_QSTN
*/
ENUMCB.DOBSoft_VLDN = function(flagName) {
    var softErrorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeDOB_SOFT");
	var workPG = pega.ui.ClientCache.find("pyWorkPage");
    var censusDate = workPG.get("CensusDate").getValue();
  	var censusYear = parseInt(censusDate.substring(0,4));
  	var censusMonth = parseInt(censusDate.substring(4,6));
  	var censusDay = parseInt(censusDate.substring(6));
    var messageString = softErrorMessage + " " + "April 1, " + censusYear + "."; 
	var softEditPage = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.SoftEditVLDN");
	var changeDOBFlag = softEditPage.get(flagName);
  	if(changeDOBFlag) {
      changeDOBFlag = changeDOBFlag.getValue();
    }
    else {
      changeDOBFlag = "";
    }
	
	if(!workPG.hasMessages() && changeDOBFlag == false) {
	  workPG.addMessage(messageString);
      softEditPage.put(flagName,true);
	}
    else if(changeDOBFlag == true) {
      softEditPage.put(flagName, false);
    }
}

/*
* Validation function for  Age
* Created by David Bourque
*/

ENUMCB.Age_VLDN = function() {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var censusDate = workPage.get("CensusDate");
	var requiredError = "";
	if (censusDate) {
		censusDate = censusDate.getValue();
		var censusYear = parseInt(censusDate.substring(0,4));
		var censusMonth = parseInt(censusDate.substring(4,6));
		var censusDay = parseInt(censusDate.substring(6));
		censusDate = CB.getLocalizedDate(censusDay,censusMonth,censusYear);
		var changeAgeHARD1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge2_HARD");
		var changeAgeHARD2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge3_HARD");
		requiredError = changeAgeHARD1 + " " + censusDate + changeAgeHARD2;
	}
	if (isDKRefVisible) {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_INT","pyWorkPage.HouseholdMemberTemp.DKRefused.Age",requiredError);
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_INT","",requiredError);
	}
	if (!workPage.hasMessages()) {
		var age = parseInt(pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_INT").getValue());
		if (age < 0 || age > 125) {
			var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge1_HARD");
			workPage.addMessage(errorMessage);
		}
	}
}

/**	
 *	Validation for Rev_DOB_QSTN
 *	Created by:AXJ
 **/
ENUMCB.Rev_DOB_VLDN = function() {
    try {
        return;
    } catch (e) {
        alert("ENUMCB Error -ENUMCB.Rev_DOB_VLDN:" + e.message);
    }
}

/*
*	Created by: Kyle Gravel
*	Validation funciton used by the No Complete Screen
*	Called by NoComplete_QSTN
*/
ENUMCB.NoComplete_VLDN = function() {
  var workPG = pega.ui.ClientCache.find("pyWorkPage");
  var responsePG = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
  var requiredMSG = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  var specifyMSG = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseSpecifyAReason");
  /*Find NRFU_INCOMPLETE_CODE and NRFU_INCOMPLETE_OTHER_REASON*/
  var nrfuIncompleteCode = responsePG.get("NRFU_INCOMPLETE_CODE");
  nrfuIncompleteCode = nrfuIncompleteCode ? nrfuIncompleteCode.getValue() : "";
  var nrfuIncompleteReason = responsePG.get("NRFU_INCOMPLETE_OTHER_TEXT");
  nrfuIncompleteReason = nrfuIncompleteReason ? nrfuIncompleteReason.getValue() : "";
  
  /*Add Required text to page if NRFU_INCOMPLETE_CODE is blank*/
  if(nrfuIncompleteCode == "") {
    workPG.addMessage(requiredMSG);
  }
  
  /*Add specify message is "Other" is selected and no text inputed on specify reason*/
  if(nrfuIncompleteCode == "9" && nrfuIncompleteReason == "") {
    workPG.addMessage(specifyMSG);
  }	
}

/*
* Validation function for Rev Age
* Created by David Bourque
*/

ENUMCB.RevAge_VLDN = function() {
    var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var censusDate = workPage.get("CensusDate");
	var requiredError = "";
	if (censusDate) {
		censusDate = censusDate.getValue();
		var censusYear = parseInt(censusDate.substring(0,4));
		var censusMonth = parseInt(censusDate.substring(4,6));
		var censusDay = parseInt(censusDate.substring(6));
		censusDate = CB.getLocalizedDate(censusDay,censusMonth,censusYear);
		var changeAgeHARD1 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge2_HARD");
		var changeAgeHARD2 = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge3_HARD");
		requiredError = changeAgeHARD1 + " " + censusDate + changeAgeHARD2;
	}
	if (isDKRefVisible) {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_RV_INT","pyWorkPage.HouseholdMemberTemp.DKRefused.RevAge",requiredError);
	} else {
		ENUMCB.Required("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_RV_INT","",requiredError);
	}
	if (!workPage.hasMessages()) {
		var age = parseInt(pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.Response.P_AGE_RV_INT").getValue());
		if (age < 0 || age > 125) {
			var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ChangeAge1_HARD");
			workPage.addMessage(errorMessage);
		}
	}
}

/**
* Validation for Detailed Origin screens
* Created by: Dillon Irish
**/

ENUMCB.DetailedOrigin_VLDN = function (count, dkRefName) {
	var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
    var cpDkRef = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  	var dkRefProp = cpDkRef.get(dkRefName);
    
  	if (dkRefProp) {
		dkRefProp = dkRefProp.getValue();
    } 
  	else {
      	dkRefProp = "";
    }
    
  	if (isDKRefVisible == "true") {
        if (count == 0 && dkRefProp == "") {
            cpWorkPage.addMessage(errorMessage);
        } 
    } 
  	else {
        if (count == 0) {
          cpWorkPage.addMessage(errorMessage);
        }
    }
}

/**
*	Validation for Language Barrier QSTN
*	Created by Dillon Irish
**/
ENUMCB.LanguageBarrier_VLDN = function (counter) {
  	var pyWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  
    if(counter == 0) {
    	pyWorkPage.addMessage(errorMessage);
    } 
}

/**
*	Validation for Language Barrier Resp QSTN
*	Created by Aansh Kapadia
**/
ENUMCB.LanguageBarrierResp_VLDN = function (counter, dkRefName) {
  var pyWorkPage = pega.ui.ClientCache.find("pyWorkPage");
  var questFlags = pega.ui.ClientCache.find("pyWorkPage.QuestFlags");
  var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  var otherCheckbox = questFlags.get("LanguageBarrierRespOtherCheckbox").getValue();
  var isDKRefVisible = ENUMCB.getIsDKRefVisible();
  var cpDkRef = pega.ui.ClientCache.find("pyWorkPage.HouseholdMemberTemp.DKRefused");
  var dkRefProp = cpDkRef.get(dkRefName);

  if (dkRefProp) {
    dkRefProp = dkRefProp.getValue();
  } else {
    dkRefProp = "";
  }
    
  if (isDKRefVisible == "true") {
    if (counter == 0 && otherCheckbox == false && dkRefProp == ""){
      pyWorkPage.addMessage(errorMessage);
    }
  } 
  else if (counter == 0 && otherCheckbox == false){
    pyWorkPage.addMessage(errorMessage);
  }
  
}

/*
* Validation function for Unable to Attempt
* Created by David Bourque
*/

ENUMCB.UnableToAttempt_VLDN = function() {
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_UNABLE_CODE");
	if (!workPage.hasMessages()) {
		var answer = parseInt(pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_UNABLE_CODE").getValue());
		var duplicateText = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_UNABLE_DUPLICATE_TEXT");
		var otherText = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_UNABLE_OTHER_TEXT");
		if (answer == 12 && (!duplicateText || duplicateText.getValue().trim() == "")) {
			var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "UnableToAttempt_HARD");
			workPage.addMessage(errorMessage);
		} else if (answer == 13 && (!otherText || otherText.getValue().trim() == "")) {
			var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "UnableToAttempt1_HARD");
			workPage.addMessage(errorMessage);
		}
	}
}

/* 
* Validation function for Occupancy_QSTN 
* Created by: Jason Wong
*/

ENUMCB.Occupancy_VLDN = function() {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	
	if(isDKRefVisible=="true") {
		ENUMCB.Required("pyWorkPage.Respondent.Occupancy","pyWorkPage.Respondent.DKRefused.Occupancy");
	}
	else {
		ENUMCB.Required("pyWorkPage.Respondent.Occupancy");
	}
}

/** 
*   Function called by the EnumCB_ScanBarcode_POST() to validate the Scan Barcode screen
*	Created by: Ebenezer Owoeye
**/
ENUMCB.ScanBarcode_VLDN = function() {
  try {
    var idProp = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response.NRFU_NOV_BARCODE_ID");
    if(idProp) {
      idProp = idProp.getValue();
    }
    else {
      idProp = "";
    }
    if(idProp.length < 12) {
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
    var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ScanBarcode_HARD");
    workPage.addMessage(errorMessage);
  }
    else {   
	    ENUMCB.Required("pyWorkPage.Respondent.Response.NRFU_NOV_BARCODE_ID"); 
	}
/** 
      if(idProp == "") {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
        primaryPage.addMessage(errorMessage);
      }
      else if(value.length < 12) {
        var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ScanBarcode_HARD");
        primaryPage.addMessage(errorMessage);
      } 
**/  
	  
  }
  catch(e) {
    console.log("***ENUMCB Error - " + e.message);
  }
}

/*
*	Validation funciton used by the Refusal Reason Screen
*	Called by RefusalReason_QSTN
*/
ENUMCB.RefusalReason_VLDN = function() {
  try {
    
    var workPG = pega.ui.ClientCache.find("pyWorkPage");
  
  	/* .Respondent.RefusalReason.RespondentTooBusy */
  	var refusalReasonPG = pega.ui.ClientCache.find("pyWorkPage.Respondent.RefusalReason"); 
  	var requiredMSG = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
  	var specifyMSG = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "RefusalReason_HARD");
  
  	/* Get values for RefusalReason properties */
  	var RespondentTooBusy = refusalReasonPG.get("RespondentTooBusy").getValue();
  	var NotInterested = refusalReasonPG.get("NotInterested").getValue();
    var SurveyIsAWasteOfTaxpayerMoney = refusalReasonPG.get("SurveyIsAWasteOfTaxpayerMoney").getValue(); 
    var DoneEnoughOtherSurveys = refusalReasonPG.get("DoneEnoughOtherSurveys").getValue(); 
    var CompletedQuestionnaireUsing = refusalReasonPG.get("CompletedQuestionnaireUsing").getValue();
    var MailedInCompletedQuestionnaire = refusalReasonPG.get("MailedInCompletedQuestionnaire").getValue();
    var QuestionsLegitimacyOfQuestionnaire = refusalReasonPG.get("QuestionsLegitimacyOfQuestionnaire").getValue();
    var PrivacyConcerns = refusalReasonPG.get("PrivacyConcerns").getValue();
    var SchedulingDifficulties = refusalReasonPG.get("SchedulingDifficulties").getValue();
    var SurveyIsVoluntary = refusalReasonPG.get("SurveyIsVoluntary").getValue();
    var DoesNotUnderstandTheQuestionnaire = refusalReasonPG.get("DoesNotUnderstandTheQuestionnaire").getValue();
    var AntigovernmentConcerns = refusalReasonPG.get("AntigovernmentConcerns").getValue();
    var HangupSlammedDoor = refusalReasonPG.get("AntigovernmentConcerns").getValue();
    var BreaksAppointment = refusalReasonPG.get("BreaksAppointment").getValue();
    
    var Other = refusalReasonPG.get("Other").getValue();
    var OtherComment = refusalReasonPG.get("OtherComment").getValue(); 
     
  	/*Add response Required text to page RefusalReason page */
  	if(RespondentTooBusy == false &&
       NotInterested == false &&
       SurveyIsAWasteOfTaxpayerMoney == false &&
       DoneEnoughOtherSurveys == false &&
       CompletedQuestionnaireUsing == false &&
       MailedInCompletedQuestionnaire == false &&
       QuestionsLegitimacyOfQuestionnaire == false &&
       PrivacyConcerns == false &&
       SchedulingDifficulties == false &&
       SurveyIsVoluntary == false &&
       DoesNotUnderstandTheQuestionnaire == false &&
       AntigovernmentConcerns == false &&
       HangupSlammedDoor == false &&
       BreaksAppointment == false &&
       Other == false ) {
   	 	workPG.addMessage(requiredMSG);
  	}
  
     
  	/*Add specify message if "Other" is selected and no text inputed on specify reason*/
  	if(Other == true && OtherComment == "") {
    	workPG.addMessage(specifyMSG);
  	}	
  } catch (e) {
    console.log("*** ENUMCB.RefusalReason_VLDN, Exception message: " + e.message);
  }
}

/*
* Validation function for Exit Pop Status
* Created by David Bourque
*/

ENUMCB.ExitPopStatus_VLDN = function() {
	var isDKRefVisible = ENUMCB.getIsDKRefVisible();
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var cpResponse = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
	var cpDKRefused = pega.ui.ClientCache.find("pyWorkPage.Respondent.DKRefused");
	var unitStatus = cpResponse.get("H_NRFU_STATUS_EXIT_CODE");
	var exitNumber = cpResponse.get("H_SIZE_EST_NRFU_INT");
	var exitNumberDKREF = cpDKRefused.get("ExitPopStatusNumber");
	var unitStatusDKREF = cpDKRefused.get("ExitPopStatusUnitStatus");
	if ((!unitStatus || unitStatus.getValue() == "") && (!exitNumber || exitNumber.getValue() == "") && (!exitNumberDKREF || exitNumberDKREF.getValue() == "") && (!unitStatusDKREF || unitStatusDKREF.getValue() == "")) {
		var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseProvideAnAnswer");
		workPage.addMessage(errorMessage);
	}
	if (!workPage.hasMessages()) {
		if (unitStatus && (unitStatus.getValue() == "1")) {
			if (isDKRefVisible) {
				ENUMCB.Required("pyWorkPage.Respondent.Response.H_SIZE_EST_NRFU_INT","pyWorkPage.Respondent.DKRefused.ExitPopStatusNumber","ExitPopStatus_HARD");
			} else {
				ENUMCB.Required("pyWorkPage.Respondent.Response.H_SIZE_EST_NRFU_INT","","ExitPopStatus_HARD");
			}
		}
		if (!workPage.hasMessages()) {
			if (exitNumberDKREF && exitNumberDKREF.getValue() != "") {
				if (isDKRefVisible) {
					ENUMCB.Required("pyWorkPage.Respondent.Response.H_NRFU_STATUS_EXIT_CODE","pyWorkPage.Respondent.DKRefused.ExitPopStatusUnitStatus","ExitPopStatus1_HARD");
				} else {
					ENUMCB.Required("pyWorkPage.Respondent.Response.H_NRFU_STATUS_EXIT_CODE","","ExitPopStatus1_HARD");
				}
			}
			if (!workPage.hasMessages()) {
				if (exitNumber && exitNumber.getValue() == "0") {
					var errorMessage = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "ExitPopStatus2_HARD");
					workPage.addMessage(errorMessage);
				}
			}
		}
	}
}

/*
*	Validation for TypeOfProxy_QSTN
*	Validates Specify text input is not blank or < 3 chars
*/
ENUMCB.TypeOfProxy_VLDN = function() {
	var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var responsePage = pega.ui.ClientCache.find("pyWorkPage.Respondent.Response");
	var typeOfProxy = responsePage.get("RESP_PRX_TYPE_CODE");
	typeOfProxy = typeOfProxy ? typeOfProxy.getValue() : "";
	var proxyWriteIn = responsePage.get("RESP_PRX_TYPE_CODE_OTHER_TEXT");
	proxyWriteIn = proxyWriteIn ? proxyWriteIn.getValue() : "";
  	var noWhiteSpaceLength = proxyWriteIn.replace(/\s/g, "");
	var strLength = noWhiteSpaceLength.length;
	var specifyMSG = CB.getAndParseFieldValue("pyWorkPage", "pyCaption", "PleaseSpecifyAProxy");
	
	if(typeOfProxy == "10" && (proxyWriteIn == "" || strLength < 3)) {
		workPage.addMessage(specifyMSG);
	}
}

ENUMCB.ProxyAddress_VLDN = function (addressType){
	var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var cpProxyAddress = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ProxyAddress");
	if(cpWorkPage && cpProxyAddress){
		 ENUMCB.Required("pyWorkPage.HouseholdRoster.ProxyAddress.AddrType", "pyWorkPage.HouseholdMemberTemp.DKRefused.ProxyAddress");
		
		var state = cpProxyAddress.get("STATE").getValue();
		var zip = cpProxyAddress.get("LOCZIP").getValue();
      	alert(state);
		
		
		if(addressType == 'USSA' || addressType == 'PRGA' || addressType == 'PRUA'){ 					/* Street and General Address*/
          	var addressNumber = cpProxyAddress.get("LOCHN1").getValue();
          	alert("AddressNumber");
			var streetName = cpProxyAddress.get("StreetName").getValue();
          	alert("StreetName");
			var urbName = cpProxyAddress.get("LOCURB").getValue();
          	alert("urbName");
			var city = "";
            var errorMessage = "";
          	alert("Vars set");
			if(addressType == 'USSA'){
				city = cpProxyAddress.get("CITY").getValue();
				errorMessage = "Please provide a City and State or ZIP Code.";
              	alert("City set");
			} else{
				city = cpProxyAddress.get("Municipio").getValue();
				errorMessage = "Please provide a Municipio and State or ZIP Code.";
			}
			
			if(addressNumber == "" && streetName == "" && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a Street Address.");
              	alert("Message set");
			}
			
			if(addressType == 'PRUA' && urbName == "" && addressNumber == "" && streetName == "" && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide an Urbanización Name.");
			}
			if((addressNumber == "" || streetName == "") && ((city != "" && state != "") || zip != "")){
				cpWorkPage.addMessage("Please provide an Address Number and Street Name.");
			}
			
			if((addressNumber != "" && streetName != "") && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a City and State or ZIP code.");
			}
		}else if(addressType == 'USPO' || addressType == 'PRPO'){			/* PO Box*/
          	alert("USPO/PRPO");
			var poBox = cpProxyAddress.get("POBox").getValue();
			var city, errorMessage;
			if(addressType == 'USPO'){
				city = cpProxyAddress.get("CITY").getValue();
				errorMessage = "Please provide a City and State or ZIP Code.";
			} else{
				city = cpProxyAddress.get("Municipio").getValue();
				errorMessage = "Please provide a Municipio and State or ZIP Code.";
			}
		
			if(poBox == "" && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a P.O. Box address.");
			}
			
			if(poBox != "" && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage(errorMessage);
			}
		}else if(addressType =='USRR' || addressType == 'PRRR'){		/* Rural Route*/
		 	alert("USRR/PRRR");	
          var rrNum = cpProxyAddress.get("RuralRouteNumber").getValue();
			var rrBoxIDNum = cpProxyAddress.get("RuralRouteBoxIDNumber").getValue();
			var rrDesc = cpProxyAddress.get("RuralRouteDescription").getValue();
			if(addressType == 'USRR'){
				city = cpProxyAddress.get("CITY").getValue();
				errorMessage = "Please provide a City and State or ZIP Code.";
			} else{
				city = cpProxyAddress.get("Municipio").getValue();
				errorMessage = "Please provide a Municipio and State or ZIP Code.";
			}
			
			if((rrNum == "" && rrBoxIDNum == "" && rrDesc == "") && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a Rural Route address.");
			}
			
			if((rrNum == "" && rrBoxIDNum == "" && rrDesc == "") && ((city != "" && state != "") || zip != "")){
				cpWorkPage.addMessage("Please provide a Rural Route # or RR Box ID #.");
			}
			
			if((rrNum != "" || rrBoxIDNum != "" || rrDesc != "") && ((city == "" || state == "") && zip == "")){
				cpWorkPage.addMessage(errorMessage);
			}
		} else if(addressType =='PRAC'){							/* Apartment Complex */
			alert("PRAC");
          	var aptName = cpProxyAddress.get("LOCAPTCOMPLEX").getValue();
			var aptNum = cpProxyAddress.get("LOCWSID1").getValue();
			var municipio = cpProxyAddress.get("Municipio").getValue();
			
			if(aptName == "" && aptNum == "" && ((municipio == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a Street Address.");
			}
			
			if(aptName == "" && aptNum != "" && ((municipio != "" && state != "") || zip != "")){
				cpWorkPage.addMessage("Please provide an Apartment Complex Name.");
			}
			
			if(aptName != "" && aptNum == "" && ((municipio != "" && state != "") || zip != "")){
				cpWorkPage.addMessage("Please provide an Apt/Unit.");
			}
			
			if(aptName != "" && aptNum != "" && ((municipio == "" && state == "") || zip == "")){
				cpWorkPage.addMessage("Please provide a Municipio and State or ZIP code.");
			}
		} else if(addressType =='PRAA'){						/* Area Name Address */
			alert("PRAA");
          	var areaName = cpProxyAddress.get("LOCAREANM1").getValue();
			var municipio = cpProxyAddress.get("Municipio").getValue();
			
			if(areaName == "" && ((municipio == "" || state == "") && zip == "")){
				cpWorkPage.addMessage("Please provide a Street Address.");
			}
			
			if(areaName == "" && ((municipio != "" && state != "") || zip != "")){
				cpWorkPage.addMessage("Please provide an Area Name.");
			}
			
			if(areaName != "" && ((municipio == "" && state == "") || zip == "")){
				cpWorkPage.addMessage("Please provide a Municipio and State or ZIP code.");
			}
		}
		
		/* Zip Validation */
		ENUMCB.Zip_VLDN(zip);
      	alert("Validation Complete")
	}
}

ENUMCB.Zip_VLDN = function (zip){
  	alert("Running ZIP VLDN");
	var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
	var cpProxyAddress = pega.ui.ClientCache.find("pyWorkPage.HouseholdRoster.ProxyAddress");
	if(cpWorkPage && cpProxyAddress){
      	alert("CP found");
		var state = cpProxyAddress.get("STATE").getValue();
		if(state == 'PR'){
			if(zip.length < 5 || zip.length > 5 || zip < 601 || zip > 988){
				cpWorkPage.addMessage("Please provide a valid ZIP code.");
			}
		}else{
			if(zip.length < 5 || zip.length > 5 || zip < 1001 || zip > 99950 || zip == 11111 || zip == 22222 || zip == 33333 || zip == 44444 || zip == 55555 || zip == 66666 || zip == 77777 || zip == 88888){
				cpWorkPage.addMessage("Please provide a valid ZIP code.");
			}
		}
	}
}