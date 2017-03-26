(function (angular) {

   'use strict';

   angular.module("Mh370App", [
      'explorer.config',
      'explorer.confirm',
      'explorer.enter',
      'explorer.flasher',
      'explorer.googleanalytics',
      'explorer.httpdata',
      'explorer.info',
      'explorer.legend',
      'explorer.message',
      'explorer.modal',
      'explorer.persist',
      'explorer.projects',
      'explorer.tabs',
      'explorer.version',

      'exp.ui.templates',
      'explorer.map.templates',

      'ui.bootstrap',
      'ngAutocomplete',
      'ngRoute',
      'ngSanitize',
      'page.footer',

      'geo.draw',
      'geo.elevation',
      //'mh370.elevation',
      'geo.geosearch',
      'geo.map',
      'geo.maphelper',
      'geo.measure',

      'mh370.autoscroll',
      'mh370.baselayer.control',
      'mh370.daterange',
      'mh370.extent',
      'mh370.glossary',
      'mh370.header',
      'mh370.help',
      'mh370.legend',
      'mh370.lga',
      'mh370.maps',
      'mh370.panes',
      'mh370.plot',
      'mh370.reset',
      'mh370.select',
      "mh370.side-panel",
      'mh370.splash',
      'mh370.start',
      'mh370.tabs',
      'mh370.templates',
      'mh370.toolbar',
      'mh370.wms'
   ])

      // Set up all the service providers here.
      .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
            configServiceProvider.location("mh370/resources/config/config.json");
            configServiceProvider.dynamicLocation("mh370/resources/config/configclient.json?");
	         versionServiceProvider.url("mh370/assets/package.json");
            persistServiceProvider.handler("local");
            projectsServiceProvider.setProject("mh370");
         }])
/*

      .factory("userService", [function () {
         return {
            login: noop,
            hasAcceptedTerms: noop,
            setAcceptedTerms: noop,
            getUsername: function () {
               return "anon";
            }
         };
         function noop() { return true; }
      }])
*/
      .controller("RootCtrl", RootCtrl);

   RootCtrl.$invoke = ['$http', 'configService', 'mapService'];
   function RootCtrl($http, configService, mapService) {
      let self = this;

      mapService.getMap().then(function (map) {
         self.map = map;
      });
      configService.getConfig().then(function (data) {
         self.data = data;
      });
   }


})(angular);