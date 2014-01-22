config = {}

forecastio_key = "cadac7d880dc4faa96e18a35a96846ec"

symbol = 'TEF.MC'

icons =
  'clear-day' :  
    'icon': 0
    'font': 'B'
  'clear-night' :      
    'icon': 1
    'font': 'C'
  'rain' :        
    'icon': 2
    'font': 'R'
  'snow' :        
    'icon': 3
    'font': 'W'
  'sleet' :        
    'icon': 4
    'font': 'X'
  'wind' :        
    'icon': 5
    'font': 'F'
  'fog' :        
    'icon': 6
    'font': 'M'
  'cloudy' :        
    'icon': 7
    'font': 'N'
  'partly-cloudy-day' :        
    'icon': 8
    'font': 'H'
  'partly-cloudy-night' :        
    'icon': 9
    'font': 'I'
  'no-weather' :       
    'icon': 10
    'font': ')'
    
String::stripAccents = ->
  translate_re = /[àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ]/g
  translate = "aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY"
  @replace translate_re, (match) ->
    translate.substr translate_re.source.indexOf(match) - 1, 1
    
tidyString = (str) ->
  str = str.replace /Calle de los /, "C. "
  str = str.replace /Calle de las /, "C. "
  str = str.replace /Calle de la /, "C. "
  str = str.replace /Calle del /, "C. "
  str = str.replace /Calle de /, "C. "
  str = str.replace /Calle /, "C. "
  str = str.replace /Avenida de los /, "Av. "
  str = str.replace /Avenida de las /, "Av. "
  str = str.replace /Avenida de la /, "Av. "
  str = str.replace /Avenida del /, "Av. "
  str = str.replace /Avenida de /, "Av. "
  str = str.replace /Avenida/, "Av. "
  str = str.replace /Paseo de los /, "P. "
  str = str.replace /Paseo de las /, "P. "
  str = str.replace /Paseo de la /, "P. "
  str = str.replace /Paseo del /, "P. "
  str = str.replace /Paseo de /, "P. "
  str = str.replace /Paseo /, "P. "
  str = str.replace /Plaza de los /, "Pz. "
  str = str.replace /Plaza de las /, "Pz. "
  str = str.replace /Plaza de la /, "Pz. "
  str = str.replace /Plaza del /, "Pz. "
  str = str.replace /Plaza de /, "Pz. "
  str = str.replace /Plaza /, "Pz. "

fetchWeather = (latitude, longitude) ->
  weather = new XMLHttpRequest()
  weather.timeout = 15000
  weather_url = "https://api.forecast.io/forecast/#{forecastio_key}/#{latitude},#{longitude}?units=auto&exclude=hourly,daily,alerts"
  weather.open "GET", weather_url, true
  forecast = {}
  address = {}
  stocks = {}
  weather.onreadystatechange = ->
    if weather.readyState is 4 and weather.status is 200
      response = JSON.parse weather.responseText
      if response
        #console.log JSON.stringify(response.currently, undefined, '\t')
        forecast.icon = icons[response.currently.icon].font
        forecast.temperature = Math.round(response.currently.temperature) + "° " + Math.round(response.currently.humidity*100) + "%"
        #forecast.temperature = "39° 100%"
        forecast.clouds = " " + Math.round(response.currently.cloudCover*100) + "% "
        forecast.rain_prob = if Math.round(response.currently.precipProbability*100) >= 1 then " " + Math.round(response.currently.precipProbability*100) + "% " else ""
        forecast.rain = if Math.ceil(response.currently.precipIntensity*2.54) >= 1 then " " + Math.ceil(response.currently.precipIntensity*2.54) + "cm" else ""
        #console.log "----> Enviando datos..."
        Pebble.sendAppMessage forecast
        #console.log "----> Datos enviados"
        console.log "----> Sincronizando datos: \n".green + render forecast, undefined, 10
      else
        console.log "----> Error en la respuesta de forecast.io".red
  weather.ontimeout = ->
    console.log "----> Timeout en la solicitud a forecast.io".red
    forecast.icon = ')'
    forecast.temperature = 'Error'
    forecast.clouds = ''
    forecast.rain_prob = ''
    forecast.rain = ''
    Pebble.sendAppMessage forecast
    #Pebble.showSimpleNotificationOnPebble "Error en HTML request", "La solicitud HTML a forecast.io sobrepasó el tiempo estipulado"    
  console.log "----> Enviando request a forecast.io ... ".yellow + weather_url.green
  weather.send()
  
  location = new XMLHttpRequest()
  location.timeout = 15000
  location_url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=#{latitude},#{longitude}&sensor=true"
  location.open "GET", location_url, true
  location.onreadystatechange = ->
    if location.readyState is 4 and location.status is 200
      response = JSON.parse location.responseText
      if response
        for component in response.results[0].address_components
          if 'street_number' in component.types
            address.number = parseInt component.long_name
          if 'route' in component.types
            #address.street = tidyString(component.long_name.toString('utf-8').stripAccents()) + [(", " + address.number) if address.number] 
            address.street = tidyString(component.long_name.toString('utf-8')) + [(", " + address.number) if address.number]                 
          if 'locality' in component.types
            #address.city = component.long_name.stripAccents()
            address.city = component.long_name
        Pebble.sendAppMessage address
        console.log "----> Sincronizando datos: \n".green + render address, undefined, 10
      else
        console.log "----> Error en la respuesta de google".red
  location.ontimeout = ->
    address.city = 'Error'
    address.street = 'Timeout en la solicitud'
    console.log "----> Timeout en la solicitud a google".red
    Pebble.sendAppMessage address   
  console.log "----> Enviando request a google ... ".yellow + location_url.green
  location.send()
  
  stock = new XMLHttpRequest()
  stock.timeout = 15000
  stock_url = "http://es.finance.yahoo.com/q?s=#{symbol}"
  stock.open "GET", stock_url, true
  stock.onreadystatechange = ->
    if stock.readyState is 4 and stock.status is 200
      value = /yfs_l84_[a-z.]*\">([0-9,]*)/i.exec this.response
      percent = /yfs_p43_[a-z.]*\">\(([0-9,]*)/i.exec this.response
      updown = /class=\"([_upgdownr]*) time_rtq_content\"/i.exec this.response
      if value and percent and updown
        stocks.stocks = symbol + ': ' + value[1] + '€ (' + [ if updown[1] is 'up_g' then '+' else '-'] + percent[1] + '%)'
      console.log "----> Sincronizando datos: \n".green + render stocks, undefined, 10
      Pebble.sendAppMessage stocks
  stock.ontimeout = ->
    console.log "----> Timeout en la solicitud a yahoo finance".red
  console.log "----> Enviando request a yahoo finance ... ".yellow + stock_url.green
  stock.send()


locationSuccess = (pos) ->
  coordinates = pos.coords
  fetchWeather coordinates.latitude, coordinates.longitude

locationError = (err) ->
  console.warn "location error (" + err.code + "): " + err.message
  Pebble.sendAppMessage
    city: "Loc Unavailable"
    temperature: "N/A"

locationOptions =
  timeout: 15000
  maximumAge: 60000
  enableHighAccuracy: true

Pebble.addEventListener "ready", (e) ->
  console.log "----> La aplicación está lista".green
  console.log "----> Plataforma: \n".green +  render navigator, undefined, 10
  json = window.localStorage.getItem 'config'
  if typeof json is 'string'
    config = JSON.parse json
    console.log "----> Cargando datos de configuracion...".green + render config, undefined, 10
    
  #locationWatcher = window.navigator.geolocation.watchPosition locationSuccess, locationError, locationOptions
  
  #navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions

Pebble.addEventListener "appmessage", (e) ->
  request = e.payload["0"]
  if request
    console.log "----> Solicitud de actualización".green
    navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions

Pebble.addEventListener "webviewclosed", (e) ->
  if e.response
    config = JSON.parse e.response
    console.log "----> Opciones: \n".green + render config, undefined, 10
    console.log "----> Webview closed".green
		window.localStorage.setItem 'config', e.response
  
Pebble.addEventListener "showConfiguration", (e) ->
  console.log "----> Showing configuration".green
  uri = "http://192.168.1.42/config.html"
  Pebble.openURL uri