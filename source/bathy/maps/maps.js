/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("bathy.maps", ["explorer.layer.slider"])

.directive("bathyMaps", ["mapsService", function(mapsService) {
	return {
		templateUrl : "bathy/maps/maps.html",
		link : function(scope) {
			mapsService.getConfig().then(function(data) {
				scope.layersTab = data;
			});
		}
	};
}])

.controller("MapsCtrl", MapsCtrl)
.factory("mapsService", MapsService);

MapsCtrl.$inject = ['mapsService'];
function MapsCtrl(mapsService) {

	this.toggleLayer = function(data) {
		mapsService.toggleShow(data);
	};
}

MapsService.$inject = ['configService', 'mapService', 'downloadService'];
function MapsService(configService, mapService, downloadService) {
	var CONFIG_KEY = "layersTab";

	return {
		getConfig : function() {
			return configService.getConfig(CONFIG_KEY);
		},

		toggleShow : function(item, groupName) {
			configService.getConfig(CONFIG_KEY).then(function(config) {
				if(item.layer) {
					item.displayed = false;
					mapService.removeFromGroup(item, config.group);
				} else {
					mapService.addToGroup(item, config.group);
					item.displayed = true;
				}
			});
		}
	};
}

})(angular);