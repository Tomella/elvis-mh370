{

angular.module("bathy.bbox", ['geo.draw'])

.directive("bathyBboxShowAll", ['$rootScope', '$timeout', function($rootScope, $timeout) {
	return {
		link : function(scope, element) {
			element.on("click", function() {
				$timeout(function() {
					$rootScope.$broadcast("bathybboxshowall");
				});
			});
		}
	};
}])

.directive("bathyBboxHideAll", ['$rootScope', function($rootScope) {
	return {
		link : function(scope, element) {
			element.on("click", function() {
				$rootScope.$broadcast("bathybboxhideall");
			});
		}
	};
}])

.directive("bathyBboxShowVisible", ['$rootScope', 'mapService', function($rootScope, mapService) {
	return {
		link : function(scope, element) {
			element.on("click", function() {
				mapService.getMap().then(function(map) {
					$rootScope.$broadcast("bathybboxshowvisible", map.getBounds());
				});
			});
		}
	};
}])

.directive("bathyBbox", ['$rootScope', 'bboxService', function($rootScope, bboxService) {
	return {
		templateUrl : "wizard/bbox/bbox.html",
		scope : {
			data : "="
		},
		link : function(scope, element) {

			$rootScope.$on("bathybboxshowall", function() {
				scope.data.hasBbox = true;
			});

			$rootScope.$on("bathybboxhideall", function() {
				scope.data.hasBbox = false;
			});

			$rootScope.$on("bathybboxshowvisible", function(event, bounds) {
				var myBounds = scope.data.bounds,
					draw = bounds.getWest() < myBounds.xMin &&
                        bounds.getEast() > myBounds.xMax &&
                        bounds.getNorth() > myBounds.yMax &&
                        bounds.getSouth() < myBounds.yMin;

				scope.data.hasBbox = draw;
			});

			scope.$watch("data.hasBbox", function(newValue) {
				if(newValue) {
					bboxService.draw(scope.data).then(function(bbox) {
						scope.bbox = bbox;
					});
				} else {
					scope.bbox = bboxService.remove(scope.bbox);
				}
			});

			scope.toggle = function() {
				var draw = scope.data.hasBbox = !scope.data.hasBbox;
			};

			scope.$on("$destroy", function() {
				if(scope.data.hasBbox) {
					scope.bbox = bboxService.remove(scope.bbox);
				}
			});
		}
	};
}])

.factory("bboxService", ['mapService', function(mapService) {
	var normalLayerColor = "#ff7800",
		hilightLayerColor = 'darkblue';

	return {
		draw : function(data) {
			var parts = data.bbox.split(" "),
				bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

			return mapService.getMap().then(function(map) {
				// create an orange rectangle
				var layer = L.rectangle(bounds, {fill: false, color: normalLayerColor, weight: 2, opacity: 0.8});
				layer.addTo(map);
				map.fitBounds(bounds);
				return layer;
			});
		},

		remove : function(bbox) {
			if(bbox){
				bbox._map.removeLayer(bbox);
			}
			return null;
		}
	};

}]);

}
