/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("bathy.select", ['bathy.select.service'])

.controller("SelectCtrl", SelectCtrl)
.controller("SelectCriteriaCtrl", SelectCriteriaCtrl)

.directive("bathySelect", [function() {
	return {
		templateUrl : "bathy/select/select.html",
		link: function(scope, element, attrs) {
			console.log("Hello select!");
		}
	};
}])

.directive("selectDoc", [function() {
	return {
		templateUrl : "bathy/select/doc.html",
		link: function(scope, element, attrs) {
			console.log("What's up doc!");
		}
	};
}])


.directive("selectGroup", [function() {
	return {
		templateUrl : "bathy/select/group.html",
		scope: {
			group: "="
		},
		link: function(scope, element, attrs) {
			console.log("What's up doc!");
		}
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

SelectCriteriaCtrl.$inject = ["selectService"];
function SelectCriteriaCtrl(selectService) {
	this.criteria = selectService.getSelectCriteria();

	this.refresh = function() {
		selectService.refresh();
	};
}

SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];
function SelectCtrl($rootScope, configService, flashService, selectService) {
	var flasher, self = this;

	$rootScope.$on("select.results.received", function(event, data) {
		//console.log("Received response")
		flashService.remove(flasher);
		self.data = data;
	});

	configService.getConfig("facets").then(function(config) {
		this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
	}.bind(this));

	this.select = function() {
		flashService.remove(flasher);
		flasher = flashService.add("Selecting", 3000, true);
		selectService.setFilter(this.filter);
	};

	this.toggle = function(result) {
		selectService.toggle(result);
	};

	this.toggleAll = function() {
		selectService.toggleAll(this.data.response.docs);
	};

	this.showWithin = function() {
		selectService.showWithin(this.data.response.docs);
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
		selectService.hideAll(this.data.response.docs);
	};

	this.hilight = function(doc) {
		if(doc.layer) {
			selectService.hilight(doc.layer);
		}
	};

	this.lolight = function(doc) {
		if(doc.layer) {
			selectService.lolight(doc.layer);
		}
	};
}

})(angular);

