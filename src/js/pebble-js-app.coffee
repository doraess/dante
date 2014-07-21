config = {}

debug = [
  'WS'
  'FORECAST'
  'INFO'
]

#forecastio_key = "cadac7d880dc4faa96e18a35a96846ec"
#symbol = 'TEF.MC'
#emoncms_key = "96abfc7a471901b0c95af4f2f5e52ab0"

forecast = {}
address = {}
stocks = {}

socket = null

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
  
enableWs = () ->
  #console.log render socket, undefined, 10 
  if not socket
    socket = new WebSocket('ws://doraess.no-ip.org:3900/pebble')
    if 'WS' in debug then console.log "----> Habilitando websocket...#{socket.readyState}".yellow 
    
    socket.addEventListener "open", ->
      if 'WS' in debug then console.log "----> Websocket abierto...#{socket.readyState}".green
      socket.send "Pebble conectado"
      Pebble.showSimpleNotificationOnPebble "Websocket", "Conectado con Galáctica"
      config.ws_enabled = true
      Pebble.sendAppMessage
        websocket: true

    socket.addEventListener "message", (event) ->
      console.log JSON.stringify event.data

    socket.addEventListener "close", ->
      if 'WS' in debug then console.log "----> Websocket cerrado.".green
      config.ws_enabled = false

    socket.addEventListener "error", (error) ->
      if 'WS' in debug then "----> Error en Websocket...#{error}".green
      config.ws_enabled = false

  else
    if 'WS' in debug then console.log "----> Socket ya abierto...#{socket.readyState}".yellow
    
    
disableWs = () ->
  if socket and socket.readyState is socket.OPEN
    if 'WS' in debug then console.log "----> Deshabilitando websocket...#{socket.readyState}".yellow 
    socket.close()
    socket = null
    Pebble.sendAppMessage
      websocket: false
  else
    if 'WS' in debug then console.log "----> Socket ya cerrado.".yellow
  config.ws_enabled = false
  
checkConfig = (config, callback) ->
  for key, value of config
    if value is undefined or ""
      Pebble.showSimpleNotificationOnPebble "Error de configuración", "Falta el valor de #{key}, por favor abra la ventana de configuración \
      e introduzca el valor correspondiente"
      break
  callback()
  
sendPebbleData = (data) ->
  emoncms = new XMLHttpRequest()
  emoncms.timeout = 15000
  emoncms_url = "http://emoncms.org/input/post.json?json=#{JSON.stringify data}&apikey=#{config.emoncms_api_key}"
  emoncms.open "GET", encodeURI emoncms_url, false
  emoncms.onreadystatechange = ->
    if emoncms.readyState is 4 and emoncms.status is 200
      if 'EMONCMS' in debug then console.log emoncms.responseText
  if 'EMONCMS' in debug then console.log "----> Enviando request a emoncms ... ".yellow + emoncms_url.green
  emoncms.setRequestHeader 'Content-type', 'application/x-www-form-urlencoded'
  emoncms.send()
  
  doraess = new XMLHttpRequest()
  doraess.timeout = 15000
  doraess_url = "http://doraess.no-ip.org:3330/input/post.json?json=#{JSON.stringify data}&apikey=77c3bf24f69e048cd6b2ee11321432cf"
  doraess.open "GET", encodeURI doraess_url, false
  doraess.onreadystatechange = ->
    if doraess.readyState is 4 and doraess.status is 200
      if 'EMONCMS' in debug then console.log doraess.responseText
  if 'EMONCMS' in debug then console.log "----> Enviando request a doraess ... ".yellow + doraess_url.green
  doraess.setRequestHeader 'Content-type', 'application/x-www-form-urlencoded'
  doraess.send()

fetchWeather = (latitude, longitude) ->
  checkConfig config, -> 
    if 'FORECAST' in debug then console.log "----> Usando configuración ... \n".green + render config, undefined, 10 
  data = {}
  weather = new XMLHttpRequest()
  weather.timeout = 15000
  weather_url = "https://api.forecast.io/forecast/#{config.forecast_api_key}/#{latitude},#{longitude}?units=auto&exclude=hourly,alerts"
  weather.open "GET", weather_url, true
  weather.onreadystatechange = ->
    if weather.readyState is 4 and weather.status is 200
      response = JSON.parse weather.responseText
      if response
        forecast = response
        Pebble.sendAppMessage data =
          icon : icons[response.currently.icon].font
          temperature : Math.round(response.currently.temperature) + "° " + Math.round(response.currently.humidity*100) + "%"
          clouds : " " + Math.round(response.currently.cloudCover*100) + "% "
          rain_prob : if Math.round(response.currently.precipProbability*100) >= 1 then " " + Math.round(response.currently.precipProbability*100) + "% " else ""
          rain : if Math.ceil(response.currently.precipIntensity*2.54) >= 1 then " " + Math.ceil(response.currently.precipIntensity*2.54) + "cm" else ""
          moon : parseInt response.daily.data[0].moonPhase * 100 
        , sendSuccess, forecastFailure
        if 'FORECAST' in debug then console.log "----> Sincronizando datos: \n".green + render data, undefined, 10
      else
        if 'FORECAST' in debug then console.log "----> Error en la respuesta de forecast.io".red
  weather.ontimeout = ->
    if 'FORECAST' in debug then console.log "----> Timeout en la solicitud a forecast.io".red
    forecast.icon = ')'
    forecast.temperature = 'Error'
    forecast.clouds = ''
    forecast.rain_prob = ''
    forecast.rain = ''
    Pebble.sendAppMessage forecast, sendSuccess, forecastFailure
    fetchWeather latitude, longitude   
  if 'FORECAST' in debug then console.log "----> Enviando request a forecast.io ... ".yellow + weather_url.green
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
        Pebble.sendAppMessage address, sendSuccess, addressFailure
        if 'FORECAST' in debug then console.log "----> Sincronizando datos: \n".green + render address, undefined, 10
      else
        if 'FORECAST' in debug then console.log "----> Error en la respuesta de google".red
  location.ontimeout = ->
    address.city = 'Error'
    address.street = 'Timeout en la solicitud'
    if 'FORECAST' in debug then console.log "----> Timeout en la solicitud a google".red
    Pebble.sendAppMessage address, sendSuccess, addressFailure  
  if 'FORECAST' in debug then console.log "----> Enviando request a google ... ".yellow + location_url.green
  location.send()
  
  stock = new XMLHttpRequest()
  stock.timeout = 15000
  stock_url = "http://es.finance.yahoo.com/q?s=#{config.stock_symbol}"
  stock.open "GET", stock_url, true
  stock.onreadystatechange = ->
    if stock.readyState is 4 and stock.status is 200
      value = /yfs_l84_[a-z.]*\">([0-9,]*)/i.exec this.response
      percent = /yfs_p43_[a-z.]*\">\(([0-9,]*)/i.exec this.response
      updown = /class=\"([_upgdownr]*) time_rtq_content\"/i.exec this.response
      if value and percent and updown
        stocks.stocks = config.stock_symbol + ': ' + value[1] + '€ (' + [ if updown[1] is 'up_g' then '+' else '-'] + percent[1] + '%)'
      if 'FORECAST' in debug then console.log "----> Sincronizando datos: \n".green + render stocks, undefined, 10
      Pebble.sendAppMessage stocks, sendSuccess, stocksFailure
  stock.ontimeout = ->
    if 'FORECAST' in debug then console.log "----> Timeout en la solicitud a yahoo finance".red
  if 'FORECAST' in debug then console.log "----> Enviando request a yahoo finance ... ".yellow + stock_url.green
  stock.send()
  
addressFailure = (e) ->
  if 'SYNC' in debug then console.log "----> Error en la sincronización: \n".red + render e, undefined, 10
  Pebble.sendAppMessage address, sendSuccess, addressFailure
  
stocksFailure = (e) ->
  if 'SYNC' in debug then console.log "----> Error en la sincronización: \n".red + render e, undefined, 10
  Pebble.sendAppMessage stocks, sendSuccess, stocksFailure
  
forecastFailure = (e) ->
  if 'SYNC' in debug then console.log "----> Error en la sincronización: \n".red + render e, undefined, 10
  Pebble.sendAppMessage forecast, sendSuccess, forecastFailure
  
sendSuccess = ->
  if 'SYNC' in debug then console.log "----> Datos sincronizados".green
  
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
  console.log "----> La aplicación está lista: ".green + Pebble.getAccountToken().green
  console.log "----> Plataforma: \n".green +  render navigator, undefined, 10
  if 'INFO' in debug then console.log "----> Document: \n".green +  render document, undefined, 10
  
  if config.ws_enabled
    enableWs() 
  json = window.localStorage.getItem 'config'
  if typeof json is 'string'
    config = JSON.parse json
    checkConfig config, -> 
      if 'INFO' in debug then console.log "----> Cargando datos de configuracion...\n".green + render config, undefined, 10
  
  if 'INFO' in debug then console.log "---->Pebble Account Token: ".green + Pebble.getAccountToken().yellow
    
  #locationWatcher = window.navigator.geolocation.watchPosition locationSuccess, locationError, locationOptions
  
  #navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions

document.addEventListener "devicemotion", (ev) ->
    accel = ev.accelerationIncludingGravity 
    console.log accel.x, accel.y, accel.z
   , false


Pebble.addEventListener "appmessage", (e) ->
  if 'FORECAST' in debug then console.log JSON.stringify e.payload
  if e.payload.command
    if 'FORECAST' in debug then console.log "----> Solicitud de actualización".green
    navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions
  if e.payload.pebble_battery
    if 'FORECAST' in debug then console.log "----> Envío de datos del Pebble ...\n".green + render e.payload, undefined, 10
    if forecast.currently
      sendPebbleData 
        pebble_battery : e.payload.pebble_battery
        pebble_temperature: forecast.currently.temperature
        pebble_humidity: parseInt forecast.currently.humidity*100
    else
      sendPebbleData 
        pebble_battery : e.payload.pebble_battery
    #navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions
  if e.payload.websocket
    enableWs()
  else
    disableWs()


Pebble.addEventListener "webviewclosed", (e) ->
  if e.response
    config = JSON.parse e.response
    if 'INFO' in debug then console.log "----> Opciones: \n".green + render config, undefined, 10
    if 'INFO' in debug then console.log "----> Webview cerrada.".yellow
    navigator.geolocation.getCurrentPosition locationSuccess, locationError, locationOptions
    window.localStorage.setItem 'config', e.response
    if config.ws_enabled is true
      enableWs()
    else 
      disableWs()
    
  
Pebble.addEventListener "showConfiguration", (e) ->
  uri = "http://doraess.github.io/pebble/dante/?" +
    "forecast_api_key=#{encodeURIComponent config.forecast_api_key}" +
    "&emoncms_api_key=#{encodeURIComponent config.emoncms_api_key}" +
    "&stock_symbol=#{encodeURIComponent config.stock_symbol}" +
    "&ws_enabled=#{encodeURIComponent config.ws_enabled}" +
    "&interval=#{encodeURIComponent 30}"
  #uri = "http://x.setpebble.com/api/8KKT/17C0D721-796A-46EB-BF22-427FA4BCCDCF"
  if 'INFO' in debug then console.log "----> Abriendo configuración ... ".yellow + uri.green
  Pebble.openURL uri