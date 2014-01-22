#include <pebble.h>
#include "util.h"
//#include "ppspinner.h"
//#include "pptoaster.h"
//#include "pptoaster.h"
	
//#define CUSTOM_FONTS

#ifdef CUSTOM_FONTS

#define TIME_FRAME           (GRect){ .origin = { 0, 0 }, .size = {144, 162} }
#define DATE_FRAME           (GRect){ .origin = { 0, 50 }, .size = {144, 25} }
#define INDICATORS_FRAME     (GRect){ .origin = { 0, 68 }, .size = {144, 30} }
#define BATTERY_FRAME        (GRect){ .origin = { 50, 0 }, .size = {30, 30} }
#define BATTERY_LEVEL_FRAME  (GRect){ .origin = { 75, 7 }, .size = {30, 30} }
#define UPDATED_FRAME        (GRect){ .origin = { 80, 7 }, .size = {60, 30} }
#define WEATHER_FRAME        (GRect){ .origin = { 0, 90 }, .size = {144, 78} }
#define TEMP_FRAME					 (GRect){ .origin = { 35, -2 }, .size = {82, 30} }
#define ICON_FRAME					 (GRect){ .origin = { 0, 0 }, .size = {40, 40} }
#define RAIN_FRAME					 (GRect){ .origin = { 0, 28 }, .size = {144, 40} }
#define CITY_FRAME					 (GRect){ .origin = { 0, 45 }, .size = {144, 20} }
#define STREET_FRAME				 (GRect){ .origin = { 0, 63 }, .size = {144, 20} }

#else

#define TIME_FRAME           (GRect){ .origin = { 0, 0 }, .size = {144, 162} }
#define DATE_FRAME           (GRect){ .origin = { 0, 45 }, .size = {144, 25} }
#define INDICATORS_FRAME     (GRect){ .origin = { 0, 68 }, .size = {144, 30} }
#define BATTERY_FRAME        (GRect){ .origin = { 50, 0 }, .size = {30, 30} }
#define BATTERY_LEVEL_FRAME  (GRect){ .origin = { 75, 5 }, .size = {30, 30} }
#define UPDATED_FRAME        (GRect){ .origin = { 80, 5 }, .size = {60, 30} }
#define WEATHER_FRAME        (GRect){ .origin = { 0, 90 }, .size = {144, 78} }
#define TEMP_FRAME					 (GRect){ .origin = { 35, -2 }, .size = {82, 30} }
#define ICON_FRAME					 (GRect){ .origin = { 0, 0 }, .size = {40, 40} }
#define RAIN_FRAME					 (GRect){ .origin = { 0, 26 }, .size = {144, 40} }
#define CITY_FRAME					 (GRect){ .origin = { 0, 42 }, .size = {144, 20} }
#define STREET_FRAME				 (GRect){ .origin = { 0, 60 }, .size = {144, 20} }

#endif

#define  ICON_KEY 0x1     // TUPLE_INT
#define  WEATHER_KEY 0x2  // TUPLE_CSTRING
#define  CITY_KEY 0x3   // TUPLE_CSTRING
#define  STREET_KEY 0x4   // TUPLE_CSTRING
#define  CLOUDS_KEY 0x5   // TUPLE_CSTRING
#define  RAIN_PROB_KEY 0x6  // TUPLE_CSTRING
#define  RAIN_KEY 0x7   // TUPLE_CSTRING
#define  STOCKS_KEY 0x8   // TUPLE_CSTRING


#define  CMD_KEY 0x0  // TUPLE_INT


static Window * window;			/* main window */
TextLayer *date_layer;   		/* layer for the date */
TextLayer *time_layer;   		/* layer for the time */
TextLayer *updated_layer;   	/* layer for last update */
TextLayer *indicators_layer;   	/* layer for last update */
TextLayer *battery_level_layer;	/* layer for battery level */
//BitmapLayer *icon_layer;
TextLayer *icon_text_layer;
TextLayer *city_layer;
TextLayer *street_layer;
TextLayer *temp_layer;
TextLayer *rain_layer;
BitmapLayer *weather_layer;

static GBitmap *background = NULL;

struct Pebble {
	BatteryChargeState battery;
	bool bluetooth;
	const char *hour;
  const char *minute;
  int current_layer;
} Pebble;

static AppSync syncData;
static uint8_t syncBuffer[512];

static AppTimer *timer;
static AppTimer *toggle_layer;

GFont *time_font, *date_font, *street_font, *temperature_font, *meteocons_font, *city_font, *icomoon_font;

//PPSpinnerLayer * spinner;

char *days[]={
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sab"
};

char *months[]={
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
};

static void timer_callback(void *context) {
  layer_mark_dirty(text_layer_get_layer(indicators_layer));
  const uint32_t timeout_ms = 250;
  timer = app_timer_register(timeout_ms, timer_callback, NULL);
}

static void toggle_layer_callback(void *context) {
  if (Pebble.current_layer == 0){
    Pebble.current_layer = 1;
  } else {
    Pebble.current_layer = 0;
  }
  layer_mark_dirty(text_layer_get_layer(rain_layer));
  const uint32_t timeout_ms = 5000;
  toggle_layer = app_timer_register(timeout_ms, toggle_layer_callback, NULL);
}

static void send_cmd(int command) {
  
  Tuplet value = TupletInteger(command, 1);
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }
  dict_write_tuplet(iter, &value);
  dict_write_end(iter);

  app_message_outbox_send();
}

void indicators_layer_update_callback(Layer *me, GContext* ctx) {
  app_timer_cancel(timer);
  text_layer_set_text(battery_level_layer, itoa(Pebble.battery.charge_percent));
  if(!Pebble.battery.is_charging) {
    graphics_context_set_fill_color(ctx, GColorWhite);
	  graphics_context_set_stroke_color(ctx, GColorWhite);
	  graphics_draw_rect(ctx, (GRect){ .origin = { 50, 10 }, .size = {22, 9} });
	  graphics_fill_rect(ctx, (GRect){ .origin = { 52, 12 }, .size = {18*Pebble.battery.charge_percent/100, 5} }, 0, GCornerNone);
  }
  
  if(Pebble.battery.is_charging) {
    static unsigned int level = 0;
    const uint32_t timeout_ms = 250;
    timer = app_timer_register(timeout_ms, timer_callback, NULL);
    graphics_context_set_fill_color(ctx, GColorWhite);
	  graphics_context_set_stroke_color(ctx, GColorWhite);
	  graphics_draw_rect(ctx, (GRect){ .origin = { 50, 10 }, .size = {22, 9} });
	  graphics_fill_rect(ctx, (GRect){ .origin = { 52, 12 }, .size = {18*level/100, 5} }, 0, GCornerNone);
    if(level == 100){
      level = 0;
    } else {
      level = level + 20;
    }
  }
  
  if(Pebble.battery.is_plugged) {
    graphics_context_set_fill_color(ctx, GColorWhite);
	  graphics_context_set_stroke_color(ctx, GColorWhite);
    graphics_fill_rect(ctx, (GRect){ .origin = { 34, 13 }, .size = {10, 3} }, 1, GCornerNone);
	  graphics_fill_rect(ctx, (GRect){ .origin = { 39, 11 }, .size = {6, 7} }, 2, GCornerNone);
    graphics_fill_rect(ctx, (GRect){ .origin = { 44, 12 }, .size = {4, 2} }, 1, GCornerNone);
    graphics_fill_rect(ctx, (GRect){ .origin = { 44, 15 }, .size = {4, 2} }, 1, GCornerNone);
  }
  
  if(Pebble.bluetooth) {
    graphics_fill_circle(ctx, (GPoint){.x=5, .y=14}, 3);
    graphics_fill_circle(ctx, (GPoint){.x=12, .y=14}, 2);
    graphics_fill_circle(ctx, (GPoint){.x=17, .y=14}, 1);
  } 
}

void battery_state_callback(BatteryChargeState charge){
  Pebble.battery = charge;
  layer_mark_dirty(text_layer_get_layer(indicators_layer));
}

void bluetooth_status_callback(bool connected){
  Pebble.bluetooth = connected;
  layer_mark_dirty(text_layer_get_layer(indicators_layer));
  if (connected) send_cmd(CMD_KEY);
  if (!connected) vibes_double_pulse();
}

static void syncData_error_callback(DictionaryResult dict_error, AppMessageResult app_message_error, void *context) {
  switch(app_message_error){
    case APP_MSG_OK:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Sincronización ok");
      break;
    case APP_MSG_SEND_TIMEOUT:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Timeout");
      break;
    case APP_MSG_SEND_REJECTED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Rechazado");
      break;
    case APP_MSG_NOT_CONNECTED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: No conectado");
      break;
    case APP_MSG_APP_NOT_RUNNING:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Message desactivado");
      break;
    case APP_MSG_INVALID_ARGS:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Argumentos no válidos");
      break;
    case APP_MSG_BUSY:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Ocupado");
      break;
    case APP_MSG_BUFFER_OVERFLOW:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Buffer overflow");
      break;
    case APP_MSG_ALREADY_RELEASED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Recurso ya liberado");
      break;
    case APP_MSG_CALLBACK_ALREADY_REGISTERED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Callback ya registrada");
      break;
    case APP_MSG_CALLBACK_NOT_REGISTERED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Callback no registrada");
      break;
    case APP_MSG_OUT_OF_MEMORY:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Sin memoria");
      break;
    case APP_MSG_CLOSED:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Message cerrado");
      break;
    case APP_MSG_INTERNAL_ERROR:
      APP_LOG(APP_LOG_LEVEL_DEBUG, "Error en la sincronizacion: Error interno");
      break;
    
  }
}

static void syncData_changed_callback(const uint32_t key, const Tuple* new_tuple, const Tuple* old_tuple, void* context) {

  if (strlen(new_tuple->value->cstring)>0){
    const time_t t = time(NULL);
    struct tm* now = localtime(&t);
  	static char now_text[] = "@00:00 ";
  	strftime(now_text, sizeof(now_text), "@%H:%M ", now);
  	text_layer_set_text(updated_layer, now_text);
	}
	switch (key) {
    case ICON_KEY:
      //APP_LOG(APP_LOG_LEVEL_DEBUG, "Icon actualizados: %s", new_tuple->value->cstring);
	    text_layer_set_text(icon_text_layer, new_tuple->value->cstring);
      break;

    case WEATHER_KEY:
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "Wheather actualizados: %s", new_tuple->value->cstring);
	    text_layer_set_text(temp_layer, new_tuple->value->cstring);
      break;
      
    case CLOUDS_KEY:
    //  text_layer_set_text(rain_layer, new_tuple->value->cstring);
      layer_mark_dirty(text_layer_get_layer(rain_layer));
      break;

    case CITY_KEY:
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "City actualizados: %s", new_tuple->value->cstring);
	  text_layer_set_text(city_layer, new_tuple->value->cstring);
      break;
    
    case STREET_KEY:
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "Street actualizados: %s", new_tuple->value->cstring);
	  text_layer_set_text(street_layer, new_tuple->value->cstring);
      break;
      
    case STOCKS_KEY:
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "Stocks actualizados: %s", new_tuple->value->cstring);
	  layer_mark_dirty(text_layer_get_layer(rain_layer));
      break;
      
    default:
      //layer_mark_dirty(text_layer_get_layer(rain_layer));
      break;
      
  }
	
}



void rain_layer_update_callback(Layer *me, GContext* ctx) {

	const Tuple* tuple;
	int width = 0;
	GSize icon_clouds_size, clouds_size, icon_rain_prob_size, rain_prob_size, icon_rain_size, rain_size;
	graphics_context_set_text_color(ctx, GColorBlack);		
  graphics_context_set_stroke_color(ctx, GColorBlack);
  
	if(Pebble.current_layer == 0) {
    tuple = app_sync_get(&syncData, CLOUDS_KEY);
  	icon_clouds_size =
              graphics_text_layout_get_content_size("1",
                                                     icomoon_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
    clouds_size =
              graphics_text_layout_get_content_size(tuple->value->cstring,
                                                     street_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
    if (strlen(tuple->value->cstring)) width = width + icon_clouds_size.w + clouds_size.w;                                                                                      
  
    tuple = app_sync_get(&syncData, RAIN_PROB_KEY);
  
    icon_rain_prob_size =
              graphics_text_layout_get_content_size("2",
                                                     icomoon_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
      rain_prob_size =
              graphics_text_layout_get_content_size(tuple->value->cstring,
                                                     street_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
                                                   
    if (strlen(tuple->value->cstring)) width = width + icon_rain_prob_size.w + rain_prob_size.w;                                              
  
    tuple = app_sync_get(&syncData, RAIN_KEY);
  
    icon_rain_size =
              graphics_text_layout_get_content_size("3",
                                                     icomoon_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
      rain_size =
              graphics_text_layout_get_content_size(tuple->value->cstring,
                                                     street_font,
                                                     layer_get_frame(me),
                                                     2,
                                                     GTextAlignmentLeft);
                                                   
      if (strlen(tuple->value->cstring)) width = width + icon_rain_size.w + rain_size.w;                                              
  
    int init = (144 - width)/2;
    //graphics_draw_rect(ctx, (GRect){ .origin = { init, 2 }, .size = {width, 30} });
                                         
  	tuple = app_sync_get(&syncData, CLOUDS_KEY);
  	if (strlen(tuple->value->cstring)>0) {
  	  graphics_draw_text(ctx,
                      //"1 ",
                      "N",
                      icomoon_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL); 
      init = init + icon_clouds_size.w;                
      graphics_draw_text(ctx,
                      tuple->value->cstring,
                      street_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL);
      init = init + clouds_size.w;                
    
    }
  
    tuple = app_sync_get(&syncData, RAIN_PROB_KEY);
    if (strlen(tuple->value->cstring)) {
  	  graphics_draw_text(ctx,
                      //"2 ",
                      "R",
                      icomoon_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL); 
      init = init + icon_rain_prob_size.w;
      graphics_draw_text(ctx,
                      tuple->value->cstring,
                      street_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL);
      init = init + rain_prob_size.w;
     
    }
  
    tuple = app_sync_get(&syncData, RAIN_KEY);
    if (strlen(tuple->value->cstring)) {
  	  graphics_draw_text(ctx,
                      //"3 ",
                      "8",
                      icomoon_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL); 
      init = init + icon_rain_size.w;
      graphics_draw_text(ctx,
                      tuple->value->cstring,
                      street_font,
                      (GRect){ .origin = { init, 2 }, .size = {40, 30} },
                      0,
                      GTextAlignmentLeft,
                      NULL);
      init = init + rain_size.w;
  	}
  } else {
    tuple = app_sync_get(&syncData, STOCKS_KEY);
    //APP_LOG(APP_LOG_LEVEL_DEBUG, "Stocks: %s", tuple->value->cstring);
	  if (strlen(tuple->value->cstring)) {
      graphics_draw_text(ctx,
                    tuple->value->cstring,
                    street_font,
                    (GRect){ .origin = { 0, 2 }, .size = {144, 30} },
                    0,
                    GTextAlignmentCenter,
                    NULL);
    } else {
      graphics_draw_text(ctx,
                    "Sin actualizar",
                    street_font,
                    (GRect){ .origin = { 0, 2 }, .size = {144, 30} },
                    0,
                    GTextAlignmentCenter,
                    NULL);
    }
  }
}


void time_layer_update_callback(Layer *me, GContext* ctx) {
	
  if (Pebble.hour && Pebble.minute)
    {
        GSize hour_sz =
            graphics_text_layout_get_content_size(Pebble.hour,
                                                   time_font,
                                                   layer_get_frame(me),
                                                   2,
                                                   GTextAlignmentLeft);
        GSize minute_sz =
            graphics_text_layout_get_content_size(Pebble.minute,
                                                   time_font,
                                                   layer_get_frame(me),
                                                   2,
                                                   GTextAlignmentLeft);
        int width = minute_sz.w + hour_sz.w;
        int half = layer_get_frame(me).size.w / 2;
        GRect hour_bounds = layer_get_frame(me);
        GRect minute_bounds = layer_get_frame(me);

        hour_bounds.size.w = half - (width / 2) + hour_sz.w;
        minute_bounds.origin.x = hour_bounds.size.w + 1;
        minute_bounds.size.w = minute_sz.w;

        graphics_draw_text(ctx,
                           Pebble.hour,
                           time_font,
                           hour_bounds,
                           2,
                           GTextAlignmentRight,
                           NULL);
        graphics_draw_text(ctx,
						   						 Pebble.minute,
                           time_font,
                           minute_bounds,
                           2,
                           GTextAlignmentLeft,
                           NULL);
    }
}

static void handle_minute_tick(struct tm *tick_time, TimeUnits units_changed)
{
    /* Need to be static because pointers to them are stored in the text
    * layers.
    */
    static char date_text[] = "XXXX, 00 XXX";
    static char hour_text[] = "00";
    static char minute_text[] = ":00";

    snprintf(date_text, sizeof(date_text), "%s, %d %s", days[tick_time->tm_wday], (int)tick_time->tm_mday, months[tick_time->tm_mon]);
		if (date_text[4] == '0') {
		    memmove(&date_text[4], &date_text[5], sizeof(date_text) - 1);
		}
      text_layer_set_text(date_layer, date_text);
	
		if (tick_time->tm_min == 0) vibes_double_pulse();
    
    if (clock_is_24h_style()) {
      strftime(hour_text, sizeof(hour_text), "%H", tick_time);
    	if (hour_text[0] == '0') {
        memmove(&hour_text[0], &hour_text[1], sizeof(hour_text) - 1);
      }
    } else {
      strftime(hour_text, sizeof(hour_text), "%I", tick_time);
      if (hour_text[0] == '0') {
        memmove(&hour_text[0], &hour_text[1], sizeof(hour_text) - 1);
      }
    }

    strftime(minute_text, sizeof(minute_text), ":%M", tick_time);
    Pebble.hour = hour_text;
    Pebble.minute = minute_text;
    layer_mark_dirty(text_layer_get_layer(time_layer));
    
    app_log(APP_LOG_LEVEL_DEBUG, "main.c", 414, "Enviando solicitud de actualizacion...");
    send_cmd(CMD_KEY);
    app_log(APP_LOG_LEVEL_DEBUG, "main.c", 416, "Enviada solicitud.");
    
	
	//if(!(tick_time->tm_min % 15)) {
		//vibes_double_pulse();
		//send_cmd(CMD_WEATHER_KEY);//Every 15 minutes, request updated weather
		//http_location_request();
    //} else {
		//Every minute, ping the phone
		//link_monitor_ping();
    //}
}


static void init() {
  
  app_message_open(124, 124);
  
  window = window_create();
  window_set_background_color(window, GColorBlack);
  window_set_fullscreen(window, true);
  
  window_stack_push(window, true /* Animated */);

  Layer *window_layer = window_get_root_layer(window);
  
  background = gbitmap_create_with_resource(RESOURCE_ID_BKG);
  
  Pebble.battery = battery_state_service_peek();
  Pebble.bluetooth = bluetooth_connection_service_peek();
  
  Tuplet initialValues[] = {
    TupletCString(ICON_KEY, ""),
    TupletCString(WEATHER_KEY, ""),
    TupletCString(CITY_KEY, ""),
    TupletCString(STREET_KEY, ""),
    TupletCString(CLOUDS_KEY, ""),
    TupletCString(RAIN_KEY, ""),
    TupletCString(RAIN_PROB_KEY, ""),
    TupletCString(STOCKS_KEY, "")
  };
  
  app_sync_init(&syncData, syncBuffer, sizeof(syncBuffer), initialValues, ARRAY_LENGTH(initialValues),
      syncData_changed_callback, syncData_error_callback, NULL);
      
  toggle_layer = app_timer_register(5000, toggle_layer_callback, NULL);
  Pebble.current_layer = 0;
    
  #ifdef CUSTOM_FONTS
  
  time_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_CONDENSED_45));
  date_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_18));
	street_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_STREET_FUTURA_12));
	temperature_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FUTURA_25));
	city_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_CITY_FUTURA_15));
	
	#else
	
	time_font = fonts_get_system_font(FONT_KEY_BITHAM_42_MEDIUM_NUMBERS);
	date_font = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
	street_font = fonts_get_system_font(FONT_KEY_GOTHIC_14);
	temperature_font = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
	city_font = fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
	
	#endif
	
	meteocons_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_METEOCONS_28));
	icomoon_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_METEOCONS_14));
  
  
  // Add time layer
	time_layer = text_layer_create(TIME_FRAME);
	text_layer_set_text_color(time_layer, GColorWhite);
	text_layer_set_background_color(time_layer, GColorClear);
	text_layer_set_font(time_layer, time_font);
	text_layer_set_text_alignment(time_layer, GTextAlignmentCenter);
	layer_add_child(window_layer, text_layer_get_layer(time_layer));
	layer_set_update_proc(text_layer_get_layer(time_layer), time_layer_update_callback);
	text_layer_set_text(time_layer, "00:00");

	// Add date layer
	date_layer = text_layer_create(DATE_FRAME);
	text_layer_set_text_color(date_layer, GColorWhite);
	text_layer_set_background_color(date_layer, GColorClear);
	text_layer_set_font(date_layer, date_font);
	text_layer_set_text_alignment(date_layer, GTextAlignmentCenter);
	layer_add_child(window_layer, text_layer_get_layer(date_layer));
	text_layer_set_text(date_layer, "Lun, 1 Ene");

	// Add indicators layer
	indicators_layer = text_layer_create(INDICATORS_FRAME);
	text_layer_set_text_color(indicators_layer, GColorWhite);
	text_layer_set_background_color(indicators_layer, GColorClear);
	text_layer_set_font(indicators_layer, street_font);
	text_layer_set_text_alignment(indicators_layer, GTextAlignmentLeft);
	layer_add_child(window_layer, text_layer_get_layer(indicators_layer));
	layer_set_update_proc(text_layer_get_layer(indicators_layer), indicators_layer_update_callback);

	// Add updated time layer
	updated_layer = text_layer_create(UPDATED_FRAME);
	text_layer_set_text_color(updated_layer, GColorWhite);
	text_layer_set_background_color(updated_layer, GColorBlack);
	text_layer_set_font(updated_layer, street_font);
	text_layer_set_text_alignment(updated_layer, GTextAlignmentRight);
	layer_add_child(text_layer_get_layer(indicators_layer), text_layer_get_layer(updated_layer));
	text_layer_set_text(updated_layer, "@00:00 ");

	// Add battery percent text layer
	battery_level_layer = text_layer_create(BATTERY_LEVEL_FRAME);
	text_layer_set_text_color(battery_level_layer, GColorWhite);
	text_layer_set_background_color(battery_level_layer, GColorClear);
	text_layer_set_font(battery_level_layer, street_font);
	text_layer_set_text_alignment(battery_level_layer, GTextAlignmentLeft);
	layer_add_child(text_layer_get_layer(indicators_layer), text_layer_get_layer(battery_level_layer));
	
	// Add background layer
	weather_layer = bitmap_layer_create(WEATHER_FRAME);
	bitmap_layer_set_background_color(weather_layer, GColorWhite);
	layer_add_child(window_layer, bitmap_layer_get_layer(weather_layer));
	//bitmap_layer_set_bitmap(weather_layer, background);
	
  // Add icon layer
	//icon_layer = bitmap_layer_create((GRect){ .origin = { 5, 5 }, .size = {40, 40} });
	//bitmap_layer_set_background_color(icon_layer, GColorClear);
	//bitmap_layer_set_alignment(icon_layer, GAlignCenter);
	//layer_add_child(text_layer_get_layer(weather_layer), bitmap_layer_get_layer(icon_layer));
	
	// Add temperature layer
	temp_layer = text_layer_create(TEMP_FRAME);
	text_layer_set_background_color(temp_layer, GColorClear);
	text_layer_set_text_alignment(temp_layer, GTextAlignmentCenter);
	text_layer_set_font(temp_layer, temperature_font);
	layer_add_child(bitmap_layer_get_layer(weather_layer), text_layer_get_layer(temp_layer));
	
	// Add icon text layer
	icon_text_layer = text_layer_create(ICON_FRAME);
	text_layer_set_background_color(icon_text_layer, GColorClear);
	text_layer_set_text_alignment(icon_text_layer, GTextAlignmentCenter);
	text_layer_set_font(icon_text_layer, meteocons_font);
	layer_add_child(bitmap_layer_get_layer(weather_layer), text_layer_get_layer(icon_text_layer));
	//text_layer_set_text(icon_text_layer, "0");
	
	// Add rain layer
	rain_layer = text_layer_create(RAIN_FRAME); 
	text_layer_set_text_color(rain_layer, GColorBlack);
	text_layer_set_background_color(rain_layer, GColorClear);
	text_layer_set_text_alignment(rain_layer, GTextAlignmentCenter);
	text_layer_set_font(rain_layer, city_font);
	layer_add_child(bitmap_layer_get_layer(weather_layer), text_layer_get_layer(rain_layer));
	layer_set_update_proc(text_layer_get_layer(rain_layer), rain_layer_update_callback);

	// Add city layer
	city_layer = text_layer_create(CITY_FRAME); 
	text_layer_set_background_color(city_layer, GColorClear);
	text_layer_set_text_alignment(city_layer, GTextAlignmentCenter);
	text_layer_set_font(city_layer, city_font);
	layer_add_child(bitmap_layer_get_layer(weather_layer), text_layer_get_layer(city_layer));
	
	// Add street layer
	street_layer = text_layer_create(STREET_FRAME);
	text_layer_set_background_color(street_layer, GColorClear);
	text_layer_set_text_alignment(street_layer, GTextAlignmentCenter);
	text_layer_set_font(street_layer, street_font);
	layer_add_child(bitmap_layer_get_layer(weather_layer), text_layer_get_layer(street_layer));

	tick_timer_service_subscribe(MINUTE_UNIT, handle_minute_tick);
	bluetooth_connection_service_subscribe(bluetooth_status_callback);
	battery_state_service_subscribe(battery_state_callback);
	
	//window_set_click_config_provider(window, click_config_provider);
	//spinner = ppspinner_create((GRect){ .origin = { 50, 30 }, .size = {50, 15} }, 5, 0, 250);
	//layer_add_child(bitmap_layer_get_layer(weather_layer), spinner);
	//ppspinner_start(spinner);
	//send_cmd(CMD_WEATHER_KEY);
}

static void deinit() {
  tick_timer_service_unsubscribe();
  bluetooth_connection_service_unsubscribe();	
  battery_state_service_unsubscribe();
  
  gbitmap_destroy(background);
  
  app_sync_deinit(&syncData);
  
  text_layer_destroy(date_layer);
  text_layer_destroy(time_layer);
  text_layer_destroy(updated_layer);
  text_layer_destroy(indicators_layer);
  text_layer_destroy(battery_level_layer);
  bitmap_layer_destroy(weather_layer);
  //bitmap_layer_destroy(icon_layer);
  text_layer_destroy(temp_layer);
  text_layer_destroy(city_layer);
  text_layer_destroy(street_layer);
  text_layer_destroy(rain_layer);
  text_layer_destroy(icon_text_layer);
  
  #ifdef CUSTOM_FONTS
  
  fonts_unload_custom_font(time_font);
  fonts_unload_custom_font(date_font);
  fonts_unload_custom_font(street_font);
  fonts_unload_custom_font(temperature_font);
  fonts_unload_custom_font(city_font);
  
  #endif
  
  fonts_unload_custom_font(meteocons_font);
  fonts_unload_custom_font(icomoon_font);

  window_destroy(window);
}



int main(void) {
  init();
  app_event_loop();
  deinit();
}