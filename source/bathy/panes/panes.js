{
   angular.module("bathy.panes", [])

      .directive("bathyPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
         return {
            templateUrl: "bathy/panes/panes.html",
            scope: {
               defaultItem: "@",
               data: "="
            },
            controller: ['$scope', function ($scope) {
               var changeSize = false;

               $scope.view = $scope.defaultItem;

               $rootScope.$on('side.panel.change', (event) => {
                  let evt = document.createEvent("HTMLEvents");
                  evt.initEvent("resize", false, true);
                  window.dispatchEvent(evt);
               });

               $scope.setView = function (what) {
                  var oldView = $scope.view;

                  if ($scope.view === what) {
                     if (what) {
                        changeSize = true;
                     }
                     $scope.view = "";
                  } else {
                     if (!what) {
                        changeSize = true;
                     }
                     $scope.view = what;
                  }

                  $rootScope.$broadcast("view.changed", $scope.view, oldView);

                  if (changeSize) {
                     mapService.getMap().then(function (map) {
                        map._onResize();
                     });
                  }
               };
               $timeout(function () {
                  $rootScope.$broadcast("view.changed", $scope.view, null);
               }, 50);
            }]
         };
      }]);

}