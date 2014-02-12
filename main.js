/**
* tk-email-templates
* Simple template system written by Johannes Tegnér @ Talkative Labs 2014-02-10
* Originally intended for Emails, but could be used for any type of templates.
* Usage example:
* Template file (path/to/files/text.txt):
*  This is a template {0} testing testing {0} {1}
*  {1}
* Javascript to load system and template:
*   var templatesystem = require('tk-email-templates')(".txt", "path/to/files");
*   templatesystem.get("test", ["hej", 5], function(text){
*     console.log(text);
*   });
* Result:
*   This is a template hej testing testing hej 5
*   5
*/

//Load required node modules.
var utilities = require('util');
var fs = require('fs');

/**
* Simple Template System.
* @param {string} templatesPath Path to template files.
* @param {string} fileType Template files file type.
*/
module.exports = function(templatesPath, fileType) {
  //Check templatesPath and fileType so they are set. They are required for the system to work, so errors will be thrown if any of them are missing.
  if (templatesPath === undefined || templatesPath === null) {
    throw new Error("tk-email-template - Failed to initialize: Path to templates is undefined.");
  }
  if (fileType === undefined || fileType === null) {
    throw new Error("tk-email-template - Failed to initialize: Templates file type is undefined.");
  }
  if (fileType.indexOf('.') === -1) {
    utilities.debug("tk-email-template - The file type argument did not contain a '.' character.\n" +
                    "This notice is printed cause it is expecting a file type formatted as: .txt, .json or similar.\n" +
                    "Its possible that your template files do not use a file type, in that case ignore this info.\n" +
                    "Else this will produce an error when the system tries to fetch the templates.");
  }

  /**
  * Storage for loaded files.
  * Used to make the system only load a template once then reuse it.
  */
  var _loadedFiles = {};

  /**
  * Fetch template file.
  * @param {string} type Type of template (file name should match this + fileType).
  * @param {function} callback Callback to fire on done. Template on success else empty and error param set: function(template, error).
  */
  function getFile(type, callback) {
    if (_loadedFiles[type] !== undefined) {
      callback(_loadedFiles[type]);
    } else {
      var path = templatesPath + type + fileType;
      fs.readFile(path, function (error, data) {
        if (error) {
          callback("", utilities.format("Failed to load file. Does the template file exist? (%s)", path));
        } else {
          _loadedFiles[type] = data.toString();
          getFile(type, callback);
        }
      });
    }
  }

  /**
  * Include files from all {include|} in the file (if any).
  * Function uses async file system operations.
  * @param {string} data File as string that is to be included to.
  * @param {function} callback Callback function: function(data, error); where error is only set if an error occurs.
  */
  function setUpIncludes(data, callback) {
    if (data.indexOf("{include|") === -1) {
      callback(data); // No includes in the file.
    } else {
      var regex1 = new RegExp("\\{include\\|(.+)\\}", 'g');
      var match;
      var includes = [];
      while ((match = regex1.exec(data)) !== null) {
        includes.push(match[1]);
      }
      var errors = [];
      var done = 0;
      for (var i=includes.length;i-->0;) {
        var current = includes[i];
        getFile(current, function(file, error) {
          done++;
          if (error || !file) {
            errors.push(((error === undefined || error === null) && !file) ? "Could not fetch file (" + current + ")." : error);
          } else {
            var regex = new RegExp("\\{include\\|" + current + "}", 'g');
            data = data.replace(regex, file);
          }
          if (done === includes.length) {
            callback(data, (errors.length > 0 ? "Error/s in 'getIncludes' function:\n" + errors.join("\n") : undefined));
          }
        }.bind(current));
      }
    }
  }

  /**
  * Recursive replace function, will iterrate and replace (then return) the text passed using the "pre", "key" and "val" params for finding what to replace and with what.
  * @param {string} text Text to replace data in.
  * @param {string} pre Used to determine in the template how the key looks. This is the keys above in the object as a string.
  * @param {string} key The object key (property name).
  * @param {object|array|string|number|boolean} val Value. 
  */
  function replace(text, pre, key, val) {
    key = (pre === "" || pre === null || pre === undefined ? key : pre + "." + key); // If the pre param is not set or empty, the object is just the key.
    if(typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      var regex = new RegExp("\\{" + key + "\\}", 'g');
      text = text.replace(regex, val.toString());
    } else if(utilities.isArray(val)) {
      utilities.error("tk-email-template - Error while setting up template. Array used in argument, but array is not yet implemented."); // Show error but no exception.
    } else {
      for(var innerKey in val){
        if (val.hasOwnProperty(innerKey)) {
          text = replace(text, key, innerKey, val[innerKey]);
        }
      }
    }
    return text;
  }

  /**
  * Get a formatted template.
  * @param {string} type Type of template (file name should match this param).
  * @param {Array} args Argument list to replace template parameters ( {0}, {1} etc ). Number should match the param number in the template.
  * @param {function} cb Callback on done. Formatted template on success else empty string and error param set: function(formattedText, error).
  */
  this.get = function(type, args, cb) {
    getFile(type, function(data, error) {
      if (error) {
        cb("", error);
      } else {
        //Includes should be fixed before replacing params, this cause the include files params should also be changed if any.
        setUpIncludes(data, function(text, error) {
          if (error) {
            utilities.error(error);
          }
          //Param replace.
          for (var key in args) {
            if (args.hasOwnProperty(key)) {
              text = replace(text, "", key, args[key]); 
            }
          }
          //Done, fire callback with the formatted text.
          cb(text);
        });
      }
    });
  };
  return this;
};
