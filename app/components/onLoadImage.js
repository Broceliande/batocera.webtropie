/**
 * onLoadImage.js
 *
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('onLoadImage', ['$parse',
        function ($parse) {
            return {
              restrict: 'A',
              link: function (scope, elem, attrs) {
                var fn = $parse(attrs.onLoadImage);
                elem.on('load', function (event) {
                  scope.$apply(function() {
                    var width = elem[0].width;
                    var height = elem[0].height;
                    var url = elem[0].src || elem[0].href;
                    var iTime = performance.getEntriesByName(url)[0];
                    var mtime = parseInt(url.replace(/^.*\?/,''));
                    fn(scope, { $event: event,
                                 width: width,
                                height: height,
                                  size: iTime.encodedBodySize,
                                 mtime: mtime });
                  });
                });
              }
            };
        }]);
})();
