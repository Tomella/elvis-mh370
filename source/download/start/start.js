
(function(angular) {

'use strict';

angular.module("mh370.start", [])

.directive("mh370Download", [function() {
	return {
		templateUrl : "download/start/start.html",
		link: function(scope, element, attrs) {
			console.log("Hello select!");
		}
	};
}]);

})(angular);