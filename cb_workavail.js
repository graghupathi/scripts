/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: ??
 *    User Story: ??
 */
var WorkAvail = WorkAvail || {};
var PageNameStringStructure = "";

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: Local function used to flag if the device running this script is a Mobile (True) or Desktop (False) device.
 */
function OnMobileApp() {
    return (pega && pega.mobile && pega.mobile.isHybrid);
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: ??
 *    User Story: ??
 *    Params: WAPage:??
 */
function GenerateAndInitializeTempPage(WAPage) {
  	
  	/*KCJ-Wrap in if mobile condition?*/
  
  	/* Retrieve the data for the Single Day form selected by the user.*/
    var currentDay = pega.ui.ClientCache.find("SelectedDay");
	
  	/* IF a Single Day form has been selected and populated the temp page with its data.*/
    if (currentDay) {
        ClearMessages(currentDay); /* Clear any messages currently on the selected Single Day form.*/
    } else { /* Selected Day temp page DNE with data.*/
        currentDay = pega.ui.ClientCache.createPage("SelectedDay"); /* Create a new page to hold this data.*/
    }
	
  	/* Copy over the data on the Work Availability page to the Selected Day temp page.*/
    currentDay.adoptJSON(WAPage.getJSON());

    /*Initialize data page. KCJ- right values to put in?*/
    SetDefaultValue(currentDay, "FromHour", "");
    SetDefaultValue(currentDay, "FromMinute", "");
    SetDefaultValue(currentDay, "FromPeriod", "");
    SetDefaultValue(currentDay, "FromTimeInMinutes", "0.00");
    SetDefaultValue(currentDay, "InHours", "");
    SetDefaultValue(currentDay, "IsAvailable", "false");
    SetDefaultValue(currentDay, "ToHour", "");
    SetDefaultValue(currentDay, "ToMinute", "");
    SetDefaultValue(currentDay, "ToPeriod", "");
    SetDefaultValue(currentDay, "ToTimeInMinutes", "0.00");
    SetDefaultValue(currentDay, "ErrorMessage", "");

    /* Return the updated temp page.*/
    return currentDay;
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: ??
 *    User Story: ??
 *    Params: 
 *			-selectedDay:??
 *			-propName:??
 *			-defaultVal:??
 */
/*DELETE?Replace each line with ? notation?-KCJ*/
function SetDefaultValue(selectedDay, propName, defaultVal) {
    if (!selectedDay.get(propName)) {
        selectedDay.put(propName, defaultVal);
    }
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: Clear the error messages on the Single Day form when that day is selected by the user.
 *    User Story: ??
 *    Params: selectedDayPage:Single Day form selected by user.
 */
function ClearMessages(selectedDayPage) {
  	
  	/* IF Selected Day temp page exists, clear messages and reset message property.*/
    if (selectedDayPage) {
        selectedDayPage.clearMessages();
        selectedDayPage.put("ErrorMessage", "");
    }
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: Resets the controls on a Single Day form to the default values.
 *    User Story: ??
 *    Params: conditional: Property holding value of the available-unavailable checkbox control.
 */
/*DELETE?Not used in this script-KCJ*/
function ClearValues(conditional) {
	
  	/* IF on the Mobile device.*/
    if (OnMobileApp()) {
        
      	/* Clear information as the user is not available during this day. -KCJ setting properties with right type of value? from hour=? '0'? Also set to blank not zero?*/
        var currentDay = pega.ui.ClientCache.find("SelectedDay"); /* Retrieve data from the Selected Day temp page.*/
        ClearMessages(currentDay);
        currentDay.put("IsAvailable", conditional); /* Set the 'Not Availible' checkbox with the proper value.*/
        if (conditional) { /* IF the 'Not Availible' checkbox is checked.*/
            currentDay.put("FromHour", "");
            currentDay.put("FromPeriod", "");
            currentDay.put("FromMinute", "");
            currentDay.put("FromTimeInMinutes", "0");
            currentDay.put("InHours", "");
            currentDay.put("ToHour", "");
            currentDay.put("ToMinute", "");
            currentDay.put("ToPeriod", "");
            currentDay.put("ToTimeInMinutes", "0");
            currentDay.put("ErrorMessage", "");
        }
    }
	
  	/*KCJ-put else for desktop?otherwise below always runs<-wanted?*/
  	/* Clear information as the user is not available during this day. -KCJ setting properties with right type of value? from hour=? '0'? Also set to blank not zero?*/
    pega.u.d.setProperty('SelectedDay.IsAvailable', conditional); /* Set the 'Not Availible' checkbox with the proper value.*/
    if (conditional) { /* IF the 'Not Availible' checkbox is checked.*/
        pega.u.d.setProperty('SelectedDay.FromHour', '');
        pega.u.d.setProperty('SelectedDay.FromPeriod', '');
        pega.u.d.setProperty('SelectedDay.FromMinute', '');
        pega.u.d.setProperty('SelectedDay.FromTimeInMinutes', '0');
        pega.u.d.setProperty('SelectedDay.InHours', '');
        pega.u.d.setProperty('SelectedDay.ToHour', '');
        pega.u.d.setProperty('SelectedDay.ToMinute', '');
        pega.u.d.setProperty('SelectedDay.ToPeriod', '');
        pega.u.d.setProperty('SelectedDay.ToTimeInMinutes', '0');
        pega.u.d.setProperty('SelectedDay.ErrorMessage', '');
    }
}

/*
 *	Created By: Tim Bechmann
 *	Date: 1-04-2017
 *	Purpose: Copies the passed dateLabel from D_CurrentStaffWorkAvailabilitiies into a temp page (SelectedDay)
 *  Params: dateLabel:??
 */
function CopyToTempPage(dateLabel) {
    try {
        /* IF on mobile device.*/
        if (OnMobileApp()) {

            /* Check to ensure an elementIndex was found */
            var elementIndex = CB.indexInPageList("DateLabel", dateLabel, "D_CurrentStaffWorkAvailabilities.WorkAvailabilities");
            if (elementIndex <= 0) { /* Not found.*/
                console.log('an element index has not been found.');
                return;
            }
			
          	/* Create a temp page for the Single day item */
            var WAPage = pega.ui.ClientCache.find('D_CurrentStaffWorkAvailabilities.WorkAvailabilities(' + elementIndex + ')');
            GenerateAndInitializeTempPage(WAPage);
        }

        /*DELETE?-KCJ*/
        /* Launch Harness
            pega.desktop.showHarnessWrapper("current", 
                                            'CB-Dec-Data-WorkAvailability',
                                            'SingleDayReview', 
                                            '', 
                                            '', 
                                            usingPage, 
                                            true, 
                                            '', 
                                            false, 
                                            dtName, 
                                            '', 
                                            '',
                                            '', 
                                            '', 
                                            false,
                                            false,
                                            false,
                                            null); */
    } catch (e) {
        console.log('Uncaught exception in function:CopyToTempPage.  Error: ' + e.message);
        alert('Uncaught exception in function:CopyToTempPage.  Error: ' + e.message);
    }
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: Saves the values entered by user on the Work Availability Single Day form.
 *    User Story: ??
 *    Params: event: Current context provided by application for use when this function is called.
 */
function SaveSingleDay(event) {
    try {
        /* On mobile device and online.*/
        if (OnMobileApp()) {

            /* Retrieve data from Seleceted Day temp page for selected Single Day form.*/
            var currentDay = pega.ui.ClientCache.find('SelectedDay');

            /* IF the page exists/is found.*/
            if (currentDay) {

                /* Clear all messages is present on the page.*/
                ClearMessages(currentDay);

                /* Get values on the selected day's data page. KCJ-need parseFloat call on times? also check if property exists before get value?*/
                var isAvailable = currentDay.get("IsAvailable") ? currentDay.get("IsAvailable").getValue() : "false";
                var summaryText = "Not Available";
				
              	/* IF the 'Not Availible' checkbox is not checked.*/
                if (isAvailable.toString() == 'false') {
				
                  	/* Run validations on the Selected Single Day form.*/
                    ValidateWorkAvailability(currentDay);
					
                  		
      				/* IF Single Day forms has an error message after validation is run, notify the user.*/
                    if (currentDay.hasMessages()) {

                        /* KCJ-Combine error messages together to display at top?*/
                        currentDay.put('ErrorMessage', currentDay.getMessages().join('<br/>'));
                        currentDay.addMessage("Error: " + currentDay.get("ErrorMessage").getValue());

                        /* Reload the Single Day section.*/
                        var section = pega.u.d.getSectionByName("WorkAvailabilitySingleDay", '', document);
                        pega.u.d.reloadSection(section, '', '', false, false, '', false);

                        /* Refresh the controls.*/
                        pega.ui.DCUtil.refresh();
                        return;
                    } else { /* No errors were found.*/
                      	/* Set summary */
                        var fromHour = currentDay.get("FromHour") ? currentDay.get("FromHour").getValue() : "";
                        var fromMinute = currentDay.get("FromMinute") ? currentDay.get("FromMinute").getValue() : "";
                        var fromPeriod = currentDay.get("FromPeriod") ? currentDay.get("FromPeriod").getValue() : "";
                        var toHour = currentDay.get("ToHour") ? currentDay.get("ToHour").getValue() : "";
                        var toMinute = currentDay.get("ToMinute") ? currentDay.get("ToMinute").getValue() : "";
                        var toPeriod = currentDay.get("ToPeriod") ? currentDay.get("ToPeriod").getValue() : "";
                        var inHours = currentDay.get("InHours") ? currentDay.get("InHours").getValue() : "0";

                        summaryText = fromHour + ':' + (fromMinute.toString() == "0" ? "00" : fromMinute.toString()) + ' ' + fromPeriod +
                           			 ' - ' + toHour + ':' + (toMinute.toString() == "0" ? "00" : toMinute.toString()) + ' ' + toPeriod +
                            		 " (" + inHours + " hours)";
                      
                      /* Fix wording for "1 hour" availability */
                      summaryText = summaryText.replace("1 hours", "1 hour");
                    }
                } else { /* The 'Not Availible' checkbox is checked.*/
                    summaryText = "Not available";
                }
				
              	/* Store the appropriate Summary property value.*/
                currentDay.put('Summary', summaryText);

                /* Copy SelectedDay back into D_CurrentStaffWorkAvailabilities-KCJ Delete? */
                /* Check to ensure an elementIndex was found */
                var elementIndex = CB.indexInPageList("DateLabel", currentDay.get("DateLabel").getValue(), "D_CurrentStaffWorkAvailabilities.WorkAvailabilities");
                if (elementIndex <= 0) {
                    console.log('an element index has not been found.');
                    return;
                }

                /* Retrieve data for all work availability days.*/
                var WAPage = pega.ui.ClientCache.find('D_CurrentStaffWorkAvailabilities.WorkAvailabilities(' + elementIndex + ')');
              	currentDay.put('Summary', summaryText);
                WAPage.adoptJSON(currentDay.getJSON());

                /*DELETE?-KCJ*/
                /* Success!  And there was much rejoincing (Yay).  Move back to previous page (WorkAvailabilitiy)-KCJ LOL */

                /* Use this when 7.2.3 becomes available:

                        var options = {
                        	harness: "WorkAvailability", 
                          	harnessClass: "CB-Dec-Data-StaffAvailability", 
                          	displayMode: pega.api.ui.constants.REPLACE_CURRENT, 
                          	readOnly: false, 
                          	doSubmit: true
                        };

                        pega.api.ui.actions.launchHarness(options); */

              /** Queueing the SaveWorkAvailability activity to save day data when possible**/
              var metadata = {
                "action": "callActivity",
                "activityName": "SaveWorkAvailabilities",
                "className": "CB-Dec-Data-StaffAvailability"
              };

              window.launchbox.PRPC.ClientStore.addAction(undefined,
                                                          undefined,
                                                          JSON.stringify(metadata),
                                                          WAPage.getJSON(),
                                                          function writeSuccessCallback(){console.log("Success callback")},
                                                          function failCallback(){console.log("Fail callback");}); 
              /* Go back to work availibility (all days) screen.-KCJ 'current correct parameter value?*/

                pega.desktop.showHarnessWrapper("current",
                    'CB-Dec-Data-StaffAvailability',
                    'MultipleDayReview',
                    '',
                    '',
                    'D_CurrentStaffWorkAvailabilities',
                    true,
                    '',
                    false,
                    '',
                    '',
                    '',
                    '',
                    '',
                    true,
                    false,
                    false,
                    null);
                return;
            }
        } else { /* On Desktop app.*/
          	
          	/* Launch activity to validate Single Day form.*/
            var launchActivity = new SafeURL("CB-Dec-Data-WorkAvailability.ValidateWorkAvailability");
            var out = httpRequestAsynch(launchActivity.toURL(), null, 50, 100);
			
          	/* what is happening here?-KCJ*/
          /* out contains whether the page has messages*/
            if (out == "true") {
              	
                /* Reload the Single Day section.*/
                var section = pega.u.d.getSectionByName("WorkAvailabilitySingleDay", '', document);
                pega.u.d.reloadSection(section, '', '', false, false, '', false);
            } else {
                /*DELETE?-KCJ*/
              /*dont delete - when the page does not have messages we want to launch the harness*/
                /**** THIS SEEMS TO BE AN ISSUE!!! ********/
                pega.desktop.showHarnessWrapper("current",
                    'CB-Dec-Data-StaffAvailability',
                    'MultipleDayReview',
                    '',
                    '',
                    'D_CurrentStaffWorkAvailabilities',
                    true,
                    '',
                    false,
                    '',
                    '',
                    '',
                    '',
                    '',
                    true,
                    false,
                    false,
                    null);
            }
        }
    } catch (e) {
        console.log("Uncaught exception in SaveSingleDay: " + e.message);
        alert("Uncaught exception in SaveSingleDay: " + e.message); /*DELETE?-KCJ*/
    }
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: Saves the values entered by user on the Work Availability 5-Day form for each single day.
 *    User Story: ??
 *    Params: event: Current context provided by application for use when this function is called.
 */
function SaveAll(event) {

    /* IF on the mobile device/offline.*/
    if (OnMobileApp()) {
      
        /* Combine next 2 lines?-KCJ*/
        var WAPage = pega.ui.ClientCache.find('D_CurrentStaffWorkAvailabilities');
        var waList = WAPage.get("WorkAvailabilities");
        var iterator = (waList.type == pega.ui.ClientCache.OBJECT_TYPE_LIST ? waList.iterator() : null);
        var templatePage = null; /*Best value to set to? return if DNE? or var templatePage;-KCJ*/
        var hasErrors = false; /*make string type?-KCJ*/
        var isAvailable = false; /*make string type?-KCJ*/

        /* Loop thru work availibility list of days see if can find current day's date label.*/
        while (iterator && iterator.hasNext()) {
          	
          	/* Grab next Single Day form.*/
            templatePage = iterator.next();
			
          	/* Find out if 'Not Available' checkbox has been checked.*/
            isAvailable = templatePage.get("IsAvailable") ? templatePage.get("IsAvailable").getValue() : "false";

            /* Put .toString after get value?-KCJ*/
          	/* IF the 'Not Available' checkbox has not been checked.*/
            if (isAvailable.toString() == "false" || isAvailable.toString() == "") {
              	
              	/* Validate the current Single Day form iterated over.*/
                ValidateWorkAvailability(templatePage);
            }

            /* IF the are error messages or the page has not been completed by the user.*/
            if (templatePage.hasMessages() || templatePage.get("Summary").getValue() === "Please enter data") {
                templatePage.put("ErrorMessage", "Please complete " + templatePage.get("DateLabel").getValue());
                templatePage.addMessage("Error: " + "Please complete " + templatePage.get("DateLabel").getValue());
                templatePage.remove("Summary"); /*Why remove summary? DELETE?-KCJ*/
                hasErrors = true;
            }
        }
		
      	/* IF any of the Work Availability Single Day forms has an error, notify the user.*/
        if (hasErrors) {

            /* Inform user to fix errors on page.*/
            WAPage.put('ValidationErrorMessage', "Please fix errors above.");

            /* Reload section with error messages displayed.*/
            var section = pega.u.d.getSectionByName("WorkAvailabilityMultipleDay", '', document);
            pega.u.d.reloadSection(section, '', '', false, false, '', false);
            return;
        }
		
        /*DELETE?-KCJ*/
        WAPage.put('ValidationErrorMessage', 'Submit Successful'/* on ' + CB.getCurrentDateTimeAsString()*/);

        /*DELETE?-KCJ*/
        /* TB - Legacy Code?
    
          SetWorkAvailabilityDateTime();

          var metadata = {
            "action": "callActivity",
            "activityName": "SaveWorkAvailabilities",
            "className": "CB-Dec-Data-StaffAvailability"
          };

          window.launchbox.PRPC.ClientStore.addAction(undefined,
                                                      undefined,
                                                      JSON.stringify(metadata),
                                                      WAPage.getJSON(),
                                                      writeSuccessCallback,
                                                      failCallback); */
    } else {/* On Desktop... */
        /* Run activity, 'SaveWorkAvailabilities'.*/
        var oSafeUrl = new SafeURL("CB-Dec-Data-StaffAvailability.SaveWorkAvailabilities");
        pega.util.Connect.asyncRequest('GET', oSafeUrl.toURL(), '');
    }
}

/*
 *    Created By: Kelsey Justis
 *    Date: 01-06-2016
 *    Purpose: Validate data entered on Work Availability screen.
 *    User Story: US-1498.
 *    Params: currentDay: The page used to hold current day entries
 */
function ValidateWorkAvailability(currentDay) {
    try {
        /* Retrieve required properties with user-entered values.*/
        var fromHour = currentDay.get("FromHour") ? parseFloat(currentDay.get("FromHour").getValue()) : 0.00;
        var fromMinute = currentDay.get("FromMinute") ? parseFloat(currentDay.get("FromMinute").getValue()) : 0.00;
        var fromPeriod = currentDay.get("FromPeriod") ? currentDay.get("FromPeriod").getValue() : "";
        var toHour = currentDay.get("ToHour") ? parseFloat(currentDay.get("ToHour").getValue()) : 0.00;
        var toMinute = currentDay.get("ToMinute") ? parseFloat(currentDay.get("ToMinute").getValue()) : 0.00;
        var toPeriod = currentDay.get("ToPeriod") ? currentDay.get("ToPeriod").getValue() : "";
        var inHours = currentDay.get("InHours") ? parseFloat(currentDay.get("InHours").getValue()) : 0.00;

        /* BEGIN REPLICATION OF CalculateTimeInMinutes DATATRANSFORM.*/
        /* Default the total minutes to minutes entered; particularly useful in case of 12:30AM = 0 Hours + 30 Minutes.*/
        fromTimeInMinutes = fromMinute;
        toTimeInMinutes = toMinute;

        /*DELETE?-KCJ*/
        if (Number.isNaN(fromTimeInMinutes)) {
            fromTimeInMinutes = 0.00;
        }
        /*DELETE?-KCJ*/
        if (Number.isNaN(toTimeInMinutes)) {
            toTimeInMinutes = 0.00;
        }

        /* IF the given From time is in the afternoon and not special case of 12PM.*/
        if ((fromPeriod === "PM") && (fromHour != 12.0)) {
            fromHour += 12.0;
            fromTimeInMinutes += (fromHour * 60.0);
        }
        /* IF the given From time is in the morning and is not the special case of 12 AM.*/
        else if ((fromPeriod === "AM") && (fromHour != 12.0)) {
            fromTimeInMinutes += (fromHour * 60.0);
        }
        /* IF the given To time is in the afternoon and not special case of 12PM.*/
        if ((toPeriod === "PM") && (toHour != 12.0)) {
            toHour += 12.0;
            toTimeInMinutes += (toHour * 60.0);
        }
        /* IF the given To time is in the morning and is not the special case of 12 AM.*/
        else if ((toPeriod === "AM") && (toHour != 12.0)) {
            toTimeInMinutes += (toHour * 60.0);
        }

        /* Insert properties with appropriate values.*/
        currentDay.put('ToTimeInMinutes', toTimeInMinutes);
        currentDay.put('FromTimeInMinutes', fromTimeInMinutes);
        /* END REPLICATION OF CalculateTimeInMinutes DATATRANSFORM.*/

        /* BEGIN REPLICATION OF SingleDayValidations VALIDATION.*/
        /* Check if user entered a value for the required field, InHours. Part of US-346.*/
        if (inHours === "" || Number.isNaN(inHours)) { /* If InHours is blank ("").*/
            /* InHours is required */
            currentDay.get("InHours").addMessage(ALMCensus.Messages.InHoursRequired);
        }
        /*US-1498:
                -AC#2: If "From" time before 9:00AM or "To" time later than 9:00PM."
                -AC#3: If "From" time after 8:45PM" or "To" time later than 9:00PM."*/
        /* 'Magic Numbers' found below correspond to the hour limits specified when converted to minutes for easy comparision.*/
        if ((fromTimeInMinutes < 540) || (fromTimeInMinutes > 1245)) {
            currentDay.get("FromHour").addMessage(ALMCensus.Messages.OutsideAcceptedTimeWindow);
        }
        /*US-1498:
                -AC#4: If "To" time before 9:15AM.
                -AC#5: If "To" time after 9:00PM" */
        /* 'Magic Numbers' found below correspond to the hour limits specified when converted to minutes for easy comparison.*/
        else if ((toTimeInMinutes < 555) || (toTimeInMinutes > 1260)) {
            currentDay.get("ToHour").addMessage(ALMCensus.Messages.OutsideAcceptedTimeWindow);
        }
        /*US-1498:
                -AC#6: If "To" time that is earlier than a "From" time.
                -AC#8: If"From" time that is the same as a "To" time.*/
        if (fromTimeInMinutes >= toTimeInMinutes) {
            currentDay.get("FromHour").addMessage(ALMCensus.Messages.ToTimeFromTimeWrongOrder);
        }
        /*US-1498:
                -AC#7: If  "From" time that is later than a "To".
                -AC#8: If "From" time that is the same as a "To" time.*/
        else if (toTimeInMinutes <= fromTimeInMinutes) {
            currentDay.get("ToHour").addMessage(ALMCensus.Messages.ToTimeFromTimeWrongOrder);
        }
        /*US-1498:
                -AC#9: If more Availability Hours than exist between the time inputted within the "From" and "To" fields or negative entry.*/
        enteredTimeInterval = (toTimeInMinutes - fromTimeInMinutes) / 60.0; /* Amount of time expired between entered from and to times.*/
        if ((!Number.isNaN(inHours) && inHours > enteredTimeInterval) || (inHours < 0.0)) {
            currentDay.get("InHours").addMessage(ALMCensus.Messages.InvalidTotalHours);
        }
        /* END REPLICATION OF SingleDayValidations VALIDATION.*/
    } catch (e) {
        console.log("Uncaught exception in ValidateWorkAvailability: " + e.message);
        try {
            /* Try to bubble error to currentDay object (maybe the error is something we can recover from) */
            currentDay.addMessage("Uncaught exception in ValidateWorkAvailability: " + e.message);
        } catch (e) {}
    }
}

/*
 *    Created By: Tim Bechmann
 *    Date: 02-10-2017
 *    Purpose: ??
 *    User Story: ??
 */
/* May use later; need to update references to classes.DELETE?-KCJ and TB*/
function SetWorkAvailabilityDateTime() {
    try {
        if (pega.mobile.isHybrid) { /* KCJ- use OnMobileApp() call?*/
            var currentWorkAvDateTime = CB.getCurrentDateTimeAsString();
            var showActnCase = pega.u.ClientCache.find("ShowActionPage");
            if (!showActnCase) {
                var showActnCase = pega.ui.ClientCache.createPage("ShowActionPage");
                var objJSON = '{"pxObjClass":"Data-Portal"}';
                showActnCase.adoptJSON(objJSON);
            }
            showActnCase.put("WorkAvailabilityDateTime", currentWorkAvDateTime);
            showActnCase.put("SyncAlert", true);
        }
    } catch (e) {
        console.log("Inside setWorkAvailabilityDateTime: " + e.message);
    }
}