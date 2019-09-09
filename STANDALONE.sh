#!/bin/bash
IP=`ifconfig | sed '/inet addr:.*255.255/!d;s|.*addr:|http://|;s|\s.*||'`
echo "------------------------------------------------"
echo "WebtroPie serving by php from ${IP}:1982"
echo
echo "Cntrl-C to stop, ./STANDALONE.sh to restart"
echo "------------------------------------------------"

php -S 0.0.0.0:1982 -t app/ -c phpserver.ini

