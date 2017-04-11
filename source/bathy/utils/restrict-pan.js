{

   angular.module("bathy.restrict.pan", [])

      .directive("restrictPan", ['mapService', function (mapService) {
         return {
            restrict: "AE",
            scope: {
               bounds: "="
            },
            link: function (scope) {
               mapService.getMap().then(map => {

                  // We expect ll and ur in bounds
                  let bounds = scope.bounds,
                     ll = bounds[0],
                     ur = bounds[1],
                     southWest = L.latLng(ll[0], ll[1]),
                     northEast = L.latLng(ur[0], ur[1]),
                     restrict = L.latLngBounds(southWest, northEast);

                  map.setMaxBounds(restrict);
                  map.on('drag', function () {
                     map.panInsideBounds(restrict, { animate: false });
                  });
               });
            }
         };
      }]);

}