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
                           controller: ['$scope', '$uibModalInstance', 'products', 'mosaics',
                              function ($scope, $uibModalInstance, products, mosaics) {
                                 $scope.mosaics = mosaics;
                                 $scope.products = products;
                                 $scope.accept = function () {
                                    $uibModalInstance.close(true);
                                 };

                                 $scope.isValid = function() {
                                    return true;
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
                              mosaics: function () {
                                 return reviewService.data.mosaics;
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
            return list.filter(item => !item.removed).reduce((acc, item) => acc + (+item.download.file_size), 0);
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

               let tiles = {};
               this.data.mosaics = downloads.filter(download => {
                  if (download.parent.dataType === "150m Bathymetry Grids" && !tiles[download.parent.tile_id]) {
                      tiles[download.parent.tile_id] = true;
                      return true;
                  }
                  return false;
               }).map(download => ({
                  mosaic: true,
                  tile: download.parent
               }));
            },

            startExtract: function () {
               let clip = clipService.data.clip;
               this.setEmail(this.data.email);

               return configService.getConfig("processing").then(config => {
                  let postData = {
                     selected: this.data.downloads.filter(product => !product.removed)
                        .map(product =>
                           ({
                              file_last_modified: product.download.file_last_modified,
                              file_name: product.download.file_name,
                              file_size: product.download.file_size,
                              file_url: product.download.file_url,
                              format: product.download.format
                           })
                     ),
                     parameters: {
                        xmin: clip.xMin,
                        xmax: clip.xMax,
                        ymin: clip.yMin,
                        ymax: clip.yMax,
                        email: this.data.email,
                        tile_ids: this.data.mosaics.filter(tile => !tile.removed).map(container => container.tile.tile_id),
                        output_format: "OGCKML",
                        out_coord_sys: "EPSG:32745",
                        out_grid_name: "dump"
                     }
                  };
                  // Clean up the data.
                  this.data.downloads.forEach(product => {
                     product.download.selected = product.removed = false;
                  });

                  return $http({
                     method: 'POST',
                     url: "/postie", // config.processingUrl,
                     data: postData,
                     headers: { "Content-Type": "application/json" }
                  }).then(function(response) {
                     return {
                        status: "success",
                        message: "Your job has been submitted. An email will be sent on job completion."
                     };
                  }, function(d) {
                     return {
                        status: "error",
                        message: "Sorry but the service failed to respond. Try again later."
                     };
                  });
               });
            },

            removeRemoved: function() {
               products.forEach(product => {
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

         return service;
      }]);

}
