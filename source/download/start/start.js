{
   angular.module("bathy.start", ["bathy.datasets"])

      .directive("bathyDownload", [function () {
         return {
            templateUrl: "download/start/start.html",
            link: function (scope, element, attrs) {
               console.log("Hello select!");
            }
         };
      }]);
}
