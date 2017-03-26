/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("mh370.help", [])

.directive("mh370Help", [function() {
	return {
		templateUrl : "mh370/help/help.html"
	};
}])

.directive("mh370Faqs", [function() {
	return {
		restrict:"AE",
		templateUrl : "mh370/help/faqs.html",
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
	var FAQS_SERVICE = "mh370/resources/config/faqs.json";

	return {
		getFaqs : function() {
			return $http.get(FAQS_SERVICE, {cache : true}).then(function(response) {
				return response.data;
			});
		}
	};
}


})(angular);