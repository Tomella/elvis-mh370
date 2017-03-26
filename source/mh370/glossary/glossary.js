/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("mh370.glossary", [])

.directive("mh370Glossary", [function() {
	return {
		templateUrl : "mh370/glossary/glossary.html"
	};
}])

.controller("GlossaryCtrl", GlossaryCtrl)
.factory("glossaryService", GlossaryService);

GlossaryCtrl.$inject = ['$log', 'glossaryService'];
function GlossaryCtrl($log, glossaryService) {
	var self = this;
	$log.info("GlossaryCtrl");
	glossaryService.getTerms().then(function(terms) {
		self.terms = terms;
	});
}


GlossaryService.$inject = ['$http'];
function GlossaryService($http) {
	var TERMS_SERVICE = "mh370/resources/config/glossary.json";

	return {
		getTerms : function() {
			return $http.get(TERMS_SERVICE, {cache : true}).then(function(response) {
				return response.data;
			});
		}
	};
}

})(angular);