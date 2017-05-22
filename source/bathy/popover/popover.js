{
angular.module('bathy.popover', [])

.directive('bathyPopover', [function() {
	return {
		templateUrl : "bathy/popover/popover.html",
		restrict : 'A',
		transclude : true,
		scope : {
			closeOnEscape : "@",
			show : "=",
			containerClass : "=",
			direction : "@"
		},
		link : function(scope, element) {
			if(!scope.direction) {
				scope.direction = "bottom";
			}

			if(scope.closeOnEscape && (scope.closeOnEscape === true || scope.closeOnEscape === "true")) {
				element.on('keyup', keyupHandler);
			}

    		function keyupHandler(keyEvent) {
    			if(keyEvent.which === 27) {
    				keyEvent.stopPropagation();
    				keyEvent.preventDefault();
    				scope.$apply(function() {
        				scope.show = false;
    				});
    			}
    		}
		}

	};
}]);

}