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
         // Clear previous selections
         this._data.list.forEach(dl => dl.selected = false);

         this._data.bounds = clip;

         let maxX = clip[2];
         let maxY = clip[3];
         let minX = clip[0];
         let minY = clip[1];
         let x = 1; // Set the indices once
         let y = 0; // Set the indices once
         let bbox = [minX, minY, maxX, maxY];

         this._data.tiles.forEach(tile => {
            let intersects;

            if (tile.type === "mosaic") {
               var poly = {
                  type: "Feature",
                  properties: {},
                  geometry: {
                     type: "Polygon",
                     coordinates: tile.polygon
                  }
               };
               let clipped = turf.bboxClip(poly, bbox);
               intersects = !!clipped.geometry.coordinates.length;
               tile.clipped = intersects ? clipped.geometry.coordinates[0].map(point => [point[1], point[0]]) : null;
            } else {
               let min = tile.bbox[0];
               let max = tile.bbox[1];
               intersects = (min[x] < maxX && max[x] > minX) && (min[y] < maxY && max[y] > minY);
            }

            tile.intersects = intersects;
            tile.downloadables.forEach(downloadable => {
               downloadable.selected &= tile.intersects; // Deselect any that are selected but aren't within the bounds.
            });
         });

         this.bounds = [[minY, minX], [maxY, maxX]];
         if (this.rectangle) {
            if (this.bounds) {
               this.rectangle.setBounds(this.bounds);
            }
         } else {
            this.mapService.getMap().then(map => {
               this.rectangle = L.rectangle(this.bounds, { color: "#f80", weight: 2 });
               this.rectangle.addTo(map);
            });
         }
      }

      get data() {
         return this._data;
      }

      zoom(dataset) {
         this.mapService.getMap().then(map => {
            let bounds;
            if (dataset.type === "mosaic" && this.rectangle) {
               bounds = map.fitBounds(this.rectangle.getBounds());
               return;
            }
            bounds = dataset.bbox;

            // We need to buffer on the right.
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
               if (dataset.type === "mosaic") {
                  this._showDataset = L.polygon(dataset.clipped, { color: "#f00", weight: 2 });
               } else {
                  this._showDataset = L.polygon(dataset.polygon, { color: "#f00" });
               }
               this._showDataset.addTo(map);
            }
         });
      }

      makeList() {
         let list = this._data.list = [];
         let tiles = this._data.tiles = [];
         let formats = {};
         this._data.formats = [];

         this._data.types.forEach(type => {
            let dataType = type.data_type;

            type.tiles = type.tiles || []; // Make sure we have a container.
            type.tiles.forEach(tile => {
               tiles.push(tile);
               tile.type = "dataset";

               let bbox = tile.bbox.split(",").map(str => +str);
               tile.bbox = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
               tile.polygon = [
                  [bbox[1], bbox[0]],
                  [bbox[1], bbox[2]],
                  [bbox[3], bbox[2]],
                  [bbox[3], bbox[0]],
                  [bbox[1], bbox[0]]
               ];

               tile.parent = type;

               // Used to filter those datasets within view
               tile.intersects = true;
               tile.center = tile.centre_pt.split(",").map(str => +str).reverse();
               tile.dataType = dataType;

               // Harvest unique formats
               tile.downloadables.forEach(downloadable => {
                  list.push(downloadable);
                  downloadable.parent = tile;
                  if (!formats[downloadable.format]) {
                     formats[downloadable.format] = downloadable.format;
                     this._data.formats.push({
                        name: downloadable.format,
                        selected: true
                     });
                  }
               });
            });

            // Turn a mosaic into our canonical form as used throughout the app.
            (type.mosaics || []).forEach(mosaic => {
               let tile = {
                  tile_id: "clipped mosaic",
                  bbox : [],
                  type: "mosaic",
                  downloadables : [{
                     format : "GEOTIFF",
                     file_name : mosaic.file_name
                  }]
               };

               let downloadable = tile.downloadables[0];
               downloadable.parent = tile;

               tile.dataType = dataType;
               tile.intersects = true;

               list.push(downloadable);

               tile.polygon = mosaic.geometry.coordinates;

               //  "bbox" : "102,-12,108,-8",
               let minX = Number.POSITIVE_INFINITY,
                  minY = Number.POSITIVE_INFINITY,
                  maxX = Number.NEGATIVE_INFINITY,
                  maxY = Number.NEGATIVE_INFINITY;

               tile.polygon.forEach(polygon => {
                  polygon.forEach(coord => {
                     minX = minX < coord[0] ? minX : coord[0];
                     minY = minY < coord[1] ? minY : coord[1];
                     maxX = maxX > coord[0] ? maxX : coord[0];
                     maxY = maxY > coord[1] ? maxY : coord[1];
                  });
               });

               tile.bbox = [[minY, minX], [maxY, maxX]];
               tile.center = [
                  minY + (maxY - minY) / 2,
                  minX + (maxX - minX) / 2
               ];
               type.tiles.push(tile);
               tiles.push(tile);
            });
            // So now we have the mosaics
         });
         // Sort it alphabetically
         this._data.formats.sort((a, b) => a.name > b.name);
         console.log(this._data);
      }

      showTiles() {
         let latlngs = [];
         this._data.tiles.forEach(item => {
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

   angular.module("bathy.datasets", ["bathy.datasets.controls", "bathy.datasets.type"])
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

      .directive("formatsFilter", ["datasetsService", function (datasetsService) {
         return {
            templateUrl: "download/datasets/formatsfilter.html",
            restrict: "AE",
            scope: {
               formats: "="
            },
            link: function (scope) {
               scope.model = {
                  get all() {
                     return scope.formats ? scope.formats.every(format => format.selected) : false;
                  },

                  set all(value) {
                     scope.formats.forEach(format => format.selected = value);
                  }
               };
               scope.datasets = datasetsService.data;
            }
         };
      }])

      .service("datasetsService", DatasetsService)

      .filter("spatialSort", [function () {
         return function (items) {
            return items;
         };
      }])

      .filter("someIntersects", [function () {
         return function (types) {
            return types ? types.filter(type =>
               type.tiles.some(tile => tile.intersects && tile.downloadables)
            ) : [];
         };
      }]);
}