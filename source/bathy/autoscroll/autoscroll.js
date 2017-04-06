{
   angular.module('bathy.autoscroll', [])

      .directive('autoScroll', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
         return {
            scope: {
               trigger: "@",
               y: "@",
               height: "@"
            },
            link: function (scope, element, attrs) {
               var timeout, oldBottom, startHeight;

               if (scope.height) {
                  startHeight = +scope.height;
               } else {
                  startHeight = 100;
               }
               oldBottom = startHeight;

               element.on("scroll", function (event) {
                  var scrollHeight = element.scrollTop(),
                     target = element.find(attrs.autoScroll),
                     totalHeight = target.height(),
                     scrollWindow = element.height(),
                     scrollBottom,
                     up;

                  if (scrollWindow >= totalHeight) {
                     return;
                  }
                  scrollBottom = totalHeight - scrollHeight - scrollWindow;
                  up = oldBottom < scrollBottom;
                  oldBottom = scrollBottom;
                  if (scrollBottom < startHeight && !up) {
                     // Add some debounce
                     if (timeout) {
                        $timeout.cancel(timeout);
                     }
                     timeout = $timeout(function () {
                        $rootScope.$broadcast(scope.trigger);
                     }, 30);

                  }
               });
            }
         };
      }]);
}