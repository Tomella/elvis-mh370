/*!
 * Copyright 2017 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("mh370.toolbar", [])

.directive("mh370Toolbar", [function() {
	return {
      templateUrl: "mh370/toolbar/toolbar.html",
		controller: 'toolbarLinksCtrl',
      transclude: true
	};
}])

.controller("toolbarLinksCtrl", ["$scope", "configService", function($scope, configService) {

	var self = this;
	configService.getConfig().then(function(config) {
		self.links = config.toolbarLinks;
	});

	$scope.item = "";
	$scope.toggleItem = function(item) {
		$scope.item = ($scope.item === item) ? "" : item;
	};

}]);

})(angular);