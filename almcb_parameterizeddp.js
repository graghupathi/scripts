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

/*************************************************************************************
***    Create a data page from D_pyUserWorkList base on the provided param.WorkClassName
***
**************************************************************************************/
function D_UserWorkListByType(dpPage, params) {
    try {
      console.log("*** D_UserWorkListByType: " + params.WorkClassName);
     
     /* if (params.WorkClassName) { */
			var clientCache = pega.u.ClientCache;
           	var WorkListByType = dpPage.put("pxResults", []);
          	var userWorkList = clientCache.find("D_pyUserWorkList.pxResults");  /* D_pyUserWorkList data page */

      		var MyWorkListSummaryDP = clientCache.get("D_MyWorkListSummary"); /* Keeps count of D_UserWorkListByType items */
			var UserWorkListByTypeItemsCount = 0;
      
          	if (userWorkList) {
  			  	userWorkList = userWorkList.iterator();  		
   
  			  	while(userWorkList.hasNext()) {    
    				var currentPage = userWorkList.next();
                    var refObjectClass = currentPage.get("pxRefObjectClass").getValue();	
                  
                  	if (refObjectClass == params.WorkClassName) {
                    	WorkListByType.add().adoptJSON(currentPage.getJSON());
                        UserWorkListByTypeItemsCount++;   
					}
  				}
               
              	console.log("** Content of D_UserWorkListByType:: " + WorkListByType.getJSON());
            } else {
              /* No pyUserWorkList */
              console.log("** Error in D_UserWorkListByType:: No item in pyUserWorkList");
            }
      
      		/* Updated count D_MyWorkListSummary */
			D_MyWorkListSummary.pyTempInteger = UserWorkListByTypeItemsCount;
      
       /** }  
        else {
          
        }
     **/
       	
    } catch (e) {
        /*log error*/
        console.log("** Error in D_UserWorkListByType:: " + e.message);
    }
 
}