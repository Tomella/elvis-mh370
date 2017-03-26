/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("mh370.groups", [])

.factory("GroupsCtrl", MapsCtrl);

MapsCtrl.$inject = ['$rootScope', 'mapService', 'selectService', 'downloadService'];
function MapsCtrl($rootScope, mapService, selectService, downloadService) {
	// We use the dummy layer group if
	var dummyLayerGroup = L.layerGroup([]),
		groups = {
			download : downloadService.getLayerGroup(),
			select:selectService.getLayerGroup()
		};
}

})(angular);