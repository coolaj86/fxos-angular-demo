'use strict';

/**
 * @ngdoc service
 * @name steve.StConfig
 * @description
 * # StConfig
 * Service in the steve.
 */
(function () {

  window.googleAnalyticsToken = 'UA-XXXXXXXX-1';

  var x = {
//*/
  //.value('StConfig', {
      apiPrefix: 'http://cellfox.dev.coolaj86.com:8080' + '/api'
    , hrefBase: 'http://cellfox.dev.coolaj86.com:8080'
//  });
///*
    };
  angular.module('steve', [])
    .constant('stConfig', x)
//
/*
  .provider('StConfigProvider', function StConfigProvider() {
    var me = this || {}
      ;

    Object.keys(x).forEach(function (k) {
      me[k] = x[k];
    });

    
    // return x;
  })
// */
  .service('StConfig', function StConfig() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var me = this
      ;

    Object.keys(x).forEach(function (k) {
      me[k] = x[k];
    });

    //return me;
  });
}());
