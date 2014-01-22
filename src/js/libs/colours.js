// Generated by CoffeeScript 1.6.3
/*
@license colour.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
Released under the MIT-License
see: https://github.com/dcodeIO/colour.js for details
*/


(function() {
  (function(global) {
    var addProperty, applyTheme, browserStyles, colour, consoleStyles, cssStyles, definedGetters, installed, prototypeBlacklist, rainbowColours, sequencer, strip, stylize;
    addProperty = function(col, func) {
      colour[col] = function(str) {
        return func.apply(str);
      };
      try {
        String.prototype.__defineGetter__(col, func);
        return definedGetters[col] = func;
      } catch (_error) {}
    };

    stylize = function(str, style) {
      return consoleStyles[style][0] + str + consoleStyles[style][1];
    };

    applyTheme = function(theme) {
      return Object.keys(theme).forEach(function(prop) {
        if (prototypeBlacklist.indexOf(prop) >= 0) {
          return;
        }
        if (typeof theme[prop] === "string") {
          theme[prop] = theme[prop].split(" ");
        }
        return addProperty(prop, function() {
          var ret, t;
          ret = this;
          t = 0;
          while (t < theme[prop].length) {
            ret = colour[theme[prop][t]](ret);
            t++;
          }
          return ret;
        });
      });
    };

    sequencer = function(map) {
      return function() {
        var i;
        if (this === undefined) {
          return "";
        }
        i = 0;
        return String.prototype.split.apply(this, [""]).map(map).join("");
      };
    };

    strip = function() {
      return this.replace(/\x1B\[\d+m/g, "").replace(/<\/?(?:span|u|i|u|del)\b[^>]*>/g, "");
    };
    "use strict";
    colour = {};
    colour.mode = "console";
    colour.headless = typeof global["window"] === "undefined";
    colour.themes = {};
    consoleStyles = {
      bold: ["\u001b[1m", "\u001b[22m"],
      italic: ["\u001b[3m", "\u001b[23m"],
      underline: ["\u001b[4m", "\u001b[24m"],
      inverse: ["\u001b[7m", "\u001b[27m"],
      strikethrough: ["\u001b[9m", "\u001b[29m"],
      white: ["\u001b[37m", "\u001b[39m"],
      gray: ["\u001b[90m", "\u001b[39m"],
      grey: ["\u001b[90m", "\u001b[39m"],
      black: ["\u001b[30m", "\u001b[39m"],
      blue: ["\u001b[34m", "\u001b[39m"],
      cyan: ["\u001b[36m", "\u001b[39m"],
      green: ["\u001b[32m", "\u001b[39m"],
      magenta: ["\u001b[35m", "\u001b[39m"],
      red: ["\u001b[31m", "\u001b[39m"],
      yellow: ["\u001b[33m", "\u001b[39m"]
    };
    browserStyles = {
      bold: ["<b>", "</b>"],
      italic: ["<i>", "</i>"],
      underline: ["<u>", "</u>"],
      inverse: ["<span style=\"background-color:black;color:white;\">", "</span>"],
      strikethrough: ["<del>", "</del>"],
      white: ["<span style=\"color:white;\">", "</span>"],
      gray: ["<span style=\"color:gray;\">", "</span>"],
      grey: ["<span style=\"color:grey;\">", "</span>"],
      black: ["<span style=\"color:black;\">", "</span>"],
      blue: ["<span style=\"color:blue;\">", "</span>"],
      cyan: ["<span style=\"color:cyan;\">", "</span>"],
      green: ["<span style=\"color:green;\">", "</span>"],
      magenta: ["<span style=\"color:magenta;\">", "</span>"],
      red: ["<span style=\"color:red;\">", "</span>"],
      yellow: ["<span style=\"color:yellow;\">", "</span>"]
    };
    cssStyles = {
      bold: ["<span class=\"ansi-escape ansi-escape-bold\">", "</span>"],
      italic: ["<span class=\"ansi-escape ansi-escape-italic\">", "</span>"],
      underline: ["<span class=\"ansi-escape ansi-escape-underline\">", "</span>"],
      inverse: ["<span class=\"ansi-escape ansi-escape-inverse\">", "</span>"],
      strikethrough: ["<span class=\"ansi-escape ansi-escape-strikethrough\">", "</span>"],
      white: ["<span class=\"ansi-escape ansi-escape-white\">", "</span>"],
      gray: ["<span class=\"ansi-escape ansi-escape-gray\">", "</span>"],
      grey: ["<span class=\"ansi-escape ansi-escape-grey\">", "</span>"],
      black: ["<span class=\"ansi-escape ansi-escape-black\">", "</span>"],
      blue: ["<span class=\"ansi-escape ansi-escape-blue\">", "</span>"],
      cyan: ["<span class=\"ansi-escape ansi-escape-cyan\">", "</span>"],
      green: ["<span class=\"ansi-escape ansi-escape-green\">", "</span>"],
      magenta: ["<span class=\"ansi-escape ansi-escape-magenta\">", "</span>"],
      red: ["<span class=\"ansi-escape ansi-escape-red\">", "</span>"],
      yellow: ["<span class=\"ansi-escape ansi-escape-yellow\">", "</span>"]
    };
    definedGetters = {};
    installed = true;
    colour.uninstall = function() {
      if (installed) {
        Object.keys(definedGetters).forEach(function(color) {
          var e;
          try {
            return String.prototype.__defineGetter__(color, null);
          } catch (_error) {
            e = _error;
            return delete String.prototype[color];
          }
        });
        installed = false;
        return true;
      }
      return false;
    };
    colour.install = function() {
      if (!installed) {
        Object.keys(definedGetters).forEach(function(color) {
          return String.prototype.__defineGetter__(color, definedGetters[color]);
        });
        installed = true;
        return true;
      }
      return false;
    };
    rainbowColours = ["red", "yellow", "green", "blue", "magenta"];
    prototypeBlacklist = ["__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "charAt", "constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf", "charCodeAt", "indexOf", "lastIndexof", "length", "localeCompare", "match", "replace", "search", "slice", "split", "substring", "toLocaleLowerCase", "toLocaleUpperCase", "toLowerCase", "toUpperCase", "trim", "trimLeft", "trimRight"];
    colour.setTheme = function(theme) {
      var err;
      if (typeof theme === "string") {
        if (typeof colour.themes[theme] !== "undefined") {
          applyTheme(colour.themes[theme]);
          return colour.themes[theme];
        }
        try {
          colour.themes[theme] = require(theme);
          applyTheme(colour.themes[theme]);
          return colour.themes[theme];
        } catch (_error) {
          err = _error;
          return err;
        }
      } else {
        return applyTheme(theme);
      }
    };
    colour.addSequencer = function(name, map) {
      return addProperty(name, sequencer(map));
    };
    Object.keys(consoleStyles).forEach(function(style) {
      return addProperty(style, function() {
        return stylize(this, style);
      });
    });
    colour.addSequencer("rainbow", function(letter, i) {
      if (letter === " ") {
        return letter;
      } else {
        return stylize(letter, rainbowColours[i++ % rainbowColours.length]);
      }
    });
    colour.addSequencer("zebra", sequencer(function(letter, i) {
      if (i % 2 === 0) {
        return letter;
      } else {
        return letter.inverse;
      }
    }));
    addProperty("strip", strip);
    addProperty("stripColors", strip);
    if (typeof module !== "undefined" && module["exports"]) {
      return module.exports = colour;
    } else if (typeof define !== "undefined" && define.amd) {
      define("colour", function() {
        return colour;
      });
      return define("colors", function() {
        return colour;
      });
    } else {
      colour.mode = "browser";
      return global["colour"] = global["colors"] = colour;
    }
  })(this);

}).call(this);
