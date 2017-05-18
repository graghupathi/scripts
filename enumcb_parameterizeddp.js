/*************************************************************************************
***    Parameterized DP functions
***
**************************************************************************************/
function D_CountyListForAgentGivenZipCode(dpPage, params) {
    try {
        if (MREnroll.isDigit(params.ZipCode) == true) {
			var clientCache = pega.u.ClientCache;
			/*clientCache.setDebugMode(clientCache.DEBUG_MODE_ON);*/
			var state = "";
			var statecode = "";
			var applnCache = pega.ui.ClientCache.find("pyWorkPage.ApplicationInfo");
			var countyListForAgent = dpPage.put("pxResults", []);       /*this will empty the data page*/
			var countyList = clientCache.find("D_CountyListForAgent.pxResults");
			if (countyList) {
				 countyList = countyList.iterator();
			} else {
				/*this as per requirement*/
				var objJSON = '{"CMSCOUNTYNAME":"County List is empty. please delete and reinstall the application.","pxObjClass":"UHG-FW-MREnroll-Data-EMSPlanTable-APPP","CMSCOUNTYCODE":"None"}';
				countyListForAgent.add().adoptJSON(objJSON);
				throw "D_CountyListForAgent is empty!";
			}
			var countyPG = null;
			var sourcePG = null;
			var zipCode = params.ZipCode;
            while (countyList.hasNext()) {
                 sourcePG = countyList.next();
                if (sourcePG.get("ZIPCODE").getValue() == zipCode) {
					countyPG = clientCache.createPage("temp");
					countyPG.adoptJSON(sourcePG.getJSON());
					state = countyPG.get("STATEABBREVIATION").getValue();
					statecode = countyPG.get("CMSSTATECODE").getValue();
					applnCache.put("State", state);
					applnCache.put("StateCode", statecode);
					countyListForAgent.add().adoptJSON(countyPG.getJSON());
                }
					delete countyPG;        /*for optimization*/
				}     
        } else { /*set the state back to "--"*/
            pega.ui.ClientCache.find("pyWorkPage.ApplicationInfo").put("State", "--");
            pega.ui.ClientCache.find("pyWorkPage.ApplicationInfo").put("StateCode", "");
        }
    } catch (e) {
        /*log error*/
        var objJSON = '{"CMSCOUNTYNAME":"County List is empty. please delete and reinstall the application.","pxObjClass":"UHG-FW-MREnroll-Data-EMSPlanTable-APPP","CMSCOUNTYCODE":"None"}';
        countyListForAgent.add().adoptJSON(objJSON);
        console.log("Error in D_CountyListForAgentGivenZipCode: " + e.message);
    }
}

function D_DKRefusedOptions() {
  var DKRefOptions = pega.ui.ClientCache.find("D_DKRefusedOptions").put("pxResults",[]);  
  var paramsPage = pega.ui.ClientCache.find("D_DKRefusedOptions.pxDPParameters");
  var dkParam = paramsPage.get("DK").getValue();
  var refParam = paramsPage.get("Ref").getValue();
  var DKRefOptionsMaster = pega.ui.ClientCache.find("D_DKRefusedOptions_Master.pxResults").iterator();  
  while(DKRefOptionsMaster.hasNext()) {
    var currentPage = DKRefOptionsMaster.next()
    if(currentPage.get("pyValue").getValue() == dkParam) {
      DKRefOptions.add().adoptJSON(currentPage.getJSON());  
    }
    else if(currentPage.get("pyValue").getValue() == refParam) {
      DKRefOptions.add().adoptJSON(currentPage.getJSON());  
    }
  }
}

function D_HomeOptions() {
  
  var clientCache = pega.u.ClientCache;
  var homeOptions = clientCache.find("D_HomeOptions").put("pxResults",[]);  
  var homeOptionsMaster = clientCache.find("D_HomeOptions_Master.pxResults").iterator();  
  var attemptType = clientCache.get("pyWorkPage.HouseholdMemberTemp.Response.NRFU_ATTEMPT_TYPE_CODE").getValue();
  var respLocation = clientCache.get("pyWorkPage.HouseholdMemberTemp.Response.RESPONSE_LOCATION_CODE").getValue();
  var label;
  if((attemptType == "PV" || attemptType == "TA" || attemptType == "TB") && respLocation == "2") {
    label = "1";
  }
  else {
    label = "2";
  }
  while(homeOptionsMaster.hasNext()) {
    var currentPage = homeOptionsMaster.next();
    if(currentPage.get("pyLabel").getValue() == label){
      homeOptions.add().adoptJSON(currentPage.getJSON());   
    }
  }
  
}



/**************** Sample Activity ************/
function ClearRiderPages() {
    try {
        var clr = pega.ui.ClientCache;
        var applnCache = clr.find("pyWorkPage.ApplicationInfo");
        applnCache.put("ProductName", "");
        applnCache.put("PBP", "");
        applnCache.put("PlanPremium", "0.00");
        applnCache.put("PlanName", "");
        applnCache.put("Brand", "");
        applnCache.put("showDSNPDisclaimer", "false");
        applnCache.put("BusinessSegment", "");
        applnCache.put("Gorl", "");
        applnCache.put("DentalRider", "");
        applnCache.put("DentalRiderPremium", "");
        applnCache.put("FitnessRider", "");
        applnCache.put("FitnessRiderPremium", "");
        applnCache.put("PropEffectiveDT", "");
        applnCache.put("ContractNumber", "");
        applnCache.put("PBP", "");
        applnCache.put("HPBP", "");
        applnCache.put("isDisplayRider", "false");
        applnCache.put("DentalFacilityNum", "");
        applnCache.put("IsFitnessRider", "false");
        applnCache.put("ElectionPeriod", "Select...");
        applnCache.put("SEPReasonCode", "");
    } catch (e) {
        /*log error*/
        console.log("Error in ClearRiderPages: " + e.message);
    }
}