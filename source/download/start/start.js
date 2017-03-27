
(function(angular) {

'use strict';

angular.module("bathy.start", [])

.directive("bathyDownload", [function() {
	return {
		templateUrl : "download/start/start.html",
		link: function(scope, element, attrs) {
			console.log("Hello select!");
		}
	};
}]);

})(angular);