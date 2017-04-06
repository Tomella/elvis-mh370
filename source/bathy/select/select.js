{
   class SelectCtrl {
      constructor($rootScope, configService, flashService, selectService) {
         this.flashService = flashService;
         this.selectService = selectService;

         $rootScope.$on("select.results.received", (event, data) => {
            //console.log("Received response")
            flashService.remove(this.flasher);
            this.data = data;
         });

         configService.getConfig("facets").then(config => {
            this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
         });
      }

      select() {
         this.flashService.remove(this.flasher);
         this.flasher = this.flashService.add("Selecting", 3000, true);
         this.selectService.setFilter(this.filter);
      }

      toggle(result) {
         this.selectService.toggle(result);
      }

      toggleAll() {
         this.selectService.toggleAll(this.data.response.docs);
      }

      showWithin() {
         this.selectService.showWithin(this.data.response.docs);
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
         this.selectService.hideAll(this.data.response.docs);
      }

      hilight(doc) {
         if (doc.layer) {
            this.selectService.hilight(doc.layer);
         }
      }

      lolight(doc) {
         if (doc.layer) {
            this.selectService.lolight(doc.layer);
         }
      }
   }
   SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];

   class SelectCriteriaCtrl{
      constructor(selectService) {
         this.criteria = selectService.getSelectCriteria();
         this.selectService = selectService;
      }

      refresh() {
         selectService.refresh();
      }
   }
   SelectCriteriaCtrl.$inject = ["selectService"];

   angular.module("bathy.select", ['bathy.select.service'])

      .controller("SelectCtrl", SelectCtrl)
      .controller("SelectCriteriaCtrl", SelectCriteriaCtrl)

      .directive("bathySelect", [function () {
         return {
            templateUrl: "bathy/select/select.html",
            link: function (scope, element, attrs) {
               console.log("Hello select!");
            }
         };
      }])

      .directive("selectDoc", [function () {
         return {
            templateUrl: "bathy/select/doc.html",
            link: function (scope, element, attrs) {
               console.log("What's up doc!");
            }
         };
      }])


      .directive("selectGroup", [function () {
         return {
            templateUrl: "bathy/select/group.html",
            scope: {
               group: "="
            },
            link: function (scope, element, attrs) {
               console.log("What's up doc!");
            }
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

