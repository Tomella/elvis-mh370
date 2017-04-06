/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

{

angular.module("bathy.clip", ['geo.draw'])

.directive('clipInfoBbox', function() {
	return {
		restrict: 'AE',
		templateUrl: 'wizard/clip/infobbox.html'
	};
})

.directive("mapClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService',
      function($rootScope, $timeout, clipService, messageService, mapService) {
	return {
		templateUrl : "wizard/clip/clip.html",
		scope : {
			bounds : "=",
			trigger : "=",
			drawn : "&"
		},
		link : function(scope, element) {
         let timer;

         scope.clip = {
            xMax: null,
            xMin: null,
            yMax: null,
            yMin: null
         };
			scope.typing = false;

			if(typeof scope.showBounds === "undefined") {
				scope.showBounds = false;
			}
         mapService.getMap().then(function(map) {
			   scope.$watch("bounds", function(bounds) {
				   if(bounds && scope.trigger) {
					   $timeout(function() {
						   scope.initiateDraw();
					   });
				   } else if(!bounds) {
					   clipService.cancelDraw();
				   }
            });
			});

         scope.check = function() {
            $timeout.cancel(timer);
            timer = $timeout(function() {
               $rootScope.$broadcast('bathy.clip.drawn', scope.clip);
            }, 4000);
         };

         $rootScope.$on('bathy.clip.draw', function(event, data) {
				if(data && data.message === "oversize") {
					scope.oversize = true;
					$timeout(() => {
						delete scope.oversize;
					}, 6000);
				} else {
					delete scope.oversize;
				}
            scope.initiateDraw();
         });

			scope.initiateDraw = function() {
				messageService.info("Click on the map and drag to define your area of interest.");
				clipService.initiateDraw().then(drawComplete);
			};

			function drawComplete(data) {
				let c = scope.clip;
				let response;

				c.xMax = +data.clip.xMax;
				c.xMin = +data.clip.xMin;
				c.yMax = +data.clip.yMax;
			   c.yMin = +data.clip.yMin;
            $rootScope.$broadcast('bathy.clip.drawn', c);
			}
		}
	};
}])


.factory("clipService", ['$q', '$rootScope', 'drawService', function($q, $rootScope, drawService) {
	let service = {
		initiateDraw : function() {
			this.data = null;
			return drawService.drawRectangle().then(drawComplete);
		},

		cancelDraw : function() {
			drawService.cancelDrawRectangle();
		}
	};

	return service;

	function drawComplete(data) {
		service.data = {
         clip:{
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