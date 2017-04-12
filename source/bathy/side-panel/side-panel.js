{
   angular.module("bathy.side-panel", [])

      .factory('panelSideFactory', ['$rootScope', ($rootScope) => {
         let state = {
            left: {
               active: null,
               width: 0
            },

            right: {
               active: null,
               width: 0
            }
         };

         function setSide(state, value) {
            let response = state.active;

            if (response === value) {
               state.active = null;
               state.width = 0;
            } else {
               state.active = value;
            }
            return !response;
         }

         return {
            state: state,
            setLeft: function (value) {
               let result = setSide(state.left, value);
               if (result) {
                  state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
               }
               return result;
            },

            setRight: function (data) {
               state.right.width = data.width;
               let response = setSide(state.right, data.name);
               $rootScope.$broadcast('side.panel.change', {
                  side: "right",
                  data: state.right
               });
               return response;
            }
         };
      }])

      .directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}">' +
                        '<ng-transclude></ng-transclude>' +
                     '</div>',
            link: function (scope) {
               scope.right = panelSideFactory.state.right;
            }
         };
      }])

      .directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'bathy/side-panel/side-panel-right.html',
            link: function (scope) {
               scope.right = panelSideFactory.state.right;

               scope.closePanel = function () {
                  panelSideFactory.setRight({name:null, width: 0});
               };
            }
         };
      }])

      .directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'bathy/side-panel/trigger.html',
            scope: {
               default: "@?",
               panelWidth: "@",
               name: "@",
               iconClass: "@",
               panelId: "@"
            },
            link: function (scope) {
               scope.toggle = function () {
                  panelSideFactory.setRight({
                     width: scope.panelWidth,
                     name: scope.panelId
                  });
               };
               if (scope.default) {
                  panelSideFactory.setRight({
                     width: scope.panelWidth,
                     name: scope.panelId
                  });
               }
            }
         };
      }])

      .directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'bathy/side-panel/side-panel-left.html',
            link: function (scope) {
               scope.left = panelSideFactory.state.left;

               scope.closeLeft = function () {
                  panelSideFactory.setLeft(null);
               };
            }
         };
      }]);

}