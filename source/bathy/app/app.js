{
   class RootCtrl {
      constructor(configService, mapService) {
         mapService.getMap().then(map => {
            this.map = map;
         });
         configService.getConfig().then(data => {
            this.data = data;
         });
      }
   }
   RootCtrl.$invoke = ['configService', 'mapService'];

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
      'geo.map',
      'geo.maphelper',
      'geo.measure',

      'bathy.autoscroll',
      'bathy.bounds',
      'bathy.clip',
      'bathy.datasets',
      'bathy.daterange',
      'bathy.extent',
      'bathy.header',
      'bathy.maps',
      'bathy.panes',
      'bathy.plot',
      'bathy.reset',
      'bathy.restrict.pan',
      'bathy.select',
      "bathy.side-panel",
      'bathy.splash',
      'bathy.start',
      'bathy.templates',
      'bathy.toolbar'
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

      .controller("RootCtrl", RootCtrl)

      .filter('bytes', function () {
         return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 0;
            let units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
               number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
         };
      });
}
