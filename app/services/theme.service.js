/**
 * theme.service.js
 */
(function () {

    'use strict';

    angular
        .module('WebtroPie.theme_service', [])
        .service('ThemeService', service);

    service.$inject = ['config', 'util', 'styler', '$http', '$q', '$document', '$window'];

    function service(config, util, styler, $http, $q, $document, $window)
    {
        var self = this;

        // Variables :-

        // each theme has an array of systems that it supports

        // self.system is the system object from self.theme.systems array
        // E.g 'AmstradC64' object

        // can only be set after Theme is fetched
        // self.system = self.theme.systems[self.system_name];
        
        self.correctThemeErrors = correctThemeErrors;
        self.createCarouselSystems = createCarouselSystems;
        self.createDefaultSystem = createDefaultSystem;
        self.decodeTheme = decodeTheme;
        self.expandMerged = expandMerged;
        self.getTheme = getTheme;
        self.getSystemTheme = getSystemTheme;
        self.mergeValue = mergeValue;
        self.mergeObjects = mergeObjects;
        self.mergeThemes = mergeThemes;
        self.playSound = playSound;
        self.resetView = resetView;
        self.setCurrentSystem = setCurrentSystem;
        self.setSystem = setSystem;
        self.setSystemByName = setSystemByName;
        self.setThemeSystemView = setThemeSystemView;
        self.switchView = switchView;
        self.themeInit = themeInit;
        self.variableReplace = variableReplace;

        // themes is a list of all themes (for selection and to cache)
        self.themes = {};

        // convert theme object images attributes to style
        function correctThemeErrors(systheme)
        {
            // empty theme, shouldn't happen now as default is generated
            if (!systheme || !systheme.view)
            {
                return;
            }
            // each view - system, basic, detailed
            angular.forEach(systheme.view, function (view)
            {
                // fix wrong text tags in themes
                // releasedate should be datetime
                if (view.text)
                {
                    if (view.text.md_releasedate)
                    {
                        if (!view.datetime) view.datetime = {};
                        if (!view.datetime.md_releasedate) view.datetime.md_releasedate = {};
                        self.mergeObjects(view.datetime.md_releasedate, view.text.md_releasedate);
                        delete view.text.md_releasedate;
                    }
                    // lastplayed should be datetime
                    if (view.text.md_lastplayed)
                    {
                        if (!view.datetime) view.datetime = {};
                        if (!view.datetime.md_lastplayed) view.datetime.md_lastplayed = {};
                        self.mergeObjects(view.datetime.md_lastplayed, view.text.md_lastplayed);
                        delete view.text.md_lastplayed;
                    }
                    // rating should be rating
                    if (view.text && view.text.md_rating)
                    {
                        if (!view.rating) view.rating = {};
                        if (!view.rating.md_rating) view.rating.md_rating = {};
                        self.mergeObjects(view.rating.md_rating, view.text.md_rating);
                        delete view.text.md_rating;
                    }
                    // let missing text size (width) equal label size
                    angular.forEach(view.datetime, function (text)
                    {
                        if (text.name &&
                            view.text['md_lbl_' + text.name.substring(3)] &&
                            view.text['md_lbl_' + text.name.substring(3)].size &&
                            (!text.size || text.size.substring(0, 1) == '0'))
                        {
                            text.size = view.text['md_lbl_' + text.name.substring(3)].size;
                        }
                    })
                }
            });
        }

        function createCarouselSystems()
        {
            self.theme.carousel_systems_list = [];
            self.theme.carousel_systems = {};

            // self.theme.systems is unsorted object 
            // self.theme.carousel_systems_list becomes a sorted array
            angular.forEach(config.systems, function (sys, system_name)
            {
                if (sys.has_games)
                {
                    if (self.theme.carousel_systems[system_name] == undefined)
                    {
                        self.theme.carousel_systems_list.push(system_name);
                    }
                    self.theme.carousel_systems[system_name] = true;
                }
            });

            self.theme.mid_index = Math.floor(self.theme.carousel_systems_list.length / 2);

            // sort systems array by name
            self.theme.carousel_systems_list.sort(function (a, b)
            {
                if (a.substring(0, 4) == 'auto') a = 'zzz' + a;
                if (a.substring(0, 6) == 'custom') a = 'zzzz' + a;
                if (b.substring(0, 4) == 'auto') b = 'zzz' + b;
                if (b.substring(0, 6) == 'custom') b = 'zzzz' + b;
                if (a > b)
                    return 1;
                if (a < b)
                    return -1;
                return 0;
            });

            // alphabetically first system
            self.first_system = self.theme.carousel_systems_list[0];
        }


        function createDefaultSystem(theme, themename)
        {
            // if not exists, generate a 'default' theme from the common
            // elements of first two non empty systems themes

            if (!theme.systems)
            {
                return;
            }

            if (!theme.systems.default)
            {
                // make a generic system theme
                // copy first system then delete differences with second system
                angular.forEach(theme.systems, function (sys)
                {
                    if (sys.view && !theme.systems.default)      // first themed system
                    {
                        theme.systems.default = angular.copy(sys);
                    }
                    else if (sys.view && !theme.systems.default.done)   // second themed system
                    {
                        angular.forEach(sys.view, function (view, v)
                        {
                            angular.forEach(view.image, function (image, imagename)
                            {
                                if ((!image.name || image.name.substring(0, 3) != "md_") &&
                                    // compare both themes image paths :-
                                    theme.systems.default.view[v].image[imagename] &&
                                    image.fullpath != theme.systems.default.view[v].image[imagename].fullpath)
                                {
                                    delete theme.systems.default.view[v].image[imagename].fullpath;
                                    if (theme.systems.default.view[v].image[imagename].div)
                                    {
                                        delete theme.systems.default.view[v].image[imagename].div['background-image'];
                                    }
                                    if (theme.systems.default.view[v].image[imagename].img)
                                    {
                                        delete theme.systems.default.view[v].image[imagename].img['content'];
                                    }
                                }
                            });
                            angular.forEach(view.text, function (text, textname)
                            {
                                // delete any ad hoc system specific text
                                if (!text.name)
                                {
                                    delete theme.systems.default.view[v].text[textname].text;
                                }
                                else if (text.name.substring(0, 3) != "md_" &&
                                    // compare both themes text wording :-
                                    text.text != theme.systems.default.view[v].text[textname].text)
                                {
                                    delete theme.systems.default.view[v].text[textname].text;
                                }
                            });
                        });
                        theme.systems.default.done = true;
                        delete theme.systems.default.logo;
                        delete theme.systems.default.path;
                        delete theme.systems.default.view.basic.image.logo.path;
                        delete theme.systems.default.view.detailed.image.logo.path;
                        if (theme.systems.default.view.system.image)
                           delete theme.systems.default.view.system.image.logo.path;
                    }
                });
            }

            // if default systems has no carousel then reference an existing carousel
            if (!theme.systems.default.view.system.carousel)
            {
                angular.forEach(theme.systems, function (sys)
                {
                    if (sys.view.system.carousel &&
                        !theme.systems.default.view.system.carousel)
                    {
                       theme.systems.default.view.system.carousel = sys.view.system.carousel;
                    }
                });
            }
            if (!theme.systems.default.view.system.text)
            {
                theme.systems.default.view.system.text = {};
            }
            // if default systems has no carousel then reference an existing carousel
            if (!theme.systems.default.view.system.text.systemInfo)
            {
                angular.forEach(theme.systems, function (sys)
                {
                    if (sys.view.system.text &&
                        sys.view.system.text.systemInfo &&
                        !theme.systems.default.view.system.text.systemInfo)
                    {
                        theme.systems.default.view.system.text.systemInfo = sys.view.system.text.systemInfo;
                    }
                });
            }
            // if any systems has no carousel reference an default carousel
            if (theme.systems.default.view.system.carousel)
            {
                angular.forEach(theme.systems, function (sys, sysname)
                {
                    if (!sys.view.system.carousel)
                    {
                        sys.view.system.carousel = theme.systems.default.view.system.carousel;
                    }
                    if (!sys.view.system.text)
                    {
                        sys.view.system.text = {};
                    }
                    if (!sys.view.system.systemInfo)
                    {
                        sys.view.system.systemInfo = theme.systems.default.view.system.text.systemInfo;
                    }
                });
            }
        }

        // convert raw theme data elements object into expanded desciptive object 
        function decodeTheme(theme)
        {
            var file_count = 0;

            self.theme = theme;

            // LOAD INCLUDES:
            // expand (E.g split "basic, detailed" views) for each include file
            // preserving paths relative to include file
            angular.forEach(self.theme.includes, function (inc, filename)
            {
                // FEATURE: but first, promote contents of feature node up heirarchy
                angular.forEach(inc.feature, function (value, key)
                {
                    if (value)
                    {
                        self.mergeObjects(inc, value);
                    }
                    delete inc.feature[key];
                });

                var subdir = '';
                var i = filename.lastIndexOf('/');
                if (i > 0)
                {
                    subdir = '/' + filename.substring(0, i);
                }

                // LOAD INCLUDE FILE MEDIA
                styler.loadMedia(self.theme, inc, self.theme.path + subdir, file_count++);

                // split combined objects (where key contains a comma)
                self.expandMerged(inc);
            });

            // expand system theme, merge included files, then convert images
            angular.forEach(self.theme.systems, function (sys)
            {
                styler.loadMedia(self.theme, sys.theme, sys.path, file_count);

                // expand merged views etc (where key contains a comma)
                self.expandMerged(sys);

                // include includes
                // - recursively merge each node of heirarchy
                if (sys.theme && sys.theme.include)
                {
                    angular.forEach(sys.theme.include, function (filename)
                    {
                        self.mergeThemes(sys.theme, filename, self.theme);
                    });
                }

                // fix theme wrong tags used
                self.correctThemeErrors(sys.theme);

                // remove unnecessary 'theme' tier, promote view to replace parent
                if (sys.theme)
                {
                    sys.view = sys.theme.view;
                    if (sys.theme.variables)
                    {
                        angular.forEach(sys.theme.variables, function (replace, pattern)
                        {
                            replaceVariablesInObject(sys);
                            
                            function replaceVariablesInObject(obj)
                            {
                                angular.forEach(obj, function(value, key)
                                {
                                    if (typeof value == 'object' || typeof value == 'array')
                                        replaceVariablesInObject(value);
                                    else if(value == '${'+pattern+'}')
                                        obj[key] = replace;
                                });
                            }
                        });
                        sys.variables = sys.theme.variables;
                    }
                    delete sys.theme;
                }

                // create convenient shortcuts
                if (sys.view)
                {
                    if (sys.view.system.image && sys.view.system.image.logo)
                    {
                        sys.logo = 'url("' + sys.view.system.image.logo.fullpath + '")';
                    }
/*
                    sys.text = sys.name;
                    if (config.systems[sys.name])
                    {
                        sys.text = config.systems[sys.name].fullname;
                    }
*/
                }
            });

            createDefaultSystem(self.theme, theme.name);

            // store this fully expaned theme into the array for caching
            self.themes[theme.name] = self.theme;
        }

        // expand combined properties E.g. seperate view with key
        // "basic, detailed, system, video" into seperate view objects
        function expandMerged(target_obj)
        {
            if (!target_obj)
            {
                return;
            }
            // find everything that needs to be split - where the key contains a comma
            var tmp = {};
            var tmp2 = [];
            angular.forEach(target_obj, function (value, key)
            {
                // recursivley expand from bottom up
                if ((typeof value) == 'object')
                {
                    self.expandMerged(value);
                }

                // add to list of things to unsplit
                if ((typeof key) == 'string' && key.indexOf(',') >= 0)
                {
                    tmp[key] = value;
                    tmp2.push(key);
                }
            });
            /* */
            // sort so that elements in duplicate combined sets
            // have presedence if in a smaller set
            if (tmp2.length > 1)
            {
                tmp2.sort(function (a, b)
                {
                    if (a.length > b.length)
                        return 1;
                    if (a.length < b.length)
                        return -1;
                    return 0;
                });
            }
            /* */
            // merge all of the splits
            //angular.forEach(tmp, function(value, key)
            angular.forEach(tmp2, function (key)
            {
                var value = target_obj[key];
                delete target_obj[key]; // remove combined from source
                var keys = key.split(/\s*,\s*/); // E.g. key = "basic, detailed"
                angular.forEach(keys, function (k)
                {
                    self.mergeValue(target_obj, k, value);  // E.g. k = "basic"
                    //if (typeof value == 'object')
                    if (typeof target_obj[k] == 'object')
                    {
                        target_obj[k].name = k;
                    }
                });
            });
        }

        // return theme object for a system which may not be
        // the same name as the system name and, if does not exist
        // use default theme
        function getSystemTheme(system_name)
        {
            var system = config.systems[system_name];

            if (system && self.theme.systems && self.theme.systems[system.theme])
                return self.theme.systems[system.theme];   // Use system.theme by default if exists

            return self.theme.systems[system_name]  // otherwise system.name if exists
                || self.theme.systems.default;      // else use default theme
        }


        // get either from memory or server
        function getTheme(themename, system_name, view_name, scan)
        {
            //console.log('getTheme sys = ' + system_name + ' view = ' + view_name)
            // if ThemeSet not in config for some reason
            if (!themename)
            {
                themename = 'carbon';
            }

            // we might not have known the system on the first call
            if (!self.default_system_name && system_name)
            {
                self.default_system_name = system_name;
                self.default_view_name = view_name;
            }

            if (self.getting == themename && self.theme_promise)   // prevent multiple calls
            {
                return self.theme_promise;
            }

            var deferred = $q.defer();

            self.getting = themename;

            // return previously fully fetched theme
            if (self.themes[themename] &&
                self.themes[themename].path)
            {
                self.setThemeSystemView(self.themes[themename], system_name, view_name);
                deferred.resolve(self.themes[themename]);
                return deferred.promise;
            }

            self.theme_promise = deferred.promise;

            // fetch from server
            $http.get('svr/theme.php', {
                cache: false,
                params: { theme: themename, scan: scan }
            })
            .then(function onSuccess(response)
            {
                self.getting = false;

                if (response.data.name)
                {
                    decodeTheme(response.data);

                    self.setThemeSystemView(self.theme, system_name, view_name);

                    deferred.resolve(self.theme);
                    delete self.theme_promise;
                }
                else if(self.theme)     // stay with current theme if loaded
                {
                    console.log('Error: loading theme');
                    console.log(response.data);
                }
                else                    // otherwise load carbon
                {
                    console.log('Error: loading theme');
                    console.log(response.data);
                    console.log('reverting to carbon');

                    if (self.themes['carbon'] &&
                        self.themes['carbon'].path)
                    {
                        self.setThemeSystemView(self.themes['carbon'], system_name, view_name);
                        deferred.resolve(self.themes['carbon']);
                    }
                    else
                    {
                        $http.get('svr/theme.php', {
                        cache: false,
                        params: { theme: 'carbon', scan: scan }
                        })
                        .then(function onSuccess(response)
                        {
                            decodeTheme(response.data);

                            self.setThemeSystemView(self.theme, system_name, view_name);

                            deferred.resolve(self.theme);
                            delete self.theme_promise;
                        });
                    }
                }
            });

            return deferred.promise;
        }



        // copy if target has missing value, or child value, or granchild value ...
        // used to merge properties from included theme file into theme
        // and expanding combined properties E.g. seperate "basic, detailed" view
        // into two seperate objects that may already exist
        function mergeValue(target_obj, prop, value)
        {
            if (prop == 'index' || prop == 'name')
            {
                return;
            }
            else if (!target_obj[prop])   // empty / first time
            {
                if ((typeof value) == 'object')
                {
                    target_obj[prop] = angular.copy(value);
                    //target_obj[prop].name = prop;
                }
                else
                {
                    target_obj[prop] = value;
                }
                return;
            }
            else if ((typeof target_obj[prop] == 'object') && (typeof value) == 'object')
            {
                // recurse into children
                angular.forEach(value, function (v, k)
                {
                    self.mergeValue(target_obj[prop], k, v);
                });
                return;
            }
            else if ((typeof target_obj[prop] == 'string') && (typeof value) == 'string')
            {
                if (target_obj[prop] == value)
                {
                    return;
                }
                else if (target_obj[prop].indexOf(value) >= 0)
                {
                    return;
                }
                else if (value.indexOf(target_obj[prop]) >= 0)
                {
                    target_obj[prop] = value;
                    return;
                }
            }
        }

        // recurse whole target object and merge every value
        function mergeObjects(target, source)
        {
            angular.forEach(source, function (value, key)
            {
                self.mergeValue(target, key, value);
            });
        }

        // recurse whole target object and merge every value
        function mergeThemes(target, filename, theme)
        {
            angular.forEach(theme.includes[filename], function (value, key)
            {
                // dont just merge the name property - include the whole file
                if (key == 'include')
                {
                    angular.forEach(value, function (incfile)
                    {
                        self.mergeThemes(target, incfile, theme);
                    });
                }
                else
                {
                    self.mergeValue(target, key, value);
                }
            });
        }

        // for the current theme using the sound name (E.g. scrollsystem)
        // look up the audio_id (E.g. carbon_click)
        function playSound(sound)
        {
            var audio_id, audio;

            if (self.view && self.view.sound && self.view.sound[sound])
            {
                audio_id = self.view.sound[sound.toLowerCase()].audio_id;
            }
            else if (self.gamelist &&
                self.gamelist[sound.toLowerCase() + 'audio_id'])  // scrollsound
            {
                audio_id = self.gamelist[sound.toLowerCase() + 'audio_id'];
            }
            if (audio_id)
            {
                styler.audio[audio_id].play();
            }
        }

        // fire reset on everything
        function resetView(view)
        {
            styler.insertIntoView(view, 0, 0);
            if (self.orig_width)
                $window.resizeTo(self.orig_width, self.orig_height);
        }

        // E.g when theme has changed
        function setCurrentSystem()
        {
            //console.log('setCurrentSystem '+self.system)
            self.setSystem(self.system_name || self.first_system);
        }

        // creates easy access to deep branches of the themes tree
        // self.system   = self.theme.systems[self.system_name]
        // self.view     = self.theme.systems[self.system_name].view[view_name]
        // self.gamelist = self.theme.systems[self.system_name].view[view_name].textlist.gamelist
        function setSystem(system_name, view_name, keep_style)
        {
            //console.log('### theme service setsystem ' + system_name + ' view = '+view_name+' keep = '+keep_style)
            if (!self.theme.systems)
            {
                styler.setHelpbarStyle(self.view, self.system);
                return;
            }

            // set self.system to point to theme/system object
            //self.system = self.theme.systems[system_name];
            self.system = self.getSystemTheme(system_name);
            self.system_name = system_name;

            // if not passed in, assume the same view as before
            if (!view_name && self.view)
            {
                view_name = self.view.name;
            }

            if (view_name &&
                self.system &&
                self.system.view &&
                self.system.view[view_name])
            {

                // if styles haven't been generated for the current theme system view
                // then do that now after theme is returned
                styler.createViewStyles(self.system.view[view_name], keep_style);

                // set self.view to the theme/system/view object
                self.view = self.system.view[view_name];

                if (self.viewscope)
                {
                    self.viewscope.view = self.view;
                }

                if (self.view.textlist && view_name != 'system')
                {
                    // create shortcut for theme gamelist view object
                    self.gamelist = self.view.textlist.gamelist;

                    if (self.applyGamelistFieldsShown)
                    {
                        self.applyGamelistFieldsShown();
                    }
                }
            }
            else
            {
                delete self.view;
                delete self.gamelist;
            }

            styler.setHelpbarStyle(self.view, self.system);
        }


        function setSystemByName(system_name, view_name, nocheck)
        {
            var system = self.getSystemTheme(system_name);
            //console.log('set system by name : sys = ' + system_name + ' : view = '+ view_name)
            if (!system)
            {
                return;
            }

            if (!system.view[view_name] ||
                !view_name)
            {

                if (system.view.detailed)
                    view_name = 'detailed';
                else if (system.view.video)
                    view_name = 'video';
                else
                    view_name = 'basic';
            }

            if (!nocheck &&
                self.system && self.system == system &&
                ((self.view && self.view.name == view_name) ||
                    (!self.view && !view_name)))
            {
                return; // already set
            }

            self.setSystem(system.name, view_name);
        }

        // set the global current theme
        function setThemeSystemView(theme, system_name, view_name)
        {
            self.theme = theme;

            createCarouselSystems();

            config.app.ThemeSet = theme.name;

            // also ripple change to system theme change
            if (system_name)
            {
                self.setSystemByName(system_name, view_name, true);
            }
            else if (self.default_system_name)
            {
                self.setSystemByName(self.default_system_name, self.default_view_name, true);
            }
            else
            {
                self.setCurrentSystem();
            }

            delete self.default_system_name;
            delete self.default_view_name;
        }

        function switchView(view_name)
        {
            self.setSystem(self.system_name, view_name);
            util.defaultFocus();
        }

        // load up (current) theme from memory otherwise from server
        function themeInit(system_name, view_name, scan)
        {
            return self.getTheme(config.app.ThemeSet, system_name, view_name, scan);
        }

        function variableReplace(str, system_name)
        {
            if (!str || (typeof str != 'string') || !system_name)
                return str;

            var system = config.systems[system_name];
            if (!system)
            {
                console.log('no system: ' + system_name);
                return str;
            }
            str = str.replace(/\$\{system.name\}/, system.name);
            if (!str) return;
            str = str.replace(/\$\{system.fullName\}/, system.fullname);
            if (!str) return;
            return str.replace(/\$\{system.theme\}/, system.theme);
        }
    }

})();