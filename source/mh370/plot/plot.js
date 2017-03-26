/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular){
'use strict';

angular.module("mh370.plot", [])

.directive("mh370Plot", ['$log', function($log) {
	return {
		restrict : "AE",
		scope : {
			line: "="
		},
		link : function(scope, element, attrs, ctrl) {
			scope.$watch("line", function(newValue, oldValue) {
				$log.info(newValue);
			});
		}
	};
}]);

})(angular);