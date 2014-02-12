var templates = require('tk-email-templates')("templates/", ".txt");
var util = require('util');

templates.get("welcome", {
    "package": "tk-email-templates"
  , "user": "Johannes"
  , "project": {
        "name": "example project"
      , "id": "1"
   }
}, function(email, error){
  if(error){
    util.error(error);
  } else {
    util.debug(email);
    //Send email.
  }
});
