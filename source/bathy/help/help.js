{

   class HelpService {
      constructor ($http) {
         this.$http = $http;
         this.FAQS_SERVICE = "bathy/resources/config/faqs.json";
      }

      getFaqs() {
         return this.$http.get(this.FAQS_SERVICE, { cache: true }).then(function (response) {
            return response.data;
         });
      }
   }
   HelpService.$inject = ['$http'];

   class  HelpCtrl {
      constructor ($log, helpService) {
         $log.info("HelpCtrl");
         helpService.getFaqs().then(faqs => {
            this.faqs = faqs;
         });
      }
   }
   HelpCtrl.$inject = ['$log', 'helpService'];

   angular.module("bathy.help", [])

      .directive("bathyHelp", [function () {
         return {
            templateUrl: "bathy/help/help.html"
         };
      }])

      .directive("bathyFaqs", [function () {
         return {
            restrict: "AE",
            templateUrl: "bathy/help/faqs.html",
            scope: {
               faqs: "="
            },
            link: function (scope) {
               scope.focus = function (key) {
                  $("#faqs_" + key).focus();
               };
            }
         };
      }])

      .controller("HelpCtrl", HelpCtrl)
      .service("helpService", HelpService);

}
