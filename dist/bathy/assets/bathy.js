/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

"use strict";

{
   AboutService.$inject = ["configService"];

   angular.module('bathy.about', []).directive("bathyAbout", ["$interval", "aboutService", function ($interval, aboutService) {
      return {
         templateUrl: "bathy/about/about.html",
         scope: {},
         link: function link(scope, element) {
            var timer = void 0;

            scope.about = aboutService.getState();

            scope.over = function () {
               $interval.cancel(timer);
               scope.about.ingroup = true;
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.about.ingroup = false;
               }, 1000);
            };

            scope.unstick = function () {
               scope.about.ingroup = scope.about.show = scope.about.stick = false;
               element.find("a").blur();
            };
         }
      };
   }]).directive("bathyAboutLink", ["$interval", "aboutService", function ($interval, aboutService) {
      return {
         restrict: "AE",
         templateUrl: "bathy/about/button.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;
            scope.about = aboutService.getState();
            scope.over = function () {
               $interval.cancel(timer);
               scope.about.show = true;
            };

            scope.toggleStick = function () {
               scope.about.stick = !scope.about.stick;
               if (!scope.about.stick) {
                  scope.about.show = scope.about.ingroup = false;
               }
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.about.show = false;
               }, 700);
            };
         }
      };
   }]).factory("aboutService", AboutService);
}

function AboutService(configService) {
   var state = {
      show: false,
      ingroup: false,
      stick: false
   };

   configService.getConfig("about").then(function (response) {
      state.items = response;
   });

   return {
      getState: function getState() {
         return state;
      }
   };
}
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
{
	angular.module("bathy.bounds", []).directive('bathyBounds', ['flashService', 'messageService', 'boundsService', function (flashService, messageService, boundsService) {
		var flasher = void 0;
		return {
			restrict: 'AE',
			link: function link() {
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
	}]).factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', function ($http, $q, $rootScope, $timeout, configService, flashService) {
		var clipTimeout = void 0,
		    notify = void 0;
		return {
			init: function init() {
				notify = $q.defer();
				$rootScope.$on('bathy.clip.drawn', function (event, clip) {
					send('Area drawn. Checking for data...');
					_checkSize(clip).then(function (message) {
						if (message.code === "success") {
							$rootScope.$broadcast('bathy.bounds.draw', [clip.xMin, clip.yMin, clip.xMax, clip.yMax]);
							getList(clip);
						} else {
							$rootScope.$broadcast('bathy.clip.draw', { message: "oversize" });
						}
					});
				});
				return notify.promise;
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			},

			checkSize: function checkSize(clip) {
				return _checkSize(clip);
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

		function _checkSize(clip) {
			var deferred = $q.defer();
			var result = drawn(clip);
			if (result && result.code) {
				switch (result.code) {
					case "oversize":
						$timeout(function () {
							send("", "clear");
							send("The selected area is too large to process. Please restrict to approximately " + "2 degrees square.", "error");
							deferred.resolve(result);
						});
						break;
					case "undersize":
						$timeout(function () {
							send("", "clear");
							send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " + "Please update the drawn area.", "error");
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
			var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
			return size < 0.00000000001 || clip.xMax < clip.xMin;
		}

		function overSizeLimit(clip) {
			// Shouldn't need abs but it doesn't hurt.
			var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
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
			return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
		}

		function getList(clip) {
			configService.getConfig("processing").then(function (conf) {
				var url = conf.intersectsUrl;
				if (url) {
					// Order matches the $watch signature so be careful
					var urlWithParms = url.replace("{maxx}", clip.xMax).replace("{minx}", clip.xMin).replace("{maxy}", clip.yMax).replace("{miny}", clip.yMin);

					send("Checking there is data in your selected area...", "wait", 180000);
					$http.get(urlWithParms).then(function (response) {
						if (response.data && response.data.available_data) {
							var message = "There is no data held in your selected area. Please try another area.";
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
					}, function (err) {
						// If it falls over we don't want to crash.
						send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
					});
				}
			});
		}
	}]);
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var RootCtrl = function RootCtrl(configService, mapService) {
      var _this = this;

      _classCallCheck(this, RootCtrl);

      mapService.getMap().then(function (map) {
         _this.map = map;
      });
      configService.getConfig().then(function (data) {
         _this.data = data;
      });
   };

   RootCtrl.$invoke = ['configService', 'mapService'];

   angular.module("BathyApp", ['explorer.config', 'explorer.confirm', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer', 'geo.baselayer.control', 'geo.draw', 'geo.map', 'geo.maphelper', 'geo.measure', 'bathy.autoscroll', 'bathy.about', 'bathy.bounds', 'bathy.clip', 'bathy.datasets', 'bathy.extent', 'bathy.header', 'bathy.maps', 'bathy.panes', 'bathy.plot', 'bathy.popover', 'bathy.reset', 'bathy.restrict.pan', 'bathy.select', "bathy.side-panel", 'bathy.splash', 'bathy.start', 'bathy.templates', 'bathy.toolbar'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
      configServiceProvider.location("bathy/resources/config/config.json?v=4");
      configServiceProvider.dynamicLocation("bathy/resources/config/configclient.json?");
      versionServiceProvider.url("bathy/assets/package.json");
      persistServiceProvider.handler("local");
      projectsServiceProvider.setProject("bathy");
   }]).controller("RootCtrl", RootCtrl).filter('bytes', function () {
      return function (bytes, precision) {
         if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
         if (typeof precision === 'undefined') precision = 0;
         var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
             number = Math.floor(Math.log(bytes) / Math.log(1024));
         return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
      };
   }).factory("userService", [function () {
      return {
         login: noop,
         hasAcceptedTerms: noop,
         setAcceptedTerms: noop,
         getUsername: function getUsername() {
            return "anon";
         }
      };
      function noop() {
         return true;
      }
   }]);

   // A couple of polyfills for ie11
   if (!('every' in Array.prototype)) {
      Array.prototype.every = function (tester, that /*opt*/) {
         for (var i = 0, n = this.length; i < n; i++) {
            if (i in this && !tester.call(that, this[i], i, this)) return false;
         }return true;
      };
   }

   if (!Array.from) {
      Array.from = function () {
         var toStr = Object.prototype.toString;
         var isCallable = function isCallable(fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
         };
         var toInteger = function toInteger(value) {
            var number = Number(value);
            if (isNaN(number)) {
               return 0;
            }
            if (number === 0 || !isFinite(number)) {
               return number;
            }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
         };
         var maxSafeInteger = Math.pow(2, 53) - 1;
         var toLength = function toLength(value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
         };

         // The length property of the from method is 1.
         return function from(arrayLike /*, mapFn, thisArg */) {
            // 1. Let C be the this value.
            var C = this;

            // 2. Let items be ToObject(arrayLike).
            var items = Object(arrayLike);

            // 3. ReturnIfAbrupt(items).
            if (arrayLike === null) {
               throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            // 4. If mapfn is undefined, then let mapping be false.
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
               // 5. else
               // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
               if (!isCallable(mapFn)) {
                  throw new TypeError('Array.from: when provided, the second argument must be a function');
               }

               // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
               if (arguments.length > 2) {
                  T = arguments[2];
               }
            }

            // 10. Let lenValue be Get(items, "length").
            // 11. Let len be ToLength(lenValue).
            var len = toLength(items.length);

            // 13. If IsConstructor(C) is true, then
            // 13. a. Let A be the result of calling the [[Construct]] internal method
            // of C with an argument list containing the single item len.
            // 14. a. Else, Let A be ArrayCreate(len).
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            // 16. Let k be 0.
            var k = 0;
            // 17. Repeat, while k < len… (also steps a - h)
            var kValue;
            while (k < len) {
               kValue = items[k];
               if (mapFn) {
                  A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
               } else {
                  A[k] = kValue;
               }
               k += 1;
            }
            // 18. Let putStatus be Put(A, "length", len, true).
            A.length = len;
            // 20. Return A.
            return A;
         };
      }();
   }
}
'use strict';

{
   angular.module('bathy.autoscroll', []).directive('autoScroll', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
      return {
         scope: {
            trigger: "@",
            y: "@",
            height: "@"
         },
         link: function link(scope, element, attrs) {
            var timeout, oldBottom, startHeight;

            if (scope.height) {
               startHeight = +scope.height;
            } else {
               startHeight = 100;
            }
            oldBottom = startHeight;

            element.on("scroll", function (event) {
               var scrollHeight = element.scrollTop(),
                   target = element.find(attrs.autoScroll),
                   totalHeight = target.height(),
                   scrollWindow = element.height(),
                   scrollBottom,
                   up;

               if (scrollWindow >= totalHeight) {
                  return;
               }
               scrollBottom = totalHeight - scrollHeight - scrollWindow;
               up = oldBottom < scrollBottom;
               oldBottom = scrollBottom;
               if (scrollBottom < startHeight && !up) {
                  // Add some debounce
                  if (timeout) {
                     $timeout.cancel(timeout);
                  }
                  timeout = $timeout(function () {
                     $rootScope.$broadcast(scope.trigger);
                  }, 30);
               }
            });
         }
      };
   }]);
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var ExtentService = function ExtentService(mapService, searchService) {
      _classCallCheck(this, ExtentService);

      var bbox = searchService.getSearchCriteria().bbox;

      if (bbox.fromMap) {
         enableMapListeners();
      }

      return {
         getParameters: function getParameters() {
            return bbox;
         }
      };

      function enableMapListeners() {
         mapService.getMap().then(function (map) {
            map.on("moveend", execute);
            map.on("zoomend", execute);
            execute();
         });
      }

      function disableMapListeners() {
         return mapService.getMap().then(function (map) {
            map.off("moveend", execute);
            map.off("zoomend", execute);
            return map;
         });
      }

      function execute() {
         mapService.getMap().then(function (map) {
            var bounds = map.getBounds();
            bbox.yMin = bounds.getSouth();
            bbox.xMin = bounds.getWest();
            bbox.yMax = bounds.getNorth();
            bbox.xMax = bounds.getEast();
            searchService.refresh();
         });
      }
   };

   ExtentService.$inject = ['mapService', 'searchService'];

   angular.module("bathy.extent", ["explorer.switch"]).directive("bathyExtent", ['extentService', function (extentService) {
      return {
         restrict: "AE",
         templateUrl: "bathy/extent/extent.html",
         controller: ['$scope', function ($scope) {
            $scope.parameters = extentService.getParameters();
         }],
         link: function link(scope, element, attrs) {}
      };
   }]).factory("extentService", ExtentService);
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var MapsCtrl = function MapsCtrl($rootScope, mapService, selectService, downloadService) {
      _classCallCheck(this, MapsCtrl);

      // We use the dummy layer group if
      var dummyLayerGroup = L.layerGroup([]),
          groups = {
         download: downloadService.getLayerGroup(),
         select: selectService.getLayerGroup()
      };
   };

   MapsCtrl.$inject = ['$rootScope', 'mapService', 'selectService', 'downloadService'];

   angular.module("bathy.groups", []).factory("GroupsCtrl", MapsCtrl);
}
'use strict';

{
	angular.module('bathy.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('bathyHeader', [function () {
		var defaults = {
			heading: "ICSM",
			headingtitle: "ICSM",
			helpurl: "help.html",
			helptitle: "Get help about ICSM",
			helpalttext: "Get help about ICSM",
			skiptocontenttitle: "Skip to content",
			skiptocontent: "Skip to content",
			quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
		};
		return {
			transclude: true,
			restrict: 'EA',
			templateUrl: "bathy/header/header.html",
			scope: {
				breadcrumbs: "=",
				heading: "=",
				headingtitle: "=",
				helpurl: "=",
				helptitle: "=",
				helpalttext: "=",
				skiptocontenttitle: "=",
				skiptocontent: "=",
				quicklinksurl: "="
			},
			link: function link(scope, element, attrs) {
				var data = angular.copy(defaults);
				angular.forEach(defaults, function (value, key) {
					if (!(key in scope)) {
						scope[key] = value;
					}
				});
			}
		};
	}]).factory('headerService', ['$http', function () {}]);
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var MapsCtrl = function () {
      function MapsCtrl(mapsService) {
         _classCallCheck(this, MapsCtrl);

         this.mapService = mapService;
      }

      _createClass(MapsCtrl, [{
         key: 'toggleLayer',
         value: function toggleLayer(data) {
            this.mapsService.toggleShow(data);
         }
      }]);

      return MapsCtrl;
   }();

   MapsCtrl.$inject = ['mapsService'];

   var MapsService = function () {
      function MapsService(configService, mapService) {
         _classCallCheck(this, MapsService);

         this.CONFIG_KEY = "layersTab";
         this.configService = configService;
         this.mapService = mapService;
         this.configService = configService;
      }

      _createClass(MapsService, [{
         key: 'getConfig',
         value: function getConfig() {
            return this.configService.getConfig(this.CONFIG_KEY);
         }
      }, {
         key: 'toggleShow',
         value: function toggleShow(item, groupName) {
            var _this = this;

            this.configService.getConfig(this.CONFIG_KEY).then(function (config) {
               if (item.layer) {
                  item.displayed = false;
                  _this.mapService.removeFromGroup(item, config.group);
               } else {
                  _this.mapService.addToGroup(item, config.group);
                  item.displayed = true;
               }
            });
         }
      }]);

      return MapsService;
   }();

   MapsService.$inject = ['configService', 'mapService'];

   angular.module("bathy.maps", ["explorer.layer.slider"]).directive("bathyMaps", ["mapsService", function (mapsService) {
      return {
         templateUrl: "bathy/maps/maps.html",
         link: function link(scope) {
            mapsService.getConfig().then(function (data) {
               scope.layersTab = data;
            });
         }
      };
   }]).controller("MapsCtrl", MapsCtrl).service("mapsService", MapsService);
}
"use strict";

{
   angular.module("bathy.panes", []).directive("bathyPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
      return {
         templateUrl: "bathy/panes/panes.html",
         scope: {
            defaultItem: "@",
            data: "="
         },
         controller: ['$scope', function ($scope) {
            var changeSize = false;

            $scope.view = $scope.defaultItem;

            $rootScope.$on('side.panel.change', function (event) {
               emitter();
               $timeout(emitter, 100);
               $timeout(emitter, 200);
               $timeout(emitter, 300);
               $timeout(emitter, 500);
               function emitter() {
                  var evt = document.createEvent("HTMLEvents");
                  evt.initEvent("resize", false, true);
                  window.dispatchEvent(evt);
               }
            });

            $scope.setView = function (what) {
               var oldView = $scope.view;
               var delay = 0;

               if ($scope.view === what) {
                  if (what) {
                     changeSize = true;
                     delay = 1000;
                  }
                  $scope.view = "";
               } else {
                  if (!what) {
                     changeSize = true;
                  }
                  $scope.view = what;
               }

               $rootScope.$broadcast("view.changed", $scope.view, oldView);

               if (changeSize) {
                  mapService.getMap().then(function (map) {
                     map._onResize();
                  });
               }
            };
            $timeout(function () {
               $rootScope.$broadcast("view.changed", $scope.view, null);
            }, 50);
         }]
      };
   }]);
}
"use strict";

{

   angular.module("bathy.plot", []).directive("bathyPlot", ['$log', function ($log) {
      return {
         restrict: "AE",
         scope: {
            line: "="
         },
         link: function link(scope, element, attrs, ctrl) {
            scope.$watch("line", function (newValue, oldValue) {
               $log.info(newValue);
            });
         }
      };
   }]);
}
'use strict';

{
	angular.module('bathy.popover', []).directive('bathyPopover', [function () {
		return {
			templateUrl: "bathy/popover/popover.html",
			restrict: 'A',
			transclude: true,
			scope: {
				closeOnEscape: "@",
				show: "=",
				containerClass: "=",
				direction: "@"
			},
			link: function link(scope, element) {
				if (!scope.direction) {
					scope.direction = "bottom";
				}

				if (scope.closeOnEscape && (scope.closeOnEscape === true || scope.closeOnEscape === "true")) {
					element.on('keyup', keyupHandler);
				}

				function keyupHandler(keyEvent) {
					if (keyEvent.which === 27) {
						keyEvent.stopPropagation();
						keyEvent.preventDefault();
						scope.$apply(function () {
							scope.show = false;
						});
					}
				}
			}

		};
	}]);
}
'use strict';

{
   angular.module('bathy.reset', []).directive('resetPage', function ($window) {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'bathy/reset/reset.html',
         controller: ['$scope', function ($scope) {
            $scope.reset = function () {
               $window.location.reload();
            };
         }]
      };
   });
}
"use strict";

{
   var servicesFactory = function servicesFactory(uris) {
      var protocols = {
         WFS: "OGC:WFS",
         WMS: "OGC:WMS"
      };

      function Services(uris) {
         this.uris = uris;
         this.container = {
            wms: null
         };

         if (uris) {
            this.services = uris.map(function (uri) {
               var service = new Service(uri);

               this.container.wms = service.isWms() ? service : this.container.wms;
               return service;
            }.bind(this));
         } else {
            this.services = [];
         }

         this.hasWms = function () {
            return this.container.wms !== null;
         };

         this.getWms = function () {
            return this.container.wms;
         };

         this.remove = function () {
            this.services.forEach(function (service) {
               service.remove();
            });
         };
      }

      function Service(doc) {
         var xmlDoc = $(doc);

         this.protocol = xmlDoc.attr("protocol");
         this.url = xmlDoc.text();
         this.layerNames = xmlDoc.attr("layerNames");
         this.name = xmlDoc.attr("name");
         this.description = xmlDoc.attr("description");
         this.handlers = [];

         this.isWfs = function () {
            return this.protocol === protocols.WFS;
         };

         this.isWms = function () {
            return this.protocol === protocols.WMS;
         };

         this.isSupported = function () {
            return typeof protocols[this.protocol] === "undefined";
         };

         this.addHandler = function (callback) {
            this.handlers.push(callback);
         };

         this.removeHandler = function (callback) {
            this.handlers.push(callback);
         };

         this.remove = function () {
            this.handlers.forEach(function (callback) {
               // They should all have a remove but you never know.
               if (this.callback.remove) {
                  callback.remove(this);
               }
            }.bind(this));
            this.handlers = [];
         };
      }

      Service.prototype = {
         getUrl: function getUrl() {
            if (url) {
               if (url.indexOf("?") < 0) {
                  return;
               } else {
                  return url.substr(0, url.indexOf("?"));
               }
            }
            return null;
         }
      };

      return new Services(uris);
   };

   var SelectService = function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
      var LAYER_GROUP_KEY = "Search Layers",
          baseUrl = "bathy/resources/config/select.json",
          parameters = {
         text: "",
         daterange: {
            enabled: false,
            upper: null,
            lower: null
         },
         bbox: {
            fromMap: true,
            intersects: true,
            yMax: null,
            yMin: null,
            xMax: null,
            xMin: null
         },
         defaultKeywords: [],
         keywords: []
      },
          timeout,
          cache,
          allDocs = {},
          busy = false,
          layers = {},
          selectLayerGroup,
          normalLayerColor = "#ff7800",
          hilightLayerColor = 'darkblue',
          service = {

         getSelectCriteria: function getSelectCriteria() {
            return parameters;
         },

         getLayerGroup: function getLayerGroup() {
            // Prime the layer group
            if (!selectLayerGroup) {
               selectLayerGroup = mapService.getGroup(LAYER_GROUP_KEY);
            }
            return selectLayerGroup;
         },

         setKeywords: function setKeywords(keywords) {},

         setFilter: function setFilter(filter) {},

         refresh: function refresh() {},

         getDaterange: function getDaterange() {
            return parameters.daterange;
         },

         more: function more() {},

         _executeQuery: function _executeQuery() {
            // Give them the lot as they will want the criteria as well
            $http.get(baseUrl, { cache: true }).then(function (response) {
               service.getLayerGroup();

               var data = response.data;

               data.response.docs.forEach(function (dataset) {
                  service._decorateDataset(dataset);
                  if (dataset.type === "group") {
                     dataset.docs.forEach(function (data) {
                        service._decorateDataset(data);
                     });
                  }
               });

               $rootScope.$broadcast("select.facet.counts", data);
               $rootScope.$broadcast("select.results.received", data);
            });
         },

         createLayer: function createLayer(dataset, color) {
            var bbox = dataset.bbox,
                key = dataset.primaryId,
                parts,
                bounds,
                layer;

            layer = layers[key];
            if (!layer) {

               if (!bbox) {
                  return null;
               }

               parts = bbox.split(" ");
               if (parts.length !== 4) {
                  return null;
               }

               if (!color) {
                  color = normalLayerColor;
               }
               bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

               // create a black rectangle
               layer = L.rectangle(bounds, {
                  fill: false,
                  color: "#000000",
                  width: 3,
                  clickable: false
               });

               layers[key] = layer;
            }
            this._decorateDataset(dataset);
            selectLayerGroup.addLayer(layer);
            return layer;
         },

         _decorateDataset: function _decorateDataset(dataset) {
            var layer = layers[dataset.primaryId];
            if (layer) {
               dataset.layer = layer;
               dataset.showLayer = true;
            } else {
               dataset.layer = null;
               dataset.showLayer = false;
               // Do we add the services to it?
               dataset.services = servicesFactory(dataset.dcUris);
               dataset.bounds = getBounds(dataset.bbox);
            }

            function getBounds(bbox) {
               var parts;
               if (!bbox) {
                  return null;
               } else {
                  parts = bbox.split(/\s/g);
                  return {
                     xMin: +parts[0],
                     xMax: +parts[2],
                     yMax: +parts[3],
                     yMin: +parts[1]
                  };
               }
            }
         },

         showWithin: function showWithin(datasets) {
            datasets.forEach(function (dataset) {
               var box = dataset.bbox,
                   coords,
                   xmin,
                   ymin,
                   xmax,
                   ymax;

               if (!box) {
                  service.removeLayer(dataset);
               } else {
                  coords = box.split(" ");
                  if (coords.length === 4 && within(+coords[0], +coords[1], +coords[2], +coords[3])) {
                     // show
                     service.createLayer(dataset);
                  } else {
                     // hide
                     service.removeLayer(dataset);
                  }
               }
            });

            function within(xmin, ymin, xmax, ymax) {
               var bbox = parameters.bbox;

               return xmin > bbox.xMin && xmax < bbox.xMax && ymin > bbox.yMin && ymax < bbox.yMax;
            }
         },

         toggle: function toggle(dataset) {
            if (dataset.showLayer) {
               this.removeLayer(dataset);
            } else {
               this.createLayer(dataset);
            }
         },

         toggleAll: function toggleAll(datasets) {
            var self = this,
                someNotShowing = datasets.some(function (dataset) {
               return !dataset.showLayer;
            });

            datasets.forEach(function (dataset) {
               if (someNotShowing) {
                  if (!dataset.showLayer) {
                     self.createLayer(dataset);
                  }
               } else {
                  if (dataset.showLayer) {
                     self.removeLayer(dataset);
                  }
               }
            });
            return !someNotShowing;
         },

         hideAll: function hideAll(datasets) {
            datasets.forEach(function (dataset) {
               if (dataset.showLayer) {
                  service.removeLayer(dataset);
               }
            });
         },

         hilight: function hilight(layer) {
            layer.setStyle({ color: hilightLayerColor });
         },

         lolight: function lolight(layer) {
            layer.setStyle({ color: normalLayerColor });
         },

         removeLayer: function removeLayer(dataset) {
            var key = dataset.primaryId,
                layer = layers[key];

            if (layer) {
               selectLayerGroup.removeLayer(layer);
               delete layers[key];
            }
            this._decorateDataset(dataset);
         }
      };

      execute();
      return service;

      function execute() {
         $timeout(function () {
            service._executeQuery();
         }, 100);
      }
   };
   SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];

   angular.module("bathy.select.service", []).factory("selectService", SelectService);
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var SelectCtrl = function () {
      function SelectCtrl($rootScope, configService, flashService, selectService) {
         var _this = this;

         _classCallCheck(this, SelectCtrl);

         this.flashService = flashService;
         this.selectService = selectService;

         $rootScope.$on("select.results.received", function (event, data) {
            //console.log("Received response")
            flashService.remove(_this.flasher);
            _this.data = data;
         });

         configService.getConfig("facets").then(function (config) {
            _this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
         });
      }

      _createClass(SelectCtrl, [{
         key: "select",
         value: function select() {
            this.flashService.remove(this.flasher);
            this.flasher = this.flashService.add("Selecting", 3000, true);
            this.selectService.setFilter(this.filter);
         }
      }, {
         key: "toggle",
         value: function toggle(result) {
            this.selectService.toggle(result);
         }
      }, {
         key: "toggleAll",
         value: function toggleAll() {
            this.selectService.toggleAll(this.data.response.docs);
         }
      }, {
         key: "showWithin",
         value: function showWithin() {
            this.selectService.showWithin(this.data.response.docs);
         }
      }, {
         key: "allShowing",
         value: function allShowing() {
            if (!this.data || !this.data.response) {
               return false;
            }
            return !this.data.response.docs.some(function (dataset) {
               return !dataset.showLayer;
            });
         }
      }, {
         key: "anyShowing",
         value: function anyShowing() {
            if (!this.data || !this.data.response) {
               return false;
            }
            return this.data.response.docs.some(function (dataset) {
               return dataset.showLayer;
            });
         }
      }, {
         key: "hideAll",
         value: function hideAll() {
            this.selectService.hideAll(this.data.response.docs);
         }
      }, {
         key: "hilight",
         value: function hilight(doc) {
            if (doc.layer) {
               this.selectService.hilight(doc.layer);
            }
         }
      }, {
         key: "lolight",
         value: function lolight(doc) {
            if (doc.layer) {
               this.selectService.lolight(doc.layer);
            }
         }
      }]);

      return SelectCtrl;
   }();

   SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];

   var SelectCriteriaCtrl = function () {
      function SelectCriteriaCtrl(selectService) {
         _classCallCheck(this, SelectCriteriaCtrl);

         this.criteria = selectService.getSelectCriteria();
         this.selectService = selectService;
      }

      _createClass(SelectCriteriaCtrl, [{
         key: "refresh",
         value: function refresh() {
            selectService.refresh();
         }
      }]);

      return SelectCriteriaCtrl;
   }();

   SelectCriteriaCtrl.$inject = ["selectService"];

   angular.module("bathy.select", ['bathy.select.service']).controller("SelectCtrl", SelectCtrl).controller("SelectCriteriaCtrl", SelectCriteriaCtrl).directive("bathySelect", [function () {
      return {
         templateUrl: "bathy/select/select.html",
         link: function link(scope, element, attrs) {
            console.log("Hello select!");
         }
      };
   }]).directive("selectDoc", [function () {
      return {
         templateUrl: "bathy/select/doc.html",
         link: function link(scope, element, attrs) {
            console.log("What's up doc!");
         }
      };
   }]).directive("selectGroup", [function () {
      return {
         templateUrl: "bathy/select/group.html",
         scope: {
            group: "="
         },
         link: function link(scope, element, attrs) {
            console.log("What's up doc!");
         }
      };
   }])

   /**
    * Format the publication date
    */
   .filter("pubDate", function () {
      return function (string) {
         var date;
         if (string) {
            date = new Date(string);
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
         }
         return "-";
      };
   })

   /**
    * Format the array of authors
    */
   .filter("authors", function () {
      return function (auth) {
         if (auth) {
            return auth.join(", ");
         }
         return "-";
      };
   })

   /**
    * If the text is larger than a certain size truncate it and add some dots to the end.
    */
   .filter("truncate", function () {
      return function (text, length) {
         if (text && text.length > length - 3) {
            return text.substr(0, length - 3) + "...";
         }
         return text;
      };
   });
}
"use strict";

{

   angular.module("bathy.splash", ["ui.bootstrap.modal"]).directive('bathySplash', ['$rootScope', '$uibModal', '$log', 'splashService', function ($rootScope, $uibModal, $log, splashService) {
      return {
         controller: ['$scope', 'splashService', function ($scope, splashService) {
            $scope.acceptedTerms = true;

            splashService.getReleaseNotes().then(function (messages) {
               $scope.releaseMessages = messages;
               $scope.acceptedTerms = splashService.hasViewedSplash();
            });
         }],
         link: function link(scope, element) {
            var modalInstance;

            scope.$watch("acceptedTerms", function (value) {
               if (value === false) {
                  modalInstance = $uibModal.open({
                     templateUrl: 'bathy/splash/splash.html',
                     size: "lg",
                     backdrop: "static",
                     keyboard: false,
                     controller: ['$scope', 'acceptedTerms', 'messages', function ($scope, acceptedTerms, messages) {
                        $scope.acceptedTerms = acceptedTerms;
                        $scope.messages = messages;
                        $scope.accept = function () {
                           modalInstance.close(true);
                        };
                     }],
                     resolve: {
                        acceptedTerms: function acceptedTerms() {
                           return scope.acceptedTerms;
                        },
                        messages: function messages() {
                           return scope.releaseMessages;
                        }
                     }
                  });
                  modalInstance.result.then(function (acceptedTerms) {
                     $log.info("Accepted terms");
                     scope.acceptedTerms = acceptedTerms;
                     splashService.setHasViewedSplash(acceptedTerms);
                  }, function () {
                     $log.info('Modal dismissed at: ' + new Date());
                  });
               }
            });

            $rootScope.$on("logoutRequest", function () {
               userService.setAcceptedTerms(false);
            });
         }
      };
   }]).factory("splashService", ['$http', function ($http) {
      var VIEWED_SPLASH_KEY = "bathy.accepted.terms",
          releaseNotesUrl = "bathy/resources/config/releasenotes.json";

      return {
         getReleaseNotes: function getReleaseNotes() {
            return $http({
               method: "GET",
               url: releaseNotesUrl + "?t=" + Date.now()
            }).then(function (result) {
               return result.data;
            });
         },
         hasViewedSplash: hasViewedSplash,
         setHasViewedSplash: setHasViewedSplash
      };

      function setHasViewedSplash(value) {
         if (value) {
            sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
         } else {
            sessionStorage.removeItem(VIEWED_SPLASH_KEY);
         }
      }

      function hasViewedSplash() {
         return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
      }
   }]).filter("priorityColor", [function () {
      var map = {
         IMPORTANT: "red",
         HIGH: "blue",
         MEDIUM: "orange",
         LOW: "gray"
      };

      return function (priority) {
         if (priority in map) {
            return map[priority];
         }
         return "black";
      };
   }]).filter("wordLowerCamel", function () {
      return function (priority) {
         return priority.charAt(0) + priority.substr(1).toLowerCase();
      };
   }).filter("sortNotes", [function () {
      return function (messages) {
         if (!messages) {
            return;
         }
         var response = messages.slice(0).sort(function (prev, next) {
            if (prev.priority == next.priority) {
               return prev.lastUpdate == next.lastUpdate ? 0 : next.lastUpdate - prev.lastUpdate;
            } else {
               return prev.priority == "IMPORTANT" ? -11 : 1;
            }
         });
         return response;
      };
   }]);
}
'use strict';

{
   angular.module("bathy.side-panel", []).factory('panelSideFactory', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
      var state = {
         left: {
            active: null,
            width: 0
         },

         right: {
            active: null,
            width: 0
         }
      };

      function setSide(state, value) {
         var response = state.active;

         if (response === value) {
            state.active = null;
            state.width = 0;
         } else {
            state.active = value;
         }
         return !response;
      }

      return {
         state: state,
         setLeft: function setLeft(value) {
            var result = setSide(state.left, value);
            if (result) {
               state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
            }
            return result;
         },

         setRight: function setRight(data) {
            state.right.width = data.width;
            var response = setSide(state.right, data.name);
            $rootScope.$broadcast('side.panel.change', {
               side: "right",
               data: state.right,
               width: data.width
            });
            return response;
         }
      };
   }]).directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}">' + '<ng-transclude></ng-transclude>' + '</div>',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;
         }
      };
   }]).directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'bathy/side-panel/side-panel-right.html',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;

            scope.closePanel = function () {
               panelSideFactory.setRight({ name: null, width: 0 });
            };
         }
      };
   }]).directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'bathy/side-panel/trigger.html',
         scope: {
            default: "@?",
            panelWidth: "@",
            name: "@",
            iconClass: "@",
            panelId: "@"
         },
         link: function link(scope) {
            scope.toggle = function () {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            };
            if (scope.default) {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            }
         }
      };
   }]).directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'bathy/side-panel/side-panel-left.html',
         link: function link(scope) {
            scope.left = panelSideFactory.state.left;

            scope.closeLeft = function () {
               panelSideFactory.setLeft(null);
            };
         }
      };
   }]);
}
"use strict";

{

   angular.module("bathy.restrict.pan", []).directive("restrictPan", ['mapService', function (mapService) {
      return {
         restrict: "AE",
         scope: {
            bounds: "="
         },
         link: function link(scope) {
            mapService.getMap().then(function (map) {

               // We expect ll and ur in bounds
               var bounds = scope.bounds,
                   ll = bounds[0],
                   ur = bounds[1],
                   southWest = L.latLng(ll[0], ll[1]),
                   northEast = L.latLng(ur[0], ur[1]),
                   restrict = L.latLngBounds(southWest, northEast);

               map.setMaxBounds(restrict);
               map.on('drag', function () {
                  map.panInsideBounds(restrict, { animate: false });
               });
            });
         }
      };
   }]);
}
"use strict";

{

   angular.module("bathy.toolbar", []).directive("bathyToolbar", [function () {
      return {
         templateUrl: "bathy/toolbar/toolbar.html",
         controller: 'toolbarLinksCtrl',
         transclude: true
      };
   }]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {

      var self = this;
      configService.getConfig().then(function (config) {
         self.links = config.toolbarLinks;
      });

      $scope.item = "";
      $scope.toggleItem = function (item) {
         $scope.item = $scope.item === item ? "" : item;
      };
   }]);
}
"use strict";

{
   var reduceToSelected = function reduceToSelected(downloadables, formats) {
      return (downloadables ? downloadables : []).filter(function (downloadable) {
         return downloadable.parent.intersects;
      }) // Only care about those that intersect and
      .filter(function (downloadable) {
         return downloadable.selected;
      }) // Those that are selected and
      .filter(function (downloadable) {
         return formats.some(function (format) {
            return format.name === downloadable.format && format.selected;
         });
      }); // The format is selected
   };

   angular.module("bathy.datasets.controls", ["bathy.datasets.type", "bathy.reviewing"]).directive("datasetsControls", ["reviewService", function (reviewService) {
      return {
         templateUrl: "download/datasets/controls.html",
         restrict: "AE",
         scope: {
            datasets: "="
         },
         link: function link(scope) {
            scope.review = function () {
               reviewService.setDownloads(scope.selectedDownloadables());
            };

            scope.hasSelectedDownloadables = function () {
               var state = scope.datasets;
               return reduceToSelected(state.list, state.formats).length > 0;
            };

            scope.selectedDownloadables = function () {
               var state = scope.datasets;
               return reduceToSelected(state.list, state.formats);
            };

            scope.sizeSelectedDownloadables = function () {
               var state = scope.datasets;
               return reduceToSelected(state.list, state.formats).reduce(function (acc, downloadable) {
                  return acc + +downloadable.file_size;
               }, 0);
            };
         }
      };
   }]).filter("selectedDownloadables", [function () {
      return function (downloadables, formats) {
         return reduceToSelected(downloadables, formats);
      };
   }]).filter("hasSelectedDownloadables", [function () {
      return function (downloadables, formats) {
         return reduceToSelected(downloadables, formats).length > 0;
      };
   }]);
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var DatasetsService = function () {
      function DatasetsService($http, $rootScope, configService, mapService) {
         var _this = this;

         _classCallCheck(this, DatasetsService);

         this.$http = $http;
         this.mapService = mapService;
         this._data = {
            active: "groups"
         };
         configService.getConfig().then(function (config) {
            _this.config = config;
            _this.getDatasets().then(function (response) {
               _this._data.types = response.data.available_data;
               _this.makeList();
               _this.showTiles();
            });
         });
      }

      _createClass(DatasetsService, [{
         key: "setBounds",
         value: function setBounds(clip) {
            var _this2 = this;

            // Clear previous selections
            this._data.list.forEach(function (dl) {
               return dl.selected = false;
            });

            this._data.bounds = clip;

            var maxX = clip[2];
            var maxY = clip[3];
            var minX = clip[0];
            var minY = clip[1];
            var x = 1; // Set the indices once
            var y = 0; // Set the indices once
            var bbox = [minX, minY, maxX, maxY];

            this._data.tiles.forEach(function (tile) {
               var intersects = void 0;

               if (tile.type === "mosaic") {
                  var poly = {
                     type: "Feature",
                     properties: {},
                     geometry: {
                        type: "Polygon",
                        coordinates: tile.polygon
                     }
                  };
                  var clipped = turf.bboxClip(poly, bbox);
                  intersects = !!clipped.geometry.coordinates.length;
                  tile.clipped = intersects ? clipped.geometry.coordinates[0].map(function (point) {
                     return [point[1], point[0]];
                  }) : null;
               } else {
                  var min = tile.bbox[0];
                  var max = tile.bbox[1];
                  intersects = min[x] < maxX && max[x] > minX && min[y] < maxY && max[y] > minY;
               }

               tile.intersects = intersects;
               tile.downloadables.forEach(function (downloadable) {
                  downloadable.selected &= tile.intersects; // Deselect any that are selected but aren't within the bounds.
               });
            });

            this.bounds = [[minY, minX], [maxY, maxX]];
            if (this.rectangle) {
               if (this.bounds) {
                  this.rectangle.setBounds(this.bounds);
               }
            } else {
               this.mapService.getMap().then(function (map) {
                  _this2.rectangle = L.rectangle(_this2.bounds, { color: "#f80", weight: 2 });
                  _this2.rectangle.addTo(map);
               });
            }
         }
      }, {
         key: "zoom",
         value: function zoom(dataset) {
            var _this3 = this;

            this.mapService.getMap().then(function (map) {
               var bounds = void 0;
               if (dataset.type === "mosaic" && _this3.rectangle) {
                  bounds = map.fitBounds(_this3.rectangle.getBounds());
                  return;
               }
               bounds = dataset.bbox;

               // We need to buffer on the right.
               var xmax = bounds[1][1];
               var xmin = bounds[0][1];
               var width = xmax - xmin;
               var wideX = bounds[1][1] + width;

               var bbox = [bounds[0], [bounds[1][0], wideX < 180 ? wideX : 180]];

               map.fitBounds(bbox, { animate: true, padding: [80, 80] });
            });
         }
      }, {
         key: "show",
         value: function show(dataset) {
            var _this4 = this;

            this.mapService.getMap().then(function (map) {
               if (_this4._showDataset) {
                  map.removeLayer(_this4._showDataset);
                  _this4._showDataset = null;
               }

               if (dataset) {
                  if (dataset.type === "mosaic") {
                     _this4._showDataset = L.polygon(dataset.clipped, { color: "#f00", weight: 2 });
                  } else {
                     _this4._showDataset = L.polygon(dataset.polygon, { color: "#f00" });
                  }
                  _this4._showDataset.addTo(map);
               }
            });
         }
      }, {
         key: "makeList",
         value: function makeList() {
            var _this5 = this;

            var list = this._data.list = [];
            var tiles = this._data.tiles = [];
            var formats = {};
            this._data.formats = [];

            this._data.types.forEach(function (type) {
               var dataType = type.data_type;

               type.tiles = type.tiles || []; // Make sure we have a container.
               type.metadata.url = _this5.config.metadataTemplate.replace("{id}", type.metadata.id);
               type.tiles.forEach(function (tile) {
                  tiles.push(tile);
                  tile.type = "dataset";

                  var bbox = tile.bbox.split(",").map(function (str) {
                     return +str;
                  });
                  tile.bbox = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
                  tile.polygon = [[bbox[1], bbox[0]], [bbox[1], bbox[2]], [bbox[3], bbox[2]], [bbox[3], bbox[0]], [bbox[1], bbox[0]]];

                  tile.parent = type;

                  // Used to filter those datasets within view
                  tile.intersects = true;
                  tile.center = tile.centre_pt.split(",").map(function (str) {
                     return +str;
                  }).reverse();
                  tile.dataType = dataType;

                  // Harvest unique formats
                  tile.downloadables.forEach(function (downloadable) {
                     list.push(downloadable);
                     downloadable.parent = tile;
                     if (!formats[downloadable.format]) {
                        formats[downloadable.format] = downloadable.format;
                        _this5._data.formats.push({
                           name: downloadable.format,
                           selected: true
                        });
                     }
                  });
               });

               // Turn a mosaic into our canonical form as used throughout the app.
               (type.mosaics || []).forEach(function (mosaic) {
                  var tile = {
                     label: mosaic.label,
                     bbox: [],
                     type: "mosaic",
                     downloadables: [{
                        format: "GEOTIFF",
                        file_name: mosaic.file_name
                     }]
                  };

                  var downloadable = tile.downloadables[0];
                  downloadable.parent = tile;

                  tile.dataType = dataType;
                  tile.intersects = true;

                  list.push(downloadable);

                  tile.polygon = mosaic.geometry.coordinates;

                  //  "bbox" : "102,-12,108,-8",
                  var minX = Number.POSITIVE_INFINITY,
                      minY = Number.POSITIVE_INFINITY,
                      maxX = Number.NEGATIVE_INFINITY,
                      maxY = Number.NEGATIVE_INFINITY;

                  tile.polygon.forEach(function (polygon) {
                     polygon.forEach(function (coord) {
                        minX = minX < coord[0] ? minX : coord[0];
                        minY = minY < coord[1] ? minY : coord[1];
                        maxX = maxX > coord[0] ? maxX : coord[0];
                        maxY = maxY > coord[1] ? maxY : coord[1];
                     });
                  });

                  tile.bbox = [[minY, minX], [maxY, maxX]];
                  tile.center = [minY + (maxY - minY) / 2, minX + (maxX - minX) / 2];
                  type.tiles.push(tile);
                  tiles.push(tile);
               });
               // So now we have the mosaics
            });
            // Sort it alphabetically
            this._data.formats.sort(function (a, b) {
               return a.name > b.name;
            });
            console.log(this._data);
         }
      }, {
         key: "showTiles",
         value: function showTiles() {
            var _this6 = this;

            var latlngs = [];
            this._data.tiles.forEach(function (item) {
               if (item.type === "mosaic") {
                  latlngs.push(item.polygon[0].map(function (point) {
                     return [point[1], point[0]];
                  }));
               } else {
                  latlngs.push(item.polygon);
               }
            });
            this.polys = L.multiPolygon(latlngs, { color: '#dddddd', fill: false, weight: 1 });
            this.mapService.getMap().then(function (map) {
               _this6.polys.addTo(map);
            });
         }
      }, {
         key: "getDatasets",
         value: function getDatasets() {
            return this.$http.get(this.config.datasetsUrl);
         }
      }, {
         key: "data",
         get: function get() {
            return this._data;
         }
      }]);

      return DatasetsService;
   }();

   DatasetsService.$inject = ["$http", "$rootScope", "configService", "mapService"];

   angular.module("bathy.datasets", ["bathy.datasets.controls", "bathy.datasets.type"]).directive("datasetsContainer", ["$rootScope", "datasetsService", function ($rootScope, datasetsService) {
      return {
         templateUrl: "download/datasets/datasets.html",
         restrict: "AE",
         link: function link(scope) {
            scope.datasets = datasetsService.data;

            $rootScope.$on('bathy.bounds.draw', function (event, clip) {
               datasetsService.setBounds(clip);
            });
         }
      };
   }]).directive("formatsFilter", ["datasetsService", function (datasetsService) {
      return {
         templateUrl: "download/datasets/formatsfilter.html",
         restrict: "AE",
         scope: {
            formats: "="
         },
         link: function link(scope) {
            scope.model = {
               get all() {
                  return scope.formats ? scope.formats.every(function (format) {
                     return format.selected;
                  }) : false;
               },

               set all(value) {
                  scope.formats.forEach(function (format) {
                     return format.selected = value;
                  });
               }
            };
            scope.datasets = datasetsService.data;
         }
      };
   }]).service("datasetsService", DatasetsService).filter("spatialSort", [function () {
      return function (items) {
         return items;
      };
   }]).filter("someIntersects", [function () {
      return function (types) {
         return types ? types.filter(function (type) {
            return type.tiles.some(function (tile) {
               return tile.intersects && tile.downloadables;
            });
         }) : [];
      };
   }]).filter("split", [function () {
      return function (text) {
         return text.split(/\n/g);
      };
   }]);
}
"use strict";

{
   angular.module("bathy.datasets.type", []).directive("datasetsType", ["datasetsService", function (datasetsService) {
      return {
         templateUrl: "download/datasets/type.html",
         restrict: "AE",
         scope: {
            name: "=",
            type: "="
         },
         link: function link(scope) {
            scope.show = function (dataset) {
               datasetsService.show(dataset);
            };
            scope.hide = function () {
               datasetsService.show(null);
            };
            scope.zoom = function (dataset) {
               datasetsService.zoom(dataset);
            };
         }
      };
   }]).directive("typeMetadata", [function () {
      return {
         templateUrl: "download/datasets/metadata.html",
         restrict: "AE",
         scope: {
            name: "=",
            metadata: "="
         },
         link: function link(scope) {}
      };
   }]).filter("selectedFormat", [function () {
      return function (downloadables, formats) {
         return (downloadables ? downloadables : []).filter(function (downloadable) {
            return formats.some(function (format) {
               return format.selected && format.name === downloadable.format;
            });
         });
      };
   }]).filter("withinBounds", [function () {
      return function (tiles) {
         return (tiles ? tiles : []).filter(function (tile) {
            return tile.intersects;
         });
      };
   }]).filter("sortFormat", function () {
      return function (formats) {
         return (formats ? formats : []).sort(function (a, b) {
            return a.format > b.format;
         });
      };
   });
}
"use strict";

{
   angular.module("bathy.start", ["bathy.datasets"]).directive("bathyDownload", [function () {
      return {
         templateUrl: "download/start/start.html",
         link: function link(scope, element, attrs) {
            console.log("Hello select!");
         }
      };
   }]);
}
'use strict';

{
   angular.module("bathy.reviewing", []).directive('bathyReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService', function ($rootScope, $uibModal, $log, messageService, reviewService) {
      return {
         controller: ['$scope', function ($scope, reviewService) {}],
         link: function link(scope, element) {
            var modalInstance;
            scope.data = reviewService.data;

            scope.$watch("data.reviewing", function (value) {
               if (value) {
                  modalInstance = $uibModal.open({
                     templateUrl: 'download/reviewing/reviewing.html',
                     size: "lg",
                     backdrop: "static",
                     keyboard: false,
                     controller: ['$scope', '$uibModalInstance', 'products', 'clip', function ($scope, $uibModalInstance, products, clip) {
                        $scope.clip = clip;
                        $scope.products = products;
                        $scope.accept = function () {
                           $uibModalInstance.close(true);
                        };

                        $scope.isValid = function () {
                           var data = this.data;
                           var valid = products.filter(function (product) {
                              return !product.removed;
                           }).length && data.email && data.outFormat;

                           return valid;
                        };

                        $scope.countAccepted = function () {
                           return products.filter(function (product) {
                              return !product.removed;
                           }).length;
                        };

                        $scope.cancel = function () {
                           $uibModalInstance.close(false);
                        };

                        $scope.noneSelected = function (products) {
                           return !products.some(function (product) {
                              return !product.removed;
                           });
                        };
                     }],
                     resolve: {
                        products: function products() {
                           return reviewService.data.downloads;
                        },
                        clip: function clip() {
                           return reviewService.data.clip;
                        }
                     }
                  });
                  modalInstance.result.then(function (run) {
                     if (run) {
                        reviewService.startExtract().then(function (response) {
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
   }]).directive("reviewEmail", ['reviewService', function (reviewService) {
      return {
         template: '<div class="input-group">' + '<span class="input-group-addon" id="nedf-email">Email</span>' + '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' + '</div>',
         restrict: "AE",
         link: function link(scope, element) {
            scope.data = reviewService.data;
            //console.log("data" + scope.data);
         }
      };
   }]).filter("sizeAcceptedProducts", [function () {
      return function (list) {
         return (list ? list : []).filter(function (item) {
            return !item.removed;
         }).reduce(function (acc, item) {
            return acc + +item.download.file_size;
         }, 0);
      };
   }]).filter("withinClip", [function () {
      return function (list, clip) {
         if (!clip) {
            return [];
         }

         return (list ? list : []).filter(function (item) {
            return !item.extent || item.extent.xMax >= clip.xMax && item.extent.xMin <= clip.xMin && item.extent.yMax >= clip.yMax && item.extent.yMin <= clip.yMin;
         });
      };
   }]).factory('reviewService', ['$http', 'clipService', 'configService', 'persistService', function ($http, clipService, configService, persistService) {
      var key = "bathy_download_email";
      var service = {
         data: {},

         setDownloads: function setDownloads(downloads) {
            this.data.downloads = downloads.map(function (download) {
               return {
                  download: download,
                  removed: false
               };
            });

            this.data.reviewing = true;
            this.data.clip = clipService.data.clip;
         },

         startExtract: function startExtract() {
            var clip = clipService.data.clip;
            var config = this.data.config;
            this.setEmail(this.data.email);
            var postData = {
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
            var selected = postData.selected;

            // Get the selected groups. This has become a bit ugly because the backend service wants the data in a funny way.
            var accumulator = {};
            var downloads = this.data.downloads.filter(function (product) {
               return !product.removed;
            }).forEach(function (product) {
               var download = product.download;
               var parent = download.parent;
               var groupName = parent.dataType;
               var postItem = {};

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
                  var group = accumulator[groupName];
                  if (!group) {
                     group = accumulator[groupName] = {
                        data_type: groupName,
                        files: []
                     };
                     selected.push(group);
                  }
                  var list = group.files;
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
            this.data.downloads.forEach(function (product) {
               product.download.selected = product.removed = false;
            });

            return $http({
               method: 'POST',
               url: config.processingUrl,
               data: postData,
               headers: { "Content-Type": "application/json" }
            }).then(function (response) {
               return {
                  status: "success",
                  message: "Your job has been submitted. Note that you will receive an email once the " + "job is complete and that it may take a few hours depending on the size of the dataset."
               };
            }, function (d) {
               return {
                  status: "error",
                  message: "Sorry but the service failed to respond. Try again later."
               };
            });
         },

         removeRemoved: function removeRemoved() {
            this.data.downloads.forEach(function (product) {
               product.removed = false;
            });
         },

         setEmail: function setEmail(email) {
            this.data.email = email;
            persistService.setItem(key, email);
         }
      };

      persistService.getItem(key).then(function (value) {
         service.data.email = value;
      });

      configService.getConfig("processing").then(function (processing) {
         service.data.config = processing;
      });

      return service;
   }]);
}
"use strict";

{

	angular.module("bathy.bbox", ['geo.draw']).directive("bathyBboxShowAll", ['$rootScope', '$timeout', function ($rootScope, $timeout) {
		return {
			link: function link(scope, element) {
				element.on("click", function () {
					$timeout(function () {
						$rootScope.$broadcast("bathybboxshowall");
					});
				});
			}
		};
	}]).directive("bathyBboxHideAll", ['$rootScope', function ($rootScope) {
		return {
			link: function link(scope, element) {
				element.on("click", function () {
					$rootScope.$broadcast("bathybboxhideall");
				});
			}
		};
	}]).directive("bathyBboxShowVisible", ['$rootScope', 'mapService', function ($rootScope, mapService) {
		return {
			link: function link(scope, element) {
				element.on("click", function () {
					mapService.getMap().then(function (map) {
						$rootScope.$broadcast("bathybboxshowvisible", map.getBounds());
					});
				});
			}
		};
	}]).directive("bathyBbox", ['$rootScope', 'bboxService', function ($rootScope, bboxService) {
		return {
			templateUrl: "wizard/bbox/bbox.html",
			scope: {
				data: "="
			},
			link: function link(scope, element) {

				$rootScope.$on("bathybboxshowall", function () {
					scope.data.hasBbox = true;
				});

				$rootScope.$on("bathybboxhideall", function () {
					scope.data.hasBbox = false;
				});

				$rootScope.$on("bathybboxshowvisible", function (event, bounds) {
					var myBounds = scope.data.bounds,
					    draw = bounds.getWest() < myBounds.xMin && bounds.getEast() > myBounds.xMax && bounds.getNorth() > myBounds.yMax && bounds.getSouth() < myBounds.yMin;

					scope.data.hasBbox = draw;
				});

				scope.$watch("data.hasBbox", function (newValue) {
					if (newValue) {
						bboxService.draw(scope.data).then(function (bbox) {
							scope.bbox = bbox;
						});
					} else {
						scope.bbox = bboxService.remove(scope.bbox);
					}
				});

				scope.toggle = function () {
					var draw = scope.data.hasBbox = !scope.data.hasBbox;
				};

				scope.$on("$destroy", function () {
					if (scope.data.hasBbox) {
						scope.bbox = bboxService.remove(scope.bbox);
					}
				});
			}
		};
	}]).factory("bboxService", ['mapService', function (mapService) {
		var normalLayerColor = "#ff7800",
		    hilightLayerColor = 'darkblue';

		return {
			draw: function draw(data) {
				var parts = data.bbox.split(" "),
				    bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

				return mapService.getMap().then(function (map) {
					// create an orange rectangle
					var layer = L.rectangle(bounds, { fill: false, color: normalLayerColor, weight: 2, opacity: 0.8 });
					layer.addTo(map);
					map.fitBounds(bounds);
					return layer;
				});
			},

			remove: function remove(bbox) {
				if (bbox) {
					bbox._map.removeLayer(bbox);
				}
				return null;
			}
		};
	}]);
}
"use strict";

{
   var DownloadCtrl = function DownloadCtrl(downloadService) {
      downloadService.data().then(function (data) {
         this.data = data;
      }.bind(this));

      this.remove = function () {
         downloadService.clear();
      };

      this.changeEmail = function (email) {
         downloadService.setEmail(email);
      };
   };
   DownloadCtrl.$inject = ["downloadService"];

   var DownloadService = function DownloadService($http, $q, $rootScope, mapService, persistService) {
      var key = "download_email",
          downloadLayerGroup = "Download Layers",
          mapState = {
         zoom: null,
         center: null,
         layer: null
      },
          _data = {
         email: null,
         item: null
      },
          service = {
         getLayerGroup: function getLayerGroup() {
            return mapService.getGroup(downloadLayerGroup);
         },

         setState: function setState(data) {
            if (data) {
               prepare();
            } else {
               restore(map);
            }

            function prepare() {
               var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

               if (mapState.layer) {
                  mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
               }
               if (!data.queryLayer) {
                  mapState.layer = L.rectangle(bounds, { color: "black", fill: false });
                  mapService.getGroup(downloadLayerGroup).addLayer(mapState.layer);
               }
            }

            function restore(map) {
               mapService.clearGroup(downloadLayerGroup);
               mapState.layer = null;
            }
         },

         add: function add(item) {
            this.clear();
            _data.item = item;
            _data.item.download = true;
            if (!item.processsing) {
               item.processing = {
                  clip: {
                     xMax: null,
                     xMin: null,
                     yMax: null,
                     yMin: null
                  }
               };
            }
         },

         clear: function clear() {
            if (_data.item) {
               _data.item.download = false;
               _data.item = null;
            }
         },

         setEmail: function setEmail(email) {
            persistService.setItem(key, email);
         },

         getEmail: function getEmail() {
            return persistService.getItem(key).then(function (value) {
               _data.email = value;
               return value;
            });
         },

         data: function data() {
            return $q.when(_data);
         }
      };

      return service;
   };
   DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'persistService'];

   angular.module("bathy.download", ['bathy.geoprocess']).directive("wizardPopup", ["downloadService", function (downloadService) {
      return {
         restrict: "AE",
         templateUrl: "wizard/download/popup.html",
         link: function link(scope) {
            downloadService.data().then(function (data) {
               scope.data = data;

               scope.$watch("data.item", function (newValue, oldValue) {
                  if (newValue) {
                     scope.stage = "bbox";
                  }

                  if (newValue || oldValue) {
                     downloadService.setState(newValue);
                  }
               });
            });
         }
      };
   }]).directive("wizardDownload", ["downloadService", function (downloadService) {
      return {
         restrict: "AE",
         controller: "DownloadCtrl",
         templateUrl: "wizard/download/popup.html",
         link: function link() {
            console.log("What the download...");
         }
      };
   }]).directive("bathyDownload", ['downloadService', function (downloadService) {
      return {
         templateUrl: "bathy/download/download.html",
         controller: "DownloadCtrl",
         link: function link(scope, element) {
            downloadService.data().then(function (data) {
               scope.data = data;
            });

            scope.$watch("data.item", function (item, old) {
               if (item || old) {
                  downloadService.setState(item);
               }
            });
         }
      };
   }]).directive("downloadAdd", ['$rootScope', 'downloadService', 'flashService', function ($rootScope, downloadService, flashService) {
      return {
         template: "<button type='button' class='undecorated' ng-click='toggle()'><span class='fa-stack'  tooltip-placement='right' tooltip='Extract data.'>" + "<i class='fa fa-lg fa-download' ng-class='{active:item.download}'></i>" + "</span></button>",
         restrict: "AE",
         scope: {
            item: "=",
            group: "="
         },
         link: function link(scope, element) {
            scope.toggle = function () {
               if (scope.item.download) {
                  downloadService.clear(scope.item);
               } else {
                  flashService.add("Select an area of interest that intersects the highlighted areas.");
                  downloadService.add(scope.item);
                  if (scope.group && scope.group.sysId) {
                     $rootScope.$broadcast('hide.wms', scope.group.sysId);
                  }
               }
            };
         }
      };
   }]).directive("downloadEmail", ['downloadService', function (downloadService) {
      return {
         template: '<div class="input-group">' + '<span class="input-group-addon" id="bathy-email">Email</span>' + '<input required="required" type="email" ng-change="download.changeEmail(email)" ng-model="email" class="form-control" placeholder="Email address to send download link" aria-describedby="bathy-email">' + '</div>',
         restrict: "AE",
         link: function link(scope, element) {
            downloadService.getEmail().then(function (email) {
               scope.email = email;
            });
         }
      };
   }]).directive("downloadFilename", ['flashService', 'downloadService', function (flashService, downloadService) {
      return {
         template: '<div class="input-group">' + '<span class="input-group-addon" id="bathy-filename">Filename</span>' + '<input type="text"' + ' ng-maxlength="30" ng-trim="true" ng-keypress="restrict($event)"' + ' ng-model="data.filename" class="form-control" placeholder="Optional filename" aria-describedby="bathy-filename">' + '<span class="input-group-addon" id="basic-addon2">.zip</span>' + '</div>' + '<div>Only up to 9 characters made up of alphanumeric or "_" allowed for file name</div>',
         restrict: "AE",
         scope: {
            data: "="
         },
         link: function link(scope, element) {
            var flasher;
            scope.restrict = function (event) {
               var key = event.keyCode;
               var char = String.fromCharCode(key).toUpperCase();
               if (key > 31 && !char.match(/[\_A-Z0-9]/ig)) {
                  flashService.remove(flasher);
                  flasher = flashService.add('Only alphanumeric characters or "_" allowed in filename.', 5000);
                  event.preventDefault();
               } else if (key > 31 && event.currentTarget.value && event.currentTarget.value.length >= 9) {
                  flashService.remove(flasher);
                  flasher = flashService.add('Filename is restricted to 9 characters.', 5000);
                  event.preventDefault();
               }
            };
         }
      };
   }]).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);
}
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

{

	angular.module("bathy.clip", ['geo.draw']).directive('clipInfoBbox', function () {
		return {
			restrict: 'AE',
			templateUrl: 'wizard/clip/infobbox.html'
		};
	}).directive("mapClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService', function ($rootScope, $timeout, clipService, messageService, mapService) {
		return {
			templateUrl: "wizard/clip/clip.html",
			scope: {
				bounds: "=",
				trigger: "=",
				drawn: "&"
			},
			link: function link(scope, element) {
				var timer = void 0;

				scope.clip = {
					xMax: null,
					xMin: null,
					yMax: null,
					yMin: null
				};
				scope.typing = false;

				if (typeof scope.showBounds === "undefined") {
					scope.showBounds = false;
				}
				mapService.getMap().then(function (map) {
					scope.$watch("bounds", function (bounds) {
						if (bounds && scope.trigger) {
							$timeout(function () {
								scope.initiateDraw();
							});
						} else if (!bounds) {
							clipService.cancelDraw();
						}
					});
				});

				scope.check = function () {
					$timeout.cancel(timer);
					timer = $timeout(function () {
						$rootScope.$broadcast('bathy.clip.drawn', scope.clip);
					}, 4000);
				};

				$rootScope.$on('bathy.clip.draw', function (event, data) {
					if (data && data.message === "oversize") {
						scope.oversize = true;
						$timeout(function () {
							delete scope.oversize;
						}, 6000);
					} else {
						delete scope.oversize;
					}
					scope.initiateDraw();
				});

				scope.initiateDraw = function () {
					messageService.info("Click on the map and drag to define your area of interest.");
					clipService.initiateDraw().then(drawComplete);
				};

				function drawComplete(data) {
					var c = scope.clip;
					var response = void 0;

					c.xMax = +data.clip.xMax;
					c.xMin = +data.clip.xMin;
					c.yMax = +data.clip.yMax;
					c.yMin = +data.clip.yMin;
					$rootScope.$broadcast('bathy.clip.drawn', c);
				}
			}
		};
	}]).factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
		var service = {
			initiateDraw: function initiateDraw() {
				this.data = null;
				return drawService.drawRectangle().then(drawComplete);
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			}
		};

		return service;

		function drawComplete(data) {
			service.data = {
				clip: {
					xMax: data.bounds.getEast().toFixed(5),
					xMin: data.bounds.getWest().toFixed(5),
					yMax: data.bounds.getNorth().toFixed(5),
					yMin: data.bounds.getSouth().toFixed(5)
				}
			};
			return service.data;
		}
	}]);
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var SearchCtrl = function () {
      function SearchCtrl($rootScope, configService, flashService, searchService) {
         var _this = this;

         _classCallCheck(this, SearchCtrl);

         this.configService = configService;
         this.flashService = flashService;
         this.searchService = searchService;

         $rootScope.$on("search.results.received", function (event, data) {
            //console.log("Received response")
            flashService.remove(_this.flasher);
            _this.data = data;
         });

         $rootScope.$on("more.search.results", function () {
            flashService.remove(_this.flasher);
            _this.flasher = flashService.add("Fetching more results", 1000, true);
            searchService.more();
         });

         configService.getConfig("facets").then(function (config) {
            _this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
         });
      }

      _createClass(SearchCtrl, [{
         key: "search",
         value: function search() {
            this.flashService.remove(this.flasher);
            this.flasher = this.flashService.add("Searching", 3000, true);
            this.searchService.setFilter(this.filter);
         }
      }, {
         key: "toggle",
         value: function toggle(result) {
            this.searchService.toggle(result);
         }
      }, {
         key: "toggleAll",
         value: function toggleAll() {
            this.searchService.toggleAll(this.data.response.docs);
         }
      }, {
         key: "showWithin",
         value: function showWithin() {
            this.searchService.showWithin(this.data.response.docs);
         }
      }, {
         key: "allShowing",
         value: function allShowing() {
            if (!this.data || !this.data.response) {
               return false;
            }
            return !this.data.response.docs.some(function (dataset) {
               return !dataset.showLayer;
            });
         }
      }, {
         key: "anyShowing",
         value: function anyShowing() {
            if (!this.data || !this.data.response) {
               return false;
            }
            return this.data.response.docs.some(function (dataset) {
               return dataset.showLayer;
            });
         }
      }, {
         key: "hideAll",
         value: function hideAll() {
            this.searchService.hideAll(this.data.response.docs);
         }
      }, {
         key: "hilight",
         value: function hilight(doc) {
            if (doc.layer) {
               this.searchService.hilight(doc.layer);
            }
         }
      }, {
         key: "lolight",
         value: function lolight(doc) {
            if (doc.layer) {
               this.searchService.lolight(doc.layer);
            }
         }
      }]);

      return SearchCtrl;
   }();

   SearchCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'searchService'];

   var SearchCriteriaCtrl = function () {
      function SearchCriteriaCtrl(searchService) {
         _classCallCheck(this, SearchCriteriaCtrl);

         this.searchService = searchService;
         this.criteria = searchService.getSearchCriteria();
      }

      _createClass(SearchCriteriaCtrl, [{
         key: "refresh",
         value: function refresh() {
            this.searchService.refresh();
         }
      }]);

      return SearchCriteriaCtrl;
   }();

   SearchCriteriaCtrl.$inject = ["searchService"];

   angular.module("bathy.search", ['bathy.search.service']).controller("SearchCtrl", SearchCtrl).controller("SearchCriteriaCtrl", SearchCriteriaCtrl).directive("bathySearch", [function () {
      return {
         templateUrl: "wizard/search/search.html"
      };
   }])

   /**
    * Format the publication date
    */
   .filter("pubDate", function () {
      return function (string) {
         var date;
         if (string) {
            date = new Date(string);
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
         }
         return "-";
      };
   })

   /**
    * Format the array of authors
    */
   .filter("authors", function () {
      return function (auth) {
         if (auth) {
            return auth.join(", ");
         }
         return "-";
      };
   })

   /**
    * If the text is larger than a certain size truncate it and add some dots to the end.
    */
   .filter("truncate", function () {
      return function (text, length) {
         if (text && text.length > length - 3) {
            return text.substr(0, length - 3) + "...";
         }
         return text;
      };
   });
}
"use strict";

{
   var GeoprocessService = function GeoprocessService($http, $q, $timeout, configService, downloadService, mapService, persistService) {
      var DEFAULT_DATASET = "dems1sv1_0",
          // TODO: We have to get this from the metadata somehow.
      geoprocessingTemplates,
          GEOPROCESS_LOGGING_URL = "service/log/geoprocess",
          clipLayer = null,
          map;

      configService.getConfig("initiateServiceTemplates").then(function (template) {
         geoprocessingTemplates = template;
      });

      mapService.getMap().then(function (lMap) {
         map = lMap;
      });

      function getUrl(data) {
         var custom, key, template;

         if (geoprocessingTemplates.custom) {
            custom = geoprocessingTemplates.custom[data.primaryId];
            if (custom) {
               key = custom.key;
               template = custom.templates[data[key]];
               if (template) {
                  return template;
               }
            }
         }
         return geoprocessingTemplates["default"];
      }

      return {
         queryLayer: function queryLayer(query, clip) {
            var deferred = $q.defer();

            var layer = L.esri.featureLayer({
               url: query.url
            });

            var bounds = L.latLngBounds([clip.yMin, clip.xMin], // top left
            [clip.yMax, clip.xMax] // bottom right
            );

            layer.query().intersects(bounds).ids(function (error, ids) {
               if (error) {
                  deferred.reject(error);
               } else {
                  deferred.resolve(ids);
               }
            });
            return deferred.promise;
         },

         outFormats: function outFormats() {
            return configService.getConfig("processing").then(function (data) {
               return data.outFormat;
            });
         },

         handleShowClip: function handleShowClip(clip) {
            this.removeClip();

            clipLayer = L.rectangle([[clip.yMin, clip.xMin], [clip.yMax, clip.xMax]], {
               weight: 2,
               opacity: 0.9,
               fill: false,
               color: "#000000",
               width: 3,
               clickable: false
            });

            clipLayer.addTo(map);
         },

         removeClip: function removeClip() {
            if (clipLayer) {
               map.removeLayer(clipLayer);
               clipLayer = null;
            }
         },

         addLayer: function addLayer(data) {
            return L.tileLayer.wms(data.parameters[0], data.parameters[1]).addTo(map);
         },

         removeLayer: function removeLayer(layer) {
            map.removeLayer(layer);
         },

         initiateJob: function initiateJob(data, email) {
            var dataset = DEFAULT_DATASET,
                // TODO Replace with real dataset file name from metadata.
            win,
                workingString = getUrl(data),
                processing = data.processing,
                log = {
               bbox: {
                  yMin: processing.clip.yMin,
                  yMax: processing.clip.yMax,
                  xMin: processing.clip.xMin,
                  xMax: processing.clip.xMax
               },
               geocatId: data.primaryId,
               crs: processing.outCoordSys.code,
               format: processing.outFormat.code
            };

            angular.forEach({
               basename: dataset,
               id: data.primaryId,
               yMin: processing.clip.yMin,
               yMax: processing.clip.yMax,
               xMin: processing.clip.xMin,
               xMax: processing.clip.xMax,
               outFormat: processing.outFormat.code,
               outCoordSys: processing.outCoordSys.code,
               filename: processing.filename ? processing.filename : "",
               email: email
            }, function (item, key) {
               workingString = workingString.replace("${" + key + "}", item);
            });

            $("#launcher")[0].src = workingString;

            downloadService.setEmail(email);
            $http.post(GEOPROCESS_LOGGING_URL, log);

            ga('send', 'event', 'bathy', 'click', 'FME data export: ' + JSON.stringify(log));
         },

         getConfig: function getConfig() {
            return configService.getConfig("processing");
         }
      };
   };
   GeoprocessService.$invoke = ['$http', '$q', '$timeout', 'configService', 'downloadService', 'ga', 'mapService', 'downloadService'];

   angular.module("bathy.geoprocess", []).directive("wizardGeoprocess", ['$http', '$q', '$timeout', 'geoprocessService', 'flashService', 'messageService', function ($http, $q, $timeout, geoprocessService, flashService, messageService) {
      return {
         restrict: "AE",
         templateUrl: "wizard/geoprocess/geoprocess.html",
         scope: {
            data: "="
         },
         link: function link(scope) {
            var clipMessage, clipTimeout, referenceLayer;

            geoprocessService.outFormats().then(function (data) {
               scope.outFormats = data;
            });

            scope.$watch("data", function (newData, oldData) {
               if (oldData) {
                  geoprocessService.removeClip();
                  removeReferenceLayer();
               }
               if (newData && newData != oldData) {
                  scope.stage = "bbox";
                  drawReferenceLayer();
               }
            });

            scope.$watchGroup(["data.processing.clip.xMax", "data.processing.clip.xMin", "data.processing.clip.yMax", "data.processing.clip.yMin"], function (newValues, oldValues, scope) {
               var result = void 0,
                   url = void 0;

               if (clipTimeout) {
                  $timeout.cancel(clipTimeout);
                  clipTimeout = null;
               }
               if (scope.data && scope.data.processing && scope.data.processing.clip && scope.data.processing.clip.xMax !== null) {
                  url = scope.config.extentCheckTemplates[scope.data.sysId];
                  clipMessage = flashService.add("Validating selected area...", 3000);

                  // Make really sure that all our stop points set this appropriately. We don't want the button locked out for ever.
                  scope.checkingOrFailed = !!url; // We only apply this to records that have a URL to check intersection against.
                  clipTimeout = $timeout(function () {
                     checkSize().then(function (result) {
                        try {
                           if (result && result.code == "success") {
                              if (url) {
                                 // Order matches the $watch signature so be careful
                                 var urlWithParms = url.replace("{maxx}", newValues[0]).replace("{minx}", newValues[1]).replace("{maxy}", newValues[2]).replace("{miny}", newValues[3]);
                                 flashService.remove(clipMessage);
                                 clipMessage = flashService.add("Checking there is data in your selected area...");
                                 $http.get(urlWithParms).then(function (response) {
                                    if (response.data && response.data.length > 0) {
                                       flashService.remove(clipMessage);
                                       if (response.data[0].Intersect === false) {
                                          messageService.error("There is no data covering the drawn area currently in this resolution dataset.", 6000);
                                          scope.stage = "bbox";
                                          drawReferenceLayer();
                                          // This is the only place that checkingOrFailed stays true;
                                       } else {
                                          if (response.data[0].Intersect === true) {
                                             clipMessage = flashService.add("There is intersecting data. Click \"Next\" if you are ready to proceed.", 5000);
                                          } else {
                                             clipMessage = flashService.add("Click \"Next\" if you are ready to proceed.", 4000);
                                          }
                                          scope.checkingOrFailed = false;
                                          geoprocessService.handleShowClip(scope.data.processing.clip);
                                       }
                                    }
                                    console.log(response);
                                 }, function (err) {
                                    // If it falls over we don't want to crash.
                                    scope.checkingOrFailed = false;
                                    geoprocessService.handleShowClip(scope.data.processing.clip);
                                    console.log("Service unavailable to check intersection");
                                 });
                              } else {
                                 geoprocessService.handleShowClip(scope.data.processing.clip);
                                 scope.checkingOrFailed = false;
                              }
                           }
                        } catch (e) {
                           // Very paranoid about setting it to block.
                           scope.checkingOrFailed = false;
                        }
                     });
                  }, 2000);
               }

               function checkSize() {
                  var deferred = $q.defer();

                  result = scope.drawn();
                  if (result && result.code) {
                     switch (result.code) {
                        case "oversize":
                           $timeout(function () {
                              flashService.remove(clipMessage);
                              messageService.error("The selected area is too large to process. Please restrict to approximately " + Math.sqrt(scope.data.restrictSize) + " degrees square.");
                              scope.stage = "bbox";
                              drawReferenceLayer();
                              deferred.resolve(result);
                           });
                           break;

                        case "undersize":
                           $timeout(function () {
                              flashService.remove(clipMessage);
                              messageService.error("X Min and Y Min should be smaller than X Max and Y Max, respectively. Please update the drawn area.");
                              scope.stage = "bbox";
                              drawReferenceLayer();
                              deferred.resolve(result);
                           });
                           break;
                        default:
                           return $q.when(result);
                     }
                  }
                  return deferred.promise;
               }
            });

            scope.drawn = function () {
               geoprocessService.removeClip();
               forceNumbers(scope.data.processing.clip);
               //flashService.remove(clipMessage);
               if (constrainBounds(scope.data.processing.clip, scope.data.bounds)) {
                  clipMessage = flashService.add("Redrawn to fit within data extent", 5000);
               }

               if (overSizeLimit(scope.data.processing.clip)) {
                  return { code: "oversize" };
               }

               if (underSizeLimit(scope.data.processing.clip)) {
                  return { code: "undersize" };
               }

               if (scope.data.processing.clip.xMax === null) {
                  return { code: "incomplete" };
               }

               //if(this.data.queryLayer) {
               //	geoprocessService.queryLayer(scope.data.queryLayer, scope.data.processing.clip).then(function(response) {
               //	});
               //} else
               if (validClip(scope.data.processing.clip)) {
                  return { code: "success" };
               }
               return { code: "invalid" };
            };

            scope.startExtract = function () {
               if (scope.allDataSet()) {
                  messageService.info("Your job has been submitted. Note that you will receive an email once the " + "job is complete and that it may take a few hours depending on the size of the dataset.");
                  flashService.add("You can select another area for processing.", 10000);
                  geoprocessService.initiateJob(scope.data, scope.email);
                  scope.data.download = false;
               }
            };

            scope.allDataSet = function () {
               var proc = scope.data && scope.data.processing ? scope.data.processing : null;
               // For it to be OK we need.
               return proc && scope.email && validClip(proc.clip) && proc.outCoordSys && proc.outFormat;
            };

            scope.validSansEmail = function () {
               var proc = scope.data && scope.data.processing ? scope.data.processing : null;
               // For it to be OK we need.
               return proc && validClip(proc.clip) && proc.outCoordSys && proc.outFormat;
            };

            scope.validClip = function (data) {
               return data && data.processing && validClip(data.processing.clip);
            };

            geoprocessService.getConfig().then(function (config) {
               scope.config = config;
            });

            function drawReferenceLayer() {
               removeReferenceLayer();
               if (scope.data.referenceLayer) {
                  referenceLayer = geoprocessService.addLayer(scope.data.referenceLayer);
               }
            }

            function removeReferenceLayer() {
               if (referenceLayer) {
                  geoprocessService.removeLayer(referenceLayer);
               }
            }

            function underSizeLimit(clip) {
               var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
               return size < 0.00000000001 || clip.xMax < clip.xMin;
            }

            function overSizeLimit(clip) {
               // Shouldn't need abs but it doesn't hurt.
               var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));

               return scope.data.restrictSize && size > scope.data.restrictSize;
            }

            function constrainBounds(c, p) {
               var flag = false,
                   ret = false;
               // Have we read the parameters yet?

               if (!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
                  return false;
               }

               ret = flag = +c.xMax < +p.xMin;
               if (flag) {
                  c.xMax = +p.xMin;
               }

               flag = +c.xMax > +p.xMax;
               ret = ret || flag;

               if (flag) {
                  c.xMax = +p.xMax;
               }

               flag = +c.xMin < +p.xMin;
               ret = ret || flag;
               if (flag) {
                  c.xMin = +p.xMin;
               }

               flag = +c.xMin > +c.xMax;
               ret = ret || flag;
               if (flag) {
                  c.xMin = c.xMax;
               }

               // Now for the Y's
               flag = +c.yMax < +p.yMin;
               ret = ret || flag;
               if (flag) {
                  c.yMax = +p.yMin;
               }

               flag = +c.yMax > +p.yMax;
               ret = ret || flag;
               if (flag) {
                  c.yMax = +p.yMax;
               }

               flag = +c.yMin < +p.yMin;
               ret = ret || flag;
               if (flag) {
                  c.yMin = +p.yMin;
               }

               flag = +c.yMin > +c.yMax;
               ret = ret || flag;
               if (flag) {
                  c.yMin = +c.yMax;
               }

               return ret;

               function empty(val) {
                  return angular.isUndefined(val) || val === "" || val === null;
               }
            }

            function forceNumbers(clip) {
               clip.xMax = clip.xMax === null ? null : +clip.xMax;
               clip.xMin = clip.xMin === null ? null : +clip.xMin;
               clip.yMax = clip.yMax === null ? null : +clip.yMax;
               clip.yMin = clip.yMin === null ? null : +clip.yMin;
            }

            // The input validator takes care of order and min/max constraints. We just check valid existance.
            function validClip(clip) {
               return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
            }
         }
      };
   }]).factory("geoprocessService", GeoprocessService).filter("sysIntersect", function () {
      return function (collection, extent) {
         // The extent may have missing numbers so we don't restrict at that point.
         if (!extent || !angular.isNumber(extent.xMin) || !angular.isNumber(extent.xMax) || !angular.isNumber(extent.yMin) || !angular.isNumber(extent.yMax)) {
            return collection;
         }

         return collection.filter(function (item) {

            // We know these have valid numbers if it exists
            if (!item.extent) {
               return true;
            }
            // We have a restriction
            return item.extent.xMin <= extent.xMin && item.extent.xMax >= extent.xMax && item.extent.yMin <= extent.yMin && item.extent.yMax >= extent.yMax;
         });
      };
   });
}
angular.module("bathy.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("bathy/about/about.html","<span class=\"about\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-class=\"(about.show || about.ingroup || about.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated about-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div class=\"aboutHeading\">About MH370 Bathymetry</div>\r\n   <div ng-repeat=\"item in about.items\">\r\n      <a ng-href=\"{{item.link}}\" name=\"about{{$index}}\" title=\"{{item.heading}}\" target=\"_blank\">\r\n         {{item.heading}}\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("bathy/about/button.html","<button ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-click=\"toggleStick()\" tooltip-placement=\"left\" uib-tooltip=\"About MH370 Bathymetry\"\r\n      class=\"btn btn-primary btn-default\">About</button>");
$templateCache.put("bathy/extent/extent.html","<div class=\"row\" style=\"border-top: 1px solid gray; padding-top:5px\">\r\n	<div class=\"col-md-5\">\r\n		<div class=\"form-inline\">\r\n			<label>\r\n				<input id=\"extentEnable\" type=\"checkbox\" ng-model=\"parameters.fromMap\" ng-click=\"change()\"></input> \r\n				Restrict area to map\r\n			</label>\r\n		</div>\r\n	</div>\r\n	 \r\n	<div class=\"col-md-7\" ng-show=\"parameters.fromMap\">\r\n		<div class=\"container-fluid\">\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Max:</strong> \r\n					<span>{{parameters.yMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-6\">\r\n					<strong>X Min:</strong>\r\n					<span>{{parameters.xMin | number : 4}}</span> \r\n				</div>\r\n				<div class=\"col-md-6\">\r\n					<strong>X Max:</strong>\r\n					<span>{{parameters.xMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Min:</strong>\r\n					<span>{{parameters.yMin | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("bathy/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-header\">\r\n\r\n        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n            <span class=\"sr-only\">Toggle navigation</span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n        </button>\r\n\r\n        <a href=\"http://www.ga.gov.au\" class=\"hidden-xs\"><img src=\"data:image/png;base64,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\" alt=\"Australian Government - Geoscience Australia\" class=\"logo\"></img></a>\r\n        <a href=\"http://www.ga.gov.au\" class=\"visible-xs\"><img src=\"data:image/png;base64,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\" alt=\"Australian Government - Geoscience Australia\" class=\"logo-stacked\"></img></a>\r\n        <a href=\"/\" class=\"appTitle visible-xs\">\r\n            <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n        </a>\r\n    </div>\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n			<li mars-version-display role=\"menuitem\" style=\"padding-top: 19px;\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("bathy/maps/maps.html","<div  ng-controller=\"MapsCtrl as maps\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Layers</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				<div class=\"container-fluid\">\r\n					<div class=\"row\" ng-repeat=\"layer in layersTab.layers\" \r\n							style=\"padding:7px;padding-left:10px;position:relative\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'odd\'\">\r\n						<div style=\"position:relative;left:6px;\">\r\n							<a href=\"{{layer.metadata}}\" target=\"_blank\" \r\n									class=\"featureLink\" title=\'View metadata related to \"{{layer.name}}\". (Opens new window.)\'>\r\n								{{layer.name}}\r\n							</a>\r\n							<div class=\"pull-right\" style=\"width:270px;\" tooltip=\"Show on map. {{layer.help}}\">\r\n								<span style=\"padding-left:10px;width:240px;\" class=\"pull-left\"><explorer-layer-slider layer=\"layer.layer\"></explorer-layer-slider></span>\r\n								<button style=\"padding:2px 8px 2px 2px;\" type=\"button\" class=\"undecorated featureLink pull-right\" href=\"javascript:;\" \r\n										ng-click=\"maps.toggleLayer(layer)\" >\r\n									<i class=\"fa\" ng-class=\"{\'fa-eye-slash\':(!layer.displayed), \'fa-eye active\':layer.displayed}\"></i>\r\n								</button>\r\n							</div>						\r\n						</div>\r\n					</div>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("bathy/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\">\r\n	<div class=\"panesMapContainer\" geo-map configuration=\"data.map\"></div>\r\n   <div class=\"base-layer-controller\">\r\n    	<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("bathy/popover/popover.html","<div class=\"bathy-popover {{direction}}\" ng-class=\"containerClass\" ng-show=\"show\">\r\n  <div class=\"arrow\"></div>\r\n  <div class=\"bathy-popover-inner\" ng-transclude></div>\r\n</div>");
$templateCache.put("bathy/reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("bathy/select/doc.html","<div ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"select.lolight(doc)\" ng-mouseenter=\"select.hilight(doc)\">\r\n	<span ng-class=\"{ellipsis:!expanded}\" tooltip-enable=\"!expanded\" style=\"width:100%;display:inline-block;\"\r\n			tooltip-class=\"selectAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" tooltip-placement=\"bottom\">\r\n		<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\">\r\n			<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n		</button>\r\n		<download-add item=\"doc\" group=\"group\"></download-add>\r\n		<bathy-wms data=\"doc\"></bathy-wms>\r\n		<bathy-bbox data=\"doc\" ng-if=\"doc.showExtent\"></bathy-bbox>\r\n		<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n	</span>\r\n	<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\">\r\n		{{doc.abstract}}\r\n	</span>\r\n	<div ng-show=\"expanded\" style=\"padding-bottom: 5px;\">\r\n		<h5>Keywords</h5>\r\n		<div>\r\n			<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("bathy/select/group.html","<div class=\"panel panel-default\" style=\"margin-bottom:-5px;\" >\r\n	<div class=\"panel-heading\"><bathy-wms data=\"group\"></bathy-wms> <strong>{{group.title}}</strong></div>\r\n	<div class=\"panel-body\">\r\n   		<div ng-repeat=\"doc in group.docs\">\r\n   			<select-doc doc=\"doc\" group=\"group\"></select-doc>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("bathy/select/select.html","<div>\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SelectCtrl as select\" class=\"scrollPanel\">\r\n		<div class=\"panel panel-default\" style=\"margin-bottom:-5px\">\r\n  			<div class=\"panel-heading\">\r\n  				<h3 class=\"panel-title\">Available datasets</h3>\r\n  			</div>\r\n  			<div class=\"panel-body\">\r\n				<div ng-repeat=\"doc in select.data.response.docs\" style=\"padding-bottom:7px\">\r\n					<select-doc ng-if=\"doc.type == \'dataset\'\" doc=\"doc\"></select-doc>\r\n					<select-group ng-if=\"doc.type == \'group\'\" group=\"doc\"></select-group>\r\n				</div>\r\n  			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("bathy/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">MH370 Bathymetry</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" bathy-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div style=\"border-bottom:1px solid gray\">\r\n		<p>\r\n			Users can download the bathymetry data over the Indian Ocean which is licensed under Creative Commons.\r\n		</p>\r\n		<p>\r\n			Data can be downloaded from the portal at <strong>no charge</strong> and there is no limit to how many requests you can place (please check the file size before you download your results).\r\n		</p>\r\n		<p>\r\n			If you need datasets in full, please contact <a href=\"clientservices@ga.gov.au\">clientservices@ga.gov.au</a>.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n\r\n		<div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n			<div class=\"pull-right\">\r\n			  	<button type=\"button\" class=\"btn btn-primary\" ng-model=\"seenSplash\" ng-focus ng-click=\"accept()\">Continue</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div ng-show=\"messages.length > 0\" class=\"container\" style=\"width:100%; max-height:250px; overflow-y:auto\">\r\n		<div class=\"row\" ng-class-even=\"\'grayline\'\" style=\"font-weight:bold\">\r\n			<div class=\"col-sm-12\" ><h3>News</h3></div>\r\n		</div>\r\n\r\n		<div class=\"row\"ng-class-even=\"\'grayline\'\" style=\"max-height:400px;overflow:auto\" ng-repeat=\"message in messages | sortNotes\">\r\n			<div class=\"col-sm-12\">\r\n				<h4>{{message.title}} <span class=\"pull-right\" style=\"font-size:70%\">Created: {{message.creationDate | date : \"dd/MM/yyyy\"}}</span></h4>\r\n				<div ng-bind-html=\"message.description\"></div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("bathy/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("bathy/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n    <div ng-show=\"right.active === \'datasets\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" bathy-download ></div>\r\n    </div>\r\n    <div ng-if=\"right.active === \'glossary\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" bathy-glossary></div>\r\n    </div>\r\n    <div ng-show=\"right.active === \'help\'\" class=\"right-side-menu-container\">\r\n        <div class=\"panesTabContentItem\" bathy-help></div>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n");
$templateCache.put("bathy/side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");
$templateCache.put("bathy/toolbar/toolbar.html","<div class=\"bathy-toolbar noPrint\">\r\n    <div class=\"toolBarContainer\">\r\n        <div>\r\n            <ul class=\"left-toolbar-items\"></ul>\r\n            <ul class=\"right-toolbar-items\">\r\n                <li>\r\n                    <panel-trigger panel-id=\"datasets\" panel-width=\"540px\" name=\"Downloads\" icon-class=\"fa-download\" default=\"true\"></panel-trigger>\r\n                </li>\r\n                <li reset-page></li>\r\n            </ul>\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("download/datasets/controls.html","<div class=\"continue-container\" ng-if=\"hasSelectedDownloadables()\" style=\"text-align: right\">\r\n   <button class=\"btn btn-primary\" ng-click=\"review()\">\r\n      Review {{selectedDownloadables().length}} selected datasets\r\n   </button>\r\n</div>\r\n");
$templateCache.put("download/datasets/datasets.html","<div ng-show=\"datasets.bounds\">\r\n   <formats-filter formats=\"datasets.formats\"></formats-filter>\r\n   <div class=\"dataset-list\">\r\n      <datasets-type ng-repeat=\"value in datasets.types | someIntersects\"\r\n               type=\"value\" name=\"value.data_type\"/>\r\n   </div>\r\n   <datasets-controls datasets=\"datasets\"></datasets-controls>\r\n</div>");
$templateCache.put("download/datasets/formatsfilter.html","<div style=\"border-bottom: solid 1px lightgray;padding: 3px;padding-left: 8px\" ng-show=\"formats.length > 1\">\r\n   <strong>Formats: </strong>\r\n   <span style=\"padding-left:10px; padding-right:10px\">\r\n      <label>All <input type=\"checkbox\" ng-model=\"model.all\" style=\"margin:0; height:11px\"></input></label>\r\n   </span>\r\n   <span style=\"border: solid 1px lightgray; padding:3px; border-radius: 2px; background-color: #eee\">\r\n      <span ng-repeat=\"format in formats\" style=\"padding-left:10px;\">\r\n         <label> {{format.name}} <input type=\"checkbox\" ng-model=\"format.selected\" style=\"margin:0; height:11px\"></input></label>\r\n      </span>\r\n   </span>\r\n</div>");
$templateCache.put("download/datasets/metadata.html","<h4>\r\n   <a href=\"{{metadata.url}}\" target=\"_blank\" ng-mouseenter=\"metadata.show = true\" ng-mouseleave=\"metadata.show = false\">{{name}}</a>\r\n   <div bathy-popover show=\"metadata.show\" direction=\"custom-{{metadata.id}}\">\r\n      <h4>{{metadata.title}}</h4>\r\n      <div ng-repeat=\"line in (metadata.description | split)\">\r\n         <p>{{line}}</p>\r\n      </div>\r\n   </div>\r\n</h4>");
$templateCache.put("download/datasets/type.html","<div class=\"dataset-group\">\r\n   <type-metadata metadata=\"type.metadata\" name=\"name\"></type-metadata>\r\n   <div class=\"dataset-subgroup\" ng-repeat=\"tile in type.tiles | withinBounds\" ng-mouseenter=\"show(tile)\" ng-mouseleave=\"hide()\">\r\n      <h5>\r\n         <input type=\"checkbox\" ng-model=\"tile.downloadables[0].selected\">\r\n         <a href=\"javascript:void(0)\" ng-click=\"zoom(tile)\">\r\n            {{tile.label || tile.tile_id}}\r\n            <span ng-if=\"tile.downloadables[0].file_size\">({{tile.downloadables[0].file_size | bytes}})</span>\r\n         </a>\r\n      </h5>\r\n   </div>\r\n</div>");
$templateCache.put("download/start/start.html","<div>\r\n   <map-clip></map-clip>\r\n   <datasets-container></datasets-container>\r\n</div>");
$templateCache.put("download/reviewing/reviewing.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Review datasets, provide email and continue</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n   <div>\r\n      <div class=\"row\">\r\n         <div class=\"col-md-12\">\r\n            <h4>{{countAccepted()}} Selected Datasets</h4>\r\n            Review and delete unwanted datasets.\r\n         </div>\r\n      </div>\r\n\r\n      <div class=\"reviewing-datasets\">\r\n         <div class=\"row\" ng-repeat=\"product in products\" ng-class-odd=\"\'reviewing-odd\'\">\r\n            <div class=\"col-md-11\">\r\n               <button type=\"button\" class=\"btn btn-default btn-xs\" ng-click=\"product.removed = !product.removed\" role=\"checkbox\">\r\n                  <i class=\"fa fa-2x\" style=\"width:24px;height:20px;color:green\" ng-class=\"{\'fa-check\': !product.removed}\" aria-hidden=\"true\"></i>\r\n               </button>\r\n\r\n               <span style=\"padding-left:7px\" ng-class=\"{\'exclude\': product.removed}\" ng-if=\"product.download.parent.type == \'mosaic\'\">\r\n                  Mosaic {{product.download.parent.dataType}}\r\n                  - bounds:\r\n                     {{clip.yMin|number : 1}}&deg; west,\r\n                     {{clip.xMin|number : 1}}&deg; north,\r\n                     {{clip.yMax|number : 1}}&deg; east,\r\n                     {{clip.xMax|number : 1}}&deg; south\r\n               </span>\r\n\r\n\r\n\r\n               <span style=\"padding-left:7px\" ng-class=\"{\'exclude\': product.removed}\" ng-if=\"product.download.parent.type != \'mosaic\'\">\r\n                  {{product.download.parent.dataType}} <span style=\"font-weight:bold\">{{product.download.parent.tile_id}}</span>               - {{product.download.format}} - bounds: {{product.download.parent.bbox[0][1]|number : 1}}&deg; west, {{product.download.parent.bbox[1][0]|number\r\n               : 1}}&deg; north, {{product.download.parent.bbox[1][1]|number : 1}}&deg; east, {{product.download.parent.bbox[0][0]|number\r\n               : 1}}&deg; south\r\n               </span>\r\n\r\n\r\n            </div>\r\n            <div class=\"col-md-1\" style=\"padding:6px\">\r\n               {{product.download.file_size | bytes}}\r\n            </div>\r\n         </div>\r\n      </div>\r\n\r\n\r\n   </div>\r\n   <div class=\"row reviewing-divider\">\r\n      <div class=\"col-md-3\">\r\n         <label for=\"geoprocessOutputFormat\">\r\n					Output Format\r\n				</label>\r\n      </div>\r\n      <div class=\"col-md-9\">\r\n         <select id=\"geoprocessOutputFormat\" style=\"width:95%\" ng-model=\"data.outFormat\" ng-options=\"opt.value for opt in data.config.outFormat\"></select>\r\n      </div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12\">\r\n         <p>\r\n            <strong>Email notification</strong> The extract of data can take some time. By providing an email address we\r\n            will be able to notify you when the job is complete. The email will provide a link to the extracted data which\r\n            will be packaged up as a single compressed file.\r\n         </p>\r\n         <div review-email></div>\r\n      </div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12\">\r\n         <div class=\"pull-right\" style=\"padding:8px;\">\r\n            <button type=\"button\" class=\"btn btn-primary\" ng-click=\"accept()\" ng-disabled=\"!isValid()\">\r\n               Start extract of datasets\r\n             </button>\r\n            <button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">Cancel</button>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("wizard/bbox/bbox.html","<button type=\"button\" class=\"undecorated\" ng-click=\"toggle()\" tooltip-placement=\"right\" tooltip=\"Show data extent on the map.\">\r\n	<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-eye orange\':data.hasBbox,\'fa-eye-slash\':!data.hasBbox}\"></i>\r\n</button>");
$templateCache.put("wizard/download/download.html","<exp-modal ng-controller=\"DownloadCtrl as dl\" icon-class=\"fa-download\" is-open=\"dl.data.item.download\" title=\"Download data\" on-close=\"dl.remove()\" is-modal=\"true\">\r\n	<div style=\"padding:5px;\">\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-12\">\r\n				<h4><bathy-wms data=\"dl.data.item\"></bathy-wms>{{dl.data.item.title}}</h4>\r\n				{{dl.data.item.abstract}}\r\n   			</div>\r\n		</div>\r\n		<bathy-geoprocess data=\"dl.data.item\"></bathy-geoprocess>\r\n	</div>\r\n</exp-modal>");
$templateCache.put("wizard/download/popup.html","<exp-modal icon-class=\"fa-download\"  is-open=\"data.item.download\" title=\"Download wizard\" on-close=\"dl.remove()\">\r\n	<div class=\"container-fluid downloadInner\" >\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-12\">\r\n				<h4><bathy-wms data=\"dl.data.item\"></bathy-wms>\r\n					<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{dl.data.item.sysId}}\" target=\"_blank\"><strong class=\"ng-binding\">{{dl.data.item.title}}</strong></a>\r\n				</h4>\r\n   			</div>\r\n		</div>\r\n		<wizard-geoprocess data=\"dl.data.item\"></wizard-geoprocess>\r\n	</div>\r\n</exp-modal>");
$templateCache.put("wizard/clip/clip.html","<div class=\"well well-sm\" style=\"margin-bottom:5px\">\r\n	<div class=\"container-fluid\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\" style=\"padding:0\">\r\n				<div class=\"\" role=\"group\" aria-label=\"...\">\r\n					<button ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\"\r\n                      tooltip-append-to-body=\"true\" tooltip-placement=\"bottom\" uib-tooltip=\"Enable drawing of a bounding box. On enabling, click on the map and drag diagonally\"\r\n						class=\"btn btn-primary btn-default\">Select an area...</button>\r\n               <span style=\"float:right\">\r\n					   <button ng-click=\"showInfo = !showInfo\" tooltip-placement=\"left\" uib-tooltip=\"Information.\" class=\"btn btn-primary btn-default\"><i class=\"fa fa-info\"></i></button>\r\n					   <bathy-about-link></bathy-about-link>\r\n               </span>\r\n            </div>\r\n            <bathy-about></bathy-about>\r\n				<exp-info title=\"Selecting an area\" show-close=\"true\" style=\"width:450px;position:fixed;top:200px;right:40px\" is-open=\"showInfo\">\r\n					<clip-info-bbox></clip-info-bbox>\r\n				</exp-info>\r\n			</div>\r\n		</div>\r\n\r\n		<div ng-show=\"oversize\" style=\"margin-top:6px\">\r\n			<div class=\"alert alert-danger\"\r\n            style=\"padding:2px; margin-bottom:0px\" role=\"alert\">Please restrict the size of your selected area to no more than 2000 square degrees.</div>\r\n		</div>\r\n\r\n		<div class=\"row\" ng-hide=\"(!clip.xMin && clip.xMin != 0) || oversize\" style=\"padding-top:7px;\">\r\n			<div class=\"col-md-12\">\r\n				Selected bounds: {{clip.xMin|number : 4}}&deg; west, {{clip.yMax|number : 4}}&deg; north, {{clip.xMax|number : 4}}&deg; east, {{clip.yMin|number\r\n				: 4}}&deg; south\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div class=\"container-fluid\" style=\"padding-top:7px\" ng-show=\"typing\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\"> </div>\r\n			<div class=\"col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMax|number : 4}} max)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMin|number : 4}} min)</span>\r\n				</span>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMax|number : 4}} max)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-offset-3 col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMin|number : 4}} min)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("wizard/clip/infobbox.html","<div class=\"\">\r\n	<strong style=\"font-size:120%\">Select an area of interest.</strong>\r\n   By hitting the \"Select an area...\" button an area on the map can be selected with the mouse by clicking a\r\n   corner and while holding the left mouse button\r\n	down drag diagonally across the map to the opposite corner.\r\n	<br/>\r\n	Clicking the \"Select an area...\" button again allows replacing a previous area selection. <br/>\r\n	<strong>Notes:</strong>\r\n   <ul>\r\n      <li>Data is only available in the gridded area to the west of Australia.</li>\r\n      <li>Can\'t move the map? The shown area is restricted to where there is data.</li>\r\n   </ul>\r\n	<p style=\"padding-top:5px\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n		You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you have made an error in the\r\n      position of your area of interest, hit the \"Select an area...\" button and draw a new bounding box.\r\n	</p>\r\n</div>");
$templateCache.put("wizard/search/search.html","<div>\r\n<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SearchCtrl as search\" class=\"scrollPanel\">\r\n	<p style=\"text-align: left; margin: 10px; font-size: 16px;\">\r\n		<strong>Search</strong>\r\n	</p>\r\n	<form class=\"form-horizontal\">\r\n		<div class=\"well\">\r\n			<div class=\"form-group\">\r\n				<label for=\"searchFilter\" class=\"col-sm-1 control-label\">Filter</label>\r\n				<div class=\"col-sm-11\">\r\n					<input placeholder=\'Leave blank to match all, type to filter results\' type=\"text\" class=\"form-control\" ng-keyup=\"search.search()\" ng-model=\"search.filter\" ></input>\r\n				</div>\r\n			</div>\r\n			<div>\r\n				<span ng-show=\"search.data.response.docs\">\r\n					<strong>Showing</strong> {{search.data.response.docs.length}} of {{search.data.response.numFound}} <strong>matches. </strong>\r\n					({{search.data.responseHeader.QTime/ 1000}} seconds)\r\n					<span ng-show=\"search.data.responseHeader\" class=\"pull-right\">\r\n\r\n						<div class=\"btn-group\" dropdown style=\"padding-right:1em\">\r\n							<button type=\"button\" class=\"undecorated\" bathy-bbox-show-all style=\"padding-left:5em\">\r\n								Show all data extents\r\n							</button>\r\n						    <button type=\"button\" class=\"undecorated dropdown-toggle\" dropdown-toggle title=\"Restrict datasets based on area of coverage\">\r\n        						<span class=\"caret\"></span>\r\n        						<span class=\"sr-only\">More options for showing and hiding datasets\' extents based on size and if only some are viewable.</span>\r\n      						</button>\r\n      						<ul class=\"dropdown-menu\" role=\"menu\">\r\n        						<li><a role=\"button\" href=\"javascript:;\" bathy-bbox-show-visible  tooltip=\"Show only those datasets that have all of their data within the current viewable map\">Show fully visible</a></li>\r\n        						<li><a role=\"button\" href=\"javascript:;\" bathy-bbox-hide-all  tooltip=\"Hide all datasets\' bounding area. \">Hide all</a></li>\r\n      						</ul>\r\n    					</div>\r\n					</span>\r\n				</span>\r\n			</div>\r\n			<div>\r\n				<div class=\"container-fluid\">\r\n					<bathy-extent></bathy-extent>\r\n					<bathy-facetenable></bathy-facetenable>\r\n					<bathy-daterange></bathy-daterange>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</form>\r\n\r\n	<div class=\"container\" style=\"width:100%\">\r\n		<div class=\"row\" ng-repeat=\"doc in search.data.response.docs\">\r\n			<div class=\"col-md-12\"  ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"search.lolight(doc)\" ng-mouseenter=\"search.hilight(doc)\">\r\n				<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;\">\r\n					<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\" tooltip-placement=\"right\" tooltip=\"Show more details.\">\r\n						<i class=\"fa pad-right fa-2x\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n					</button>\r\n					<download-add item=\"doc\"></download-add>\r\n					<bathy-wms data=\"doc\"></bathy-wms>\r\n					<bathy-bbox data=\"doc\" ng-if=\"doc.showExtent\"></bathy-bbox>\r\n					<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n				</span>\r\n				<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\"\r\n						tooltip-enable=\"!expanded\" tooltip-class=\"searchAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" >\r\n					<download-actions doc=\"doc\" ng-show=\"expanded\"></download-actions>\r\n					{{doc.abstract}}\r\n				</span>\r\n				<div ng-show=\"expanded\">\r\n					<h6>Authors</h6>\r\n					{{doc.author | authors}}\r\n					<h6>Keywords</h6>\r\n					<div>\r\n						<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n					</div>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>\r\n</div>");
$templateCache.put("wizard/geoprocess/geoprocess.html","<div class=\"container-fluid fred\" ng-form>\r\n	<div ng-show=\"stage==\'bbox\'\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\">\r\n				<wizard-clip trigger=\"stage == \'bbox\'\" drawn=\"drawn()\" clip=\"data.processing.clip\" bounds=\"data.bounds\"></wizard-clip>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n 			<div class=\"col-md-12\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!validClip(data) || checkingOrFailed\" ng-click=\"stage=\'formats\'\">Next</button>\r\n			</div>\r\n		</div>\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Select an area of interest.</strong> There are two ways to select your area of interest:\r\n			<ol>\r\n				<li>Draw an area on the map with the mouse by clicking a corner and while holding the left mouse button\r\n					down drag diagonally across the map to the opposite corner or</li>\r\n				<li>Type your co-ordinates into the areas above.</li>\r\n			</ol>\r\n			Once drawn the points can be modified by the overwriting the values above or drawing another area by clicking the draw button again.\r\n			Ensure you select from the highlighted areas as the data can be quite sparse for some data.<br/>\r\n			<p style=\"padding-top:5px\">\r\n			<strong>Warning:</strong> Some extracts can be huge. It is best if you start with a small area to experiment with first. An email will be sent\r\n			with the size of the extract. Download judiciously.\r\n			</p>\r\n			<p style=\"padding-top\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n            You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you have made an error in the\r\n            position of your area of interest, hit the \"Select an area...\" button and draw a new bounding box.\r\n			</p>\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'formats\'\">\r\n		<div class=\"well\">\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-3\">\r\n				<label for=\"geoprocessOutputFormat\">\r\n					Output Format\r\n				</label>\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<select id=\"geoprocessOutputFormat\" style=\"width:95%\" ng-model=\"data.processing.outFormat\" ng-options=\"opt.value for opt in config.outFormat\"></select>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\">\r\n				<label for=\"geoprocessOutCoordSys\">\r\n					Coordinate System\r\n				</label>\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<select id=\"geoprocessOutCoordSys\" style=\"width:95%\" ng-model=\"data.processing.outCoordSys\" ng-options=\"opt.value for opt in config.outCoordSys | sysIntersect : data.processing.clip\"></select>\r\n			</div>\r\n		</div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" ng-click=\"stage=\'bbox\'\">Previous</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!validSansEmail(data)\" ng-click=\"stage=\'email\'\">Next</button>\r\n   			</div>\r\n		</div>\r\n\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Data representation.</strong> Select how you want your data presented.<br/>\r\n			Output format is the structure of the data and you should choose a format compatible with the tools that you will use to manipulate the data.\r\n			<ul>\r\n				<li ng-repeat=\"format in outFormats\"><strong>{{format.value}}</strong> - {{format.description}}</li>\r\n			</ul>\r\n			Select what <i>coordinate system</i> or projection you would like. If in doubt select WGS84.<br/>\r\n			Not all projections cover all of Australia. If the area you select is not covered by a particular projection then the option to download in that projection will not be available.\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'email\'\">\r\n		<div class=\"well\" exp-enter=\"stage=\'confirm\'\">\r\n			<div download-email></div>\r\n			<br/>\r\n			<div download-filename data=\"data.processing\"></div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" ng-click=\"stage=\'formats\'\">Previous</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!allDataSet(data)\" ng-click=\"stage=\'confirm\'\">Submit</button>\r\n   			</div>\r\n		</div>\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Email notification</strong> The extract of data can take some time. By providing an email address we will be able to notify you when the job is complete. The email will provide a link to the extracted\r\n			data which will be packaged up as a single file. To be able to proceed you need to have provided:\r\n			<ul>\r\n				<li>An area of interest to extract the data (referred to as a bounding box).</li>\r\n				<li>An output format.</li>\r\n				<li>A valid coordinate system or projection.</li>\r\n				<li>An email address to receive the details of the extraction.</li>\r\n				<li><strong>Note:</strong>Email addresses need to be and are stored in the system.</li>\r\n			</ul>\r\n			<strong style=\"font-size:120%\">Optional filename</strong> The extract of data can take some time. By providing an optional filename it will allow you\r\n			to associate extracted data to your purpose for downloading data. For example:\r\n			<ul>\r\n				<li>myHouse will have a file named myHouse.zip</li>\r\n				<li>Sorrento would result in a file named Sorrento.zip</li>\r\n			</ul>\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'confirm\'\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12 abstractContainer\">\r\n				{{data.abstract}}\r\n			</div>\r\n		</div>\r\n		<h3>You have chosen:</h3>\r\n		<table class=\"table table-striped\">\r\n			<tbody>\r\n				<tr>\r\n					<th>Area</th>\r\n					<td>\r\n						<span style=\"display:inline-block; width: 10em\">Lower left (lat/lng&deg;):</span> {{data.processing.clip.yMin | number : 6}}, {{data.processing.clip.xMin | number : 6}}<br/>\r\n						<span style=\"display:inline-block;width: 10em\">Upper right (lat/lng&deg;):</span> {{data.processing.clip.yMax | number : 6}}, {{data.processing.clip.xMax | number : 6}}\r\n					</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Output format</th>\r\n					<td>{{data.processing.outFormat.value}}</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Coordinate system</th>\r\n					<td>{{data.processing.outCoordSys.value}}</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Email address</th>\r\n					<td>{{email}}</td>\r\n				</tr>\r\n				<tr ng-show=\"data.processing.filename\">\r\n					<th>Filename</th>\r\n					<td>{{data.processing.filename}}</td>\r\n				</tr>\r\n			</tbody>\r\n		</table>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" style=\"width:6em\" ng-click=\"stage=\'email\'\">Back</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-click=\"startExtract()\">Confirm</button>\r\n   			</div>\r\n		</div>\r\n	</div>\r\n</div>");}]);