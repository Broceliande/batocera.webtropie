<?php
  // server side config
  define("HOME", "/home/pi"); // relative to this dir
  //define("ROMSPATH", HOME."/RetroPie/roms/");
  define("ROMSPATH", "roms/"); // relative to this dir
  define("ES_PATH", "/etc/emulationstation");
  // below are symlinked ..
  define("HOME_ES", HOME."/.emulationstation"); // relative to this dir
  define("ES_CONFIG_PATH", "/opt/retropie/configs/all/emulationstation");
  define("DEFAULT_THEME", "carbon");
  define("APP", 1);
  define("ENV", 2);
  define("LANG", 4);
  define("ES", 8);
  define("THEMES", 16);
  define("SYSTEMS", 32);
  define("THEMES_LIST", 64);
?>
