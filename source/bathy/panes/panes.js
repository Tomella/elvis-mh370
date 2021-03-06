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
                  emitter();
                  $timeout(emitter, 100);
                  $timeout(emitter, 200);
                  $timeout(emitter, 300);
                  $timeout(emitter, 500);
                  function emitter() {
                     let evt = document.createEvent("HTMLEvents");
                     evt.initEvent("resize", false, true);
                     window.dispatchEvent(evt);
                  }
               });

               $scope.setView = function (what) {
                  let oldView = $scope.view;
                  let delay = 0;

                  if ($scope.view === what) {
                     if (what) {
                        changeSize = true;
                        delay = 1000;
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