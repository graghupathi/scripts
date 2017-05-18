/* Placeholder for user's offline scripts */

/*custom populator for radio and drop down type questions answer population*/
function D_QuestionOptions(dpPage, params){  
  var cc=pega.u.ClientCache;  
  var currOptionsPL = cc.find("D_QuestionOptions").put("pxResults",[]);  
  var optionsIter = cc.find("D_QuestionOptions_Master.pxResults").iterator();  
  while(optionsIter.hasNext()){  
       var optionPg = optionsIter.next();  
		var que = pega.clientTools.getParamPage().get("QuestionName");
       if(optionPg.get("QuestionName").getValue() == que){  
            currOptionsPL.add().adoptJSON(optionPg.getJSON());  
       }  
  }  
}   

/*Function to ensure ClientCache is updated with CurrentSurveyQuestion prior to UI Stream rendering*/  
function preFlowAction$DisplayQuestion(){
  pega.ui.ClientCache.find("pyWorkPage").put("CurrentSurveyQuestion", pega.clientTools.getParamPage().get("QuestionName"));
}

/*start of code for setting Answer for SimpleQuestion of type File in offline mode*/ 

pega.mobile.hybrid.callWhenLaunchboxLoaded(function() {
      	pega.desktop.registerEventListener("deltasync", onSurveyDeltaSync);
});

function onSurveyDeltaSync(){
  var workObjIns = pega.ui.ClientCache.find("pyWorkPage.pzInsKey");
  var workInsHandle = workObjIns.getValue();
  //If temporary object, lookup actual id in most recent D_pzOfflineWorkIDs datapage
  if(workInsHandle.indexOf('TEMP') >= 0){
    pega.offline.clientstorehelper.getDataPage('D_pzOfflineWorkIDs',
            function(result) {
      			var offlineWorkIDs = result.pyData;
				var pxResultCount = (offlineWorkIDs.pxResults && offlineWorkIDs.pxResults.length) ? offlineWorkIDs.pxResults.length : 0;
				if (pxResultCount > 0) {
					for (var mappingIndex in offlineWorkIDs.pxResults) {
						var mapping = offlineWorkIDs.pxResults[mappingIndex];
						if (mapping != undefined) {
							if (workInsHandle.indexOf(mapping.pyEventID) >= 0) {
								workInsHandle = workInsHandle.replace(mapping.pyEventID, mapping.pyID);
								updateFileAnswer(workInsHandle);
							}
						}
					}
				}
    		},
            function(){
                console.error("clientStoreSync: Unable to get list of items to reconcile");
                onFailure(arguments[0]);
            });
  }else{
    updateFileAnswer(workInsHandle);
  }
}

function updateFileAnswer(workHandle){
    pega.offline.clientstorehelper.getWorkItem(workHandle,
    function(result) {
      console.debug("reconciliation: new work item retrieved.");
      var newWorkObjectJSON = result.content;
      var questionsObj = JSON.parse(result.content).Question;	
      for(quesIdx in questionsObj){
        var currQue = questionsObj[quesIdx];
        if(currQue.QuestionMode == "file"){
          var currentQuesObj = pega.ui.ClientCache.find(currQue.SurveyPageReference);
          currentQuesObj.put("Answer",currQue.Answer);
        }
      }
    },
    function() {
      console.debug("reconciliation: new work item retrieved getWorkItem Failed");
    });
}

/*
function postLoadWorkAndAssignmentFromJSON(newWorkJSON, newAssignmentJSON){
  debugger;
  var currentWorkPage = pega.ui.ClientCache.find("pyWorkPage");
  if(currentWorkPage){
    var questionsObj = JSON.parse(newWorkJSON).Question;	
    for(quesIdx in questionsObj){
      var currQue = questionsObj[quesIdx];
      if(currQue.QuestionMode == "file"){
        var currentQuesObj = pega.ui.ClientCache.find(currQue.SurveyPageReference);
        currentQuesObj.put("Answer",currQue.Answer);
      }
    }
  }
}
*/

/*End of code for setting Answer for SimpleQuestion of type File in offline mode*/