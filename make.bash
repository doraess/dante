#!/usr/bin/env bash

set -e

JADE_FILE='src/js/config.jade'
COFFEE_FILE='src/js/pebble-js-app.coffee'
JS_FILE='src/js/pebble-js-app.js'
CONFIG_FILE='src/js/config.html'
CONFIG_FILE_MIN='src/js/config.min.html'
DORAESS='X-Wing.local'
DORAESS='192.168.1.38'

echo -ne "Conectado con el iPhone ... "; 
pebble ping --phone $DORAESS
echo "OK"
echo -ne "Limpiando el proyecto ... "; 
pebble clean > /dev/null 2>&1
#rm $JS_FILE
#rm $CONFIG_FILE
echo "OK"

echo -ne "Compilando coffeescript ... "
coffee -c $COFFEE_FILE
echo "OK"
echo -ne "Compilando el template ... "
jade < $JADE_FILE > $CONFIG_FILE
cp $CONFIG_FILE ~/Documents/Proyectos/www/config.html
cat $CONFIG_FILE | tr -d '\n' > $CONFIG_FILE_MIN
echo "OK"
echo -ne "Adjuntando código html ... "
echo "var html = '$(cat $CONFIG_FILE_MIN)';" >> $JS_FILE
for f in $(pwd)/src/js/libs/*.js; do 
	echo "Añadiendo librería ... $f"; 
	echo " \
	/**---------- Library $f -----------**/ \
	" >> $JS_FILE;
	cat $f >> $JS_FILE;
done

echo -ne "Construyendo el proyecto ..."; 
#pebble build > /dev/null 2>&1
pebble build
cp $(pwd)/build/dante.pbw ~/Dropbox/Pebble/dante.pbw
echo "OK"


echo -ne "Instalando la watchapp ..."; 
pebble install --phone $DORAESS
pebble logs --phone $DORAESS
echo "OK"
