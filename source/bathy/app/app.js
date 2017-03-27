(function (angular) {

   'use strict';

   angular.module("BathyApp", [
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

      'geo.baselayer.control',
      'geo.draw',
      'geo.elevation',
      'geo.geosearch',
      'geo.map',
      'geo.maphelper',
      'geo.measure',

      'bathy.autoscroll',
      'bathy.daterange',
      'bathy.extent',
      'bathy.glossary',
      'bathy.header',
      'bathy.help',
      'bathy.legend',
      'bathy.lga',
      'bathy.maps',
      'bathy.panes',
      'bathy.plot',
      'bathy.reset',
      'bathy.select',
      "bathy.side-panel",
      'bathy.splash',
      'bathy.start',
      'bathy.tabs',
      'bathy.templates',
      'bathy.toolbar',
      'bathy.wms'
   ])

      // Set up all the service providers here.
      .config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
            configServiceProvider.location("bathy/resources/config/config.json");
            configServiceProvider.dynamicLocation("bathy/resources/config/configclient.json?");
	         versionServiceProvider.url("bathy/assets/package.json");
            persistServiceProvider.handler("local");
            projectsServiceProvider.setProject("bathy");
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