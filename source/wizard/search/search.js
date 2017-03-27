/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("bathy.search", ['bathy.search.service'])

.controller("SearchCtrl", SearchCtrl)
.controller("SearchCriteriaCtrl", SearchCriteriaCtrl)

.directive("bathySearch", [function() {
	return {
		templateUrl : "wizard/search/search.html"
	};
}])

/**
 * Format the publication date
 */
.filter("pubDate", function() {
	return function(string) {
		var date;
		if(string) {
			date = new Date(string);
			return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
		}
		return "-";
	};
})

/**
 * Format the array of authors
 */
.filter("authors", function() {
	return function(auth) {
		if(auth) {
			return auth.join(", ");
		}
		return "-";
	};
})

/**
 * If the text is larger than a certain size truncate it and add some dots to the end.
 */
.filter("truncate", function() {
	return function(text, length) {
		if(text && text.length > length - 3) {
			return text.substr(0, length -3) + "...";
		}
		return text;
	};
});


SearchCriteriaCtrl.$inject = ["searchService"];
function SearchCriteriaCtrl(searchService) {
	this.criteria = searchService.getSearchCriteria();

	this.refresh = function() {
		searchService.refresh();
	};
}

SearchCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'searchService'];
function SearchCtrl($rootScope, configService, flashService, searchService) {
	var flasher, self = this;

	$rootScope.$on("search.results.received", function(event, data) {
		//console.log("Received response")
		flashService.remove(flasher);
		self.data = data;
	});

	$rootScope.$on("more.search.results", function() {
		flashService.remove(flasher);
		flasher = flashService.add("Fetching more results", 1000, true);
		searchService.more();
	});

	configService.getConfig("facets").then(function(config) {
		this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
	}.bind(this));

	this.search = function() {
		flashService.remove(flasher);
		flasher = flashService.add("Searching", 3000, true);
		searchService.setFilter(this.filter);
	};

	this.toggle = function(result) {
		searchService.toggle(result);
	};

	this.toggleAll = function() {
		searchService.toggleAll(this.data.response.docs);
	};

	this.showWithin = function() {
		searchService.showWithin(this.data.response.docs);
	};

	this.allShowing = function() {
		if(!this.data || !this.data.response) {
			return false;
		}
		return !this.data.response.docs.some(function(dataset) {
			return !dataset.showLayer;
		});
	};

	this.anyShowing = function() {
		if(!this.data || !this.data.response) {
			return false;
		}
		return this.data.response.docs.some(function(dataset) {
			return dataset.showLayer;
		});
	};

	this.hideAll = function() {
		searchService.hideAll(this.data.response.docs);
	};

	this.hilight = function(doc) {
		if(doc.layer) {
			searchService.hilight(doc.layer);
		}
	};

	this.lolight = function(doc) {
		if(doc.layer) {
			searchService.lolight(doc.layer);
		}
	};
}

})(angular);

