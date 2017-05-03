{
   let reduceToSelected = function(downloadables, formats) {
      return (downloadables ? downloadables : [])
         .filter(downloadable => downloadable.parent.intersects)              // Only care about those that intersect and
         .filter(downloadable => downloadable.selected)                       // Those that are selected and
         .filter(downloadable => formats.some(format => format.name === downloadable.format && format.selected)); // The format is selected
   };

   angular.module("bathy.datasets.controls", ["bathy.datasets.type", "bathy.reviewing"])
      .directive("datasetsControls", ["reviewService", function (reviewService) {
         return {
            templateUrl: "download/datasets/controls.html",
            restrict: "AE",
            scope: {
               datasets: "="
            },
            link: function (scope) {
               scope.review = function() {
                  reviewService.setDownloads(scope.selectedDownloadables());
               };

               scope.hasSelectedDownloadables = function() {
                  let state = scope.datasets;
                  return reduceToSelected(state.list, state.formats).length > 0;
               };

               scope.selectedDownloadables = function() {
                  let state = scope.datasets;
                  return reduceToSelected(state.list, state.formats);
               };

               scope.sizeSelectedDownloadables = function() {
                  let state = scope.datasets;
                  return reduceToSelected(state.list, state.formats).reduce((acc, downloadable) => acc + (+downloadable.file_size), 0);
               };
            }
         };
      }])

      .filter("selectedDownloadables", [function () {
         return function (downloadables, formats) {
            return reduceToSelected(downloadables, formats);
         };
      }])

      .filter("hasSelectedDownloadables", [function () {
         return function (downloadables, formats) {
            return reduceToSelected(downloadables, formats).length > 0;
         };
      }]);
}