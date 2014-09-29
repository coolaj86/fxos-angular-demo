'use strict';

/**
 * @ngdoc service
 * @name fxos.msg
 * @description
 * # msg
 * Service in the fxos.
 */
angular.module('fxos', [])
  .service('fxMsg', ['$rootScope', '$q', '$window', function msg($rootScope, $q, $window) {
    // AngularJS will instantiate a singleton by calling "new" on this function

        // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsManager (1.3 API?)
        // https://developer.mozilla.org/en-US/docs/Web/API/MozMobileMessageManager (2.0 API?)
    var MsgMngr = $window.navigator.mozMobileMessage
        // events => [deliveryerror, deliverysuccess, received, sent, sending, failed]
        // are these delivery events receipts?
      ;
  
    // https://developer.mozilla.org/en-US/docs/Web/API/WebSMS_API
    // navigator.mozMobileMessage
      // navigator.mozMobileMessage.send("+1 (801) 360-4427", "Test") // works 1.3
    // navigator.mozSetMessageHandler
    // window.MozMobileMessageManager
      // .send("+1 (801) 360-4427", "Test") // 1.3 doesn't work
    // window.MozSmsSegmentInfo
    // window.MozSmsMessage
    // window.MozSmsFilter
    // window.MozSmsEvent
    // window.MozMmsMessage
    // window.MozMmsEvent
    // window.MozMobileMessageManager
    // window.MozMobileMessageThread
    function Msg() {
    }

    /*
    Msg.create = function (url, $scope) {
      //Msg.$scope = $scope || $rootScope;
      return Msg;
    };
    */

    Msg.$scope = $rootScope;
    Msg.on = function (eventname, fn) {
      // events:
        // received
      MsgMngr.addEventListener(eventname, function (msg) {
        // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsMessage
        //console.log("SMS received");
        //console.log(JSON.stringify(msg));

        console.log('msg');
        console.log(msg);
        console.log('this.result');
        console.log(this.result);
        getById(msg.id || this.id || this.result && this.result.id).then(function (res) {
          // handled by getById
          //Msg.$scope.$apply(function () {
            fn.call(null, res);
          //});
        });
      });
    };

    Msg.addEventListener = Msg.on;

    function smsToJSON(msg) {
      return {
        // observed
        body: msg.body
      , delivery: msg.delivery                    // received   (sender)      sent / sending    error
      , deliveryStatus: msg.deliveryStatus        // success    (receiver)    not-applicable    error
      , deliveryTimestamp: msg.deliveryTimestamp
      , iccId: msg.iccId
      , id: msg.id
      , messageClass: msg.messageClass            // normal, class-1 (i.e. short code messages from provider)
      , read: msg.read
      , receiver: msg.receiver // empty (should show which SIM this is from). Sad Day.
      , sender: msg.sender
      , threadId: msg.threadId
      , timestamp: msg.timestamp
      , type: msg.type

        // supposedly on mmsg
      , subject: msg.subject

      // for debugging
      , _original: msg
      };
    }

    function getById(id) {
      var defer = $q.defer()
        ;

      var x = MsgMngr.getMessage(id);
      x.onsuccess = function (/*ev*/) {
        // this.result === ev.target.result
        defer.resolve(smsToJSON(this.result));
      };
      x.onerror = function (/*ev*/) {
        defer.reject(this.error);
      };

      return defer.promise;
    }

    function get(opts) {
      opts = opts || {};

      // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsFilter
      var filter = new $window.MozSmsFilter()
          // threadId, read, startDate, endDate, numbers, delivery
        , cursor
        , defer = $q.defer()
        , ps = []
        , reverse
        , limit = 20
        , offset = 0
        , count = 0
        ;

      if ('undefined' !== typeof opts.threadId) {
        filter.threadId = opts.threadId;
      }

      if ('undefined' !== typeof opts.limit) {
        limit = opts.limit;
      }

      if ('undefined' !== typeof opts.offset) {
        offset = opts.offset;
      }

      if ('undefined' !== typeof opts.read) {
        filter.read = opts.read;
      }

      if ('undefined' !== typeof opts.reverse) {
        reverse = opts.reverse;
      } else {
        // default to newest first
        reverse = true;
      }

      if ('undefined' !== typeof opts.numbers) {
        filter.numbers = opts.numbers;
      }

      cursor = MsgMngr.getMessages(filter, reverse);
      cursor.onsuccess = function (/*thing?*/) {
        if (this.done || count >= (offset + limit)) {
          defer.resolve(ps);
          return;
        }

        var msg = this.result
          ;

        if (count >= offset) {
          // copy DOM object to javascript so that console.log will show something meaningful
          ps.push(smsToJSON(msg));
        }

        count += 1;
        this.continue();
      };

      return defer.promise;
    }

    function send(to, text) {
      var requests
        , ps = []
        ;

      requests = MsgMngr.send(to, text);

      if (!Array.isArray(to)) {
        requests = [requests];
      }

      requests.forEach(function (request) {
        var defer = $q.defer()
          ;

        request.onsuccess = function () {
          // TODO send confirm
          console.log('[sent]');
          console.log(this.result);
          defer.resolve(this.result || this);
        };

        request.onerror = function () {
          // TODO send error
          console.error('[error] ' + this.result);
          console.error(this.error.name + ':' + this.error.message);
          console.error(JSON.stringify(this.error));
          console.error(this.error.toString());
          defer.resolve({ error: this.error || this });
        };

        ps.push(defer.promise);
      });

      return $q.all(ps).then(function (results) {
        // TODO  get javascript version of results / errors
        if (Array.isArray(to)) {
          return results;
        } else {
          return results[0] || null;
        }
      });
    }

    function setRead(msg, read) {
      var id = msg.id || id
        , defer = $q.defer()
        , r
        ;

      r = MsgMngr.markMessageRead(id, read);
      r.onsuccess = function () {
        defer.resolve();
      };
      r.onerror = function () {
        defer.reject();
      };

      return defer.promise;
    }

    function del(msg) {
      var id = msg.id || msg
        , defer = $q.defer()
        , r
        ;

      r = MsgMngr.delete(id);
      r.onsuccess = function () {
        defer.resolve();
      };
      r.onerror = function () {
        defer.reject();
      };

      return defer.promise;
    }

    function multipart() {
      // .getSegmentInfoForText(text)
    }

    return {
      get: get
    , getById: getById
    , on: Msg.on
    , send: send
    , setRead: setRead
    , delete: del
    };
  }]);
