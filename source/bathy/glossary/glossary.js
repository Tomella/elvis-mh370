{
   class GlossaryService {
      constructor($http) {
         this.$http = $http;
         this.TERMS_SERVICE = "bathy/resources/config/glossary.json";
      }

      getTerms() {
         return this.$http.get(this.TERMS_SERVICE, { cache: true }).then(response => {
            return response.data;
         });
      }
   }
   GlossaryService.$inject = ['$http'];

   class GlossaryCtrl {
      constructor($log, glossaryService) {
         $log.info("GlossaryCtrl");
         glossaryService.getTerms().then(terms => {
            this.terms = terms;
         });
      }
   }
   GlossaryCtrl.$inject = ['$log', 'glossaryService'];

   angular.module("bathy.glossary", [])

      .directive("bathyGlossary", [function () {
         return {
            templateUrl: "bathy/glossary/glossary.html"
         };
      }])

      .controller("GlossaryCtrl", GlossaryCtrl)
      .service("glossaryService", GlossaryService);

}