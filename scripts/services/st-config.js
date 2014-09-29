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
  /*
  var XHR = window.XMLHttpRequest
    ;

  window.XMLHttpRequest = function () {
    return new XHR({ mozAnon: true, mozSystem: true });
  };
  */

  var hrefBase = 'http://cellfox.dev.coolaj86.com:7070'
    , x = {
//*/
  //.value('StConfig', {
      apiPrefix: hrefBase + '/api'
    , hrefBase: hrefBase
    , phoneNumber: '+18014713042'
    , secret: 'be a super secret whatever'
    , testNumber: '+18013604427'
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
