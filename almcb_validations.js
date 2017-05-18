/************************ Offlne validation ********************
 ***                       This script holds a helper function and how to use the
 ***                       helper function and some common functions
 ***
 *****************************************************************/

//namespace
var ALMCB = ALMCB || {};
/*******************************************************************************************
 ****      The following helper method simplifies creating custom client-side edit validation
 ****      START helper
 ********************************************************************************************/
ALMCB.ALMCreateCustomEditValidation = function(validationType, handler) {

        /* temp addition to skip creation while outside ADCAN process - GIANC301 10/18/2016 */
        var skipValidation = false;
        if (pega.mobile.isHybrid) {
            var cpWorkPage = pega.ui.ClientCache.find("pyWorkPage");
            if (cpWorkPage) {
                var curWorkstream = CB.getCurrentWorkstream("pyWorkPage");
                if (curWorkstream != "ADCAN") {
                    skipValidation = true;
                }
            } else {
                var strCurObjClass = pega.u.d.getHarnessClass();
                if (strCurObjClass == "Data-Portal") {
                    skipValidation = true;
                }
            }
        } else {
            var strCurObjClass = pega.u.d.getHarnessClass();
            var matchISR = strCurObjClass.match(/isr/i);
            var matchEnum = strCurObjClass.match(/enum/i);
            if (matchISR) {
                skipValidation = true;
            }
            if (matchEnum) {
                skipValidation = true;
            }
        }
        if (!skipValidation) {
            try {
                if (typeof validationType != "string" || typeof handler != "function") {
                    throw "Usage: ALMCB.ALMCreateCustomEditValidation(string,function)";
                }
                if (!ALMCustomEditValidation) {
                    var ALMCustomEditValidation = {};
                }
                ALMCustomEditValidation[validationType] = new validation_ValidationType(validationType, handler);
                ALMCustomEditValidation[validationType].addEventFunction("onchange", handler);
            } catch (e) {
                //log the error
                console.log("Unexpected ALMCB.ALMCreateCustomEditValidation error: " + e.message);
            }
        }
    };
    /***************** END helper  ************************************************/

/***Parameterized Data Page***/

function D_GQTypeOptions() {
  var paramsPage = pega.ui.ClientCache.find("D_GQTypeOptions.pxDPParameters");
  var GQTypeOptions = pega.ui.ClientCache.find("D_GQTypeOptions").put("pxResults",[]);
  var nameParam = paramsPage.get("Name").getValue();
  var GQTypeOptionsMaster = pega.ui.ClientCache.find("D_AllGQTypes.pxResults").iterator();  
  while(GQTypeOptionsMaster.hasNext()) {
    var currentPage = GQTypeOptionsMaster.next()
    if(currentPage.get("Name").getValue() == nameParam) {
      GQTypeOptions.add().adoptJSON(currentPage.getJSON());  
    }
  }
}

/*****************************/


var SetLALiterals = {
    /*String Literals - Data used in logic*/
    addressType_Urbanizacion: "Urbanizacion",
    addressType_General: "General",
    addressType_ApartmentComplex: "Apartment Complex",
    addressType_AreaName: "Area Name",
    addressType_TrailerMobileHm: "Empty Trailer Pad/Mobile Home Site",
  
    /*Area Name is being used in a reg expression, if you change this search code for /^Area\sName$/*/

    addressStatus_GQ: "Group Quarters (GQ)",
    addressStatus_TL: "Transitory Location (TL)",
	addressStatus_DNE: "Does Not Exist",
	addressStatus_UTW: "Unable To Work",  
    addressStatus_ETMH: "Empty Trailer Pad/Mobile Home Site",
 
    addressStructureType_MultiUnit: "Multi Unit Structure",
    addressStructureType_Trailer: "Trailer/Mobile Home",
  

    /*Field Names Displayed to Users*/

    /*	This section of code is creating problem
    	fld_AddressType: DLCensus.Messages.Fld_AddressType,
    	fld_AddressAreaName1: DLCensus.Messages.Fld_AddressAreaName1,
    	fld_AddressAreaName2: DLCensus.Messages.Fld_AddressAreaName2,
    	fld_HouseNumber: DLCensus.Messages.Fld_HouseNumber,
    	fld_NameUrban: DLCensus.Messages.Fld_NameUrban,
    	fld_Street: DLCensus.Messages.Fld_Street,
    	fld_ZipCode: DLCensus.Messages.Fld_ZipCode,
    	fld_BuildingDescriptor: DLCensus.Messages.Fld_BuildingDescriptor,
    	fld_BuildingNumber: DLCensus.Messages.Fld_BuildingNumber,
    	fld_WithinStructDescriptor: DLCensus.Messages.Fld_WithinStructDescriptor,
    	fld_WithinStructID: DLCensus.Messages.Fld_WithinStructID,
    	fld_LocationPhysicalDesc: DLCensus.Messages.Fld_LocationPhysicalDesc,
    	fld_KilometerMarker: DLCensus.Messages.Fld_KilometerMarker,
    	fld_GQName: DLCensus.Messages.Fld_GQName,
    	fld_FacilityName: DLCensus.Messages.Fld_FacilityName,
    	fld_TLName: DLCensus.Messages.Fld_TLName,
    */
    /*Messages Displayed to Users*/
    /*  This section of code is creating problem
	msg_MultipleZeros: DLCensus.Messages.Msg_MultipleZeros,
	msg_StreetNameStart: DLCensus.Messages.Msg_StreetNameStart,
	msg_ZipCodeZeros: DLCensus.Messages.Msg_ZipCodeZeros,
	msg_ZipCodeValid: DLCensus.Messages.Msg_ZipCodeValid,
	msg_BuildingDescriptor: DLCensus.Messages.Msg_BuildingDescriptor,
	msg_AlphaNumeric: DLCensus.Messages.Msg_AlphaNumeric,
	msg_AddressTypeAreaName: DLCensus.Messages.Msg_AddressTypeAreaName,
	msg_AreaNameNotSame: DLCensus.Messages.Msg_AreaNameNotSame,
	msg_KilometerMarker: DLCensus.Messages.Msg_KilometerMarker,
	msg_ContainsInvalidChar: DLCensus.Messages.Msg_ContainsInvalidChar,
	msg_InvalidStreetName: DLCensus.Messages.Msg_InvalidStreetName,
  	msg_StreetNameGeneralError: DLCensus.Messages.Msg_StreetNameGeneralError,
  	msg_HouseNumberValid: DLCensus.Messages.Msg_HouseNumberValid,
  	msg_UnitNumberValid: DLCensus.Messages.Msg_UnitNumberValid,
   	msg_AptComplexValid: DLCensus.Messages.Msg_AptComplexValid	
*/

    /* Field Names Displayed to Users */
    AddressStatusRequired: "An Address Status must be selected",
    AddressStatusReasonRequired: "You indicated this unit is unable to be worked.  You must supply a reason.",

    fld_AddressType: "Address Type",
    fld_AddressAreaName1: "Area Name 1",
    fld_AddressAreaName2: "Area Name 2",
    fld_HouseNumber: "House Number",
    fld_NameUrban: "Name of Urbanización",
    fld_Street: "Street Name",
    fld_ZipCode: "Zip Code",
    fld_BuildingDescriptor: "Building Descriptor",
    fld_BuildingNumber: "Building Number",
    fld_WithinStructDescriptor: "Unit Descriptor",
    fld_WithinStructID: "Unit Number",
    fld_LocationPhysicalDesc: "Location/Physical Description",
    fld_KilometerMarker: "Kilometer Marker",
    fld_GQName: "Group Quarters Name",
    fld_FacilityName: "Facility Name",
    fld_TLName: "Transitory Location Name",

    /*Messages Displayed to Users  */
    msg_MultipleZeros: " can't be multiple consecutive zeros",
    msg_StreetNameStart: " should not start with ",
    msg_ZipCodeZeros: " must start with 00",
    msg_ZipCodeValid: " must be valid",
    msg_BuildingDescriptor: " valid values are [EDIF,TORRE]",
    msg_AphaNumeric: " must be Alpha Numeric.",
    msg_AddressTypeAreaName: " must be Area Name",
    msg_AreaNameNotSame: " cannot be identical",
    msg_KilometerMarker: " legal values range from 0.1 to 999.9",

    Msg_HouseNumberValid: "House Number is invalid.",
    Msg_BuildingNumberValid: "Building Number is required with a Building Descriptor.",
    Msg_UnitNumberValid: "Unit Number is invalid.",
    Msg_AptComplexValid: "Condominium or Residencial Name is Required.",
    Msg_ContainsInvalidChar: "invalid character(s) are not allowed.",
    Msg_IsRequired: "is Required.",
};

ALMCB.ALMCreateCustomEditValidation('AddressStatusDefault', function(obj) {
    return validateRadioButtonSelected('AddressStatusDefault', obj);
});


ALMCB.ALMCreateCustomEditValidation('AddressStatusNew', function(obj) {
    return validateRadioButtonSelected('AddressStatusNew', obj);
});


ALMCB.ALMCreateCustomEditValidation('AddressStatusRework', function(obj) {
    return validateRadioButtonSelected('AddressStatusRework', obj);
});

ALMCB.ALMCreateCustomEditValidation('AddressStatusReason', function(obj) {
    var addressStatus = pega.ui.ClientCache.find('pyWorkPage.BCU.SelectedUnitPage.AddressStatus').getValue();
    if (addressStatus === "Unable To Work" && (!obj.value || obj.value === "")) {
        return (new validation_Error(obj, SetLALiterals.AddressStatusReasonRequired));
    }
});


/*	
 *	Created By: Mark Switzer
 *	Date: 10-06-2016
 *	Purpose: This function validates that the named radio button group meets 2 criteria:
 *              1) it editable (and visible) on the screen.
 *              2) one of its values has been selected.
 *			 Part of US-578 and US-1269.
 */
function validateRadioButtonSelected(radioGroupName, radioGroupObj) {
    if (!ALMCB.IsObjectEditable(radioGroupObj)) return null;

    var selectedItem = getRealValue(radioGroupObj.name, true);
    if (!selectedItem || selectedItem === "") {
        return new validation_Error(radioGroupObj, SetLALiterals.AddressStatusRequired);
    } else {
        return null;
    }
}

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_AddressType', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var state = ALMCB.getGeoDetailsState();
    var structureType = ALMCB.getAddressStructureType();
    if (ALMCB.isStatePR(state) && structureType != SetLALiterals.addressStructureType_MultiUnit) {
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_AddressType, true); /*,/^Area\sName$/,SetLALiterals.msg_AddressTypeAreaName);*/
        if (errObj != null) {
            return errObj;
        }
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_AreaName1PR', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;
    var addrType = ALMCB.getAddressType();
    var isRequired = false;
    if (addrType == SetLALiterals.addressType_AreaName) {
        isRequired = true;
    }

    var areaName2 = ALMCB.getAreaName2();
    var areaName1 = ALMCB.getTrimmedValue(obj);
    if (areaName2.length > 1 && areaName2 == areaName1) {
        return new validation_Error(obj, SetLALiterals.fld_AddressAreaName1 + " and " + SetLALiterals.fld_AddressAreaName2 + " " + SetLALiterals.msg_AreaNameNotSame);
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_AddressAreaName1, isRequired);
    if (errObj != null) {
        return errObj;
    }

});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_AreaName2PR', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var areaName1 = ALMCB.getAreaName1();
    var areaName2 = ALMCB.getTrimmedValue(obj);
    if (areaName2 == areaName1) {
        return new validation_Error(obj, SetLALiterals.fld_AddressAreaName1 + " and " + SetLALiterals.fld_AddressAreaName2 + " " + SetLALiterals.msg_AreaNameNotSame);
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_AddressAreaName1, false);
    if (errObj != null) {
        return errObj;
    }

});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_UrbanizationPR', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrType = ALMCB.getAddressType();
    var isRequired = false;
    if (!(addrType === undefined) && addrType == SetLALiterals.addressType_Urbanizacion) {
        isRequired = true;
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_NameUrban, isRequired);
    if (errObj != null) {
        return errObj;
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_HouseNumber', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrType = ALMCB.getAddressType();
    var streetName = ALMCB.getStreetName();
    var isRequired = false;

    switch (addrType) {
        case SetLALiterals.addressType_General:
        case SetLALiterals.addressType_Urbanizacion:
            isRequired = true;
            break;
        case SetLALiterals.addressType_AreaName:
        case SetLALiterals.addressType_ApartmentComplex:
            break;
    }

    /*if ((addrType == SetLALiterals.addressType_ApartmentComplex) && streetName != "") isRequired = true;*/

    /* Check for required */
    var elementValue = ALMCB.getTrimmedValue(obj);
    if (isRequired == true && elementValue.length < 1) {
        return new validation_Error(obj, SetLALiterals.msg_HouseNumberValid);
    }

    /* Check for length = 0 and allowing 1 zero and alphanumeric */

    if (elementValue.length == 1) {
        var errObj = ALMCB.characterValidation(obj, "", false, /^([a-zA-Z0-9])+$/, SetLALiterals.msg_HouseNumberValid);
        if (errObj != null) {
            return errObj;
        }
    }

    /* Check for leading zeroes and special characters */

    var errObj = ALMCB.characterValidation(obj, "", false, /^(?!0+$)[a-zA-Z0-9\.\-\/]+$/, SetLALiterals.msg_HouseNumberValid);
    if (errObj != null && String(obj.value).length > 1) {
        return errObj;
    }

    if ((elementValue.length > 1) && (!/^(?!.*?[.\-\/]{2})[a-zA-Z0-9\/\-.]+$/.test(elementValue))) {
        return new validation_Error(obj, SetLALiterals.msg_HouseNumberValid);
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_StreetName', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var isUnnamed = ALMCB.getIsUnnamedUnknown();
    var kilometerMarker = ALMCB.getKilometerMarker();
    var addrType = ALMCB.getAddressType();
    var houseNum = ALMCB.getHouseNumber();
    var isRequired = false;

    switch (addrType) {
        case SetLALiterals.addressType_General:
            isRequired = true;
            break;
        case SetLALiterals.addressType_Urbanizacion:
            if (isUnnamed === "" || isUnnamed == false) {
                isRequired = true;
            }
            break;
        case SetLALiterals.addressType_AreaName:
            if (((isUnnamed === "" || isUnnamed == false) && houseNum.length >= 1) || (kilometerMarker.length >= 1)) {
                isRequired = true;
            }
            break;
        case SetLALiterals.addressType_ApartmentComplex:
            if ((isUnnamed === "" || isUnnamed == false) && houseNum.length >= 1) {
                isRequired = true;
            }
            break;
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_Street, isRequired);
    if (errObj != null) {
        return errObj;
    }

    /*shouldn't start with specific character sequence*/
    var elementValue = ALMCB.getTrimmedValue(obj);
    var msgData = elementValue.match(/^(hcr)|(rr)|(Highway\sContract\sRoute)|(Rural\sRoute)$/i);
    if (msgData != null) {
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_Street, false, /^!(hcr)|!(rr)|!(Highway\sContract\sRoute)|!(Rural\sRoute)$/i, SetLALiterals.msg_StreetNameStart + msgData[0]);
        if (errObj != null) {
            return errObj;
        }
    }

    /*shouldn't start with specific character sequence any number
    var elementValue = ALMCB.getTrimmedValue(obj);
    var errObj=ALMCB.characterValidation(obj,SetLALiterals.fld_Street
    ,true,/^!(hcr\s\d)|!(rr\s\d)|!(Highway\sContract\sRoute\s\d)|!(Rural\sRoute\s\d)$/i
    ," should not start with num " 
    + elementValue.match(/^(hcr\s\d)|(rr\s\d)|(Highway\sContract\sRoute\s\d)|(Rural\sRoute\s\d)$/i)[0]);
    if (errObj!=null) {
    	return errObj;
    }*/

    /*return lenthValidation(obj,SetLALiterals.fld_Street);*/
    try {
        var exclusionList = [
            "DIRTRD", "DIRTST", "PRIVATERD", "PRIVATEST", "UNNAMEDRD", "UNNAMEDST", "UNKNOWNRD", "UNKNOWNST", "UNRD", "UNST",
            "CALLESINNOMBRE", "CLLESINNOMBRE", "CLLSINNOMBRE", "SINNOMBRE", "CALLEPRIVADA", "CLLPRIVADA", "PRIVATERD", "PRVTRD",
            "PT", "UNNAMEDROAD", "UNAMEDROAD", "UNROAD", "UNNAMEDRD", "UNAMEDRD", "UNRD", "UNNAMED", "UNAMED", "PRIVATEROAD",
            "PRVTROAD", "PVTROAD", "PTROAD", "PRROAD", "PVTRD", "PTRD", "PRRD", "PRIVATE", "PRVT", "PVT", "NONAMEROAD", "NOTNAMEDROAD",
            "UNKNOWNROAD", "NONAMERD", "NOTNAMEDRD", "UNKNOWN", "NONAME", "NOTNAMED", "S/N", "DIRTROAD", "CLLESINNOMBRE", "NONOMBRE",
            "CALLEJÓNSINNOMBRE", "CALLEJONSINNOMBRE", "CAMSINNOMBRE", "CAMINOSINNOMBRE", "NOTIENENOMBRE", "CLLSINNOMBREINTERIOR",
            "CLLSINNOMBREINT", "SINSALIDA", "CLLSINSALIDA", "SINSALIDA", "CALLEJÓNSINSALIDA", "CALLEJONSINSALIDA"
        ];


        if ((/SINNOMBRE/.test(obj.value.replace(/\s+/g, '').toUpperCase())) || (exclusionList.indexOf(obj.value.replace(/\s+/g, '').toUpperCase()) > -1)) { /* User input is invalid.*/
            return (new validation_Error(obj, SetLALiterals.msg_StreetNameGeneralError + "\n" + obj.value + " " + SetLALiterals.msg_InvalidStreetName)); /* Display error message.*/
        }

    } catch (e) {
        /*log the error*/
        console.log("Unexpected ALMCB.ALMCreateCustomEditValidation(SetLocationAddress_StreetName) error: " + e.message);
        throw e;
    }

});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_ZipCode', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var state = ALMCB.getGeoDetailsState();
    /*If State is PR, Zip must start with 00*/
    if (ALMCB.isStatePR(state)) {
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_ZipCode, false, /^00/, SetLALiterals.msg_ZipCodeZeros);
        if (errObj != null) {
            return errObj;
        }
    }

    /*check for valid Zip Code*/
    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_ZipCode, false, /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/, SetLALiterals.msg_ZipCodeValid);
    if (errObj != null) {
        return errObj;
    }
});

ALMCB.ALMCreateCustomEditValidation("SetLocationAddress_BuildingDescriptor", function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;
    var addrType = ALMCB.getAddressType();
    /*check for valid values: EDIF, TORRE*/
    if (addrType === SetLALiterals.addressType_ApartmentComplex) {
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_BuildingDescriptor, false, /^(TORRE)|(EDIF)$/, SetLALiterals.msg_BuildingDescriptor);
        if (errObj != null) {
            return errObj;
        }
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_BuildingIdentifier', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrType = ALMCB.getAddressType();
    var bldDesc = ALMCB.getBuildingDescription();
    var isRequired = false;

    if (addrType === SetLALiterals.addressType_ApartmentComplex) {
        if (bldDesc.length > 0) {
            isRequired = true;
        }
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_BuildingNumber, isRequired, /^/, SetLALiterals.msg_BuildingNumberValid);
        if (errObj != null) {
            return errObj;
        }
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_WithinStructDescriptor', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    /*var addrType = ALMCB.getAddressType();*/

    var isRequired = false;
    var unitDesc = ALMCB.getUnitDescription();

    /*if (!(addrType===undefined) && addrType==SetLALiterals.addressType_Urbanizacion) {
    	isRequired = false;
    }*/
    if (unitDesc === '') {
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_WithinStructDescriptor, isRequired);
        if (errObj != null) {
            return errObj;
        }
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_WithinStructID', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;
    var addrType = ALMCB.getAddressType();
    var unitDesc = ALMCB.getUnitDescription();
    var isRequired = false;


    switch (addrType) {
        case SetLALiterals.addressType_General:
        case SetLALiterals.addressType_Urbanizacion:
        case SetLALiterals.addressType_AreaName:
            if (!(unitDesc === undefined) && unitDesc.length >= 1) {
                isRequired = true;
            }
            break;
        case SetLALiterals.addressType_ApartmentComplex:
            isRequired = true;
            break;
    }

    /* check for required condition */

    var elementValue = ALMCB.getTrimmedValue(obj);
    if (isRequired && elementValue.length < 1) {
        return new validation_Error(obj, SetLALiterals.msg_UnitNumberValid);
    }

    /* check for length == 1 and only alphanumeric allowed */
    if (elementValue.length == 1) {
        var errObj = ALMCB.characterValidation(obj, "", false, /^([a-zA-Z0-9])+$/, SetLALiterals.msg_UnitNumberValid);
        if (errObj != null) {
            return errObj;
        }
    }

    /* check for leading zeroes and special characters */
    var errObj = ALMCB.characterValidation(obj, "", false, /^(?!0+$)[a-zA-Z0-9\.\-\/]+$/, SetLALiterals.msg_UnitNumberValid);
    if (errObj != null && String(obj.value).length > 1) {
        return errObj;
    }

    if ((elementValue.length > 1) && (!/^(?!.*?[.\-\/]{2})[a-zA-Z0-9\/\-.]+$/.test(elementValue))) {
        return new validation_Error(obj, SetLALiterals.msg_UnitNumberValid);
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_AptComplexName', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;
    var addrType = ALMCB.getAddressType();
    var aptName = ALMCB.getElementValue("LOCAPTCOMPLEX");
    var isRequired = false;

    switch (addrType) {
        case SetLALiterals.addressType_ApartmentComplex:
            /* if (!aptName || aptName.length<1){
    			return new validation_Error(obj, SetLALiterals.msg_AptComplexValid);
			}*/
            isRequired = true;
            break;
    }

    var errObj = ALMCB.characterValidation(obj, "", isRequired, /^/, SetLALiterals.msg_AptComplexValid);

    if (errObj != null) {
        return errObj;
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_LocationPhysicalDesc', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    //When Address Type=Area Name and  (Street Is Unnamed =true OR House Number is null)
    var isUnnamed = ALMCB.getIsUnnamedUnknown();
    var addrType = ALMCB.getAddressType();
    var houseNum = ALMCB.getHouseNumber();
    var isRequired = false;

    /*if (addrType===SetLALiterals.addressType_AreaName && (isUnnamed=="true" || houseNum.length==0)) {
    	isRequired = true;
    }*/

    if (addrType === SetLALiterals.addressType_AreaName) {
        isRequired = true;
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_LocationPhysicalDesc, isRequired);
    if (errObj != null) {
        return errObj;
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_KilometerMarker', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrType = ALMCB.getAddressType();
    if (addrType === SetLALiterals.addressType_AreaName) {
        elVal = ALMCB.getTrimmedValue(obj);
        if (/^\d{1,}?$/.test(elVal)) {
            obj.value = elVal + ".0";
        }
        var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_KilometerMarker, false, /^\d{0,3}(\.\d{0,1})?$/, SetLALiterals.msg_KilometerMarker);
        if (errObj != null) {
            return errObj;
        }
        var elementVal = ALMCB.getTrimmedValue(obj);
        if (elementVal === "0.0") {
            return new validation_Error(obj, SetLALiterals.fld_KilometerMarker + " " + SetLALiterals.msg_KilometerMarker);
        }
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_GQName', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrStatus = ALMCB.getAddressStatus();
    var isRequired = false;
    if (!(addrStatus === undefined) && addrStatus === SetLALiterals.addressStatus_GQ) {
        isRequired = true;
    }

    var errObj = ALMCB.characterValidation(obj, SetLALiterals.fld_GQName, isRequired);
    if (errObj != null) {
        return errObj;
    }
});

ALMCB.ALMCreateCustomEditValidation('SetLocationAddress_GQFacilityName', function(obj) {
    if (!ALMCB.IsObjectEditable(obj)) return null;

    var addrStatus = ALMCB.getAddressStatus();
    var addrType = ALMCB.getAddressType();

    var fieldName = SetLALiterals.fld_FacilityName;
    if (addrStatus == SetLALiterals.addressStatus_TL) {
        fieldName = SetLALiterals.fld_TLName;
    }

    var isRequired = false;
    switch (addrType) {
        case SetLALiterals.addressType_General:
        case SetLALiterals.addressType_Urbanizacion:
        case SetLALiterals.addressType_AreaName:
            if (!(addrStatus === undefined) && (addrStatus === SetLALiterals.addressStatus_GQ || addrStatus === SetLALiterals.addressStatus_TL)) {
                isRequired = true;
            }
            break;
        case SetLALiterals.addressType_ApartmentComplex:
            isRequired = false;
            break;

    }

    var errObj = ALMCB.characterValidation(obj, fieldName, isRequired);
    if (errObj != null) {
        return errObj;
    }
});

ALMCB.isStatePR = function(state) {
    return (state == "72" || state == "89");
};

ALMCB.getBuildingDescription = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var bldDesc = ALMCB.getPageWithNullCheck(locAddr,"BuildingDescriptor");*/
    return ALMCB.getElementValue("LOCBLDGDESC");
};

ALMCB.getUnitDescription = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var unitDesc = ALMCB.getPageWithNullCheck(locAddr,"WithinStructDescriptor");
    return (unitDesc)?unitDesc.getValue():"";*/
    return ALMCB.getElementValue("LOCWSDESC1");
};

ALMCB.getHouseNumber = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var houseNum = ALMCB.getPageWithNullCheck(locAddr,"HouseNumber");
    return (houseNum)?houseNum.getValue():"";*/
    return ALMCB.getElementValue("LOCHNPR");
};

ALMCB.getKilometerMarker = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var kiloMrk = ALMCB.getPageWithNullCheck(locAddr,"KilometerMarker");
    return (kiloMrk)?kiloMrk.getValue():"";*/
    return ALMCB.getElementValue("KMHM");
};

ALMCB.getGeoDetailsState = function() {
    var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var geoDetailPage = ALMCB.getPageWithNullCheck(workPg, "BCU");
    var state = geoDetailPage.get('State');
    return (state) ? state.getValue() : "";

    /* need to revert to previous style of referencing this property - it just works the old way and not the new */
    /*return ALMCB.getElementValue("TABBLKST"); */
};

ALMCB.getLatLon = function() {
    /*pyWorkPage.BCU.UnitList(1).LocationAddress*/
    var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg, "BCU.SelectedUnitPage.LocationAddress");
    var lat = ALMCB.getPageWithNullCheck(locAddr, "OFLAT");
    var lon = ALMCB.getPageWithNullCheck(locAddr, "OFLON");
    var latVal = (lat) ? lat.getValue() : "";
    var lonVal = (lon) ? lon.getValue() : "";
    var mapLoc = {
        lat: latVal,
        lon: lonVal,
        zoom: 14
    };
    if (latVal.length == 0 || lonVal.length == 0) {
        mapLoc = null;
    }

    /*alert("latVal: " + latVal);
    alert("lonVal: " + lonVal );  
    alert("mapLoc: " + mapLoc ); */
    return mapLoc;
};

ALMCB.getAddressType = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var addrType = ALMCB.getPageWithNullCheck(locAddr,"AddressType");
    return (addrType)? addrType.getValue():"";*/
    return ALMCB.getElementValue("AddressTypePR");
};

ALMCB.getAreaName1 = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var areaName1 = ALMCB.getPageWithNullCheck(locAddr,"AreaName1PR");
    var areaName1Val = (areaName1)?areaName1.getValue():"";
    return areaName1Val;*/
    return ALMCB.getElementValue("LOCAREANM1");
};

ALMCB.getAreaName2 = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var areaName2 = ALMCB.getPageWithNullCheck(locAddr,"AreaName2PR");
    var areaName2Val = (areaName2)?areaName2.getValue():"";
    return areaName2Val;*/
    return ALMCB.getElementValue("LOCAREANM2");
};

ALMCB.getStreetName = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var locAddr = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage.LocationAddress");
    var areaName2 = ALMCB.getPageWithNullCheck(locAddr,"AreaName2PR");
    var areaName2Val = (areaName2)?areaName2.getValue():"";
    return areaName2Val;*/
    return ALMCB.getElementValue("StreetName");
};

ALMCB.getAddressStructureType = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var selUnitPg = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage");
    var structType = ALMCB.getPageWithNullCheck(selUnitPg,"StructureType");
    var structTypeVal = (structType)?structType.getValue():"";
    return structTypeVal;*/
    /*alert("Structure Type:" + ALMCB.getElementValue("StructureType"));*/
    return ALMCB.getElementValue("StructureType");
};

ALMCB.getAddressStatus = function() {
    /*var workPg = pega.ui.ClientCache.find("pyWorkPage");
    var selUnitPg = ALMCB.getPageWithNullCheck(workPg,"BCU.SelectedUnitPage");
    var addrStatus = ALMCB.getPageWithNullCheck(selUnitPg,"AddressStatus");
    return (addrStatus)?addrStatus.getValue():"";*/
    return ALMCB.getElementValue("AddressStatus");
};

ALMCB.getIsUnnamedUnknown = function() {
    /*return document.getElementsByName("$PpyWorkPage$pBCU$pSelectedUnitPage$pLocationAddress$pUnnamedUnknownFlagPR")[1].checked;*/
    var nameOrId = "UnnamedUnknownFlagPR";
    var el = document.getElementById(nameOrId);
    if (el == null) {
        $("input[name$='" + nameOrId + "']").each(function() {
            //if an element is checked return it otherwise return the last element
            if (this.checked == true) {
                el = this;
                console.log("checked element found:" + el.name);
                return true;
            } else {
                el = this;
                console.log("un-checked element returned:" + el.name);
            }
        });
    }
    console.log("element found by ID:" + el.name + " value: " + el.checked);
    return el.checked;
    /*return ALMCB.getElementValue("IsUnnamedUnknown");*/
};

ALMCB.getElementValue = function(elementName) {
    var elementVal = "";
    if (!($("#" + elementName).val() === undefined)) {
        elementVal = $("#" + elementName).val(); //targetElement.value;
        console.log(elementName + ": ~~" + elementVal + "~~");
    } else {
        console.log("element val:" + $("#" + elementName).val() + "; Trying another way to find value");
        /*try using ends with name search for finding the element. This will work for radio buttons*/
        $("input[name$='" + elementName + "']").each(function() {
            /*alert(elementName+ "::" + this.type);*/
            if (this.type == "checkbox") {
                alert(elementName + "::" + this.type);
                if (this.checked == true) {
                    elementVal = this.checked;
                    return true;
                }
            } else {
                if (this.checked == true) {
                    elementVal = this.value;
                    return true;
                }
            }
        });
    }
    /*alert( elementName + ":" + elementVal);*/
    return elementVal;
};

ALMCB.getPageWithNullCheck = function(obj, attrib) {
    if (obj) {
        var pg = obj.get(attrib);
        if (!pg) {
            console.log(arguments.callee.caller.toString() + ";Page for attrib: " + attrib + " is null or empty. Parent obj JSON:\n");
            console.log(obj.getJSON());
        }
        return pg;
    } else {
        console.log(arguments.callee.caller.toString() + ";Parent for attrib: " + attrib + " is null or empty. ");
    }
};

ALMCB.IsObjectEditable = function(el) {
    try {
        if ((el.offsetWidth > 0 || el.offsetHeight > 0) && el.disabled == false) {
            return true;
        } else return false;
    } catch (err) {
        console.log("Error in IsObjectVisible: " + err);
        throw err;
    }
};

ALMCB.characterValidation = function(obj, attribName, required, regExValidator, specializeMsg) {
    var elementVal = ALMCB.getTrimmedValue(obj);
    console.log("characterValidation:" + obj.name + ":" + elementVal);

    if (regExValidator == null) {
        regExValidator = /^([a-zA-Z0-9-\s.\/]+)$/;
    }
    if (specializeMsg == null) {
        specializeMsg = SetLALiterals.msg_AlphaNumeric;
    }
    if (required == null) {
        required = false;
    }
    if (required) {

        if (elementVal.length < 1 || !regExValidator.test(elementVal)) {
            return new validation_Error(obj, attribName + " " + specializeMsg);
        }

    } else {
        if (elementVal.length >= 1 && !regExValidator.test(elementVal)) {
            return new validation_Error(obj, attribName + " " + specializeMsg);
        }
    }
    return null;
};

ALMCB.getTrimmedValue = function(obj) {
    var elementVal = "";
    if (obj.type == "radio") {
        var propName = obj.name;
        propName = propName.substring(propName.lastIndexOf("$p") + 2);
        console.log(propName + ";ID: " + obj.id + "=" + obj.checked);
        $("input[name$='" + propName + "']").each(function() {
            if (this.checked == true) {
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

ALMCB.lenthValidation = function(obj, attribName, attribMaxLength) {
    var elementVal = ALMCB.getTrimmedValue(obj);
    if (attribMaxLength == null) {
        attribMaxLength = obj.maxLength;
    }

    if (elementVal.length > attribMaxLength) {
        return new validation_Error(obj, attribName + " must not be more than " + attribMaxLength + " characters");
    }
};

/*	
 *	Created By: Marc Gosselin & Sonny Kocak
 *	Date: 09-12-2016
 *	Purpose: This validation script will check to make sure a structure type is selected and throw an error if it is not
 *			 Part of US-568
 */

ALMCB.ALMCreateCustomEditValidation('SetStructureType_StructureType', function(obj) {

    var found;

    $.each($("input:checked"), function(i, val) {
        found = "true";
    })

    if (!found) {
        return new validation_Error(obj, 'A Structure type must be selected.');
    }

});
/*
 * validateDuplicateAddress
 * Purpose:  Check for duplicate addresses when the user selects Next from the SetAddrLocation section.
 *			 If duplicates are found, messages are set for the user.  If messages get set on the section, then the
 *			 postFlowAction should not proceed.
 */
ALMCB.validateDuplicateAddress = function() {
  try
  {
	  var BCU = pega.ui.ClientCache.find("pyWorkPage.BCU");
      if(BCU)
      {
        var selectedUnitPage = BCU.get("SelectedUnitPage");
        if(selectedUnitPage)
        {
          var locationAddress = selectedUnitPage.get("LocationAddress")
          if(locationAddress)
          {
            var selAddressStatus = selectedUnitPage.get("AddressStatus");
            var selStreetName = locationAddress.get("StreetName");
            var selLOCHN = locationAddress.get("LOCHN");
            var selPageIndex = selectedUnitPage.get("PageIndex");
            var cpSelPageIndex = (selPageIndex)? selPageIndex.getValue() : "-1";
            if(selAddressStatus && selStreetName && selLOCHN)
            {
                var cpSelAddressStatus = selAddressStatus.getValue();
                var cpSelLOCHN = selLOCHN.getValue();
                var cpSelStreetName = selStreetName.getValue();
                if((cpSelLOCHN != "") && (cpSelStreetName != "") && (cpSelAddressStatus != "Group Quarters (GQ)"))
                {
                    var selLOCZIP = locationAddress.get("LOCZIP");
                    var selLOCBLDGID = locationAddress.get("LOCBLDGID");
                    var cpSelLOCZIP = (selLOCZIP)? selLOCZIP.getValue() : "";
                    var cpSelLOCBLDGID = (selLOCBLDGID)? selLOCBLDGID.getValue() : "";
                    var selLOCWSID1 = locationAddress.get("LOCWSID1");
                    var cpSelLOCWSID1 = selLOCWSID1.getValue();
                    var addrList = pega.ui.ClientCache.find("pyWorkPage.BCU.UnitList");
                    if(addrList){
                      var iterAddrList = addrList.iterator();
                      while(iterAddrList.hasNext()){
                        var cpCurAddr = iterAddrList.next();
                        if(cpCurAddr)
                        {
                          var curPageIndex = cpCurAddr.get("PageIndex");
                          var cpCurPageIndex = (curPageIndex)? curPageIndex.getValue() : "-1";
                          if(cpCurPageIndex!=cpSelPageIndex)
                          {
                              var curlocationAddress = cpCurAddr.get("LocationAddress");
                              if(curlocationAddress)
                              {
                                var curAddressStatus = cpCurAddr.get("AddressStatus");
                                var cpCurAddressStatus = (curAddressStatus)? curAddressStatus.getValue() : "";
                                if(cpCurAddressStatus != "Group Quarters (GQ)")
                                {
                                  var curLOCWSID1 = curlocationAddress.get("LOCWSID1");
                                  var cpCurLOCWSID1 = (curLOCWSID1)? curLOCWSID1.getValue() : "";
                                  var curLOCHN = curlocationAddress.get("LOCHN");
                                  var cpCurLOCHN = (curLOCHN)? curLOCHN.getValue() : "";
                                  var curLOCZIP = curlocationAddress.get("LOCZIP");
                                  var cpCurLOCZIP = (curLOCZIP)? curLOCZIP.getValue() : "";
                                  var curStreetName = curlocationAddress.get("StreetName");
                                  var cpCurStreetName = (curStreetName)? curStreetName.getValue() : "";
                                  var curLOCBLDGID = curlocationAddress.get("LOCBLDGID");
                                  var cpCurLOCBLDGID = (curLOCBLDGID)? curLOCBLDGID.getValue() : "";
                                  if ((cpCurLOCHN.toUpperCase()==cpSelLOCHN.toUpperCase()) &&
                                      (cpCurStreetName.toUpperCase()==cpSelStreetName.toUpperCase()) &&
                                      (cpCurLOCZIP.toUpperCase()==cpSelLOCZIP.toUpperCase()) &&
                                      (cpCurLOCBLDGID.toUpperCase()==cpSelLOCBLDGID.toUpperCase()) &&
                                      (cpCurLOCWSID1.toUpperCase()==cpSelLOCWSID1.toUpperCase()))
                                  {  /* Duplicate address */
                                      var workPage = pega.ui.ClientCache.find("pyWorkPage");
                                      var selMAFID = locationAddress.get("MAFID");
                                      var cpSelMAFID = (selMAFID)? selMAFID.getValue() : "";
                                      if(cpSelMAFID == "")
                                      {
                                        workPage.addMessage(ALMCensus.Messages.Msg_DuplicateAddressNew);                                
                                      }
                                      else
                                      {
                                        workPage.addMessage(ALMCensus.Messages.Msg_DuplicateAddressUpdated);
                                      }
                                      break;
                                  }
                                }
                              }
                          }
                        }
                      }
                    }
                }
            }
          }
        }
      }
  }
  catch( Err )
  {
    alert("checkForDuplicateAddresses Error ==> " + Err.message);
  }
}