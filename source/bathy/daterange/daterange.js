/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("bathy.daterange", [])

.directive("bathyDaterange", [function() {
	return {
		restrict : 'AE',
		templateUrl : "bathy/daterange/daterange.html",
		controller : "DaterangeCtrl",
		link : function(scope, element, attrs, ctrl) {
			scope.change = function() {
				ctrl.change();
			};
		}
	};
}])

.directive("bathyDaterangeSlider", [function() {
	return {
		restrict : "AE",
		require : "^bathyDaterange",
		template : '<slider min="0" max="240" step="1" value="[0,240]" range="true" ng-model="daterange.range" formatter="daterange.formatter"></slider>',
		link : function(scope, element, attrs, ctrl) {
			scope.daterange = ctrl;
		}
	};
}])

.controller("DaterangeCtrl", DaterangeCtrl)
.factory("daterangeService", DaterangeService);

DaterangeCtrl.$inject = ['$timeout', 'daterangeService'];
function DaterangeCtrl($timeout, daterangeService) {
	var MAX = 240,
		MIN = 0,
		self = this,
		timeout;

	this.data = daterangeService.getDaterange();

	this.change = function() {
		daterangeService.changed();
	};

	this.slider = function() {
		// Give it some debounce
		$timeout.cancel(timeout);
		timeout = $timeout(function() {
			daterangeService.changed();
		}, 200);
	};

	this.formatter = function(val) {
		// Arrrgghh! It fires 3 times per change in range. Only once is an array.
		if(!angular.isArray(val)) {
			return;
		}
		// this is the slider, self is the controller
		var upper = val[1],
			lower = val[0];

		if(lower === undefined || lower == MIN) {
			lower = "Earliest";
			if(self.data) {
				self.data.lower = null;
			}
		} else {
			lower = convertToDate(lower);
			lower = (lower.getMonth() + 1) + "/" + lower.getFullYear();
			if(self.data) {
				self.data.lower = lower;
			}
		}

		if(upper === undefined || upper == MAX) {
			upper = "newest";
			if(self.data) {
				self.data.upper = null;
			}
		} else {
			upper = convertToDate(upper);
			upper = (upper.getMonth() + 1) + "/" + upper.getFullYear();
			if(self.data) {
				self.data.upper = upper;
			}
		}
		self.slider();
		return lower + " to " + upper;
	};

	function convertToDate(value) {
		var date = new Date();
		if(value !== undefined) {
			date.setMonth(date.getMonth() - (MAX - value));
			return date;
		}
	}
}

DaterangeService.$inject = ['$log', 'searchService'];
function DaterangeService($log, searchService) {
	return {
		getDaterange : function() {
			return searchService.getDaterange();
		},

		changed : function() {
			$log.info("Refreshing..");
			searchService.refresh();
		}
	};
}

})(angular);