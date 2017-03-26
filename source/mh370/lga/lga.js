/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {
'use strict';

angular.module("mh370.lga", [])

.directive("mh370Lga", ['$log', '$timeout', 'lgaService', function($log, $timeout, lgaService) {
	return {
		restrict : "AE",
		templateUrl : "mh370/lga/lga.html",
		link : function(scope, element) {
			var timeout;

			lgaService.load().then(function(data) {
				scope.lgaData = data;
			});

			scope.changing = function() {
				$log.info("Cancel close");
				$timeout.cancel(timeout);
			};

			scope.cancel = cancel;

			scope.zoomToLocation = function(region) {
				lgaService.zoomToLocation(region);
				cancel();
			};

			function cancel() {
				$timeout.cancel(timeout);
				timeout = $timeout(function() {
					$log.info("Clear filter");
					scope.nameFilter = "";
				}, 7000);
			}
		}
	};
}])

.provider("lgaService", LgaServiceProvider)

.filter("mh370FilterList", function() {
	return function(list, filter, max) {
		var response = [],
			lowerFilter, count;

		if(!filter) {
			return response;
		}
		if(!max) {
			max = 50;
		}

		lowerFilter = filter.toLowerCase();

		if(list) {
			count = 0;
			list.some(function(item) {
				if(item.name.toLowerCase().indexOf(filter) > -1) {
					response.push(item);
					count++;
				}
				return count > max;
			});
		}
		return response;
	};
});

function LgaServiceProvider() {
	var statesUrl = "mh370/resources/config/states.json",
		lgasUrl = "mh370/resources/config/lgas.json",
		lgaShapeUrl = "service/area/lga/",
		lgaData = {},
		lgaTimeout,
		lgaLayer,
		lgaFadeLayer;

	this.setReferenceUrl = function(url) {
		lgasUrl = url;
	};

	this.$get = ['$http', '$q', '$timeout', 'mapService', function lgaServiceFactory($http, $q, $timeout, mapService) {
		var service = {
			load : function() {
				$http.get(lgasUrl, {cache : true}).then(function(response) {
				   	lgaData.lgas = response.data.lgas;
				});

				$http.get(statesUrl, {cache : true}).then(function(response) {
				   	lgaData.states = response.data.states;
				});
				return $q.when(lgaData);
			},

			zoomToLocation : function(region) {
				var bbox = region.bbox;

				mapService.getMap().then(function(map) {
					map.fitBounds([
					   [bbox.yMin, bbox.xMin],
					   [bbox.yMax, bbox.xMax]
					]);

					showLayer(map, region.name);
				});
			}
		};
		return service;

		function showLayer(map, name) {
			var opacity = 1;
			if(lgaFadeLayer) {
				$timeout.cancel(lgaTimeout);
				map.removeLayer(lgaFadeLayer);
			}
			lgaFadeLayer = L.esri.featureLayer({
				url: lgaShapeUrl + encodeURIComponent(name),
				style : {
					fill:false,
					opacity:1
				}
			});

			map.addLayer(lgaFadeLayer);

			lgaTimeout = $timeout(fade, 5000);

			function fade() {
				opacity -= 0.05;
				if(opacity <= 0) {
					map.removeLayer(lgaFadeLayer);
				} else {
					lgaFadeLayer.setStyle({opacity:opacity});
					lgaTimeout = $timeout(fade, 1000);
				}
			}
		}

	}];
}

})(angular);