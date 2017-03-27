/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function(angular) {


'use strict';

angular.module("bathy.splash", [])

.directive('bathySplash', ['$rootScope', '$modal', '$log', 'splashService',
                        function($rootScope, $modal, $log, splashService){
	return {
		controller : ['$scope', 'splashService', function ($scope, splashService) {
			$scope.acceptedTerms = true;

			splashService.getReleaseNotes().then(function(messages) {
				$scope.releaseMessages = messages;
				$scope.acceptedTerms = splashService.hasViewedSplash();
			});
		}],
		link : function(scope, element) {
			var modalInstance;

			scope.$watch("acceptedTerms", function(value) {
				if(value === false) {
					modalInstance = $modal.open({
						templateUrl: 'bathy/splash/splash.html',
						size: "lg",
						backdrop : "static",
						keyboard : false,
						controller : ['$scope', '$modalInstance', 'acceptedTerms', 'messages', function ($scope, $modalInstance, acceptedTerms, messages) {
							$scope.acceptedTerms = acceptedTerms;
							$scope.messages = messages;
							$scope.accept = function () {
								$modalInstance.close(true);
							};
						}],
						resolve: {
							acceptedTerms: function () {
								return scope.acceptedTerms;
							},
							messages : function() {
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

			$rootScope.$on("logoutRequest", function() {
				userService.setAcceptedTerms(false);
			});
		}
	};
}])

.factory("splashService", ['$http', function($http) {
	var VIEWED_SPLASH_KEY = "bathy.accepted.terms",
		releaseNotesUrl = "bathy/resources/config/releasenotes.json";

	return {
		getReleaseNotes : function() {
			return $http({
				method : "GET",
				url : releaseNotesUrl + "?t=" + Date.now()
			}).then(function(result) {
				return result.data;
			});
		},
		hasViewedSplash : hasViewedSplash,
		setHasViewedSplash : setHasViewedSplash
	};

	function setHasViewedSplash(value) {
		if(value) {
			sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
		} else {
			sessionStorage.removeItem(VIEWED_SPLASH_KEY);
		}
	}

	function hasViewedSplash() {
		return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
	}
}])

.filter("priorityColor", [function() {
	var map = {
		IMPORTANT: "red",
		HIGH: "blue",
		MEDIUM: "orange",
		LOW: "gray"
	};

	return function(priority) {
		if(priority in map) {
			return map[priority];
		}
		return "black";
	};
}])

.filter("wordLowerCamel", function() {
	return function(priority) {
		return priority.charAt(0) + priority.substr(1).toLowerCase();
	};
})

.filter("sortNotes", [function() {
	return function(messages) {
		if(!messages) {
			return;
		}
		var response = messages.slice(0).sort(function(prev, next) {
			if(prev.priority == next.priority) {
				return prev.lastUpdate == next.lastUpdate?0:next.lastUpdate - prev.lastUpdate;
			} else {
				return prev.priority == "IMPORTANT"?-11:1;
			}
		});
		return response;

	};
}]);

})(angular);