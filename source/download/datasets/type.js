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

      .directive("typeMetadata", [function() {
         return {
            templateUrl: "download/datasets/metadata.html",
            restrict: "AE",
            scope: {
               name: "=",
               metadata: "="
            },
            link: function(scope) {
            }
         };
      }])

      .filter("selectedFormat", [function () {
         return function (downloadables, formats) {
            return (downloadables ? downloadables : []).filter(downloadable => {
               return formats.some(format => format.selected && format.name === downloadable.format);
            });
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