{
   angular.module("bathy.reviewing", [])

      .directive('bathyReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService',
         function ($rootScope, $uibModal, $log, messageService, reviewService) {
            return {
               controller: ['$scope', function ($scope, reviewService) {

               }],
               link: function (scope, element) {
                  var modalInstance;
                  scope.data = reviewService.data;

                  scope.$watch("data.reviewing", function (value) {
                     if (value) {
                        modalInstance = $uibModal.open({
                           templateUrl: 'download/reviewing/reviewing.html',
                           size: "lg",
                           backdrop: "static",
                           keyboard: false,
                           controller: ['$scope', '$uibModalInstance', 'products', 'clip',
                              function ($scope, $uibModalInstance, products, clip) {
                                 $scope.clip = clip;
                                 $scope.products = products;
                                 $scope.accept = function () {
                                    $uibModalInstance.close(true);
                                 };

                                 $scope.isValid = function() {
                                    let data = this.data;
                                    let valid = products.filter(product => !product.removed).length && data.email && data.outFormat;

                                    return valid;
                                 };

                                 $scope.countAccepted = function() {
                                    return products.filter(product => !product.removed).length;
                                 };

                                 $scope.cancel = function () {
                                    $uibModalInstance.close(false);
                                 };

                                 $scope.noneSelected = function (products) {
                                    return !products.some(product => !product.removed);
                                 };
                              }],
                           resolve: {
                              products: function () {
                                 return reviewService.data.downloads;
                              },
                              clip: function () {
                                 return reviewService.data.clip;
                              }
                           }
                        });
                        modalInstance.result.then(function (run) {
                           if (run) {
                              reviewService.startExtract().then(response => {
                                 messageService[response.status](response.message);
                                 reviewService.removeRemoved();
                                 scope.data.reviewing = false;
                              });
                           } else {
                              scope.data.reviewing = false;
                           }
                        }, function () {
                           $log.info('Cancelled');
                        });
                     }
                  });
               }
            };
         }])

      .directive("reviewEmail", ['reviewService', function (reviewService) {
         return {
            template: '<div class="input-group">' +
            '<span class="input-group-addon" id="nedf-email">Email</span>' +
            '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
            '</div>',
            restrict: "AE",
            link: function (scope, element) {
               scope.data = reviewService.data;
               //console.log("data" + scope.data);
            }
         };
      }])

      .filter("sizeAcceptedProducts", [function () {
         return function (list) {
            return (list ? list : []).filter(item => !item.removed).reduce((acc, item) => acc + (+item.download.file_size), 0);
         };
      }])

      .filter("withinClip", [function () {
         return function (list, clip) {
            if (!clip) {
               return [];
            }

            return (list ? list : []).filter(item =>
               !item.extent ||
                  (item.extent.xMax >= clip.xMax &&
                     item.extent.xMin <= clip.xMin &&
                     item.extent.yMax >= clip.yMax &&
                     item.extent.yMin <= clip.yMin
                  )
            );
         };
      }])

      .factory('reviewService', ['$http', 'clipService', 'configService', 'persistService',
                        function ($http, clipService, configService, persistService) {
         var key = "bathy_download_email";
         var service = {
            data: {},

            setDownloads: function(downloads) {
               this.data.downloads = downloads.map(download => ({
                  download,
                  removed: false
               }));

               this.data.reviewing = true;
               this.data.clip = clipService.data.clip;
            },

            startExtract: function () {
               let clip = clipService.data.clip;
               let config = this.data.config;
               this.setEmail(this.data.email);
               let postData = {
                  selected: [],
                  parameters: {
                     xmin: clip.xMin,
                     xmax: clip.xMax,
                     ymin: clip.yMin,
                     ymax: clip.yMax,
                     email: this.data.email,
                     output_format: this.data.outFormat.code
                  }
               };
               let selected = postData.selected;

               // Get the selected groups. This has become a bit ugly because the backend service wants the data in a funny way.
               let accumulator = {};
               let downloads = this.data.downloads.filter(product => !product.removed).forEach(product => {
                  let download = product.download;
                  let parent = download.parent;
                  let groupName = parent.dataType;
                  let postItem = {};


                  if (parent.type === "mosaic") {
                     // Mosaics don't have a list for files and there is only ever one.
                     selected.push({
                        data_type: groupName,
                        files: {
                           format: download.format,
                           file_name: download.file_name,
                           file_url: "",
                           file_size: "",
                           file_last_modified: ""
                        }
                     });

                  } else {
                     // datasets have a list for files and we have them here
                     let group = accumulator[groupName];
                     if (!group) {
                        group = accumulator[groupName] = {
                           data_type: groupName,
                           files: []
                        };
                        selected.push(group);
                     }
                     let list = group.files;
                     list.push({
                        format: download.format,
                        file_name: download.file_name,
                        file_url: download.file_url,
                        file_size: download.file_size,
                        file_last_modified: download.file_last_modified
                     });
                  }
               });


               // Clean up the data.
               this.data.downloads.forEach(product => {
                  product.download.selected = product.removed = false;
               });

               return $http({
                  method: 'POST',
                  url: config.processingUrl,
                  data: postData,
                  headers: { "Content-Type": "application/json" }
               }).then(function(response) {
                  return {
                     status: "success",
                     message: "Your job has been submitted. Note that you will receive an email once the " +
                        "job is complete and that it may take a few hours depending on the size of the dataset."
                  };
               }, function(d) {
                  return {
                     status: "error",
                     message: "Sorry but the service failed to respond. Try again later."
                  };
               });
            },

            removeRemoved: function() {
               this.data.downloads.forEach(product => {
                  product.removed = false;
               });
            },

            setEmail: function (email) {
               this.data.email = email;
               persistService.setItem(key, email);
            }
         };

         persistService.getItem(key).then(value => {
            service.data.email = value;
         });

         configService.getConfig("processing").then(processing => {
            service.data.config = processing;
         });

         return service;
      }]);

}
