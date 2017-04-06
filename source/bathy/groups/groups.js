{
   class MapsCtrl {
      constructor($rootScope, mapService, selectService, downloadService) {
         // We use the dummy layer group if
         let dummyLayerGroup = L.layerGroup([]),
            groups = {
               download: downloadService.getLayerGroup(),
               select: selectService.getLayerGroup()
            };
      }
   }
   MapsCtrl.$inject = ['$rootScope', 'mapService', 'selectService', 'downloadService'];

   angular.module("bathy.groups", [])

      .factory("GroupsCtrl", MapsCtrl);
}