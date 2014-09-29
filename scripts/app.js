'use strict';

angular.module('yololiumApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'duScroll',
  'ui.router',
  'ui.bootstrap',
  'steve',
  'fxos'
])
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider/*, $httpProvider, stConfig*/) {
    //$locationProvider.html5Mode(true);

    // Deal with missing trailing slash
    $urlRouterProvider.rule(function($injector, $location) {
      var path = $location.path(), search = $location.search()
        ;

      if (path[path.length - 1] === '/') {
        return;
      }

      if (Object.keys(search).length === 0) {
        return path + '/';
      }

      var params = []
        ;

      angular.forEach(search, function(v, k){
        params.push(k + '=' + v);
      });

      return path + '/?' + params.join('&');
    });
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('root', {
        url: '/'
      , views: {
          body: {
            templateUrl: 'views/main.html'
          , controller: 'MainCtrl as M'
          }
        }
      })
      ;
  }])
  .run([function () {
    
  }])
  ;
