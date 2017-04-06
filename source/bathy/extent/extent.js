{
   class ExtentService {
      constructor(mapService, searchService) {
         let bbox = searchService.getSearchCriteria().bbox;

         if (bbox.fromMap) {
            enableMapListeners();
         }

         return {
            getParameters: function () {
               return bbox;
            }
         };

         function enableMapListeners() {
            mapService.getMap().then(function (map) {
               map.on("moveend", execute);
               map.on("zoomend", execute);
               execute();
            });
         }

         function disableMapListeners() {
            return mapService.getMap().then(function (map) {
               map.off("moveend", execute);
               map.off("zoomend", execute);
               return map;
            });
         }

         function execute() {
            mapService.getMap().then(function (map) {
               var bounds = map.getBounds();
               bbox.yMin = bounds.getSouth();
               bbox.xMin = bounds.getWest();
               bbox.yMax = bounds.getNorth();
               bbox.xMax = bounds.getEast();
               searchService.refresh();
            });
         }
      }
   }
   ExtentService.$inject = ['mapService', 'searchService'];

   angular.module("bathy.extent", ["explorer.switch"])

      .directive("bathyExtent", ['extentService', function (extentService) {
         return {
            restrict: "AE",
            templateUrl: "bathy/extent/extent.html",
            controller: ['$scope', function ($scope) {
               $scope.parameters = extentService.getParameters();
            }],
            link: function (scope, element, attrs) {

            }
         };
      }])

      .factory("extentService", ExtentService);

}