#!/bin/bash

# ------------
# INSTALLATION
# ------------

cd `dirname $0`              # this (script) directory (relative)
WebtroPie=`pwd`              # this (script) directory (full)
SVR=$WebtroPie/app/svr       # external content (images etc) to web serve
LIB=$WebtroPie/app/lib       # external libs

echo "Webtropie standalone version."
echo "This is a port of Webtropie for Batocera."
echo
echo "Running standalone runs in a single thread"
echo "WebtroPie may not run as reponsively as under Apache"
# Make sure you have the packages below :-
echo
echo "Installing..."
echo

#  fix permissions ?
#chown -R pi:www-data app
#chown -f pi:www-data /dev/shm/runcommand.log
#chown -f pi:www-data /dev/shm/retroarch.cfg
#find app -type f -exec chmod 664 {} \;
#find app -type d -exec chmod 775 {} \;

# create symlinks so we can web serve images and themes from the svr directory
ln -sf /etc/emulationstation/themes                   $SVR
ln -sf /userdata/screenshots/downloaded_images   $SVR
ln -sf /userdata/roms                         $SVR

# download libs so that it can work offline in future
cd $LIB
rm -f angular*
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js.map
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-route.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-route.min.js.map
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-animate.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-animate.min.js.map


# create a php.ini with bigger upload limits
sed -f - /etc/php/php.ini > $WebtroPie/php.ini << SED_SCRIPT
  s|^;*\s*\(upload_max_filesize\s*=\).*$|\1 128M|gi
  s|^;*\s*\(post_max_size\s*=\).*$|\1 128M|gi
  s|^;*\s*\(memory_limit\s*=\).*$|\1 128M|gi
SED_SCRIPT

# create a php.ini for stand alone webserver with altered session settings
sed -f - $WebtroPie/php.ini > $WebtroPie/phpserver.ini << SED_SCRIPT
  s|^;*\s*\(session.name\s*=\).*$|\1 PHPSERVER|gi
  s|^;*\s*\(session.save_path\s*=\).*$|\1 $WebtroPie/sessions|gi
SED_SCRIPT

# STAND ALONE PHP WEBSERVER

cd "$WebtroPie"

# Create local session directory owned by pi
if [ ! -d "$WebtroPie/sessions" ] ; then
	mkdir "$WebtroPie/sessions"
	chown pi:www-data "$WebtroPie/sessions"
	chmod 755 "$WebtroPie/sessions"
fi

./STANDALONE.sh

printf "\nReady\n\e[7m \e[0m\n"
