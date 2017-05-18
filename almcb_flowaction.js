/*	
 *	Created By: Sonny Kocak
 *	Date: 11-17-2016
 *	Purpose: This pre action preFlowAction$DisplayAddressList.
 */
function preFlowAction$DisplayAddressList()
{   
  try { 
    console.log();
    PrepareFullAddresses("preFlowAction for DisplayAddressList calling PrepareFullAddresses method"); 
  }
  catch(err) {
    alert("preFlowAction$DisplayAddressList Error" + err.message);
  }
}

/*	
 *	Created By: Mark Switzer
 *	Date: 09-30-2016
 *	Purpose: This pre action copies the current AddressStatus into 
 *			 the correct AddressStatusX property (Default, New, Rework)
 *			 Part of US-578 and US-1269. 
 */
function preFlowAction$SetAddressStatus() {    
  /* retrieve data */
  var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var BCU = workPage.get('BCU');
  var unit = BCU.get('SelectedUnitPage');
  var addressStatus = unit.get('AddressStatus').getValue();
  var newUnitStatus = unit.get('NewUnitStatus');

  /* Pre Mugne call */
  Munge("Pre");

  /* Set the correct AddressStatusX property (Default, New, Rework) */
  if (newUnitStatus) {
    if (newUnitStatus.getValue() === 'New') {
      unit.put('AddressStatusNew', addressStatus);
      unit.put('AddressStatusRework', '');
      unit.put('AddressStatusDefault', '');
    } else if (newUnitStatus.getValue() === 'Rework') {
      unit.put('AddressStatusRework', addressStatus);
      unit.put('AddressStatusNew', '');
      unit.put('AddressStatusDefault', '');
    } else {
      unit.put('AddressStatusDefault', addressStatus);
      unit.put('AddressStatusRework', '');
      unit.put('AddressStatusNew', '');
      unit.put('NewUnitStatus', '');
    }
  } else {
    unit.put('AddressStatusDefault', addressStatus);
    unit.put('AddressStatusRework', '');
    unit.put('AddressStatusNew', '');
    unit.put('NewUnitStatus', '');
  }

  /* default attempt contact fields */
  try {
    var enumerateUnit = unit.get('EnumerateUnit');
    if (!enumerateUnit || enumerateUnit != true) {
      unit.put('EnumerateUnit', false);
    }
    var LocationAddress = unit.get('LocationAddress');
    var LocIsMail = LocationAddress.get('LOCISMAIL');
    if (!LocIsMail || LocIsMail != 'N') {
      LocationAddress.put('LOCISMAIL', 'Y');
    }
  } catch (e) {
    /* alert(e); */
  }
}

/*	
 *	Created By: Kyle Gravel
 *	Date: 08-29-2016
 *	Purpose: This post action copies the Selected Unit Page back into
 *			 the correct index of the Unit List after "Set Address Status"
 *			 is complete. Part of US-626
 */
function postFlowAction$SetAddressStatus() {

  /* Retrieve data.*/
  var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var BCU = workPage.get('BCU');
  var unit = BCU.get('SelectedUnitPage');
  var newUnitStatus = unit.get('NewUnitStatus') ? unit.get('NewUnitStatus').getValue() : "";

  /* Port Mugne call */
  Munge("Post");

  /* Get AddressStatus value if it exists; if not, initialize it.-KCJ 01-19-2017.*/
  var addressStatus = unit.get('AddressStatus') ? unit.get('AddressStatus').getValue():"";
  unit.put("AddressStatus",addressStatus);

  /* Get AddressStatusReason value if it exists; if not, initialize it.-KCJ 01-19-2017.*/
  var reason = unit.get('AddressStatusReason') ? unit.get('AddressStatusReason').getValue():"";
  unit.put("AddressStatusReason",reason);

  /* Get DangerousAddress value if it exists; if not, initialize it.-KCJ 01-19-2017.*/
  var dangerousAddress = unit.get('DangerousAddress') ? unit.get('DangerousAddress').getValue():false;

  /* If address status is not "Unable to Work", the dangerous address checkbox should be cleared when the user taps "Next" and proceeds to the next step.-KCJ, BUG-734, 01-19-2017*/
  if ((addressStatus !== 'Unable To Work') && (dangerousAddress === true)){
    dangerousAddress = false;
  }
  unit.put("DangerousAddress",dangerousAddress);


  /* Validate fields. Be sure to return out of function after validation piece, so we don't execute routing piece if a validation fails. */
  if (addressStatus === "") {

    /* Address Status is required */
    if (newUnitStatus === "") {
      unit.get('AddressStatusDefault').addMessage(ALMCensus.Messages.AddressStatusRequired);
    } 
    else if (newUnitStatus === "New") {
      unit.get('AddressStatusNew').addMessage(ALMCensus.Messages.AddressStatusRequired);
    } 
    else {
      unit.get('AddressStatusRework').addMessage(ALMCensus.Messages.AddressStatusRequired);
    }
    return;
  }

  /* Unable To Work requires a reason */
  if (addressStatus === 'Unable To Work' && (reason === "")) {
    unit.get('AddressStatusReason').addMessage(ALMCensus.Messages.AddressStatusReasonRequired);
    return;
  }

  /* Determine routing, and possibly resolved work status (Does Not Exists, Unable To Work)*/
  if ("Does Not Exist" === addressStatus) {

    unit.put('ReportingUnitStatus', 'Resolved-DoesNotExist');
    /* Call function in order to set the reporting status and status reason for RU */
    UpdateReportingStatusAndStatusReasonForRU("AddressStatus", "AddressStatus");
    SaveSelectedUnitPage();
    workPage.put('NextStep', 'Resolve');
    return;
  }

  if (addressStatus === "Unable To Work") {
    /*Store the current address' reason into LatestAddressStatusReason, at the BCU level*/
    /*Nate Dietrich, Mark Switzer */
    BCU.put('LatestAddressStatusReason', reason);

    var previousReportingUnitStatus = unit.get('ReportingUnitStatus').getValue();
    unit.put('ReportingUnitStatus', 'Resolved-UnableToWork');
    /* Call function in order to set the reporting status and status reason for RU */
    UpdateReportingStatusAndStatusReasonForRU("AddressStatus", "AddressStatus");
    SaveSelectedUnitPage();
    workPage.put('NextStep', 'Resolve');
    return;
  }

  unit.put('ReportingUnitStatus', 'Open');
  if (["Housing Unit", "Uninhabitable", "Under Construction"].indexOf(addressStatus) > -1) {
    workPage.put('NextStep', 'StructureType');
  } 
  else if (addressStatus === "Group Quarters (GQ)") {
    /*Go to 'Set GQ Details" Screen.-KCJ, Part of US-845.*/
    unit.put("StructureType","");
    SaveSelectedUnitPage();
    workPage.put('NextStep', 'CollectGQInformation');
  }
  else if (addressStatus === "Transitory Location (TL)") {
    /*Go to 'Select TL Type" Screen.-KCJ, Part of US-845.*/
    unit.put("StructureType","");
    SaveSelectedUnitPage();
    workPage.put('NextStep', 'SelectTLType');
  }
  else {
    workPage.put('NextStep', 'LocationAddress');
  }
}

/*
 *	Created By: Kelsey Justis and Naga 
 *	Date: 10-26-2016
 *	Purpose: This pre-flow action initializes the AttemptContactYesNo property value if the value has not already been set.
 *	User Story: US-1283.
 */
function preFlowAction$AttemptContact() {
  /* retrieve data */
  var unit = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
  var contactMade = unit.get('AttemptContactYesNo') ? unit.get('AttemptContactYesNo').getValue() : ""; 

  /* Check if the AttemptContactYesNo property exists in memory with a value; 
  if so, assign contactMade with the existing value; 
  otherwise assign contactMade with an initial/default value of "".*/
  if (contactMade === "") { /* IF contactMade was not given an existing AttemptContactYesNo value:*/
    unit.put("AttemptContactYesNo",''); /* Put AttemptContactYesNo property into memory with default value.*/
  }
}

/*
 *	Created By: Kelsey Justis
 *	Date: 10-17-2016
 *	Purpose: This post-flow action validates AttemptContactYesNo radio button value has been chose; otherwise display an error message in mobile state.
 *	User Story: US-1283.
 */
function postFlowAction$AttemptContact() {
  /* retrieve data */
  var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var BCU = workPage.get('BCU');
  var unit = BCU.get('SelectedUnitPage');
  var contactMade = unit.get('AttemptContactYesNo').getValue();

  /*Validate field.*/
  if (!contactMade || contactMade === '') { /* If a value has not been chose.*/
    /* AttemptContact response is required. */
    unit.get('AttemptContactYesNo').addMessage(ALMCensus.Messages.Msg_AttemptContactRequired);
    return;
  }

  var addressStatus = unit.get('AddressStatus') ? unit.get('AddressStatus').getValue() : '';
  if (contactMade === 'Yes' && addressStatus === 'Group Quarters (GQ)') {
    /*Go to 'Set GQ Contact Info" Screen.-switz302 Part of US-844.*/
    workPage.put('NextStep', 'SetGQContactInfo');
  }
  else if (contactMade === 'Yes' && addressStatus === 'Transitory Location (TL)') {
    /*Go to 'Set TL Contact Info" Screen.-switz302 Part of US-1923.*/
    workPage.put('NextStep', 'SetTLContactInfo');
  }
  else {
    /*Go to 'Set Location Address" Screen.-switz302 Part of US-844 and US-1923.*/
    workPage.put('NextStep', 'LocationAddress');
  }
}

function preFlowAction$SetStructureType() {
  /* set the flow action button labels since the customization doesn't work offline */
  var work = pega.ui.ClientCache.find('pyWorkPage');

  /* clear NextStep value because this can be checked in AutoSubmit to know
       if we're moving backward or forward */
  /* work.put('NextStep', ''); */ /* 12/14/2016 - marked for deletion (was related to bug with 2 decision shapes running back to back) */
}


/*
 *	Created By: Kelsey C. Justis
 *	Date: 02-09-2017
 *	Purpose: This post-flow action initializes the StructureType property values if the values have not already been set.
 *	User Story: ??<-Edited bad code of original author style IDK the USs-KCJ.
 */
function postFlowAction$SetStructureType() {  
  /* Check if the StructureType property exists in memory with a value; if so, assign StructureType with the existing value; otherwise assign an initial/default value of "".*/
  var unit = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
  
 
  var structType = unit.get('StructureType') ? unit.get('StructureType').getValue() : "";
 
  /* If a StructType value has not been chosen, notify user a selection is required.*/
  if (structType === "") {
    unit.get('StructureType').addMessage(ALMCensus.Messages.Msg_StructureTypeRequired); 
  } 
  else {

    /* Get aptComplex.*/

    /*var unit = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage');
    var structType = unit.get('StructureType') ? unit.get('StructureType').getValue() : "";
    var aptComplex = locationAddress.get('LOCAPTCOMPLEX') ? locationAddress.get('LOCAPTCOMPLEX').getValue(): "";*/

   
  }
}

/*
 *	Created By: Jared Nichols
 *	Date: 12-19-2016
 *	Purpose: This pre-flow action initializes the GQTypes and GQCategory property values if the values have not already been set.
 *	User Story: US-595, 596.
 */
function preFlowAction$CollectGQInformation() {
  /* retrieve data */
  var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
  var gqType = locationAddress.get('GQTypes') ? locationAddress.get('GQTypes').getValue(): "";
  var gqCategory = locationAddress.get('GQCategory') ? locationAddress.get('GQCategory').getValue(): "";
  var gqTypeCode = locationAddress.get('GQTypeCode') ? locationAddress.get('GQTypeCode').getValue(): "";


  /* Check if the GQTypes property exists in memory with a value; if so, assign GQTypes with the existing value; otherwise assign an initial/default value of "".*/
  if (gqType === "") { /* IF gqType was not given an existing gqType value:*/
    locationAddress.put("GQTypes", ""); /* Put GQTypes property into memory with default value.*/
  }
  /* Check if the GQCategory property exists in memory with a value; if so, assign gqCategory with the existing value; otherwise assign an initial/default value of "".*/
  if (gqCategory === "") { /* IF gqCategory was not given an existing gqCategory value:*/
    locationAddress.put("GQCategory", ""); /* Put GQCategory property into memory with default value.*/
  }
  /* Check if the GQTypeCode property exists in memory with a value; if so, assign gqTypeCode with the existing value; otherwise assign an initial/default value of "".*/
  if (gqTypeCode === "") { /* IF GQTypeCode was not given an existing gqCategory value:*/
    locationAddress.put("GQTypeCode", ""); /* Put GQCategory property into memory with default value.*/
  }
}

/*
 *	Created By: Jared Nichols
 *	Date: 12-19-2016
 *	Purpose: This post-flow action dictates whether 703: Domestic Violence Shelters is selected under GQTypes in order to determine the flow.
 *	User Story: US-596.
 */
function postFlowAction$CollectGQInformation() {
  /* retrieve data */
  try
  {
    var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var gqCategory = locationAddress.get('GQCategory') ? locationAddress.get('GQCategory').getValue(): "";

    var gqTypeCode = locationAddress.get("GQTypeCode");
    var cpGqTypeCode = (gqTypeCode)? gqTypeCode.getValue() : "";
    var gqType = "";
    if( cpGqTypeCode != "" )
    {
      var gqList = pega.ui.ClientCache.find("D_GQTypeOptions.pxResults");
      if(gqList)
      {
        var iterGQList = gqList.iterator();
        while(iterGQList.hasNext())
        {
          var cpCurItem = iterGQList.next();
          var name = cpCurItem.get("Name");
          var cpName = (name)? name.getValue() : "";
          var code = cpCurItem.get("Code");
          var cpCode = (code)? code.getValue() : "";
          if((name == gqCategory) && (cpCode == cpGqTypeCode))
          {
            gqType = cpCurItem.get("Value") ? cpCurItem.get("Value").getValue() : "";
            locationAddress.put('GQTypes',gqType);
            break;
          }
        }
      }
    }
    else
    {
      locationAddress.put('GQTypes',"");
    }

    if (gqCategory === "") { /* If a value has not been chosen.*/
      /* GQCategory is required */
      locationAddress.get('GQCategory').addMessage(ALMCensus.Messages.Msg_GQCategoryRequired);
    }
    /* Validate fields required. */
    else if (cpGqTypeCode == "") { /* If a value has not been chosen.*/
      /* GQTypeCode is required - as is GQTypes which gets set from it. */
      locationAddress.get('GQTypeCode').addMessage(ALMCensus.Messages.Msg_GQTypesRequired);
    }



    /* Branching logic. */
    if (gqType ===  "703: Domestic Violence Shelters") {
      workPage.put('NextStep', 'SetLocationAddress');
    } else {
      workPage.put('NextStep', 'AttemptContact');
    }
  }
  catch(Err)
  {
    alert("Error in CollectGQInformation Post Action ==> <" + Err.message + ">");
  }
}
/*
 *	Created By: Kelsey C. Justis  
 *	Date: 11-28-2016
 *	Purpose: This pre-flow action initializes the TLType and TLDescription property values if the values have not already been set.
 *	User Story: US-601.
 */
function preFlowAction$SelectTLType() {
  /* retrieve data */
  var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
  var TLTypeValue = locationAddress.get('TLType') ? locationAddress.get('TLType').getValue(): "";

  /* Check if the TLType property exists in memory with a value; if so, assign TLTypeValue with the existing value; otherwise assign an initial/default value of "".*/
  if (TLTypeValue === "") { /* IF TLTypeValue was not given an existing TLTypeValue value:*/
    locationAddress.put("TLType", ""); /* Put TLType property into memory with default value.*/
    locationAddress.put("TLDescription", ""); /* Put TLDescription property into memory with default value.*/
  }
}

/*
 *	Created By: Kelsey C. Justis
 *	Date: 11-28-2016
 *	Purpose: This post-flow action validates whether a TL Type value has been chosen and if appropriate a properly formatted TL Description has been provided; otherwise display an error message in mobile state.
 *	User Story: US-601.
 */
function postFlowAction$SelectTLType() {
  /* retrieve data */
  var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
  var TLTypeValue = locationAddress.get('TLType').getValue();
  var TLDescValue = locationAddress.get('TLDescription').getValue();

  /* validate fields */
  if (TLTypeValue === "") { /* If a value has not been chose.*/
    /* TL Type is required */
    locationAddress.get('TLType').addMessage(ALMCensus.Messages.Msg_TLTypeRequired);
  }
  if (TLTypeValue === "Other") { /* If TLType is "Other".*/
    if (TLDescValue === "") { /* If TLDescValue is blank ("").*/
      /* TLDescription is required */
      locationAddress.get('TLDescription').addMessage(ALMCensus.Messages.Msg_TLDescriptionRequired);
    }
    if (TLDescValue.length > 100) { /* If TLDescValue is longer than 100 alpha numeric characters.*/
      /* TLDescription is too long.*/
      locationAddress.get('TLDescription').addMessage(ALMCensus.Messages.Msg_TLDescriptionTooLong);
    }
  }
}

function preFlowAction$SetLocationAddress() {

  /* set the flow action button labels since the customization doesn't work offline */
  var work = pega.ui.ClientCache.find('pyWorkPage');

  /* clear NextStep value because this can be checked in AutoSubmit to know
         if we're moving backward or forward */
  /* work.put('NextStep', ''); */ /* 12/14/2016 - marked for deletion (was related to bug with 2 decision shapes running back to back) */
  var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
  var selectedUnitPage = BCU.get("SelectedUnitPage");
  var StructureType = selectedUnitPage.get("StructureType") ? selectedUnitPage.get("StructureType").getValue() : '';
  var AddressStatus = selectedUnitPage.get("AddressStatus").getValue();
  var isPR = BCU.get("IsPR").getValue();

	/* Added by Deepak for US-2304 */
	var index = BCU.get('SelectedUnit').getValue();
	var oldUnit = BCU.get('UnitList(' + index + ')');
	var oldStructureType = oldUnit.get("StructureType") ? selectedUnitPage.get("StructureType").getValue() : '';
	var oldAddressStatus = oldUnit.get("AddressStatus").getValue();
  
   var locationAddress = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.LocationAddress');
 	if (locationAddress)
    {
      var aptComplex = locationAddress.get('LOCAPTCOMPLEX') ? locationAddress.get('LOCAPTCOMPLEX').getValue(): "";
      var locbldgid = locationAddress.get('LOCBLDGID') ? locationAddress.get('LOCBLDGID').getValue(): "";
      var gqName = locationAddress.get('GQName') ? locationAddress.get('GQName').getValue(): "";
      var gqFacName = locationAddress.get('GQFacilityName') ? locationAddress.get('GQFacilityName').getValue(): "";
      
       if (((StructureType === "Single Family Home") ||
         (StructureType === "Multi Unit Structure")||
         (StructureType === "Trailer/Mobile Home") ||
         (StructureType === "Boat, Tent, Etc")) &&
        (aptComplex != "")) 
    	{

   		 	aptComplex = "";
      		locationAddress.put("LOCAPTCOMPLEX",aptComplex);

    	}
        if ((AddressStatus === "Empty Trailer Pad/Mobile Home Site") ||
         (AddressStatus === "Nonresidential")||
         (AddressStatus === "Transitory Location (TL)")  &&
        (aptComplex != "")) 
    	{

   		 	aptComplex = "";
      		locationAddress.put("LOCAPTCOMPLEX",aptComplex);

    	}
        
        if ((AddressStatus === "Transitory Location (TL)") || (AddressStatus === "Group Quarters (GQ)") )
    	{
            if (gqFacName != ""){
        		gqFacName = "";
      			locationAddress.put("GQNGQFacilityNameame",gqFacName);
            }
    	}
        
        if (AddressStatus === "Group Quarters (GQ)") 
    	{
			if (locbldgid != ""){
        		locbldgid = "";
      			locationAddress.put("LOCBLDGID",locbldgid);
            }
            
            if (gqName != ""){
        		gqName = "";
      			locationAddress.put("GQName",gqName);
            }
            
     	}
     }
  

	 /*Added by Deepak for US-2304 - End of code changes*/

  /* (Re)Set visible conditions to false*/ 
  selectedUnitPage.put("DisplayAddressTypePR", false);
  selectedUnitPage.put("DisplayAddressTypePRNoApartmentComplex", false); 
  selectedUnitPage.put("DisplayAptComplex", false);
  selectedUnitPage.put("DisplayBuildingDescriptor", false);
  selectedUnitPage.put("DisplayBuildingID", false);
  selectedUnitPage.put("DisplayFacilityName", false);
  selectedUnitPage.put("DisplayGQName", false);
  selectedUnitPage.put("DisplayLocAptComplex", false);
  selectedUnitPage.put("DisplayMarina", false);
  selectedUnitPage.put("DisplayMobileHome", false);
  selectedUnitPage.put("DisplaySubdivision", false);
  selectedUnitPage.put("DisplayTLName", false);
  selectedUnitPage.put("DisplayUnitDescriptor", false);
  selectedUnitPage.put("DisplayUnitID", false);

  /*Visibility Conditions for dynamic Label - Stateside AptComplex field*/ /* BUG-409 TODO: . */
  if (isPR === "false" || isPR === false) {
    selectedUnitPage.put("DisplayUnitDescriptor", true);
    selectedUnitPage.put("DisplayUnitID", true);
    var clause1 = ((AddressStatus === "Housing Unit") ||
                   (AddressStatus === "Uninhabitable") ||
                   (AddressStatus === "Under Construction"));

    /*Is GQ*/
    if (AddressStatus === 'Group Quarters (GQ)') {
      /*IsDisplayFacilityName*/
      selectedUnitPage.put("DisplayFacilityName", true);
      /*IsDisplayGQName*/
      selectedUnitPage.put("DisplayGQName", true);
      selectedUnitPage.put("DisplayBuildingID", true);
    }

    /*IsDisplayMarina*/
    if (AddressStatus === 'Transitory Location (TL)') {
      selectedUnitPage.put("DisplayMarina", true);
      selectedUnitPage.put("DisplayLocAptComplex", true);
      selectedUnitPage.put("DisplayFacilityName", true);
    }

    /*IsMarina*/
    if ((clause1 && (StructureType === "Boat, Tent, Etc"))) {
      selectedUnitPage.put("DisplayMarina", true);
      selectedUnitPage.put("DisplayLocAptComplex", true);
    }

    /*IsSubdivision*/
    if ((AddressStatus === "Nonresidential") ||
        (clause1 && (StructureType === "Single Family Home"))) {
      selectedUnitPage.put("DisplaySubdivision", true);
      selectedUnitPage.put("DisplayLocAptComplex", true);
    }

    /*IsMobileHome*/
    if ((AddressStatus === "Empty Trailer Pad/Mobile Home Site") ||
        (clause1 && (StructureType === "Trailer/Mobile Home"))) {
      selectedUnitPage.put("DisplayMobileHome", true);
      selectedUnitPage.put("DisplayLocAptComplex", true);
    }

    /*IsAptComplex*/
    if (clause1 && (StructureType === "Multi Unit Structure")) {
      selectedUnitPage.put("DisplayAptComplex", true);
      selectedUnitPage.put("DisplayLocAptComplex", true);
      selectedUnitPage.put("DisplayBuildingID", true);
    } 
  }

  /* Puerto Rico!-KCJ*/ /* BUG-409 TODO: . */
  if (isPR === "true" || isPR === true) {
    var clauseAddressStatus = ((AddressStatus === "Housing Unit") || (AddressStatus === "Uninhabitable") || (AddressStatus === "Under Construction"));
    var clauseStructureType = (StructureType === "Multi Unit Structure");
    var logicAptComplex = (clauseAddressStatus && clauseStructureType) || (AddressStatus === 'Group Quarters (GQ)');

    if (logicAptComplex) {

      /*IsDisplayAddressTypePR*/ /* BUG-409 TODO: . */
      selectedUnitPage.put("DisplayAddressTypePR", true);
    } else {

      /*IsDisplayAddressTypePRNoApartmentComplex*/ /* BUG-409 TODO: . */
      selectedUnitPage.put("DisplayAddressTypePRNoApartmentComplex", true);
    }

    if (AddressStatus === 'Group Quarters (GQ)') {

      /*IsDisplayFacilityName*/ /* BUG-409 TODO: . */
      selectedUnitPage.put("DisplayFacilityName", true);

      /*IsDisplayGQName*/ /* BUG-409 TODO: . */
      selectedUnitPage.put("DisplayGQName", true);
    } 

    /*IsDisplayTLName*/ /* BUG-409 TODO: . */
    if (AddressStatus === 'Transitory Location (TL)') {
      selectedUnitPage.put("DisplayTLName", true);
    } 

    /*IsDisplayUnitDescriptor*/ /* BUG-409 TODO: . */
    if ((AddressStatus !== 'Nonresidential') && 
        !((AddressStatus === 'Housing Unit' && StructureType === 'Single Family Home') ||
          (AddressStatus === 'Uninhabitable' && StructureType === 'Single Family Home') || 
          (AddressStatus === 'Under Construction' && StructureType === 'Single Family Home')
         )
       ) {
      selectedUnitPage.put("DisplayUnitDescriptor", true);
    } 
  }

  /* Populate street name drop down autocomplete */
  var unitList = BCU.get("UnitList");
  var unitListIterator = unitList.iterator();	
  var StreetNameList = pega.ui.ClientCache.createPage("D_StreetNameList"); 
  var pxResults = StreetNameList.put("pxResults", []); 
  var objJSON = '{"pxObjClass":"CB-Data-Address-Location"}';

  if (unitList) {
    while (unitListIterator.hasNext()){
      var currentPage = unitListIterator.next();
      var tempPage = pega.ui.ClientCache.createPage("TempPage");
      var StreetName = currentPage.get("LocationAddress.StreetName");

      if (StreetName) {
        StreetName = (StreetName.getValue()).toUpperCase();
        if (StreetName != "") {
          tempPage.put("StreetName", StreetName);
          if (!CB.isInPageList("StreetName", StreetName, "D_StreetNameList.pxResults")) {
            pxResults.add().adoptJSON(tempPage.getJSON());
          }
        }
      }  
    }

    StreetNameList.put("pxResultCount", pxResults.size());

    var sortFunc =function (a, b) {
      if (a.StreetName == b.StreetName)  
        return 0;  
      if (a.StreetName > b.StreetName)  
        return 1;  
      if (a.StreetName < b.StreetName)  
        return -1;  
    };    
    CB.sortPageList("D_StreetNameList", sortFunc,"pxResults");
  }


  /*Refresh Section.-KCJ*/
  var section = pega.u.d.getSectionByName("SetLocationAddress", '', document);
  pega.u.d.reloadSection(section, '', '', false, false, '', false);
}

/*	
 *	Created By: Deepak Nagda, Sonny Kocak, David Oliver
 *	Date: 02-13-2017
 *	Purpose: This preflow action creates the AttemptContactInfo page for selectedunitpage, if its not there.
 *			 Part of US-591 and US-592. 
 *
 *	Purpose: This pre action preFlowAction$SetGQContactInfo: Manage the ContactDetail() page group
 * 
 *	1.  Copy in the ContactDetail(SORIn)                Pull in the  external data 
 *	2.  Copy data into   ContactDetail(AddressStatusCurrent)       
 *	3  Copy data into  ContactDetail(Display)         Used for display
 */
function preFlowAction$SetGQContactInfo() {
  if (pega.mobile.isHybrid) {
    SetContactPageInfo();
    SetContactDetailsInfo();

  }
}

/*	
 *	Created By: Mark Switzer,Sonny Kocak, David Oliver 
 *	Date: 02-13-2017
 *	Purpose: This post flow action validates data entered on the SetGQContactInfo screen.
 *           This validation is shared by GQ and TL. 
 *			 Part of US-591 and US-592. 
 */
function postFlowAction$SetGQContactInfo() {
  if (pega.mobile.isHybrid) {
    console.log('postFlowAction$SetGQContactInfo()'); 
    validateContactInfo();
  }
}

/*	
 *	Created By: Sonny Kocak, David Oliver
 *	Date: 02-13-2017
 *	Purpose: .AddressStatusCurrent     and AddressStatusLast are used to keep track of the current and previous values of  .AddressStatus
 *
 * todo: create or add to namespace and update the scope of address status current/last
 */
function Munge(PreOrPost)
{
  /* Set the value for .AddressStatusCurrent to  .AddressStatus,   or "Blank"   if  .AddressStatus has no value,    strip special char, */
  var selectedUnitPage = findPage('pyWorkPage.BCU.SelectedUnitPage');
  var addressStatus = ALMCB_Helpers.getFieldValue(selectedUnitPage, "AddressStatus");
  var addressStatusCurrent = ALMCB_Helpers.getFieldValue(selectedUnitPage, "AddressStatusCurrent");
  var addressStatusLast = ALMCB_Helpers.getFieldValue(selectedUnitPage, "AddressStatusLast");

  /**/
  console.log("addressStatus : " + addressStatus);
  if (addressStatus == "")
  {
    addressStatusCurrent ="";
  } else {
    /* check for (GQ) and (TL) and remove */ 
    if (addressStatus.indexOf("(") >= 0)
      addressStatus = addressStatus.substr(0, addressStatus.length - 4).trim();

    /* strip out any special chars*/
    addressStatus = addressStatus.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');

    switch (PreOrPost) {
      case "Pre": 
        if (addressStatus == "Blank")
        {
          addressStatusCurrent=addressStatus;
          addressStatusLast=addressStatus;
        }
        break;
      case "Post": 
        addressStatusCurrent=addressStatus;
        if (addressStatusLast == "")
          addressStatusLast=addressStatus;
        if (addressStatusLast != addressStatusCurrent)
          addressStatusLast=addressStatusCurrent;
        break;
    }
  }
  selectedUnitPage.put('AddressStatusCurrent', addressStatusCurrent);
  selectedUnitPage.put('AddressStatusLast', addressStatusLast);
  SaveSelectedUnitPage();

  console.log("addressStatus : " + addressStatus);
}



/*	
 *	Created By: Deepak Nagda
 *	Date: 12-20-2016
 *	Purpose: This preflow action creates the AttemptContactInfo page for selectedunitpage, if its not there.
 *			 Part of US-591 and US-592. 
 */
function preFlowAction$SetTLContactInfo() {
  if (pega.mobile.isHybrid) {
    SetContactPageInfo();
  }
}
/*	
 *	Created By: Mark Switzer
 *	Date: 12-19-2016
 *	Purpose: This post flow action validates data entered on the SetTLContactInfo screen.
 *           This validation is shared by GQ and TL. 
 *			 Part of US-1918 and US-1919. 
 */
function postFlowAction$SetTLContactInfo() {
  if (pega.mobile.isHybrid) {
    /* alert('postFlowAction$SetTLContactInfo()'); */
    validateContactInfo();
  }
}
function postFlowAction$SetLocationAddress() {
  ALMCB.validateDuplicateAddress();
  var workPage = pega.ui.ClientCache.find("pyWorkPage");
  if( !workPage.hasMessages() )
  {
    var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
    var selectedUnitPage = BCU.get("SelectedUnitPage");
    var locationAddress = selectedUnitPage.get("LocationAddress");
    var LOCHN = locationAddress.get("LOCHN");
    var LOCZIP = locationAddress.get("LOCZIP");
    var LOCWSID1 = locationAddress.get("LOCWSID1");
    var LOCWSDESC1 = locationAddress.get("LOCWSDESC1");
    var LOCBLDGID = locationAddress.get("LOCBLDGID");
    var LOCBLDGDESC = locationAddress.get("LOCBLDGDESC");
    var LOCDESC = locationAddress.get("LOCDESC");
    var IsLocationAvailable = locationAddress.get("IsLocationAvailable");
    var addrType = selectedUnitPage.get("AddressType") ? selectedUnitPage.get("AddressType").getValue() : '';
    var StructureType = selectedUnitPage.get("StructureType") ? selectedUnitPage.get("StructureType").getValue() : '';
    var AddressStatus = selectedUnitPage.get("AddressStatus").getValue();
    var StreetName = locationAddress.get("StreetName");
    var UnnamedUnknownFlagPR = locationAddress.get("UnnamedUnknownFlagPR");

    /* Get property to determine if stateside.*/
    var isPR = pega.ui.ClientCache.find("pyWorkPage.BCU.IsPR").getValue();

    /* IF not stateside, do these validations: */
    if (isPR === "false" || isPR === false) {
      houseNumberValidations(LOCHN);
      streetNameValidation(StreetName);
      zipCodeValidations(LOCZIP);
      unitIDValidations(LOCWSID1);
      unitIDReqValidations(LOCWSID1, LOCWSDESC1);
      buildingIDReqValidations(LOCBLDGID, LOCBLDGDESC);
      addressRequirements(LOCHN, StreetName, UnnamedUnknownFlagPR, LOCDESC);
    }
    var SameAsGQ = document.getElementsByName("$PpyWorkPage$pBCU$pSelectedUnitPage$pIsFacilityNameSameAsGQ")[1].checked;
    var SelectedUnitPage = pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage");
    var LocAddress = SelectedUnitPage.get('LocationAddress');
    /* line 561 commented out by Drake Downs, hardcoding this variable is causing problems with my validation code 
    LocAddress.put('IsLocationAvailable', true); */
    var isPR = BCU.get("IsPR").getValue();
    var houseNum = LocAddress.get('LOCHN') ? LocAddress.get('LOCHN').getValue() : '';
    var houseNumSuf = LocAddress.get('LOCHNSUF') ? LocAddress.get('LOCHNSUF').getValue() : '';
    var houseNumNoSuf = LocAddress.get('HouseNumNoSuf') ? LocAddress.get('HouseNumNoSuf').getValue() : '';
    if (isPR==="false" &&  houseNum !== "" && isNaN(houseNumSuf)) {
      LocAddress.put('LOCHN', houseNumNoSuf + houseNumSuf);
    }
    if (SameAsGQ) {
      var GQName = SelectedUnitPage.get("GQName").getValue();
      SelectedUnitPage.put("GQFacilityName", GQName);
    }

    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var AddressStatus = SelectedUnitPage.get("AddressStatus").getValue();

    try {
      var AttemptContactYesNo = SelectedUnitPage.get("AttemptContactYesNo").getValue() || '';
    } catch (e) {
    }

    try {
      var EnumerateUnit = SelectedUnitPage.get("EnumerateUnit").getValue() || '';
    } catch (e) {
      var EnumerateUnit = false;
    }

    try {
      var LocIsMail = LocAddress.get("LOCISMAIL").getValue().toString() || '';
    } catch (e) {
      var LocIsMail = new String();
      LocIsMail = 'Y';
    }

    /*  alert("AttemptContactYesNo: '" + AttemptContactYesNo + "' EnumerateUnit: '" + EnumerateUnit + "' LocIsMail: '" + LocIsMail + "'"); */

    /* if (["Empty Trailer Pad/Mobile Home Site", "Uninhabitable", "Nonresidential"].indexOf(AddressStatus) > -1) { */
    if ((AddressStatus == "Uninhabitable") || (AddressStatus == "Empty Trailer Pad/Mobile Home Site") || (AddressStatus == "Nonresidential")) {
      /* alert("AddressStatus 2: '" + AddressStatus + "'"); */
      /* IF Address Status = Uninhabitable, Empty Trailer Pad/Mobile Home Site, Non-Residential THEN work is complete and reporting unit status is set to Resolved-Completed */
      SelectedUnitPage.put('ReportingUnitStatus', 'Resolved-Completed');
      /* Call function in order to set the reporting status and status reason for RU */
      UpdateReportingStatusAndStatusReasonForRU("AddressStatus", "AddressStatus");
      workPage.put('NextStep', 'Resolve');
      SaveSelectedUnitPage();
    } else if ((LocIsMail == 'N' || LocIsMail == 'n') && AttemptContactYesNo === 'Yes') {
      /* IF Mailing Address is needed (LOCISMAIL=N) AND Attempt Contact = Yes, THEN the system will move to Set Mailing Address (US-940 through US-944) */
      workPage.put('NextStep', 'MailingAddress');
    } else if (EnumerateUnit === true && AttemptContactYesNo === 'Yes') {
      /* IF Mailing Address is needed (LOCISMAIL=N) AND Attempt Contact = Yes, THEN the system will move to Set Mailing Address (US-940 through US-944) */
      workPage.put('NextStep', 'Enumerate');
    } else {
      workPage.put('NextStep', 'Mapspot');
    }

    /* set Full Address  */
    PrepareFullAddress();
  }

}

function postFlowAction$SetMailingAddress() {
  var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var SelectedUnitPage = pega.ui.ClientCache.find("pyWorkPage.BCU.SelectedUnitPage");
  var AddressStatus = SelectedUnitPage.get("AddressStatus").getValue();

  try {
    var AttemptContactYesNo = SelectedUnitPage.get("AttemptContactYesNo").getValue() || '';
  } catch (e) {

  }

  try {
    var EnumerateUnit = SelectedUnitPage.get("EnumerateUnit").getValue() || '';
  } catch (e) {
    var EnumerateUnit = false;
  }

  if (EnumerateUnit === true && AttemptContactYesNo === 'Yes') {
    workPage.put('NextStep', 'Enumerate');
  } else {
    workPage.put('NextStep', 'Mapspot');
  }
}

function preFlowAction$SetMapspot() {
  console.log("Inside preflowaction setmapspot - 1");
  PrepareFullAddress();
  /* if (pega.mobile.isHybrid){
    console.log("Inside preflowaction setmapspot - 2");
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    var BCU = workPage.get('BCU');
    var unit = BCU.get('SelectedUnitPage');
    if (unit){
      var unitPoint = unit.get('UnitPoint');
      if (unitPoint)
      {
        /*unitPoint.put("MarkerLatitude", "");
        unitPoint.put("MarkerLongitude","");
        if (unitPoint) unitPoint.put("CoordinateCollectType", "");
      }
    } 		

  }*/
}

function postFlowAction$SetMapspot() {
  /*var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var BCU = workPage.get('BCU');
  var unit = BCU.get('SelectedUnitPage');
  var latVal = ""
  if (unit){
    var unitPoint = unit.get('UnitPoint');
    if (unitPoint)
    {
      var lat = unitPoint.get("MarkerLatitude");
      latVal = parseFloat((lat) ? lat.getValue() :  "");
      console.log("ALMCB_mapIntegration_deepak latVal: " + latVal);
      var lon = unitPoint.get("MarkerLongitude");
      var lonVal = parseFloat((lon) ? lon.getValue() :  "");
    }
  } 
  if (latVal == "" || isNaN(latVal) ) {
    AdCanGoBack();
  }
  else
  {
    var previousReportingUnitStatus = unit.get('ReportingUnitStatus').getValue();
    if (previousReportingUnitStatus != "Resolved-Completed"){*/
  var workPage = pega.ui.ClientCache.find('pyWorkPage');
  var BCU = workPage.get('BCU');
  var unit = BCU.get('SelectedUnitPage');
  unit.put('ReportingUnitStatus', 'Resolved-Completed');
  workPage.put('NextStep', 'Resolve');
  /* Call function in order to set the reporting status and status reason for RU */
  UpdateReportingStatusAndStatusReasonForRU("AddressStatus", "AddressStatus");
  SaveSelectedUnitPage();
  /* pega.u.d.submit("pyActivity=FinishAssignment",null,"");
    }
  }*/
}

/* Begin stateside Set Location Address Validations*/
/* character validation checking for only a-z, A-Z, 0-9, ., /, and - */
characterValidationZ = function(element, attribName, required, regExValidator, specializeMsg) {

  /* IF element exists:-KCJ*/
  if (element) {
    var elementVal = element.getValue();
    console.log("characterValidation:" + attribName + ":" + elementVal);

    if (regExValidator == null) {
      regExValidator = /^([a-zA-Z0-9-\s.\/]+)$/;
    }

    if (required == null) {
      required = false;
    }

    if (required) {
      if (elementVal.length < 1 || !regExValidator.test(elementVal)) {
        return false;
      }

    } else {
      if (elementVal.length >= 1 && !regExValidator.test(elementVal)) {
        return false;
      }
    }
  }
  return true;
};

function zipCodeValidations(LOCZIP) {
  /*zip code required validation
  unit.get('LOCZIP').addMessage(ALMCensus.Messages.Msg_ZipCodeZeroes);*/
  var zip = LOCZIP.getValue();
  var state = ALMCB.getGeoDetailsState();
  /*check for valid Zip Code*/
  if (! characterValidationZ(LOCZIP, ALMCensus.Messages.Fld_ZipCode, false, /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/, ALMCensus.Messages.Msg_ZipCodeValid))
  {
    LOCZIP.addMessage(ALMCensus.Messages.Fld_ZipCode + " " + ALMCensus.Messages.Msg_ZipCodeValid);
    return;
  }
  /*If State is PR, Zip must start with 00*/
  if (ALMCB.isStatePR(state)) {
    /* alert("in zip valid."); */
    if (! characterValidationZ(LOCZIP, ALMCensus.Messages.Fld_ZipCode, false, /^00/, ALMCensus.Messages.Msg_ZipCodeZeros)) 
    {
      LOCZIP.addMessage("ZIP Code must start with \"00\".");
      return;
    }
    /* return ALMCensus.Messages.Fld_ZipCode + " " + ALMCensus.Messages.Msg_ZipCodeZeros; */
  }
  else if(!ALMCB.isStatePR(state))
  {
    /*Check the zip code validation only if zip code is given*/
    if(zip.length >= 1)
      if (characterValidationZ(LOCZIP, ALMCensus.Messages.Fld_ZipCode, false, /^00/, null))
      {
        LOCZIP.addMessage(ALMCensus.Messages.Fld_ZipCode + " " + ALMCensus.Messages.Msg_ZipCodeZeros);
        return;
        /* TODO: change this to use correct formatting */
      }
  }
  return ""; 
}

/* validations for HouseHumber */
function houseNumberValidations(LOCHN) {

  /* validations for special chars, alphanumeric, and zeros */
  var passesInvalidCharacters = characterValidationZ(LOCHN,null,false,null,ALMCensus.Messages.Msg_HouseNumberValid);
  var passesOneAlphanumericCharacter = characterValidationZ(LOCHN,null,false,/[a-z0-9]+/i,ALMCensus.Messages.Msg_HouseNumberValid);
  var passesZeros = true;

  if(characterValidationZ(LOCHN,null,false,/^[0]+$/,ALMCensus.Messages.Msg_HouseNumberValid)) {
    if(!characterValidationZ(LOCHN,null,false,/^0$/,ALMCensus.Messages.Msg_HouseNumberValid)) {
      passesZeros = false;
    }
  }
  if (!passesInvalidCharacters || !passesOneAlphanumericCharacter || !passesZeros){
    LOCHN.addMessage(ALMCensus.Messages.Msg_HouseNumberValid);
    return; 
  }

  /* Test if House Number has an invalid string in it. Part of US-2242, 571-KCJ, 01/09/2017.*/
  var houseNumber = LOCHN.getValue().replace(/\s+/g, '');   /* Get house number property value.*/
  var exclusionList = ["NONE","UNKNOWN","UNNAMED","PRIVATE","DIRT"]; /* Provided list of unacceptable words.*/  

  /* Check if a bad word is found in House Number.*/
  for (var badWord in exclusionList) {
    if (houseNumber.indexOf(exclusionList[badWord]) >= 0) {

      /* Display error message and exit function call.*/ 
      LOCHN.addMessage(ALMCensus.Messages.Msg_HouseNumberValid);
      return; 
    }
  } 
}

/* validations for Unit ID */
function unitIDValidations(LOCWSID1) {

  var passesInvalidCharacters = characterValidationZ(LOCWSID1,null,false,null,ALMCensus.Messages.Msg_UnitNumberValid);
  var passesZeros = true;

  if(characterValidationZ(LOCWSID1,null,false,/^[0]+$/,ALMCensus.Messages.Msg_UnitNumberValid)) {
    if(!characterValidationZ(LOCWSID1,null,false,/^0$/,ALMCensus.Messages.Msg_UnitNumberValid)) {
      passesZeros = false;
    }
  }
  if (!passesInvalidCharacters || !passesZeros) {
    LOCWSID1.addMessage(ALMCensus.Messages.Msg_UnitNumberValid);
    return;
  }

  /* Test if Unit ID has an invalid string in it and contains at least one number OR one letter if not blank. Part of US-2242, 571-KCJ, 01/09/2017.*/
  var unitID = LOCWSID1.getValue().replace(/\s+/g, '');
  var regExp = /[a-zA-Z0-9]/; /* RegExp to check if string has letter or number in it.*/
  var exclusionList = ["NONE", "UNKNOWN", "UNNAMED", "PRIVATE", "DIRT"]; /* Provided list of unacceptable words.*/
  var unitIDMissingAlphaNumericChar = (!regExp.test(unitID) && (unitID.length > 0)); /* Test if Unit ID does not have a letter of number if not blank.*/

  /* Check if a bad word is found in Unit ID.*/
  var unitIDHasBadWord = false;
  for (var badWord in exclusionList) {
    if (unitID.indexOf(exclusionList[badWord]) >= 0) {
      unitIDHasBadWord = true;
      break;
    }
  }

  if (unitIDMissingAlphaNumericChar || unitIDHasBadWord) {

    /* Display error message and exit function call.*/
    LOCWSID1.addMessage(ALMCensus.Messages.Msg_UnitNumberValid);
    return;
  }
}

/* validations for StreetName */
function streetNameValidation(StreetName) {
  /* Get StreetName as a string, streetName, and remove spaces and convert to UPPER CASE. */
  var streetName = StreetName ? StreetName.getValue().replace(/ /g, '').toUpperCase() : '';

  /* If streetName w/out spaces is empty, exit without error message. */
  if (streetName == '') {
    return;
  }

  /* Define array variable to hold Street Name exclusion list. List is different for US vs PR. */
  var exclusionList = [];
  var state = ALMCB.getGeoDetailsState();
  if(!ALMCB.isStatePR(state)) {/*US.*/
    exclusionList = ["CALLEPRIVADA","CALLESINNOMBRE","CLLPRIVADA","CLLSINNOMBRE","DIRTRD",
                     "DIRTST","NONAME","NONAMERD","NONAMEROAD","NOTNAMED","NOTNAMEDRD",
                     "NOTNAMEDROAD","PRIVATE","PRIVATERD","PRIVATEROAD","PRIVATEST","PRRD",
                     "PRROAD","PRVT","PRVTRD","PRVTROAD","PT","PTRD","PTROAD","PVT","PVTRD",
                     "PVTROAD","SINNOMBRE","UNAMED","UNAMEDRD","UNAMEDROAD","UNKNOWN","UNKNOWNRD",
                     "UNKNOWNROAD","UNKNOWNST","UNNAMED","UNNAMEDRD","UNNAMEDROAD","UNNAMEDST",
                     "UNRD","UNROAD","UNST" ];
  }
  else {/*PR*/
    exclusionList = ["CALLEJÓNSINNOMBRE","CALLEJÓNSINSALIDA","CALLEPRIVADA","CALLESINNOMBRE",
                     "CAMINOSINNOMBRE ","CAMSINNOMBRE","CLLESINNOMBRE","CLLPRIVADA",
                     "CLLSIN NOMBREINTERIOR","CLLSINNOMBRE","CLLSINNOMBREINT","CLLSINSALIDA",
                     "DIRTRD","DIRTROAD","DIRTST","NONAME","NONAMERD","NONAMEROAD","NONOMBRE",
                     "NOTIENENOMBRE","NOTNAMED","NOTNAMEDRD","NOTNAMEDROAD","PRIVATE","PRIVATERD",
                     "PRIVATEROAD","PRIVATEST","PRRD","PRROAD","PRVT","PRVTRD","PRVTROAD","PT",
                     "PTRD","PTROAD","PVT","PVTRD","PVTROAD","S/N","SINNOMBRE","SINSALIDA","SINSALIDA ",
                     "UNAMED","UNAMEDRD","UNAMEDROAD","UNKNOWN","UNKNOWNRD","UNKNOWNROAD","UNKNOWNST",
                     "UNNAMED","UNNAMEDR","UNNAMEDRD","UNNAMEDROAD","UNNAMEDST","UNRD","UNROA","UNS" ];
  }  

  /* Check if entered street namet is in the exclusion list. */
  if (exclusionList.indexOf(streetName) >= 0) {
    /* User input is invalid; display error message. */
    var originalValue = StreetName ? StreetName.getValue() : '';
    StreetName.addMessage(originalValue + " " + ALMCensus.Messages.Msg_NotValidStreet);
  }

  /* Test if Street Name starts with one of the strings not permitted. Part of US-2242, 571-KCJ, 01/11/2017.*/
  streetName = StreetName ? StreetName.getValue() : ''; /* Get Street Name property value.*/
  var exclusionList = /(^HCR )|(^RR )|(^HCR\d)|(^RR\d)|(^HIGHWAY CONTRACT ROUTE )|(^RURAL ROUTE )|(^HIGHWAY CONTRACT ROUTE\d)|(^RURAL ROUTE )|(^HIGHWAY CONTRACT ROUTE\d)|(^RURAL ROUTE\d)/; /* Provided list of unacceptable words.*/  

  /* Test if Street Name matches the current RegExp.*/
  var streetNameIsInvalid = (exclusionList.test(streetName)); 
  if (streetNameIsInvalid) {

    /* User input is invalid; display error message. */
    StreetName.addMessage(streetName + " " + ALMCensus.Messages.Msg_NotValidStreet);
  }
}

/* validations for Unit Number requirement when Unit Descriptor is filled */
function unitIDReqValidations(LOCWSID1, LOCWSDESC1) {
  var unitID = LOCWSID1.getValue();
  var unitDesc = LOCWSDESC1.getValue();
  if ((unitDesc != null && unitDesc != "") && (unitID === null || unitID.length < 1)) {
    LOCWSID1.addMessage(ALMCensus.Messages.Msg_UnitNumberRequired);
    return;

  }}

/* validations for Building Number requirement when BuildingDescriptor is filled */
function buildingIDReqValidations(LOCBLDGID, LOCBLDGDESC) {
  var state = ALMCB.getGeoDetailsState();

  /* If stateside, do NOT do these validations */
  if(!ALMCB.isStatePR(state)){
    return;
  }

  var buildingID = LOCBLDGID.getValue();
  var buildingDesc = LOCBLDGDESC.getValue();

  if ((buildingDesc != null && buildingDesc !="") && (buildingID === null || buildingID.length < 1)) {
    LOCBLDGID.addMessage(ALMCensus.Messages.Msg_BuildingNumberRequired);
    return;

  }}

function addressRequirements(LOCHN, StreetName, UnnamedUnknownFlag, LOCDESC) {
  var houseNumber = LOCHN ? LOCHN.getValue() : '';
  var streetName = StreetName ? StreetName.getValue() : '';
  var unnamedUnknownFlag = UnnamedUnknownFlag ? UnnamedUnknownFlag.getValue() : false;
  var description = LOCDESC ? LOCDESC.getValue() : '';
  var state = ALMCB.getGeoDetailsState();

  /* If stateside, do these validations */
  if(!ALMCB.isStatePR(state))
  {
    if(houseNumber != "" && streetName != "")
      return;
    else if(unnamedUnknownFlag === true && description != "")
      return;

    if (houseNumber != "" && description != "" && streetName === "" && unnamedUnknownFlag === false) {
      UnnamedUnknownFlag.addMessage(ALMCensus.Messages.Msg_AddressRequiredValidation);
      StreetName.addMessage(" ");
    }
    else if(description != "" && houseNumber === "" && unnamedUnknownFlag === false && streetName === "") {
      UnnamedUnknownFlag.addMessage(ALMCensus.Messages.Msg_AddressRequiredValidation);
    }
    else if(unnamedUnknownFlag === true && description === "") {
      LOCDESC.addMessage(ALMCensus.Messages.Msg_LocationPhysDescRequiredValidation);
    }
    else if (houseNumber === "" && streetName === "")
    {
      LOCHN.addMessage(ALMCensus.Messages.Msg_AddressRequiredValidation);
      StreetName.addMessage(" ");
    }
    else if (houseNumber === "" || streetName === "") {
      if (houseNumber === "" ) {
        LOCHN.addMessage(ALMCensus.Messages.Msg_AddressRequiredValidation);
      }
      else {
        StreetName.addMessage(ALMCensus.Messages.Msg_AddressRequiredValidation);
      }
    }
  }
}

/*	
 *	Created By: Mark Switzer
 *	Date: 12-19-2016
 *	Purpose: This post flow action validates data entered on Contact Info screens (GQ and TL for now).
 *			 Part of US-591 & US-592, and US-1918 & US-1919.
 */
function validateContactInfo() {
  var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
  var SelectedUnitPage = BCU.get("SelectedUnitPage");
  var AttemptContactInfo = SelectedUnitPage.get("AttemptContactInfo");
  if (!AttemptContactInfo) {
    /* alert('validateContactInfo() - Page does not exist: AttemptContactInfo.'); */
    console.log('validateContactInfo() - Page does not exist: AttemptContactInfo.');
  }
  /* Get ClientCache objects. */
  var ContactName = AttemptContactInfo.get("ContactName");
  var ContactTitle = AttemptContactInfo.get("ContactTitle");
  var PhoneNumber = AttemptContactInfo.get("PhoneNumber");
  var PhoneExtension = AttemptContactInfo.get("PhoneExtension");
  var Email = AttemptContactInfo.get("Email");
  var Website = AttemptContactInfo.get("Website");
  var OfficeLocation = AttemptContactInfo.get("OfficeLocation");
  var MaxCapacity = AttemptContactInfo.get("MaxCapacity");
  var MaxCapacityType = AttemptContactInfo.get("MaxCapacityType");

  /* Get objects' values. */
  var contactName = ContactName ? ContactName.getValue().trim() : '';
  var contactTitle = ContactTitle ? ContactTitle.getValue().trim() : '';
  var phoneNumber = PhoneNumber ? PhoneNumber.getValue().trim() : '';
  phoneNumber = phoneNumber.replace(/\D/g,'');
  var phoneExtension = PhoneExtension ? PhoneExtension.getValue().trim() : '';
  var email = Email ? Email.getValue().trim() : '';
  var website = Website ? Website.getValue().trim() : '';
  var officeLocation = OfficeLocation ? OfficeLocation.getValue().trim() : '';
  var maxCapacity = MaxCapacity ? MaxCapacity.getValue().trim() : '';
  var maxCapacityType = MaxCapacityType ? MaxCapacityType.getValue() : '';


  AttemptContactInfo.put("ContactName", contactName);
  AttemptContactInfo.put("ContactTitle", contactTitle);
  AttemptContactInfo.put("PhoneNumber", phoneNumber);
  AttemptContactInfo.put("PhoneExtension", phoneExtension);
  AttemptContactInfo.put("Email", email);
  AttemptContactInfo.put("Website", website);
  AttemptContactInfo.put("OfficeLocation", officeLocation);
  AttemptContactInfo.put("MaxCapacity", maxCapacity);

  /* VALIDATE: Contact Name */
  /* Required */
  if(contactName.length <= 0) {
    ContactName.addMessage(ALMCensus.Messages.Msg_ContactNameRequired);
  }
  /* Cannot exceed 35 characters */
  else if(contactName.length > 35) {
    ContactName.addMessage(ALMCensus.Messages.Msg_ContactNameLength);
  }
  /* Must match the Valid Character Set. -- Mark Switzer - 12/21/2016: We currently are not doing any validations from the Valid Character Set, by BO request. */
  /* else if(!characterValidationZ(ContactName,null,true,/^([a-zA-Z0-9]+)$/,ALMCensus.Messages.Msg_ContactNameInvalid)) {
    ContactName.addMessage(ALMCensus.Messages.Msg_ContactNameInvalid);
  } */

  /* VALIDATE: Contact Title */
  if(contactTitle.length <= 0) {
    ContactTitle.addMessage(ALMCensus.Messages.Msg_ContactTitleRequired);
  }
  else if(contactTitle.length > 50) {
    ContactTitle.addMessage(ALMCensus.Messages.Msg_ContactTitleLength);
  }
  /* Must match the Valid Character Set. -- Mark Switzer - 12/21/2016: We currently are not doing any validations from the Valid Character Set, by BO request. */
  /* else if(!characterValidationZ(ContactTitle,null,true,/^([a-zA-Z0-9]+)$/,ALMCensus.Messages.Msg_ContactTitleInvalid)) {
    ContactTitle.addMessage(ALMCensus.Messages.Msg_ContactTitleInvalid);
  } */

  /* VALIDATE: Phone Number */
  if(phoneNumber.length <= 0) {
    PhoneNumber.addMessage(ALMCensus.Messages.Msg_ContactPhoneNumberRequired);
  }
  else if(phoneNumber.length != 10) {
    PhoneNumber.addMessage(ALMCensus.Messages.Msg_ContactPhoneNumberLength);
  }
  /* Must match these other validations, too:
    - The digits in positions A and D cannot be 0 or 1. (1st and 2nd items in array)
    - The digit in position B cannot be 9. (3rd item in array)
    - The digits in positions ABC cannot be one of the following strings: 456, 710, 950. (4th item in array)
    - The digits in positions DEF cannot be one of the following strings: 555, 950, 958, 959. (5th item in array)
    - The digits in positions EF cannot be 11. (6th item in array)
  */
  else {
    regexArray = [/^[^0-1]/, /^[0-9]{3}[^0-1]/, /^[0-9][^9]/, /^(?!(456|710|950)).+/, /^[0-9]{3}(?!(555|950|958|959)).+/, /^[0-9]{4}([^1]|1[^1])/];

    for(var i = 0; i < regexArray.length; i++)
      if(!characterValidationZ(PhoneNumber,null,true,regexArray[i],ALMCensus.Messages.Msg_ContactPhoneNumberInvalid)) {
        PhoneNumber.addMessage(ALMCensus.Messages.Msg_ContactPhoneNumberInvalid);
        break;
      }
  }

  /* VALIDATE: Phone Extension */
  if(phoneExtension.length > 8) {
    PhoneExtension.addMessage(ALMCensus.Messages.Msg_ContactPhoneExtensionLength);
  }
  /* Must be numeric (only allow integer numbers).  Also, added reduntant check on length: (0-8 digits long) */
  else if(!characterValidationZ(PhoneExtension,null,false,/^[0-9]{0,8}$/,ALMCensus.Messages.Msg_ContactPhoneExtensionNumeric)) {
    PhoneExtension.addMessage(ALMCensus.Messages.Msg_ContactPhoneExtensionNumeric);
  }

  /* VALIDATE: Business Email */
  if(email.length > 80) {
    Email.addMessage(ALMCensus.Messages.Msg_ContactEmailLength);
  }
  /* Can only contain certain character/special character combinations */
  else if(!characterValidationZ(Email,null,false,/^([a-zA-Z0-9\.@\-_/#']*)@([a-zA-Z0-9\.@\-_/#']*)\.([a-zA-Z0-9\.@\-_/#']*)$/,ALMCensus.Messages.Msg_ContactEmailInvalid)) {
    Email.addMessage(ALMCensus.Messages.Msg_ContactEmailInvalid);
  }

  /* VALIDATE: Website */
  if(website.length > 80) {
    Website.addMessage(ALMCensus.Messages.Msg_ContactWebsiteLength);
  }
  /* Can only contain certain character/special character combinations */
  else if(!characterValidationZ(Website,null,false,/^([a-zA-Z0-9\.\-_/\\:]*)\.([a-zA-Z0-9\.\-_/\\:]*)$/,ALMCensus.Messages.Msg_ContactWebsiteInvalid)) {
    Website.addMessage(ALMCensus.Messages.Msg_ContactWebsiteInvalid);
  }

  /* VALIDATE: Office Location */
  if(officeLocation.length <= 0) {
    OfficeLocation.addMessage(ALMCensus.Messages.Msg_ContactOfficeLocationRequired);
  }
  else if(officeLocation.length > 54) {
    OfficeLocation.addMessage(ALMCensus.Messages.Msg_ContactOfficeLocationLength);
  }
  /* Must match the Valid Character Set. -- Mark Switzer - 12/21/2016: We currently are not doing any validations from the Valid Character Set, by BO request. */
  /* else if(!characterValidationZ(OfficeLocation,null,true,/^([a-zA-Z0-9]+)$/,ALMCensus.Messages.Msg_ContactOfficeLocationInvalid)) {
    OfficeLocation.addMessage(ALMCensus.Messages.Msg_ContactOfficeLocationInvalid);
  } */

  /* VALIDATE: Max Capacity */
  if(maxCapacity.length <= 0) {
    MaxCapacity.addMessage(ALMCensus.Messages.Msg_ContactMaxCapacityRequired);
  }
  else if(maxCapacity.length > 5) {
    MaxCapacity.addMessage(ALMCensus.Messages.Msg_ContactMaxCapacityLength);
  }
  /* Must be a positive number (integer?) */
  else if(!characterValidationZ(MaxCapacity,null,true,/^([0-9]+)$/,ALMCensus.Messages.Msg_ContactMaxCapacityInvalid)) {
    MaxCapacity.addMessage(ALMCensus.Messages.Msg_ContactMaxCapacityInvalid);
  }
}

/**
     *	Save the SelectedUnitPage back to the UnitList so that it is persisted.
     *
     *  Expected to be called from any flow action post-processing functions
     *	that will return to the address list and expect changes to the selected unit
     *	to be saved.
     *
     *  Equivalent to AdCan.SaveSelectedUnitPage data transform, keep in synch.
     */
function SaveSelectedUnitPage() {
  if (pega.mobile.isHybrid) {
    var workPage = pega.ui.ClientCache.find('pyWorkPage');
    workPage.put('pyStatusWork', 'Open-InProgress');
    var BCU = workPage.get('BCU');
    var remainingUnits=parseInt(BCU.get('RemainingUnits').getValue());

    /* alert ("Initial value for remaining units   " + remainingUnits); */ 
    var index = BCU.get('SelectedUnit').getValue();
    var selectedUnit = BCU.get('SelectedUnitPage');
    if (selectedUnit) {
      try {
        var newUnitStatus = selectedUnit.get('NewUnitStatus').getValue() || '';
      } catch (e) {
        var newUnitStatus = '';
        selectedUnit.put('NewUnitStatus', '');
      }
      var unit = BCU.get('UnitList(' + index + ')');
      var status = selectedUnit.get('ReportingUnitStatus').getValue() || '';
      /* A unit can be worked, reworked and reworked again. We only want to increment the */
      /* the remaining unit once */
      var currentListingStatus=selectedUnit.get('ListingStatus').getValue(); 
      if (currentListingStatus!=="Worked" && remainingUnits>=1) {
        remainingUnits=remainingUnits-1;
        BCU.put('RemainingUnits',remainingUnits);
        /* alert ("Decrementing/Previous state is resolved  " + remainingUnits); */ 
      }
      if (status.startsWith('Resolved')) {
        selectedUnit.put('ListingStatus', 'Worked');

        if (newUnitStatus === 'New') {
          selectedUnit.put('NewUnitStatus', 'Rework');
        }
        unit.adoptPage(selectedUnit);

        /* PrepareFullAddresses */  
        PrepareFullAddresses();      }
    }
  } else {
    /* assume DT SaveSelectedUnitPage is called from flow action post processing */
  }
}