JADE_FILE=$(shell pwd)/src/js/config.jade
COFFEE_FILE=$(shell pwd)/src/js/pebble-js-app.coffee
JS_FILE=$(shell pwd)/src/js/pebble-js-app.js
CONFIG_FILE=$(shell pwd)/src/js/config.html
CONFIG_FILE_MIN=$(shell pwd)/src/js/config.min.html
DORAESS="X-Wing.local"
PEBBLE="/Users/alberto/Documents/Proyectos/pebble/PebbleSDK-2.0.0/bin/pebble"
#DORAESS="192.168.0.127"

all: clean ping build install

build: coffee jade libs
	@echo "Construyendo el proyecto ... \c"; 
	@$(PEBBLE) build> /dev/null 2>&1
	@echo "OK"

coffee: $(COFFEE_FILE)
	@echo "Compilando coffeescript ... \c"
	@coffee -c $(COFFEE_FILE)
	@echo "OK"

jade: $(JADE_FILE)
	@echo "Compilando el template ... \c"
	@jade -P < $(JADE_FILE) > $(CONFIG_FILE)
	@cp $(CONFIG_FILE) ~/Documents/Proyectos/www/doraess.github.io/pebble/dante/index.html
	@cat $(CONFIG_FILE) | tr -d '\n' > $(CONFIG_FILE_MIN) 
	@echo "OK"

libs: $(JS_FILE) $(wildcard src/js/libs/*.js)
	@$(foreach file,$(wildcard src/js/libs/*.js), \
	echo "Añadiendo librería $(file) ... \c"; \
	echo "\n/**---------- Library $(file) -----------**/ \n" >> $(JS_FILE); \
	cat $(file) >> $(JS_FILE); \
	echo "Ok";)

clean:
	@echo "Limpiando el proyecto ... \c"
	@$(PEBBLE) clean > /dev/null 2>&1
	@echo "Ok"

ping:
	@echo "Conectado con el iPhone ... \c"
	@$(PEBBLE) ping --phone $(DORAESS)
	@echo "Ok"

install:
	@$(PEBBLE) install --phone $(DORAESS)
	
log:
	@$(PEBBLE) logs --phone $(DORAESS)
	