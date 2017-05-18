function CheckErrorPlacement()
{
  checkForErrors();
  checkForRequired();
}

/*Check for any required fields to attach check error events when they are empty and lose focus, you may pass a section to increase performance and reduce where the function looks
*/

function checkForRequired(section){
  
  var outer_section;
  if(section){
    outer_section =$('div[data-node-id="'+section+'"]');
  }else{
    outer_section= $('body');
  }
  
  $(outer_section).find('.usds_input_required input').each(function(index){

    if($(this).parent().find('.iconErrorDiv').size()>0){
      	  
          var textInput = this.parentElement.parentElement.parentElement.parentElement;
          textInput.className += " usds-text-input-error-field";

          var errorMessage = this.parentElement.parentElement;
          errorMessage = errorMessage.previousSibling;
          errorMessage.className += " usds-text-input-error-message";

          var errorContainer = this.parentElement.parentElement.parentElement.parentElement;
          errorContainer.className += " usds-text-input-error-layout";
      
          $(this.nextSibling).insertBefore($(this.parentElement.parentElement));
    }
   
  });
  
 $(outer_section).find('.usds_input_required input').focusout(function(e){
   move_required(e);	
 });
 
  
}

function move_required(e){
  
  function move_ready(){
  	var field_container = e.currentTarget.parentElement.parentElement;  
    if ($(field_container).find('.iconErrorDiv').size()<1) {
      window.requestAnimationFrame(move_ready);
    }else{
  
  		var textInput = e.currentTarget.parentElement.parentElement.parentElement.parentElement;
   		var errorMessage = e.currentTarget.parentElement.parentElement;
          errorMessage = errorMessage.previousSibling;
   		var errorContainer = e.currentTarget.parentElement.parentElement.parentElement.parentElement;

          textInput.className += " usds-text-input-error-field";
          errorMessage.className += " usds-text-input-error-message";
          errorContainer.className += " usds-text-input-error-layout";

          $(e.currentTarget.nextSibling).insertBefore($(e.currentTarget.parentElement.parentElement));
          checkForErrors();
   		
    }
  }
  
  if(e.currentTarget.value ==""){
   move_ready(); 
  }else{
    
    var textInput = e.currentTarget.parentElement.parentElement.parentElement.parentElement;
   		var errorMessage = e.currentTarget.parentElement.parentElement;
          errorMessage = errorMessage.previousSibling;
   		var errorContainer = e.currentTarget.parentElement.parentElement.parentElement.parentElement;
    
         $(errorMessage.parentElement).find('.usds-text-input-error-message').removeClass('usds-text-input-error-message')
     	 $(textInput).removeClass('usds-text-input-error-field');
       	 $(errorMessage).removeClass('usds-text-input-error-message');
         $(errorContainer).removeClass('usds-text-input-error-layout');
         $(errorContainer).find('.iconErrorDiv').remove();
  		checkForErrors();
   }
}

/*Checks for any errors on the page by searching for the error section.  
  If there are errors, call function to move the error
*/
function checkForErrors(){
  console.log('Entering CheckForErrors...');
  if($(".inputErrorDiv").length > 0){
    console.log('Entering moveErrorDiv');
    moveErrorDiv();
  }
  else if($(".iconErrorDiv").length > 0){
    console.log('Entering moveIconErrorDiv');
    moveIconErrorDiv();
  }
  else {
    console.log('No Error Div Found.  WHAT DID YOU DO?!?!?!');
  }
}

/*USDS Standards dictate a specific format for errors on Text Inputs.
  The below code will find all errors, and format the Text Input as required
*/

function moveIconErrorDiv(){
  
//Using jQuery (denoted with $), find each instance of the error section and iterate through it
    $.each($(".iconErrorDiv"),function( i, val ){

/*Get ID of the error section which contains the property for which there is an error
  Strip off extraneous characters to be left with just the property
*/
    	var property = $(this).attr('id');
        property = property.replace("$PpyWorkPage$p","");
    	property = property.replace("Error","");
      
/*Strip off the "**" that pega adds to all error messages
  remove padding so error message aligns with text input
*/
      var errorMessage = "Generic Error";
      if($(this).children("#PegaRULESErrorFlag").length > 0) {
        var errorMessage = $(this).children("#PegaRULESErrorFlag").html();
        errorMessage = errorMessage.replace("**","");
        $(this).children("#PegaRULESErrorFlag").html(errorMessage);
        $(this).children("#PegaRULESErrorFlag").css("padding-left","0");
      }
      else {
         errorMessage = $(this).children('.iconError').attr('title'); 
      }
/*Set the formatting of the parent section as required
  Clone the error section, insert it before the text input, and remove the original
*/
        $(this).parents('div[data-ui-meta*="' + property + '"]').addClass("usds-text-input-error-section");
    	errorDiv.clone().insertBefore($("#" + property + ""));
 		errorDiv.hide();
  })
}

function moveErrorDiv(){
  
//Using jQuery (denoted with $), find each instance of the error section and iterate through it
    $.each($(".inputErrorDiv"),function( i, val ){

/*Get ID of the error section which contains the property for which there is an error
  Strip off extraneous characters to be left with just the property
*/
    	var property = $(this).attr('id');
        property = property.replace("$PpyWorkPage$p","");
    	property = property.replace("Error","");
      
/*Strip off the "**" that pega adds to all error messages
  remove padding so error message aligns with text input
*/
        var errorMessage = $(this).children("#PegaRULESErrorFlag").html();
        errorMessage = errorMessage.replace("**","");
        $(this).children("#PegaRULESErrorFlag").html(errorMessage);
        $(this).children("#PegaRULESErrorFlag").css("padding-left","0");

/*Set the formatting of the parent section as required
  Clone the error section, insert it before the text input, and remove the original
*/
        $(this).parents('div[data-ui-meta*="' + property + '"]').addClass("usds-text-input-error-section");
    	errorDiv.clone().insertBefore($("#" + property + ""));
 		errorDiv.hide();
  })
}