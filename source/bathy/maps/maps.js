{
   class MapsCtrl {
      constructor(mapsService) {
         this.mapService = mapService;
      }

      toggleLayer(data) {
         this.mapsService.toggleShow(data);
      }
   }
   MapsCtrl.$inject = ['mapsService'];

   class MapsService {
      constructor(configService, mapService) {
         this.CONFIG_KEY = "layersTab";
         this.configService = configService;
         this.mapService = mapService;
         this.configService = configService;

      }

      getConfig() {
         return this.configService.getConfig(this.CONFIG_KEY);
      }

      toggleShow(item, groupName) {
         this.configService.getConfig(this.CONFIG_KEY).then(config => {
            if (item.layer) {
               item.displayed = false;
               this.mapService.removeFromGroup(item, config.group);
            } else {
               this.mapService.addToGroup(item, config.group);
               item.displayed = true;
            }
         });
      }
   }
   MapsService.$inject = ['configService', 'mapService'];


   angular.module("bathy.maps", ["explorer.layer.slider"])

      .directive("bathyMaps", ["mapsService", function (mapsService) {
         return {
            templateUrl: "bathy/maps/maps.html",
            link: function (scope) {
               mapsService.getConfig().then(function (data) {
                  scope.layersTab = data;
               });
            }
         };
      }])

      .controller("MapsCtrl", MapsCtrl)
      .service("mapsService", MapsService);
}