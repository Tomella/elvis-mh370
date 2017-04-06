{

   class SearchCtrl {
      constructor($rootScope, configService, flashService, searchService) {
         this.configService = configService;
         this.flashService = flashService;
         this.searchService = searchService;

         $rootScope.$on("search.results.received", (event, data) => {
            //console.log("Received response")
            flashService.remove(this.flasher);
            this.data = data;
         });

         $rootScope.$on("more.search.results", () => {
            flashService.remove(this.flasher);
            this.flasher = flashService.add("Fetching more results", 1000, true);
            searchService.more();
         });

         configService.getConfig("facets").then(config => {
            this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
         });
      }

      search() {
         this.flashService.remove(this.flasher);
         this.flasher = this.flashService.add("Searching", 3000, true);
         this.searchService.setFilter(this.filter);
      }

      toggle(result) {
         this.searchService.toggle(result);
      }

      toggleAll() {
         this.searchService.toggleAll(this.data.response.docs);
      }

      showWithin() {
         this.searchService.showWithin(this.data.response.docs);
      }

      allShowing() {
         if (!this.data || !this.data.response) {
            return false;
         }
         return !this.data.response.docs.some(function (dataset) {
            return !dataset.showLayer;
         });
      }

      anyShowing() {
         if (!this.data || !this.data.response) {
            return false;
         }
         return this.data.response.docs.some(function (dataset) {
            return dataset.showLayer;
         });
      }

      hideAll() {
         this.searchService.hideAll(this.data.response.docs);
      }

      hilight(doc) {
         if (doc.layer) {
            this.searchService.hilight(doc.layer);
         }
      }

      lolight(doc) {
         if (doc.layer) {
            this.searchService.lolight(doc.layer);
         }
      }
   }
   SearchCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'searchService'];

   class SearchCriteriaCtrl {
      constructor(searchService) {
         this.searchService = searchService;
         this.criteria = searchService.getSearchCriteria();
      }

      refresh() {
         this.searchService.refresh();
      }
   }
   SearchCriteriaCtrl.$inject = ["searchService"];

   angular.module("bathy.search", ['bathy.search.service'])

      .controller("SearchCtrl", SearchCtrl)
      .controller("SearchCriteriaCtrl", SearchCriteriaCtrl)

      .directive("bathySearch", [function () {
         return {
            templateUrl: "wizard/search/search.html"
         };
      }])

      /**
       * Format the publication date
       */
      .filter("pubDate", function () {
         return function (string) {
            var date;
            if (string) {
               date = new Date(string);
               return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
            }
            return "-";
         };
      })

      /**
       * Format the array of authors
       */
      .filter("authors", function () {
         return function (auth) {
            if (auth) {
               return auth.join(", ");
            }
            return "-";
         };
      })

      /**
       * If the text is larger than a certain size truncate it and add some dots to the end.
       */
      .filter("truncate", function () {
         return function (text, length) {
            if (text && text.length > length - 3) {
               return text.substr(0, length - 3) + "...";
            }
            return text;
         };
      });

}
