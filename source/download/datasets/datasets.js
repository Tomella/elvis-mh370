{
   class DatasetsService {
      constructor($http, $rootScope, configService, mapService) {
         this.$http = $http;
         this.configService = configService;
         this.mapService = mapService;
         this._data = {
            active: "groups"
         };
         this.getDatasets().then(response => {
            this._data.types = response.data.available_data;
            this.makeList();
            this.showTiles();
         });
      }

      setBounds(clip) {
         this._data.bounds = clip;

         let maxX = clip[2];
         let maxY = clip[3];
         let minX = clip[0];
         let minY = clip[1];
         let x = 1; // Set the indices once
         let y = 0; // Set the indices once

         this._data.list.forEach(tile => {
            let min = tile.bbox[0];
            let max = tile.bbox[1];
            tile.intersects = (min[x] < maxX && max[x] > minX) && (min[y] < maxY && max[y] > minY);
            tile.downloadables.forEach(downloadable => {
               downloadable.selected &= tile.intersects; // Deselect any that are selected but aren't within the bounds.
            });
         });

         let bounds = [[minY, minX], [maxY, maxX]];
         if (this.rectangle) {
            this.rectangle.setBounds(bounds);
         } else {
            this.mapService.getMap().then(map => {
               this.rectangle = L.rectangle(bounds, {color: "#f80", weight: 2});
               this.rectangle.addTo(map);
            });
         }
      }

      get data() {
         return this._data;
      }

      zoom(dataset) {
         this.mapService.getMap().then(map => {
            // We need to buffer on the right.
            let bounds = dataset.bbox;
            let xmax = bounds[1][1];
            let xmin = bounds[0][1];
            let width = xmax - xmin;
            let wideX = bounds[1][1] + width;

            let bbox = [
               bounds[0],
               [bounds[1][0], wideX < 180 ? wideX : 180]
            ];

            map.fitBounds(bbox, { animate: true, padding: [80, 80] });
         });
      }

      show(dataset) {
         this.mapService.getMap().then(map => {
            if (this._showDataset) {
               map.removeLayer(this._showDataset);
               this._showDataset = null;
            }

            if (dataset) {
               this._showDataset = L.polygon(dataset.polygon, { color: "#f00" });
               this._showDataset.addTo(map);
            }
         });
      }

      makeList() {
         let list = this._data.list = [];
         let keys = {};

         this._data.types.forEach(type => {
            let dataType = type.data_type;

            type.tiles.forEach(tile => {
               let bbox = tile.bbox.split(",").map(str => +str);
               tile.bbox = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
               tile.polygon = [
                  [bbox[1], bbox[0]],
                  [bbox[1], bbox[2]],
                  [bbox[3], bbox[2]],
                  [bbox[3], bbox[0]],
                  [bbox[1], bbox[0]]
               ];

               // Used to filter those datasets within view
               tile.intersects = true;
               tile.center = tile.centre_pt.split(",").map(str => +str).reverse();
               tile.dataType = dataType;

               if (!keys[tile.tile_id]) {
                  list.push(tile);
                  keys[tile.tile_id] = true;
               }
            });
         });
         console.log(this._data);
      }

      showTiles() {
         let latlngs = [];
         this._data.list.forEach(item => {
            latlngs.push(item.polygon);
         });
         this.polys = L.multiPolygon(latlngs, { color: '#dddddd', fill: false, weight: 1 });
         this.mapService.getMap().then(map => {
            this.polys.addTo(map);
         });
      }

      getDatasets() {
         return this.configService.getConfig("datasets").then(config => {
            return this.$http.get(config.datasetsUrl);
         });
      }
   }
   DatasetsService.$inject = ["$http", "$rootScope", "configService", "mapService"];

   angular.module("bathy.datasets", ["bathy.datasets.type"])
      .directive("datasetsContainer", ["$rootScope", "datasetsService", function ($rootScope, datasetsService) {
         return {
            templateUrl: "download/datasets/datasets.html",
            restrict: "AE",
            link: function (scope) {
               scope.datasets = datasetsService.data;

               $rootScope.$on('bathy.bounds.draw', (event, clip) => {
                  datasetsService.setBounds(clip);
               });
            }
         };
      }])

      .service("datasetsService", DatasetsService)

      .filter("spatialSort", [function () {
         return function (items) {
            return items;
         };
      }]);
}