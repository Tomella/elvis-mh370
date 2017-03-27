
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
/**
 * This version relies on 0.0.4+ of explorer-path-server as it uses the URL for intersection on the artesian basin plus the actual KML
 */
(function(angular, Exp, L) {
'use strict';

angular.module("bathy.elevation", [
                                  'graph',
                                  'explorer.crosshair',
                                  'explorer.flasher',
                                  'explorer.feature.summary',
                                  'geo.map',
                                  'geo.path'])

.directive("pathElevationPlot", ['$log', '$timeout', '$rootScope','$filter', 'elevationService', 'crosshairService',   'featureSummaryService',
             function($log, $timeout, $rootScope, $filter, elevationService, crosshairService, featureSummaryService) {
	var WIDTH = 1000,
		HEIGHT = 90,
		elevationStyle = {
			fill:"orange",
			fillOpacity : 0.4,
			stroke : "darkred",
			strokeWidth : 1.5
		},
		waterTableStyle = {
			fill:"lightblue",
			fillOpacity:0.8,
			stroke:"darkblue",
			strokeWidth : 1.5
		},
		infoLoading = '<span><img alt="Waiting..." src="resources/img/tinyloader.gif" ng-show="message.spinner" style="position:relative;top:2px;" width="12"></img></span>';

	return {
		templateUrl : "bathy/elevation/elevation.html",
		scope:true,
		controller : ['$scope', function($scope) {
			$scope.paths = [];
			$scope.config = {
					yLabel : "Elevation (m)",
					xLabel : "Distance: 3000m"
			};

			$rootScope.$on("elevation.plot.data", function(event, data) {
				$scope.length = data.length;
				$scope.geometry = data.geometry;
				$scope.config.xLabel = "Distance: " + $filter("length")(data.length, true);
				$scope.waterTable = null;

				if($scope.length && $scope.geometry) {
					elevationService.getElevation($scope.geometry, $scope.length).then(function(elevation) {
						// Keep a handle on it as we will generally build a collection after the first build
						$scope.elevation = {
								style: elevationStyle,
								data: elevation
						};
						// Show the range.
						$scope.config.leftText = "Elevation Range: " +
							$filter("length")(d3.min(elevation, function(d) { return d.z; }), true) + " to " +
							$filter("length")(d3.max(elevation, function(d) { return d.z; }), true);

						// If we got here we always want to wipe out existing paths.
						$scope.paths = [$scope.elevation];
					});

					elevationService.intersectsWaterTable($scope.geometry).then(function(intersects) {
						$scope.intersectsWaterTable = intersects;
					});
				}
			});

			$scope.getInfoText = function() {
				if(!$scope.infoText) {
					$scope.infoText = infoLoading;
					elevationService.getInfoText().then(function(html) {
						$scope.infoText = html;
					});
				}
			};

			$scope.toggleWaterTable = function() {
				var length = $scope.paths.length;
				// We have to clear the paths so that it re-renders from scratch.
				$scope.paths = [];
				// Then we re-render on the next animation frame.
				if($scope.waterTable) {
					$timeout(function() {
						if(length === 1) {
							$scope.paths = [$scope.elevation, $scope.waterTable];
						} else {
							$scope.paths = [$scope.elevation];
						}
					});
				} else {
					elevationService.getWaterTable($scope.geometry, $scope.length).then(function(waterTable) {
						$scope.waterTable = {
								style : waterTableStyle,
								data : waterTable
						};
						$scope.paths = [$scope.elevation, $scope.waterTable];
					});
				}
			};

			$scope.close = function() {
				$scope.paths = $scope.geometry = $scope.length = null;
			};
		}],

		link : function(scope, element) {
			scope.graphClick = function(event) {
				if(event.position) {
					var point = event.position.points[0].point;
					elevationService.panToPoint(point);
					scope.point = point;
				}
			};

			scope.graphLeave = function(event) {
				scope.position = null;
				crosshairService.remove();
				cancelDeferredView();
				$log.debug("Mouse left");
				if(scope.mapListener) {
					$log.info("offMapMove");
					featureSummaryService.offMapMove(scope.mapListener);
				}
			};

			scope.graphEnter = function(event) {
				$log.debug("Graph be entered");
			};

			scope.graphMove = function(event) {
				var point;

				scope.position = event.position;

				if(scope.position) {
					point = scope.position.point;
					window.eve = event;
					scope.position.markerLonlat = crosshairService.move(point);
					deferredView();
				}
				if(!scope.mapListener) {
					scope.mapListener = function() {
						cancelDeferredView();
						deferredView();
					};
					$log.info("onMapMove");
					featureSummaryService.onMapMove(scope.mapListener);
				}
				$log.debug("Mouse moving...");
			};

			scope.$watch("geometry", processGeometry);

			function processGeometry() {
				if(scope.line) {
					scope.line = elevationService.pathHide(scope.line);
				}
				if(scope.geometry) {
					scope.line = elevationService.pathShow(scope.geometry);
				} else {
					elevationService.hideWaterTable();
				}

			}

			function deferredView() {
				$log.info("Deferred view");
				featureSummaryService.deferView(scope.position).then(function(data) {
					scope.featuresUnderPoint = data;
				});
			}

			function cancelDeferredView() {
				$log.info("Cancel deferred view");
				featureSummaryService.cancelView();
				scope.featuresUnderPoint = null;
			}
		}
	};
}])

.directive('marsPanTo', ['$rootScope', 'mapService', function($rootScope, mapService) {
	var DEFAULTS = {
		eventName: "elevation.plot.data",
		options: {
			paddingTopLeft:[50, 50],
			paddingBottomRight:[50, 250]
		}
	};
	return {
		restrict: 'AE',
		scope: {
			eventName: "=",
			options: "="
		},
		link: function(scope) {
			angular.forEach(DEFAULTS, function(value, key) {
				if(typeof scope[key] === "undefined") {
					scope[key] = value;
				}
			});

			$rootScope.$on(scope.eventName, function(event, data) {
				var line = L.polyline(data.geometry);
				var bounds = line.getBounds();
				mapService.getMap().then(function(map) {
					map.fitBounds(bounds, scope.options);
				});
			});
		}
	};
}])

.directive('marsInfoElevation', ['$log', 'elevationService', function($log, elevationService){
	return {
		templateUrl:"bathy/elevation/elevationInfo.html",
		scope:true,
		link : function(scope, element) {
			scope.toggleWaterTableShowing = function() {
				scope.state = elevationService.getState();

				if(!elevationService.isWaterTableShowing()) {
					elevationService.showWaterTable();
				} else {
					elevationService.hideWaterTable();
				}
			};
		}
	};
}])

.provider("elevationService", function ConfigServiceProvider() {
	var pointCount = 500,
		elevationUrl = "service/path/elevation",
		waterTableUrl = "service/path/waterTable",
		artesianBasinKmlUrl = "service/artesianBasin/geometry/kml",
		intersectUrl = "service/artesianBasin/intersects",
		waterTableLayer = null,
		map,
		state = {
			isWaterTableShowing : false
		};

	this.setIntersectUrl = function(url) {
		intersectUrl = url;
	};

	this.setKmlUrl = function(url) {
		artesianBasinKmlUrl = url;
	};

	this.setElevationUrl = function(url) {
		elevationUrl = url;
	};

	this.setWaterTableUrl = function(url) {
		waterTableUrl = url;
	};

	this.$get = ['$log', '$http', '$q', '$timeout', 'mapService', 'flashService', function($log, $http, $q, $timeout, mapService, flashService) {

		// We are safe doing this as it can't be triggered until the map is drawn anyway.
		mapService.getMap().then(function(olMap) {map = olMap;});

		var $elevation = {
			panToPoint : function(point) {
				mapService.zoomTo(point.y, point.x);
			},

			getState : function() {
				return state;
			},

			getElevation : function(geometry, distance) {
				var flasher = flashService.add("Retrieving elevation details...", 8000),
					wktStr = Exp.Util.toLineStringWkt(geometry);

				return $http.post(elevationUrl, {wkt:wktStr, count:pointCount, distance:distance}).then(function(response) {
					flashService.remove(flasher);
					return response.data;
				});
			},

			intersectsWaterTable :function(geometry) {
				var url = intersectUrl + (intersectUrl.indexOf("?") > -1?"":"?wkt=");
				return $http.get(url + Exp.Util.toLineStringWkt(geometry), {cache:true}).then(function(response) {
					return response.data.intersects;
				});
			},

			isWaterTableShowing : function() {
                /* jshint -W093 */
				return state.isWaterTableShowing = waterTableLayer !== null;
			},

			showWaterTable : function() {
				if(!waterTableLayer) {
					this.getWaterTableLayer().then(function(layer) {
						layer.addTo(map);
					});
				}
				state.isWaterTableShowing = true;
			},

			hideWaterTable : function() {
				if(waterTableLayer) {
					map.removeLayer(waterTableLayer);
				}
				waterTableLayer = null;
				state.isWaterTableShowing = false;
			},

			createWaterTableLayer : function() {
				return mapService.getMap().then(function(map) {
					var kml = new L.KML(artesianBasinKmlUrl, {async: true});

					return kml.on("loaded", function(e) {
						waterTableLayer = e.target;
						return waterTableLayer;
					});
				});
			},

			getWaterTableLayer : function() {
				return this.createWaterTableLayer();
			},

			getWaterTable : function(geometry, distance) {
				var flasher = flashService.add("Retrieving water table details...", 8000),
					wktStr = Exp.Util.toLineStringWkt(geometry);

				return getGrid(geometry);
			},

			getInfoText : function() {
				return $http("map/elevation/elevationInfo.html", {cache : true}).then(function(response) {
					return response.data;
				});
			},

			pathShow : function(latlngs) {
				var lineLayer = L.polyline(latlngs, {color: 'red', weight:3, opacity:0.8}).addTo(map);
				return lineLayer;
			},

			pathHide : function(lineLayer) {
				map.removeLayer(lineLayer);
				return null;
			}
		};

		return $elevation;

		function getGrid(geometry) {
			var pointsCount = 500;
			var deferred = $q.defer();

			var elevation1SecUrl = "http://www.ga.gov.au/gisimg/services/topography/dem_s_1s/ImageServer/WCSServer" +
				"?SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage&coverage=1&CRS=EPSG:4326" +
				//"&BBOX={xmin},{ymin},{xmax},{ymax}" +
				"&BBOX={bbox}" +
				"&FORMAT=GeoTIFF&RESX={resx}" +
				"&RESY={resy}&RESPONSE_CRS=EPSG:4326" +
				"&HEIGHT={resy}&WIDTH={resx}";

			var points = [];
			// Set some out of bounds figures
			var maxx = -181, maxy = -91, minx = 181, miny = 91;
			geometry.forEach(function(latlng) {
				points.push([latlng.lat, latlng.lng]);
				maxx = Math.max(maxx, latlng.lng);
				maxy = Math.max(maxy, latlng.lat);
				minx = Math.min(minx, latlng.lng);
				miny = Math.min(miny, latlng.lat);
			});

			// Do some zero sanity checks
			if(minx >= maxx) {
				maxx = minx + 0.00001;
			}

			if(miny >= maxy) {
				maxy = miny + 0.00001;
			}
			var bbox = minx +"," + miny + "," + maxx + "," + maxy;
			var dx = maxx - minx;
			var dy = maxy - miny;
			var aspect = dx / dy;
			var resy = 500;
			var resx = 500;

			if(aspect < 1) {
				resx = Math.ceil(resx * aspect);
			} else {
				resy = Math.ceil(resy / aspect);
			}

			console.log(bbox + "\n" + resx + "\n" + resy);

			var url = elevation1SecUrl.replace(/(\{resx\})/g, resx)
					.replace(/(\{resy\})/g, resy)
					.replace("{bbox}", bbox);

			$q.all([interpolate(), loadData()]).then(function(results) {

				console.log("WCS lenght = " + results[1].length);
				var response = results[0].map(function(point) {
					var lng = point[1];
					var lat = point[0];

					var x = Math.min(Math.floor((lng - minx) / dx * resx), resx - 1);
					var y = Math.min(Math.floor((lat - miny) / dy * resy), resy - 1);

					console.log((x + y * resx) + "\n" + x + " " + y);

					// Now we have to map that to the point in the pixel array.
					return {
						x: lng,
						y: lat,
						z: results[1][x + (resy - y) * resx]
					};
				});
				deferred.resolve(response);
			});

			function interpolate() {
				var deferred = $q.defer();
				$timeout(function () {
					var svg = d3.select("body").append("svg")
				    	.attr("width", 0)
				    	.attr("height", 0);

					var path = svg.append("path")
				    	.data([points])
				    	.attr("d", d3.svg.line()
				    	.tension(0) // Catmull–Rom
				    	.interpolate("cardinal-closed"));

					var element = path[0][0];
					var length = element.getTotalLength();
					var response = Array.apply(null, Array(pointsCount)).map(function (x, i) {
					    var p = element.getPointAtLength(length / pointsCount * i);
					    return [p.x, p.y];
					});

					svg.remove();
					deferred.resolve(response);
				});


				return deferred.promise;
			}

			function loadData() {
				var deferred = $q.defer();
				var request = new XMLHttpRequest();
				request.addEventListener( 'load', function ( event ) {
					var parser = new GeotiffParser();
					parser.parseHeader(event.target.response);
					var data = parser.loadPixels();
					deferred.resolve(data);
				}, false );

				request.addEventListener( 'progress', function ( event ) {
					deferred.notify( event );
				}, false );

				request.addEventListener( 'error', function ( event ) {
					deferred.reject( event );
				}, false );
				request.crossOrigin = '';

				request.open( 'GET', url, true );
				request.responseType = 'arraybuffer';
				request.send( null );

				return deferred.promise;
			}


			return deferred.promise;
		}
	}];
});

})(angular, Exp, L);
