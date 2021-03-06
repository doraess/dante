function render(data, options, indentation) {
  "use strict";

  // Default value for the indentation param
  indentation = indentation || 0;

  // Default values for the options
  options = options || {};
  options.emptyArrayMsg = options.emptyArrayMsg || '(empty array)';
  options.keysColor = options.keysColor || "cyan";
  options.dashColor = options.dashColor || "green";
  options.defaultIndentation = options.defaultIndentation || 2;

  options.stringColor = options.stringColor || "yellow";

  // Initialize the output (it's an array of lines)
  var output = [];

  // Helper function to detect if an object can be serializable directly
  var isSerializable = function(input) {
    if (typeof input === 'string' || typeof input === 'boolean' ||
        typeof input === 'number' || input === null) {
      return true;
    }
    return false;
  };

  var addColorToData = function(input) {
    if (typeof input === 'string') {
      // Print strings in regular terminal color
      return options.stringColor ? input[options.stringColor] : input;
    }

    if (input === true) {
      return (input+'').green;
    }
    if (input === false) {
      return (input+'').red;
    }
    if (input === null) {
      return (input+'').grey;
    }
    if (typeof input === 'number') {
      return (input+'').blue;
    }
    return (input+'');
  };

  // Render a string exactly equal
  if (isSerializable(data)) {
    output.push(indent(indentation) + addColorToData(data));
  }
  else if (Array.isArray(data)) {
    // If the array is empty, render the `emptyArrayMsg`
    if (data.length === 0) {
      output.push(indent(indentation) + options.emptyArrayMsg);
    } else {
      data.forEach(function(element) {
        // Prepend the dash at the begining of each array's element line
        var line = indent(indentation) + ('- ')[options.dashColor];

        // If the element of the array is a string, render it in the same line
        if (typeof element === 'string') {
          line += render(element, options);
          output.push(line);

        // If the element of the array is an array or object, render it in next line
        } else {
          output.push(line);
          output.push(
            render(element, options, indentation + options.defaultIndentation)
          );
        }
      });
    }
  }
  else if (typeof data === 'object') {
    // Get the size of the longest index to render all the values on the same column
    var maxIndexLength = getMaxIndexLength(data);
    var key;
    var isError = data instanceof Error;

    Object.getOwnPropertyNames(data).forEach(function(i) {
      // Prepend the index at the beginning of the line
      key = indent(indentation) + (i + ': ')[options.keysColor];

      // Skip `undefined`, it's not a valid JSON value.
      if (data[i] === undefined) {
        return;
      }

      // If the value is serializable, render it in the same line
      if (isSerializable(data[i]) && (!isError || i !== 'stack')) {
        key += render(data[i], options, maxIndexLength - i.length);
        output.push(key);

        // If the index is an array or object, render it in next line
      } else {
        output.push(key);
        output.push(
          render(
            isError && i === 'stack'
              ? data[i].split('\n')
              : data[i],
            options, indentation + options.defaultIndentation
          )
        );
      }
    });
  }
  // Return all the lines as a string
  return output.join('\n');
};

function renderString(data, options, indentation) {
  "use strict";

  var output = '';
  var parsedData;
  // If the input is not a string or if it's empty, just return an empty string
  if (typeof data !== 'string' || data === '') {
    return '';
  }

  // Remove non-JSON characters from the beginning string
  if (data[0] !== '{' && data[0] !== '[') {
    var beginingOfJson;
    if (data.indexOf('{') === -1) {
      beginingOfJson = data.indexOf('[');
    } else if (data.indexOf('[') === -1) {
      beginingOfJson = data.indexOf('{');
    } else {
      beginingOfJson = data.indexOf('{') < data.indexOf('[') ? data.indexOf('{') : data.indexOf('[');
    }
    output += data.substr(0, beginingOfJson) + "\n";
    data = data.substr(beginingOfJson);
  }

  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    // Return an error in case of an invalid JSON
    return 'Error:'.red + ' Not valid JSON!';
  }

  // Call the real render() method
  output += render(parsedData, options);
  return output;
};
