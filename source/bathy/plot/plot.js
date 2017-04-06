{

   angular.module("bathy.plot", [])

      .directive("bathyPlot", ['$log', function ($log) {
         return {
            restrict: "AE",
            scope: {
               line: "="
            },
            link: function (scope, element, attrs, ctrl) {
               scope.$watch("line", function (newValue, oldValue) {
                  $log.info(newValue);
               });
            }
         };
      }]);

}