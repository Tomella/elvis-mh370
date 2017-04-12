/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
{
	angular.module("bathy.bounds", [])

		.directive('bathyBounds', ['flashService', 'messageService', 'boundsService',
			function (flashService, messageService, boundsService) {
				let flasher;
				return {
					restrict: 'AE',
					link: function () {
						boundsService.init().then(null, null, function notify(message) {
							flashService.remove(flasher);
							switch (message.type) {
								case "error":
								case "warn":
								case "info":
									messageService[message.type](message.text);
									break;
								default:
									flashService.remove(flasher);
									flasher = flashService.add(message.text, message.duration ? message.duration : 8000, message.type === "wait");
							}
						});
					}
				};
			}])

		.factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService',
			function ($http, $q, $rootScope, $timeout, configService, flashService) {
				let clipTimeout, notify;
				return {
					init: function () {
						notify = $q.defer();
						$rootScope.$on('bathy.clip.drawn', function (event, clip) {
							send('Area drawn. Checking for data...');
							checkSize(clip).then(function (message) {
								if (message.code === "success") {
									$rootScope.$broadcast('bathy.bounds.draw', [
										clip.xMin,
										clip.yMin,
										clip.xMax,
										clip.yMax
									]);
									getList(clip);
								} else {
									$rootScope.$broadcast('bathy.clip.draw', { message: "oversize" });
								}
							});
						});
						return notify.promise;
					},

					cancelDraw: function () {
						drawService.cancelDrawRectangle();
					},

					checkSize: function (clip) {
						return checkSize(clip);
					}
				};

				function send(message, type, duration) {
					if (notify) {
						notify.notify({
							text: message,
							type: type,
							duration: duration
						});
					}
				}

				function checkSize(clip) {
					let deferred = $q.defer();
					let result = drawn(clip);
					if (result && result.code) {
						switch (result.code) {
							case "oversize":
								$timeout(function () {
									send("", "clear");
									send("The selected area is too large to process. Please restrict to approximately " +
										"2 degrees square.",
										"error");
									deferred.resolve(result);
								});
								break;
							case "undersize":
								$timeout(function () {
									send("", "clear");
									send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " +
										"Please update the drawn area.", "error");
									deferred.resolve(result);
								});
								break;
							default:
								return $q.when(result);
						}
					}
					return deferred.promise;
				}

				function underSizeLimit(clip) {
					let size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
					return size < 0.00000000001 || clip.xMax < clip.xMin;
				}

				function overSizeLimit(clip) {
					// Shouldn't need abs but it doesn't hurt.
					let size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
					return size > 2000;
				}

				function forceNumbers(clip) {
					clip.xMax = clip.xMax === null ? null : +clip.xMax;
					clip.xMin = clip.xMin === null ? null : +clip.xMin;
					clip.yMax = clip.yMax === null ? null : +clip.yMax;
					clip.yMin = clip.yMin === null ? null : +clip.yMin;
				}

				function drawn(clip) {
					//geoprocessService.removeClip();
					forceNumbers(clip);

					if (overSizeLimit(clip)) {
						return { code: "oversize" };
					}

					if (underSizeLimit(clip)) {
						return { code: "undersize" };
					}

					if (clip.xMax === null) {
						return { code: "incomplete" };
					}

					if (validClip(clip)) {
						return { code: "success" };
					}
					return { code: "invalid" };
				}

				// The input validator takes care of order and min/max constraints. We just check valid existance.
				function validClip(clip) {
					return clip &&
						angular.isNumber(clip.xMax) &&
						angular.isNumber(clip.xMin) &&
						angular.isNumber(clip.yMax) &&
						angular.isNumber(clip.yMin) &&
						!overSizeLimit(clip) &&
						!underSizeLimit(clip);
				}

				function getList(clip) {
					configService.getConfig("processing").then(function (conf) {
						let url = conf.intersectsUrl;
						if (url) {
							// Order matches the $watch signature so be careful
							let urlWithParms = url
								.replace("{maxx}", clip.xMax)
								.replace("{minx}", clip.xMin)
								.replace("{maxy}", clip.yMax)
								.replace("{miny}", clip.yMin);

							send("Checking there is data in your selected area...", "wait", 180000);
							$http.get(urlWithParms).then(function (response) {
								if (response.data && response.data.available_data) {
									let message = "There is no data held in your selected area. Please try another area.";
									send("", "clear");
									if (response.data.available_data) {
										response.data.available_data.forEach(function (group) {
											if (group.downloadables) {
												message = "There is intersecting data. Select downloads from the list.";
											}
										});
									}
									send(message, null, 4000);
									$rootScope.$broadcast('site.selection', response.data);
								}
							}, function (err) { // If it falls over we don't want to crash.
								send("The service that provides the list of datasets is currently unavailable. " +
									"Please try again later.", "error");
							});
						}
					});
				}
			}]);

}