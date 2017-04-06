{
   class DaterangeCtrl {
      constructor($timeout, daterangeService) {
         this.MAX = 240;
         this.MIN = 0;

         this.data = daterangeService.getDaterange();
      }

      change() {
         daterangeService.changed();
      }

      slider() {
         // Give it some debounce
         $timeout.cancel(this.timeout);
         this.timeout = $timeout(function () {
            daterangeService.changed();
         }, 200);
      }

      formatter(val) {
         // Arrrgghh! It fires 3 times per change in range. Only once is an array.
         if (!angular.isArray(val)) {
            return;
         }
         // this is the slider, self is the controller
         let upper = val[1];
         let lower = val[0];

         if (lower === undefined || lower === this.MIN) {
            lower = "Earliest";
            if (this.data) {
               this.data.lower = null;
            }
         } else {
            lower = this.convertToDate(lower);
            lower = (lower.getMonth() + 1) + "/" + lower.getFullYear();
            if (this.data) {
               this.data.lower = lower;
            }
         }

         if (upper === undefined || upper === this.MAX) {
            upper = "newest";
            if (this.data) {
               this.data.upper = null;
            }
         } else {
            upper = this.convertToDate(upper);
            upper = (upper.getMonth() + 1) + "/" + upper.getFullYear();
            if (this.data) {
               this.data.upper = upper;
            }
         }
         this.slider();
         return lower + " to " + upper;
      }

      convertToDate(value) {
         let date = new Date();
         if (value !== undefined) {
            date.setMonth(date.getMonth() - (this.MAX - value));
            return date;
         }
      }
   }
   DaterangeCtrl.$inject = ['$timeout', 'daterangeService'];

   class DaterangeService {
      constructor($log, searchService) {
         return {
            getDaterange: function () {
               return searchService.getDaterange();
            },

            changed: function () {
               $log.info("Refreshing..");
               searchService.refresh();
            }
         };
      }
   }
   DaterangeService.$inject = ['$log', 'searchService'];

   angular.module("bathy.daterange", [])

      .directive("bathyDaterange", [function () {
         return {
            restrict: 'AE',
            templateUrl: "bathy/daterange/daterange.html",
            controller: "DaterangeCtrl",
            link: function (scope, element, attrs, ctrl) {
               scope.change = function () {
                  ctrl.change();
               };
            }
         };
      }])

      .directive("bathyDaterangeSlider", [function () {
         return {
            restrict: "AE",
            require: "^bathyDaterange",
            template: '<slider min="0" max="240" step="1" value="[0,240]" range="true" ng-model="daterange.range" formatter="daterange.formatter"></slider>',
            link: function (scope, element, attrs, ctrl) {
               scope.daterange = ctrl;
            }
         };
      }])

      .controller("DaterangeCtrl", DaterangeCtrl)
      .factory("daterangeService", DaterangeService);

}