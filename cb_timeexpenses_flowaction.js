/*************************************************************
 ****	All time and expenses code should be here
 ****	Please use try/catch block in your code
 **************************************************************/
function preFlowAction$DateAndTime() {
  try {
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var TimeExpense = workPage.get('TimeExpense');
    var WorkDateTime = workPage.get('WorkDateTime');

    /*Temp fix replace work page-Needed?-KCJ*/
    replaceWorkPage();
	
    /*IF TimeExpense DNE, initialize it.*/
    if (!TimeExpense) {
      var tempWorkpg = workPage.getJSON();
      tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1)
      tempWorkpg += ', "WorkDateTime":{"pxObjClass":"CB-Data-WorkDateTime"}, "TimeExpense" : {"pxObjClass":"CB-Data-TimeExpense"}}';
      workPage.adoptJSON(tempWorkpg);
      TimeExpense = workPage.get('TimeExpense');
      TimeExpense.put("HasExpense", "");
    }
      	
    /*IF TimeExpense.HasExpense property DNE, initialize it.*/
    if (!TimeExpense.get("HasExpense")) {
      TimeExpense.put("HasExpense", "");
    }
    
    /* timeExpense exists so we can retrieve the WorkDatetimeList. */
    var workDateTimeList = TimeExpense.get('WorkDatetimeList(1)');
    if (workDateTimeList) {
      workPage.put('WorkDatetimeListIsEmpty', false);
    } else{
      workPage.put('WorkDatetimeListIsEmpty', true);
    }
    
    /*Initialize Time Expense report status.*/
    var workStatus = workPage.get('pyStatusWork');
    if (workStatus !== "Open-Rejected")
    	TimeExpense.put("Status", "NOT ATTESTED"); 
    
    if (!TimeExpense.get('Date') || !TimeExpense.get('YearData') || !TimeExpense.get('MonthData') || !TimeExpense.get('DayData')) {    
      /* Default the Month/Day/Year values to today's date.*/
      var today = new Date();
      var todayMonth = (today.getMonth() + 1).toString(); /* Get month, add 1 (since 0-indexed), int2string.*/
      var todayDay = (today.getDate() < 10) ? ('0' + today.getDate().toString()) : today.getDate().toString(); /* Pad with 0 if needed(1-9).*/
      var todayYear = today.getFullYear().toString();
      TimeExpense.put("YearData", todayYear);
      TimeExpense.put("MonthData",todayMonth);
      TimeExpense.put("DayData",todayDay);
    }
    
    console.debug("Before CheckForExistingTimeExpense:: pyWorkPage: " + workPage.getJSON());
    
    CheckForExistingTimeExpense(false);
    
    /*IF WorkDateTime DNE, initialize it.*/
    if (!WorkDateTime) {
      var tempWorkpg = workPage.getJSON();
      tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1);
      tempWorkpg += ', "WorkDateTime":{"pxObjClass":"CB-Data-WorkDateTime"}}';
      workPage.adoptJSON(tempWorkpg);
    }

	/* Determine the work date time type for the newly created/initialized WorkDatetime */
    SetTypeDropdown();
    
  } catch (e) {
    console.debug("preFlowAction$DateAndTime:: caught exception" + e);
  }
   
  AppendUpdateTEWorklist();
  console.log("Leaving preFlowAction$DateAndTime:: pyWorkPage: " + workPage.getJSON());
}

/*
 *	Created By: Kelsey Justis 
 *	Date: 12-05-2016
 *	Purpose: This post flow action executes after the Date and Time screen 
 *  		 with the purpose of updating and validating the values entered.
 *	User Story: US-1634.
 */
function postFlowAction$DateAndTime() {
  
  try {
    /* Retrieve required data.*/
    var workPage = pega.ui.ClientCache.find("pyWorkPage");
	var timeExpense = workPage.get("TimeExpense");
    var workDateTime = workPage.get("WorkDateTime");
    
    
  console.log("**** Entering postFlowAction$DateAndTime, pyWorkPage: " + workPage.getJSON()); 
    
    workPage.clearMessages();
    timeExpense.clearMessages();
    workDateTime.clearMessages();
    
    var otCheckbox = workPage.get('WorkDateTime.OTPreApproved') ? workPage.get('WorkDateTime.OTPreApproved').getValue() : "";
    var type = workPage.get('WorkDateTime.Type') ? workPage.get('WorkDateTime.Type').getValue() : "";
    var displayOTType = workPage.get('WorkDateTime.DisplayOTType') ? workPage.get('WorkDateTime.DisplayOTType').getValue() : false;
    var displayRegularType = workPage.get('WorkDateTime.DisplayRegularType') ? workPage.get('WorkDateTime.DisplayRegularType').getValue() : false;
    var otType = workPage.get('WorkDateTime.OvertimeType') ? workPage.get('WorkDateTime.OvertimeType').getValue() : "";
    var regularType = workPage.get('WorkDateTime.RegularType') ? workPage.get('WorkDateTime.RegularType').getValue() : "";
    
    if (displayOTType == true || displayOTType == 'true'){
      workDateTime.put('Type', otType); 
    }else{
      workDateTime.put('Type', regularType);
    }
    
    if (otCheckbox == false || otCheckbox == 'false'){
      if(displayOTType == true || otCheckbox == 'true'){
        workPage.get('WorkDateTime.OTPreApproved').addMessage(ALMCensus.Messages.Msg_OTPreApprove_Required);
      }
    }
    
    /* Validate for empty WorkDateTimeList.*/
    /* KCJ US-1810 work needed?*/
    var workDateTimePageList = timeExpense.get("WorkDatetimeList");
    var isReclaim = timeExpense.get('IsReclaim') ? timeExpense.get('IsReclaim').getValue() : false;
    var hasExistingNotAttested = workPage.get('HasExistingNotAttested') ? workPage.get('HasExistingNotAttested').getValue() : false;
    var sameDateCount = workPage.get('SameDateTimeExpenseCount') ? parseInt(workPage.get('SameDateTimeExpenseCount').getValue()) : parseInt("0");
    
    /* Validate 4 Max TE */
    if (sameDateCount > 3) {
      timeExpense.get('MonthData').addMessage(ALMCensus.Messages.Msg_2MaxTE);
      return;         
    }
    /* Validate Not Attested with same date */
    else if (hasExistingNotAttested === true || hasExistingNotAttested === "true") {
      timeExpense.get('MonthData').addMessage(ALMCensus.Messages.Msg_NotAttested);
      return;
    }
    else if (!workDateTimePageList && (isReclaim === "false" || isReclaim === false))  {   
      timeExpense.addMessage(ALMCensus.Messages.Msg_WorkDatetimeList_NoItems);
      return; /* No List, so return */
    }
    
    
    /* Calculate total time worked from time interval information entered on the DateAndTime Screen.-Part of User Story: Bug-581-KCJ.*/
    /* Iterator to loop over WorkDateTimeList and temp properties.*/
    var workDateTimeList = timeExpense.get("WorkDatetimeList").iterator();
    
    /* Initialize the properties required to record the total time worked.*/
    var timeIntervalTimeWorked= 0.0;
    var totalTimeWorked = 0.0;
	var totalRegularTimeWorked = 0.0;
	var totalOverTimeWorked = 0.0;
	var workDateTime;
	var workDateTimeType;
    
    /* While there still exist a time interval after the current time interval in the WorkDateTimeList.*/
    while (workDateTimeList && workDateTimeList.hasNext()) {    
      /* Grab hours/minutes worked in current time interval.*/
      workDateTime = workDateTimeList.next();         
      timeIntervalTimeWorked = workDateTime.get("TimeIntervalTimeWorked") ? parseFloat(workDateTime.get("TimeIntervalTimeWorked").getValue()):0.0;
      /* Grab the work date time type */
	  workDateTimeType = workDateTime.get("Type") ? workDateTime.get("Type").getValue() : "";
      /*Increment total.*/
      totalTimeWorked += timeIntervalTimeWorked;   
	  if (workDateTimeType == "Regular" || workDateTimeType == "Training") {
		totalRegularTimeWorked += timeIntervalTimeWorked;
	  }
	  else if (workDateTimeType == "Overtime" || workDateTimeType == "Training Overtime") {
		totalOverTimeWorked += timeIntervalTimeWorked;
	  }
    }
    timeExpense.put('TotalTimeWorked', String(totalTimeWorked));
	timeExpense.put('TotalRegularTimeWorked', String(totalRegularTimeWorked));
	timeExpense.put('TotalOverTimeWorked', String(totalOverTimeWorked));
  } catch (e) {
    console.log("postFlowAction$DateAndTime:: Caught exception" + e);
  }
}

function preFlowAction$Mileage() {
  
      /*Temp fix replace work page-Needed?-KCJ*/
      replaceWorkPage();

      var TimeExpense = pega.ui.ClientCache.find('pyWorkPage.TimeExpense');
      var ExpenseList = TimeExpense.get('ExpenseList');
      if (ExpenseList) {
        TimeExpense.put('ExpenseExist', 'Yes');
      } else {
        TimeExpense.put('ExpenseExist', 'No');
      }
      AppendUpdateTEWorklist();
}

function postFlowAction$Mileage() {
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  console.debug("****** postFlowAction$Mileage, pyWorkPage: " + workPage.getJSON());
  
  var timeExpense = pega.ui.ClientCache.find('pyWorkPage.TimeExpense');
  var mileage = timeExpense.get('Mileage') ? timeExpense.get('Mileage').getValue() : "";
  var hasExpense = timeExpense.get('HasExpense') ? timeExpense.get('HasExpense').getValue() : "";
  var workDatetimeList = timeExpense.get('WorkDatetimeList(1)');
  if ((!workDatetimeList) && (!mileage || mileage === '' || mileage === "0") && (hasExpense === 'No')) {
    timeExpense.get('Mileage').addMessage(ALMCensus.Messages.Msg_Mileage);
  } else {
    if (mileage) {
      if (mileage > 9999) {
        timeExpense.get('Mileage').addMessage(ALMCensus.Messages.Msg_Mileage_Digits);
      }
      if (!CB.isDigit(mileage)) {
        timeExpense.get('Mileage').addMessage(ALMCensus.Messages.Msg_Mileage_Number);
      }
    }
  }
  if (!timeExpense.hasMessages() && hasExpense !== 'No') {
    timeExpense.put("HasExpense", "Yes");
  }
  if (!timeExpense.hasMessages() && (!mileage || mileage === '' || mileage === "0")) {
    timeExpense.put('Mileage', '');
  }
}

function preFlowAction$Expense(flowClass) {
    
  	/*Temp fix replace work page-Needed?-KCJ*/
    replaceWorkPage();
  
    var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var TempExpense = workPg.get("ExpenseEntry");
    if (!TempExpense) {
      var tempWorkpg = workPg.getJSON();
      tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1);
      tempWorkpg = tempWorkpg + ', "ExpenseEntry" : {"pxObjClass":"CB-Data-WorkExpense"} }';
      workPg.adoptJSON(tempWorkpg);
      var TempExpense = workPg.get("ExpenseEntry");
      TempExpense.put('Type', 'Parking');
      TempExpense.put('Amount', '');
      TempExpense.put('Comment', '');
      TempExpense.put('ImageID', '');
    }
  	AppendUpdateTEWorklist();
}

function postFlowAction$Expense() {
  
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  console.debug("***** postFlowAction$Expense, pyWorkPage: " + workPage.getJSON());
  
  var workPg = pega.ui.ClientCache.find('pyWorkPage');
  var timeExpense = workPg.get('TimeExpense');
  var expenseEntry = workPg.get('ExpenseEntry');
  var ExpenseList = timeExpense.get('ExpenseList(1)');
  if (!ExpenseList) {
    expenseEntry.get('Type').addMessage(ALMCensus.Messages.Msg_ExpenseDataRequired);
  }
}

function preFlowAction$Summary() {

  /*Temp fix replace work page-Needed?-KCJ*/
  replaceWorkPage();

  var timeExpense = pega.ui.ClientCache.find('pyWorkPage.TimeExpense');
  var ExpenseList = timeExpense.get('ExpenseList');
  var total = parseFloat("0");
  if (ExpenseList) {
    ExpenseList = ExpenseList.iterator();
    while (ExpenseList && ExpenseList.hasNext()) {
      var Expense = ExpenseList.next();
      var amount = parseFloat(Expense.get('Amount').getValue());
      total = total + +amount;
    }
    timeExpense.put('TotalExpense', String(total));
  } else {
    timeExpense.put('TotalExpense', '');
  }
  AppendUpdateTEWorklist();
}


/*
 *	Created By: Kenward Thoi
 *	Date: 12-2016
 *	Purpose: Check if timeExpense case flow should enter Attest screen or Submit screen when entered.
 *	User Story:.
 */
function preFlowAction$Attest() {
  var timeExpense = pega.ui.ClientCache.find('pyWorkPage.TimeExpense');
  
  /* Set Attestflag to false, so that user can re-attest */
  timeExpense.put("AttestFlag", "false");
  
  var SubmitFlag = pega.ui.ClientCache.find('TempPg') ? pega.ui.ClientCache.find('TempPg').get("pyLabel").getValue() : "false";
  if (SubmitFlag === "true") {
    timeExpense.put("Status", "TRANSMITTED-PENDING");
    
  if (pega.mobile.isHybrid) {
    	AppendUpdateTEWorklist();
    }
  	pega.u.d.submit("pyActivity=FinishAssignment",null,"");
  }
}

/*
 *	Created By: Kenward Thoi
 *	Date: 12-2016
 *	Purpose: Update timeExpense case with the date once case is submitted.
 *	User Story:.
 */
function postFlowAction$SubmitTimeExpense() {
  var timeExpense = pega.ui.ClientCache.find('pyWorkPage.TimeExpense');
  var current = new Date();
  timeExpense.put("SubmitTime", current);
  AppendUpdateTEWorklist();
}


/*
 *	Created By: Kenward Thoi, Kelsey Justis 
 *	Date: 12-2016
 *	Purpose: This function appends the current Time and Expense Case/Work item to the TimeExpenseCaseList Data Page; 
 * 			 this allows the case information just entered to appear/be accesible on the History Screen.
 *	User Story: US-412.
 */
function AppendUpdateTEWorklist() {
  
  console.debug("***** AppendUpdateTEWorklist");
  
  /* Clear the current tempPg.*/
  ClearTemp();
  
  /* IF Offline.*/
  if (OnMobileApp())
    {
      /* Get required data pages.*/
      var timeExpenseDP = pega.ui.ClientCache.find('D_TimeExpenseCaseList');
      var workPage = pega.ui.ClientCache.find('pyWorkPage');
      var TEcurrent = workPage.get('TimeExpense');
      
      /* Get required properties to copy over.*/
      var ID = workPage.get('pyID').getValue();
      var insKey = workPage.get('pzInsKey').getValue();
      var date = TEcurrent.get('Date') ? TEcurrent.get('Date').getValue() : "";
      var status = TEcurrent.get('Status') ? TEcurrent.get('Status').getValue() : "";
      var mileage = TEcurrent.get('Mileage') ? TEcurrent.get('Mileage').getValue() : "";
      var hoursWorked = TEcurrent.get('HoursWorked') ? TEcurrent.get('HoursWorked').getValue() : "";
      var totalTimeWorked = TEcurrent.get('TotalTimeWorked') ? TEcurrent.get('TotalTimeWorked').getValue() : "";
      
      /* Make sure property values are formatted to sync with desktop/online.*/
      if (mileage === "") {
          mileage = 0;
      }
      if (hoursWorked === "") {
          hoursWorked = 0;
      }
      
      /* IF a timeExpense data page exists.*/
      if (timeExpenseDP) {
        
          /* Get data page results.*/
          var results = timeExpenseDP.get("pxResults");
        
          /* IF there are results present.*/
          if (results) {
              var count = parseInt("0"); /* Why not just 0?-KCJ*/
              var found = false;
              var iterate = results.iterator();
            	
              /* Search case list for the case currently being worked.*/
              while (iterate.hasNext() && iterate && !found) {
                  count += 1;
                  var temp = iterate.next();
                  var tempID = temp.get("pyID") ? temp.get("pyID").getValue() : "";
                  /* IF this is our current case being worked.*/
                  if (tempID === ID) {
                      var pxResult = timeExpenseDP.get("pxResults(" + count + ")");
                      pxResult.adoptJSON(workPage.getJSON());
                      found = true;
                  }
              }
            	
              /* IF the case being worked is not found in the case list.*/
              if (!found) {
                  var pxResult = results.add().adoptJSON(workPage.getJSON());
              }
          } 
          else {
            timeExpenseDP.put("pxResults", []);
            /* Get the assignment key to save.*/
            var assignmentKey = pega.ui.ClientCache.find('newAssignPage').get("pzInsKey") ? assignmentKey.getValue() : "";
            var pxResult = timeExpenseDP.get("pxResults");
            /* Store required case properties.*/
            pxResult.put("LastAssignmentKey", assignmentKey);
            pxResult.put("pyID", ID);
            pxResult.put("pzInsKey", insKey);
            pxResult.put("");

            /* Store required timeExpense properties.*/
            var timeExpense = pxResult.get("TimeExpense");
            timeExpense.put("Status", status);
            timeExpense.put("Mileage", mileage);
            timeExpense.put("Date", date);
            timeExpense.put("TotalTimeWorked", totalTimeWorked);
            pxResult.add().adoptJSON(workPage.getJSON());
            /* Add case being worked to the new case lilst.
              var tempWorkpg = timeExpenseDP.getJSON();
              tempWorkpg = tempWorkpg.substring(0, tempWorkpg.length - 1);
              tempWorkpg = tempWorkpg + ', "pxResults":[{"pxObjClass":"CB-FW-CensusFW-Work-TimeExpense", "TimeExpense":{"pxObjClass":"CB-Data-TimeExpense"}}] }';
              timeExpenseDP.adoptJSON(tempWorkpg);
              var pxResult = timeExpenseDP.get('pxResults(1)');*/
          }
        
      }
    }
}


function replaceWorkPage() {
  
  	try {
      var objJSON;
      var workPG = pega.ui.ClientCache.find("pyWorkPage");
      var prevWPG = pega.ui.ClientCache.find("PreviousWorkPage");

      if (prevWPG) {
        objJSON = prevWPG.getJSON();
        workPG.adoptJSON(prevWPG.getJSON());
      }
    } 
  	catch (err) {      
      console.log("*** Inside replaceWorkPage(): " + err.message);
    }
}