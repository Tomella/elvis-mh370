/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("bathy.help", [])

.directive("bathyHelp", [function() {
	return {
		templateUrl : "bathy/help/help.html"
	};
}])

.directive("bathyFaqs", [function() {
	return {
		restrict:"AE",
		templateUrl : "bathy/help/faqs.html",
		scope : {
			faqs : "="
		},
		link : function(scope) {
			scope.focus = function(key) {
				$("#faqs_" + key).focus();
			};
		}
	};
}])

.controller("HelpCtrl", HelpCtrl)
.factory("helpService", HelpService);

HelpCtrl.$inject = ['$log', 'helpService'];
function HelpCtrl($log, helpService) {
	var self = this;
	$log.info("HelpCtrl");
	helpService.getFaqs().then(function(faqs) {
		self.faqs = faqs;
	});
}


HelpService.$inject = ['$http'];
function HelpService($http) {
	var FAQS_SERVICE = "bathy/resources/config/faqs.json";

	return {
		getFaqs : function() {
			return $http.get(FAQS_SERVICE, {cache : true}).then(function(response) {
				return response.data;
			});
		}
	};
}


})(angular);