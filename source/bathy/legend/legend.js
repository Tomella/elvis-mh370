{
   angular.module('bathy.legend', [])

      .directive('legend', function ($window) {
         return {
            restrict: 'AE',
            templateUrl: 'bathy/legend/legend.html',
         };
      })

      .directive('legendButton', ["panelSideFactory", function (panelSideFactory) {
         let CODE = "legend";

         return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'bathy/legend/button.html',
            link: function (scope) {
               scope.toggle = function () {
                  panelSideFactory.setLeft(CODE);
               };
            }
         };
      }]);
}