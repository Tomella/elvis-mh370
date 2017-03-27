/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module('bathy.tabs', [])

.directive('tabsMain', ['$rootScope', function($rootScope) {
	return {
		templateUrl: 'bathy/tabs/tabs.html'
	};
}])

.directive('bathyMapsOld', ['$rootScope', function($rootScope) {
	return {
		templateUrl:'bathy/tabs/maps.html',
		controller: 'customMapsController'
	};
}])

.controller("customMapsController", ['$scope', 'rocksAssetService', function($scope, rocksAssetService) {

	// get the custom maps
	rocksAssetService.getRfcs().then(function(mapsRfcs) {
		$scope.rfcs = mapsRfcs;
	});

	$scope.toggleRfcShow = function() {
		var element = this.rfc;
		element.displayed = element.handleShow();
	};

	$scope.makeRfcActive = function() {
		$scope.active = this.rfc;
	};
}])

.factory('bathyAssetService', ['$rootScope', '$q', '$timeout', '$http', 'layerService', 'mapService', function($rootScope, $q, $timeout, $http, layerService, mapService){
	return {
		getRfcs:function() {
			return $q.all([mapService.getMap(), $http.get('resources/config/rocks/custom-assets.json', {cache:true})]).then(function(mapFeatures) {

				// extracts the features defined in config
				var map = mapFeatures[0],
				refFeatureTypes = mapFeatures[1].data,
				features = [];

				angular.forEach(refFeatureTypes, function(feature) {
					var decorated = layerService.decorate(feature);
					decorated.map = map;
					decorated.addToMap();
					features.push(decorated);
				});

				return features;
			});
		}
	};
}])

.filter("countGreaterThanZero", [function() {
	return function(rfcs) {
		if(rfcs) {
			return rfcs.filter(function(rfc) {
				return rfc.count && rfc.count > 0;
			});
		} else {
			return [];
		}
	};
}]);

})(angular);