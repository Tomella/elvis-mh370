(function (angular) {
   "use strict";
   angular.module('mh370.legend', [])

   .directive('legend', function ($window) {
      return {
         restrict: 'AE',
         templateUrl: 'mh370/legend/legend.html',
      };
   })

   .directive('legendButton', ["panelSideFactory", function (panelSideFactory) {
      let CODE = "legend";

      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'mh370/legend/button.html',
         link: function (scope) {
            scope.toggle = function () {
               panelSideFactory.setLeft(CODE);
            };
         }
      };
   }]);
})(angular);