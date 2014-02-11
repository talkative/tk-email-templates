/**
* tk-email-template
* Email template system written by Johannes Tegnér @ Talkative Labs 2014-02-10
* Usage example:
* Template file (path/to/files/text.txt):
*  This is a email {0} testing testing {0} {1}
*  {1}
* Javascript to load system and template:
*   var emailtemplatesystem = require('../path/system.js')(".txt", "path/to/files");
*   emailtemplatesystem.get("test", ["hej", 5], function(email){
*     console.log(email);
*   });
* Result:
*   This is a email hej testing testing hej 5
*   5
*/

//Load required node modules.
var utilities = require('util');
var fs = require('fs');

/**
* Email template system.
* @param {string} templatesPath Path to template files.
* @param {string} fileType Template files file type.
*/
module.exports = function(templatesPath, fileType) {
  if (templatesPath === undefined || templatesPath === null) {
    utilities.error("tk-email-template - Failed to initialize: Path to templates is undefined.");
    return null;
  }
  if (fileType === undefined || fileType === null) {
    utilities.error("tk-email-template - Failed to initialize: Templates file type is undefined.");
    return null;
  }
  if (fileType.indexOf('.') === -1) {
    utilities.debug("tk-email-template - The file type argument did not contain a '.' character.\n" +
                    "This notice is printed cause it is expecting a file type formatted as: .txt, .json or similar.\n" +
                    "Its possible that your template files do not use a file type, in that case ignore this info.\n" +
                    "Else this will produce an error when the system tries to fetch the templates.");
  }

  /**
  * File type of the template files.
  */
  var _templateFileType = fileType;
  /**
  * Path to template files.
  */
  var _templateFilePath =  templatesPath;

  /**
  * Storage for loaded files.
  * Used to make the system only load a template once then reuse it.
  */
  var _loadedFiles = {};

  /**
  * Fetch template file.
  * @param {string} type Type of template (file name should match this + fileType).
  * @param {cb} callback Callback to fire on done. email template on success else empty and error param set: function(email, error).
  */
  function getFile(type, cb) {
    if (_loadedFiles[type] !== undefined) {
      cb(_loadedFiles[type]);
    } else {
      var path = _templateFilePath + type + _templateFileType;
      fs.readFile(path, function (error, data) {
        if (error) {
          cb("", utilities.format("Failed to load file. Does the template file exist? (%s)", path));
        } else {
          _loadedFiles[type] = data.toString();
          getFile(type, cb);
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
  function getIncludes(data, callback) {
    if (data.indexOf("{include|") === -1) {
      callback(data);
    } else {
      var regex1 = new RegExp("\\{include\\|(.+)\\}", 'g');
      var match = null;
      var includes = [];
      while (match = regex1.exec(data)) {
        includes.push(match[1]);
      }
      var length = includes.length, errors = [];
      for (var i=includes.length;i-->0;) {
        var curr = includes[i];
        getFile(curr, function(file, error) {
          if (error) {
            errors.push(error);
          } else if(file === null) {
            errors.push("File was null.");
          } else {
            var regex = new RegExp("\\{include\\|" + curr + "}", 'g');
            data = data.replace(regex, file);
          }
          length--;
          if (length === 0) {
            if (errors.length > 0) {
              var errorStr = "Error/s in 'getIncludes':\n";
              for (var k=0;k<errors.length;k++) {
                errorStr += errors[k] + "\n";
              }
              callback(data, errorStr)
            } else {
              callback(data);
            }
          }
        });
      }
    }
  }

  /**
  * Get a formatted email template.
  * @param {string} type Type of template (file name should match this param).
  * @param {Array} args Argument list to replace template parameters ( {0}, {1} etc ). Number should match the param number in the template.
  * @param {function} cb Callback on done. Formatted email template on success else empty string and error param set: function(email, error).
  */
  this.get = function(type, args, cb) {
    getFile(type, function(data, error) {
      if (error) {
        cb("", error);
      } else {
        //Includes should be fixed before replacing params, this cause the include files params should also be changed if any.
        getIncludes(data, function(text, error){
          if (error) {
            utilities.error(error);
          }
          //Param replace.
          for (var key in args) {
            if (!args.hasOwnProperty(key)) {
              continue;
            }
            var regex = new RegExp("\\{" + key + "\\}", 'g');
            text = text.replace(regex, args[key]);
          }
          //Done, fire callback with the formatted text.
          cb(text);
        });
      }
    });
  };
  return this;
};
