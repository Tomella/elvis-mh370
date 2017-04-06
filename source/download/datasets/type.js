{
   angular.module("bathy.datasets.type", [])
      .directive("datasetsType", ["datasetsService", function(datasetsService) {
         return {
            templateUrl: "download/datasets/type.html",
            restrict: "AE",
            scope: {
               name: "=",
               type: "="
            },
            link: function(scope) {
               scope.show = dataset => {
                  datasetsService.show(dataset);
               };
               scope.hide = () => {
                  datasetsService.show(null);
               };
               scope.zoom = dataset => {
                  datasetsService.zoom(dataset);
               };
            }
         };
      }])

      .filter("withinBounds", [function () {
         return function (tiles) {
            return (tiles ? tiles : []).filter(tile => {
               return tile.intersects;
            });
         };
      }])

      .filter("sortFormat", function() {
         return function(formats) {
            return (formats ? formats : []).sort((a, b) => a.format > b.format);
         };
      });
}