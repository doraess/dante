// Generated by CoffeeScript 1.7.1
(function() {
  var address, addressFailure, checkConfig, config, debug, disableWs, enableWs, fetchWeather, forecast, forecastFailure, icons, locationError, locationOptions, locationSuccess, sendPebbleData, sendSuccess, socket, stocks, stocksFailure, tidyString,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  config = {};

  debug = ['WS'];

  forecast = {};

  address = {};

  stocks = {};

  socket = null;

  icons = {
    'clear-day': {
      'icon': 0,
      'font': 'B'
    },
    'clear-night': {
      'icon': 1,
      'font': 'C'
    },
    'rain': {
      'icon': 2,
      'font': 'R'
    },
    'snow': {
      'icon': 3,
      'font': 'W'
    },
    'sleet': {
      'icon': 4,
      'font': 'X'
    },
    'wind': {
      'icon': 5,
      'font': 'F'
    },
    'fog': {
      'icon': 6,
      'font': 'M'
    },
    'cloudy': {
      'icon': 7,
      'font': 'N'
    },
    'partly-cloudy-day': {
      'icon': 8,
      'font': 'H'
    },
    'partly-cloudy-night': {
      'icon': 9,
      'font': 'I'
    },
    'no-weather': {
      'icon': 10,
      'font': ')'
    }
  };

  String.prototype.stripAccents = function() {
    var translate, translate_re;
    translate_re = /[àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ]/g;
    translate = "aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY";
    return this.replace(translate_re, function(match) {
      return translate.substr(translate_re.source.indexOf(match) - 1, 1);
    });
  };

  tidyString = function(str) {
    str = str.replace(/Calle de los /, "C. ");
    str = str.replace(/Calle de las /, "C. ");
    str = str.replace(/Calle de la /, "C. ");
    str = str.replace(/Calle del /, "C. ");
    str = str.replace(/Calle de /, "C. ");
    str = str.replace(/Calle /, "C. ");
    str = str.replace(/Avenida de los /, "Av. ");
    str = str.replace(/Avenida de las /, "Av. ");
    str = str.replace(/Avenida de la /, "Av. ");
    str = str.replace(/Avenida del /, "Av. ");
    str = str.replace(/Avenida de /, "Av. ");
    str = str.replace(/Avenida/, "Av. ");
    str = str.replace(/Paseo de los /, "P. ");
    str = str.replace(/Paseo de las /, "P. ");
    str = str.replace(/Paseo de la /, "P. ");
    str = str.replace(/Paseo del /, "P. ");
    str = str.replace(/Paseo de /, "P. ");
    str = str.replace(/Paseo /, "P. ");
    str = str.replace(/Plaza de los /, "Pz. ");
    str = str.replace(/Plaza de las /, "Pz. ");
    str = str.replace(/Plaza de la /, "Pz. ");
    str = str.replace(/Plaza del /, "Pz. ");
    str = str.replace(/Plaza de /, "Pz. ");
    return str = str.replace(/Plaza /, "Pz. ");
  };

  enableWs = function() {
    if (!socket) {
      socket = new WebSocket('ws://doraess.no-ip.org:3900/pebble');
      if (__indexOf.call(debug, 'WS') >= 0) {
        console.log(("----> Habilitando websocket..." + socket.readyState).yellow);
      }
      Pebble.sendAppMessage({
        websocket: true
      });
      socket.addEventListener("open", function() {
        if (__indexOf.call(debug, 'WS') >= 0) {
          console.log(("----> Websocket abierto..." + socket.readyState).green);
        }
        return socket.send(forecast);
      });
      socket.addEventListener("message", function(event) {
        console.log(event.data);
        return Pebble.showSimpleNotificationOnPebble("Conectado con Galáctica");
      });
      socket.addEventListener("close", function() {
        if (__indexOf.call(debug, 'WS') >= 0) {
          return console.log(("----> Websocket cerrado..." + socket.readyState).green);
        }
      });
      return socket.addEventListener("error", function(error) {
        if (__indexOf.call(debug, 'WS') >= 0) {
          return ("----> Error en Websocket..." + error).green;
        }
      });
    } else {
      if (__indexOf.call(debug, 'WS') >= 0) {
        return console.log(("----> Socket ya abierto..." + socket.readyState).yellow);
      }
    }
  };

  disableWs = function() {
    if (socket && socket.readyState === socket.OPEN) {
      if (__indexOf.call(debug, 'WS') >= 0) {
        console.log(("----> Deshabilitando websocket..." + socket.readyState).yellow);
      }
      socket.close();
      Pebble.sendAppMessage({
        websocket: false
      });
    } else {
      if (__indexOf.call(debug, 'WS') >= 0) {
        console.log(("----> Socket ya cerrado..." + socket.readyState).yellow);
      }
    }
    return socket = null;
  };

  checkConfig = function(config, callback) {
    var key, value;
    for (key in config) {
      value = config[key];
      if (value === void 0 || '') {
        Pebble.showSimpleNotificationOnPebble('Error de configuración', "Falta el valor de " + key + ", por favor abra la ventana de configuración e introduzca el valor correspondiente");
        break;
      }
    }
    return callback();
  };

  sendPebbleData = function(data) {
    var doraess, doraess_url, emoncms, emoncms_url;
    emoncms = new XMLHttpRequest();
    emoncms.timeout = 15000;
    emoncms_url = "http://emoncms.org/input/post.json?json=" + (JSON.stringify(data)) + "&apikey=" + config.emoncms_api_key;
    emoncms.open("GET", encodeURI(emoncms_url, false));
    emoncms.onreadystatechange = function() {
      if (emoncms.readyState === 4 && emoncms.status === 200) {
        if (__indexOf.call(debug, 'EMONCMS') >= 0) {
          return console.log(emoncms.responseText);
        }
      }
    };
    if (__indexOf.call(debug, 'EMONCMS') >= 0) {
      console.log("----> Enviando request a emoncms ... ".yellow + emoncms_url.green);
    }
    emoncms.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    emoncms.send();
    doraess = new XMLHttpRequest();
    doraess.timeout = 15000;
    doraess_url = "http://doraess.no-ip.org:3330/input/post.json?json=" + (JSON.stringify(data)) + "&apikey=77c3bf24f69e048cd6b2ee11321432cf";
    doraess.open("GET", encodeURI(doraess_url, false));
    doraess.onreadystatechange = function() {
      if (doraess.readyState === 4 && doraess.status === 200) {
        if (__indexOf.call(debug, 'EMONCMS') >= 0) {
          return console.log(doraess.responseText);
        }
      }
    };
    if (__indexOf.call(debug, 'EMONCMS') >= 0) {
      console.log("----> Enviando request a doraess ... ".yellow + doraess_url.green);
    }
    doraess.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    return doraess.send();
  };

  fetchWeather = function(latitude, longitude) {
    var data, location, location_url, stock, stock_url, weather, weather_url;
    checkConfig(config, function() {
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        return console.log("----> Usando configuración ... \n".green + render(config, void 0, 10));
      }
    });
    data = {};
    weather = new XMLHttpRequest();
    weather.timeout = 15000;
    weather_url = "https://api.forecast.io/forecast/" + config.forecast_api_key + "/" + latitude + "," + longitude + "?units=auto&exclude=hourly,alerts";
    weather.open("GET", weather_url, true);
    weather.onreadystatechange = function() {
      var response;
      if (weather.readyState === 4 && weather.status === 200) {
        response = JSON.parse(weather.responseText);
        if (response) {
          forecast = response;
          Pebble.sendAppMessage(data = {
            icon: icons[response.currently.icon].font,
            temperature: Math.round(response.currently.temperature) + "° " + Math.round(response.currently.humidity * 100) + "%",
            clouds: " " + Math.round(response.currently.cloudCover * 100) + "% ",
            rain_prob: Math.round(response.currently.precipProbability * 100) >= 1 ? " " + Math.round(response.currently.precipProbability * 100) + "% " : "",
            rain: Math.ceil(response.currently.precipIntensity * 2.54) >= 1 ? " " + Math.ceil(response.currently.precipIntensity * 2.54) + "cm" : "",
            moon: parseInt(response.daily.data[0].moonPhase * 100)
          }, sendSuccess, forecastFailure);
          if (__indexOf.call(debug, 'FORECAST') >= 0) {
            return console.log("----> Sincronizando datos: \n".green + render(data, void 0, 10));
          }
        } else {
          if (__indexOf.call(debug, 'FORECAST') >= 0) {
            return console.log("----> Error en la respuesta de forecast.io".red);
          }
        }
      }
    };
    weather.ontimeout = function() {
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        console.log("----> Timeout en la solicitud a forecast.io".red);
      }
      forecast.icon = ')';
      forecast.temperature = 'Error';
      forecast.clouds = '';
      forecast.rain_prob = '';
      forecast.rain = '';
      return Pebble.sendAppMessage(forecast, sendSuccess, forecastFailure);
    };
    if (__indexOf.call(debug, 'FORECAST') >= 0) {
      console.log("----> Enviando request a forecast.io ... ".yellow + weather_url.green);
    }
    weather.send();
    location = new XMLHttpRequest();
    location.timeout = 15000;
    location_url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&sensor=true";
    location.open("GET", location_url, true);
    location.onreadystatechange = function() {
      var component, response, _i, _len, _ref;
      if (location.readyState === 4 && location.status === 200) {
        response = JSON.parse(location.responseText);
        if (response) {
          _ref = response.results[0].address_components;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            component = _ref[_i];
            if (__indexOf.call(component.types, 'street_number') >= 0) {
              address.number = parseInt(component.long_name);
            }
            if (__indexOf.call(component.types, 'route') >= 0) {
              address.street = tidyString(component.long_name.toString('utf-8')) + [address.number ? ", " + address.number : void 0];
            }
            if (__indexOf.call(component.types, 'locality') >= 0) {
              address.city = component.long_name;
            }
          }
          Pebble.sendAppMessage(address, sendSuccess, addressFailure);
          if (__indexOf.call(debug, 'FORECAST') >= 0) {
            return console.log("----> Sincronizando datos: \n".green + render(address, void 0, 10));
          }
        } else {
          if (__indexOf.call(debug, 'FORECAST') >= 0) {
            return console.log("----> Error en la respuesta de google".red);
          }
        }
      }
    };
    location.ontimeout = function() {
      address.city = 'Error';
      address.street = 'Timeout en la solicitud';
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        console.log("----> Timeout en la solicitud a google".red);
      }
      return Pebble.sendAppMessage(address, sendSuccess, addressFailure);
    };
    if (__indexOf.call(debug, 'FORECAST') >= 0) {
      console.log("----> Enviando request a google ... ".yellow + location_url.green);
    }
    location.send();
    stock = new XMLHttpRequest();
    stock.timeout = 15000;
    stock_url = "http://es.finance.yahoo.com/q?s=" + config.stock_symbol;
    stock.open("GET", stock_url, true);
    stock.onreadystatechange = function() {
      var percent, updown, value;
      if (stock.readyState === 4 && stock.status === 200) {
        value = /yfs_l84_[a-z.]*\">([0-9,]*)/i.exec(this.response);
        percent = /yfs_p43_[a-z.]*\">\(([0-9,]*)/i.exec(this.response);
        updown = /class=\"([_upgdownr]*) time_rtq_content\"/i.exec(this.response);
        if (value && percent && updown) {
          stocks.stocks = config.stock_symbol + ': ' + value[1] + '€ (' + [updown[1] === 'up_g' ? '+' : '-'] + percent[1] + '%)';
        }
        if (__indexOf.call(debug, 'FORECAST') >= 0) {
          console.log("----> Sincronizando datos: \n".green + render(stocks, void 0, 10));
        }
        return Pebble.sendAppMessage(stocks, sendSuccess, stocksFailure);
      }
    };
    stock.ontimeout = function() {
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        return console.log("----> Timeout en la solicitud a yahoo finance".red);
      }
    };
    if (__indexOf.call(debug, 'FORECAST') >= 0) {
      console.log("----> Enviando request a yahoo finance ... ".yellow + stock_url.green);
    }
    return stock.send();
  };

  addressFailure = function(e) {
    if (__indexOf.call(debug, 'SYNC') >= 0) {
      console.log("----> Error en la sincronización: \n".red + render(e, void 0, 10));
    }
    return Pebble.sendAppMessage(address, sendSuccess, addressFailure);
  };

  stocksFailure = function(e) {
    if (__indexOf.call(debug, 'SYNC') >= 0) {
      console.log("----> Error en la sincronización: \n".red + render(e, void 0, 10));
    }
    return Pebble.sendAppMessage(stocks, sendSuccess, stocksFailure);
  };

  forecastFailure = function(e) {
    if (__indexOf.call(debug, 'SYNC') >= 0) {
      console.log("----> Error en la sincronización: \n".red + render(e, void 0, 10));
    }
    return Pebble.sendAppMessage(forecast, sendSuccess, forecastFailure);
  };

  sendSuccess = function() {
    if (__indexOf.call(debug, 'SYNC') >= 0) {
      return console.log("----> Datos sincronizados".green);
    }
  };

  locationSuccess = function(pos) {
    var coordinates;
    coordinates = pos.coords;
    return fetchWeather(coordinates.latitude, coordinates.longitude);
  };

  locationError = function(err) {
    console.warn("location error (" + err.code + "): " + err.message);
    return Pebble.sendAppMessage({
      city: "Loc Unavailable",
      temperature: "N/A"
    });
  };

  locationOptions = {
    timeout: 15000,
    maximumAge: 60000,
    enableHighAccuracy: true
  };

  Pebble.addEventListener("ready", function(e) {
    var json;
    console.log("----> La aplicación está lista: ".green + Pebble.getAccountToken().green);
    console.log("----> Plataforma: \n".green + render(navigator, void 0, 10));
    if (__indexOf.call(debug, 'INFO') >= 0) {
      console.log("----> Document: \n".green + render(document, void 0, 10));
    }
    if (config.ws_enabled) {
      enableWs();
    }
    json = window.localStorage.getItem('config');
    if (typeof json === 'string') {
      config = JSON.parse(json);
      checkConfig(config, function() {
        if (__indexOf.call(debug, 'INFO') >= 0) {
          return console.log("----> Cargando datos de configuracion...\n".green + render(config, void 0, 10));
        }
      });
    }
    if (__indexOf.call(debug, 'INFO') >= 0) {
      return console.log("---->Pebble Account Token: ".green + Pebble.getAccountToken().yellow);
    }
  });

  document.addEventListener("devicemotion", function(ev) {
    var accel;
    accel = ev.accelerationIncludingGravity;
    return console.log(accel.x, accel.y, accel.z);
  }, false);

  Pebble.addEventListener("appmessage", function(e) {
    if (__indexOf.call(debug, 'FORECAST') >= 0) {
      console.log(JSON.stringify(e.payload));
    }
    if (e.payload.command) {
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        console.log("----> Solicitud de actualización".green);
      }
      navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    if (e.payload.pebble_battery) {
      if (__indexOf.call(debug, 'FORECAST') >= 0) {
        console.log("----> Envío de datos del Pebble ...\n".green + render(e.payload, void 0, 10));
      }
      if (forecast.currently) {
        return sendPebbleData({
          pebble_battery: e.payload.pebble_battery,
          pebble_temperature: forecast.currently.temperature,
          pebble_humidity: parseInt(forecast.currently.humidity * 100)
        });
      } else {
        return sendPebbleData({
          pebble_battery: e.payload.pebble_battery
        });
      }
    }
  });

  Pebble.addEventListener("webviewclosed", function(e) {
    if (e.response) {
      config = JSON.parse(e.response);
      if (__indexOf.call(debug, 'INFO') >= 0) {
        console.log("----> Opciones: \n".green + render(config, void 0, 10));
      }
      if (__indexOf.call(debug, 'INFO') >= 0) {
        console.log("----> Webview cerrada.".yellow);
      }
      navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
      window.localStorage.setItem('config', e.response);
      if (config.ws_enabled === true) {
        return enableWs();
      } else {
        return disableWs();
      }
    }
  });

  Pebble.addEventListener("showConfiguration", function(e) {
    var uri;
    uri = "http://doraess.github.io/pebble/dante/?" + ("forecast_api_key=" + (encodeURIComponent(config.forecast_api_key))) + ("&emoncms_api_key=" + (encodeURIComponent(config.emoncms_api_key))) + ("&stock_symbol=" + (encodeURIComponent(config.stock_symbol))) + ("&ws_enabled=" + (encodeURIComponent(config.ws_enabled)));
    if (__indexOf.call(debug, 'INFO') >= 0) {
      console.log("----> Abriendo configuración ... ".yellow + uri.green);
    }
    return Pebble.openURL(uri);
  });

}).call(this);

/**---------- Library src/js/libs/colours.js -----------**/ 

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

/**---------- Library src/js/libs/prettyjson.js -----------**/ 

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

/**---------- Library src/js/libs/utils.js -----------**/ 

"use strict";

/**
 * Creates a string with the same length as `numSpaces` parameter
 **/
function indent(numSpaces) {
  return new Array(numSpaces+1).join(' ');
};

/**
 * Gets the string length of the longer index in a hash
 **/
getMaxIndexLength = function(input) {
  var maxWidth = 0;
  var key;

  Object.getOwnPropertyNames(input).forEach(function(key) {
    maxWidth = Math.max(maxWidth, key.length);
  });
  return maxWidth;
};
