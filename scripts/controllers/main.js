'use strict';

angular.module('yololiumApp')
  .controller(
    'MainCtrl'
  , [ '$scope'
    , '$http'
    , '$sce'
    , 'StConfig'
    , function (
        $scope
      , $http
      , $sce
      , StConfig
    ) {
    var scope = this
      ;

    scope.logs = [];

    // snthsnthsnh
    $http.get(StConfig.hrefBase + '/404.html').then(function (resp) {
      scope.logs.push({ success: true, log: JSON.stringify(resp.data) });
    }, function (err) {
      scope.logs.push({ error: true, log: JSON.stringify(err) });
    });
  }]);

//
// A lovely Simple Push Notification demo
//
// https://developer.mozilla.org/en-US/docs/WebAPI
// https://developer.mozilla.org/en-US/docs/Web/API/Simple_Push_API
// https://developer.mozilla.org/en-US/Apps/Build/App_permissions
// https://developer.mozilla.org/en-US/Apps/Build/API_support_table
//
/*
  // TODO manually check for updates since push doesn't work very well
  if (navigator.battery.charging || navigator.battery.level >= 0.97) {
    console.log('connected to power');
    // setAlarm(Date.now() + 15 * 1000);
  } else if () {
    // setAlarm(Date.now() + 15 * 60 * 60 * 1000);
  } else {
    // setAlarm(Date.now() + 1 * 60 * 60 * 1000);
  }
  // TODO try websockets
*/

$(function() {
  return;
  'use strict';

  window.onerror = function (e) {
    console.error('[window.onerror] uncaught exception');
    console.error(e);
    log.error('[window.onerror] uncaught exception');
    log.error(e && e.message || e);
  };

  // using systemXHR
  $.ajaxSetup({
    xhr: function() { return new window.XMLHttpRequest({ mozSystem: true, mozAnon: true }); }
  });
  $('.js-test-site-container').hide();

  // TODO Promise
  var log = window.AjLogger.create('#console')
    , db = new window.PouchDB('settings')
    , phoneNumber = '+18014713042'
    , secret = 'be a super secret whatever'
    , homeBase = 'http://cellfox.dev.coolaj86.com:8080'
    , payloadsUrl = homeBase + '/api/phones/:id/notifications' // needs replace
    , registerUrl = homeBase +  '/api/register/phone' // TODO -> /api/register/phone
    , gamestate = {
        master: '+13174266525'
      , players: {}
      , words: ['pirate bay', 'sad panda', 'superhero']
      , round: 0
      , minplayers: 0
      , maxplayers: 6
      }
    ;

  $('#push-form').on('submit', function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    db.get('push_endpoint', function (err, doc) {
      if (err && 404 !== err.status) {
        console.error(err);
        log.alert('Error with PouchDB / IndexedDB: ' + err.message);
      }

      if (!doc) {
        registerMozilla();
      } else /* if (!doc.friendlyId) */ {
        registerHome(doc.url, doc.oldUrl);
      /*
      } else {
        showRegistration(doc);
      */
      }
    });
  });

  $('.js-try-push').on('click', function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    db.get('push_endpoint', function (err, doc) {
      if (!doc || !doc.url) {
        log.error("doc.url disappeared");
      }

      if ('number' !== typeof doc.count) {
        doc.count = -1;
      }
      doc.count += 1;
      log.clear();
      log('v' + doc.count + ': sending push...');

      log(
        "curl '" + doc.url + "' \\"
      + "\n  -X PUT \\"
      + "\n  -d 'version=" + doc.count + "' \\"
      + "\n  -v"
      );
      $.ajax({
        url: doc.url
      , type: 'PUT'
      , data: { version: doc.count } // urlencoded
      }).then(function (data) {
        console.log('data');
        console.log(JSON.stringify(data));

        db.put(doc, function (err) {
          if (err) {
            log.error('error saving count');
            return;
          }

          log.info('v' + doc.count + ': awaiting notification...');
        });
      });
    });
  });

  $('body').on('click', '[name="reset"]', function () {
    db.get('push_endpoint', function (err, doc) {
      var request
        , count = 0
        ;

      if (!doc) {
        return;
      }

      function unregister(url) {
        request = navigator.push.unregister(url);
        request.onsuccess = function (e) {
          console.log(e);
          log('[unregistered]');
        };
        request.onerror = function (e) {
          if (count > 3) {
            return;
          }
          count += 1;
          setTimeout(function () {
            unregister(url);
          }, 10 * 60 * 1000);
          console.log(e);
          log('[fail] [unregister]:' + (e && e.message || JSON.stringify(e)));
        };
      }

      unregister(doc.url);
      db.remove(doc._id, doc._rev, function (/*err, response*/) {
        log.warn('[delete]');
      });
    });
  });
  $('body').on('click', '#console-clear', function () {
    log.clear();
  });

  // Register with Mozilla for a push notification
  function registerMozilla(oldUrl) {
    if (!window.navigator.push) {
      console.error('missing navigator.push');
    }
 
    var req = navigator.push.register()
      ;
    
    log('Registering for push notification...');
    req.addEventListener('success', function (/*ev*/) {
      var endpoint = req.result
        ;

      db.put({
        _id: 'push_endpoint'
      , url: req.result
      }, function (err) {
        if (err) {
          log.error('error saving endpoint to Pouch');
          log.error(err);
        }
        registerHome(endpoint, oldUrl);
      });
    });

    req.addEventListener('error', function(ev) {
      console.error("Error getting a new endpoint: " + ev.target.error.name);
      console.error("Error getting a new endpoint: " + req.error);
      console.error("Error getting a new endpoint: " + req.error.name);

      log.error(ev.target.error.name);
      log.error(req.error);
      log.error(req.error.name);
    });
  }

  // Register at our own server to use that url
  function registerHome(endpoint, oldUrl) {
    // TODO update server to keep friendlyId the same
    $.post(registerUrl, {
      url: endpoint
    , webhook: endpoint
    , previous: oldUrl
    , number: phoneNumber
    , secret: secret
    }).then(
      function (body) {
        db.get('push_endpoint', function (err, doc) {
          if (!doc || !doc.url) {
            log.error('db data disappeared');
            doc = { _id: 'push_endpoint' };
          }

          doc.url = endpoint;
          doc.friendlyId = body.id;

          db.put(doc, function (err) {
            if (err) {
              log('error storing in pouch', 'error');
              log(err && err.message || err, 'error');
            } else {
              showRegistration(doc);
            }
          });
        });
      }
    , function (err) {
        // NOTE: you may never get here because Firefox OS
        // doesn't send you data from non-200 requests
        log('error communicating with server', 'error');
        log(err && err.message || JSON.stringify(err), 'error');
      });
  }

  function showRegistration(doc) {
    $('a.js-test-site').attr('href', homeBase).text(homeBase);
    $('.js-test-site-container').show();
    log.clear();
    log('Registered');
    log.info(doc.friendlyId);
    log(doc.url);
  }

  function sendOneSms(body) {
    log.clear();
    log.log('[SMS activated]');
    log.log(body.body);
    body.to.forEach(function (to) {
      var msg = body.body
        , request = navigator.mozMobileMessage.send(to, msg)
        ;

      log.log('[sending] ' + to);
      log.log(msg);
      request.onsuccess = function () {
        // TODO send confirm
        log.log('[sent] ' + to);
        log.log(this.result);
      };
      request.onerror = function () {
        // TODO send error
        log.error('[error] ' + to);
        log.error(this.error.name + ':' + this.error.message);
        log.error(JSON.stringify(this.error));
        log.error(this.error.toString());
      };

    });
  }

  function sendSms(body) {
    var msg = body.body
      , requests
      , to = body.to.map(function (to) { return to.replace(/\+1(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"); })
      ;

    log.clear();
    log.log('[SMS activated]');
    log.log(body.body);

    requests = navigator.mozMobileMessage.send(to, msg);
    requests.forEach(function (request) {
      log.log('[sending] to all');
      log.log(msg);
      request.onsuccess = function () {
        // TODO send confirm
        log.log('[sent] ' + Object.keys(this.result));
        log.log(this.result);
      };
      request.onerror = function () {
        // TODO send error
        log.error('[error] ' + this.result);
        log.error(this.error.name + ':' + this.error.message);
        log.error(JSON.stringify(this.error));
        log.error(this.error.toString());
      };
    });
  }

  function listenForPush() {
    window.navigator.mozSetMessageHandler('push', function(ev) {
      //console.log('[push notification]');
      //console.log(ev);
      //log.clear();
      log('[push notification]');
      log('v' + ev.version);
      log('from ' + ev.pushEndpoint);
      log("retrieving... ");
      
      db.get('push_endpoint', function (err, doc) {
        $.get(payloadsUrl.replace(':id', doc.friendlyId))
          .then(
            function (data) {
              if (!data) {
                log.error('NO DATA');
                return;
              }

              if (!data.batch) {
                log.error('NO BATCH');
                log.error(JSON.stringify(data));
                return;
              }

              //log.clear();
              log.log('[push notification] retrieved data:');
              log.log(JSON.stringify(data));
              data.batch.forEach(function (data) {
                if ('sms' === data.type) {
                  // TODO POST to confirm
                  sendSms(data);
                  return;
                }
              });
            }
          , function (err) {
              log.error("failed to retrieve push data");
              log.error(JSON.stringify(err));
            }
          );
      });
    });

    window.navigator.mozSetMessageHandler('push-register', function() {
      log.clear();
      log.warn("[push-register] renewing endpoint...");
      
      db.get('push_endpoint', function(err, doc) {
        if (!doc) {
          registerMozilla();
          return;
        }

        db.remove(doc._id, doc._rev, function (/*err, response*/) {
          registerMozilla(doc.url);
        });
      });
    });
  }

  function simpleSend(to, text) {
    var requests
      ;

    if (!to) {
      log.error('No one to send to');
      return;
    }

    if (!Array.isArray(to)) {
      to = [to];
    }

    log.log('[Sending]');
    log.log(JSON.stringify(to));
    log.log(text);

    requests = navigator.mozMobileMessage.send(to, text);
    requests.forEach(function (request) {
      request.onsuccess = function () {
        log.log('[sent] ' + Object.keys(this.result));
        log.log(this.result.receiver + ':' + this.result.sender);
      };
      request.onerror = function () {
        // TODO send error
        log.error('[error] ' + this.result);
        log.error(this.error.name + ':' + this.error.message);
        log.error(JSON.stringify(this.error));
        log.error(this.error.toString());
      };
    });
  }

  function playerAdded(player) {
    var msg = player.name + " (" + player.number + ") has joined the match. ("
      ;

    msg += Object.keys(gamestate.players).length;

    if (gamestate.minplayers) {
      msg += "/" + gamestate.minplayers;
    }

    msg += ")";

    if (gamestate.minplayers) {
      if (Object.keys(gamestate.players).length >= gamestate.minplayers) {
        msg += "Ready to start? (type 'start')";
      }
    }
    simpleSend(gamestate.master, msg);
  }

  function handleMasterMessage(cmd, text) {
    var num
      , valid
      ;

    if ('numplayers' === gamestate.mstate) {
      num = parseInt(cmd, 10);
      valid = num > 0;

      if (!valid) {
        simpleSend(gamestate.master, "'" + text + "' didn't make sense to me. How many players? (pick a number between 2 and 10)");
      } else {
        simpleSend(gamestate.master, "Okay, tell your " + num + " players to text 'Join' to join. :-D");
      }
      gamestate.mstate = 'ready';
    }

    if ('ready' === gamestate.mstate) {
      if (/^start$/.test(cmd)) {
        startRound();
      }
    }
  }

  // http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffle(array) {
    var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  function startRound() {
    gamestate.active = true;
    gamestate.word = gamestate.words.pop();
    if (!gamestate.word) {
      simpleBroadcast("Game over");
      return;
    }
    simpleBroadcast("Rearrange these characters into the word I'm thinking of: "
      + shuffle(gamestate.word.split('')).join(''));
  }

  function handleMessage(from, text) {
    var player = gamestate.players[from]
      , cmd = text.trim().toLowerCase()
      , msg
      ;

    if (from === gamestate.master) {
      handleMasterMessage(cmd, text);
      return;
    }

    if (/^STOP$/i.test(cmd)) {
      player = gamestate.players[from] || {};
      delete gamestate.players[from];
      simpleSend(from, 'you have been removed from the game');
      if (player) {
        simpleSend(gamestate.master, (player.name || player.number) + ' left the game');
      }
      return;
    }

    log.log('cmd 0:', cmd);
    if (!gamestate.active) {
      log.log('cmd:', cmd);
      if (/^join$/i.test(cmd)) {
        player = gamestate.players[from] = { number: from, state: 'join', points: 0 };
        simpleSend(from, "Welcome to Mixed Up Words competition, Player "
          + Object.keys(gamestate.players).length
          + ",  What's your name?");
        player.state = 'name';
        return;
      }

      if ('name' === player.state) {
        player.name = text;
        player.state = 'ready'; // pending -> let the game master accept
        msg = "Hey, " + player.name + ", you're application has been submitted and we'll let you know when the games begins.";
        simpleSend(from, msg);
        playerAdded(player);
        return;
      }

      simpleSend(from, "Unrecognized command. Please wait for the next round or text STOP to leave the game.");
    } else if (gamestate.active) {
      if (cmd === gamestate.word) {
        gamestate.active = false;
        player.points += 1;
        msg = player.name + " guessed " + gamestate.word + " and won this round!\n";

        msg += getLeaderboard();

        simpleBroadcast(msg);
        simpleSend(gamestate.master, "send 'start' to begin the next round");
      } else {
        simpleSend(from, "WRONG. Try Again");
      }
      // TODO it's a guess
    } else {
    }
  }

  function getLeaderboard() {
    var msg = ''
      ;

    Object.keys(gamestate.players).sort(function (a, b) {
      return a.points - b.points;
    }).forEach(function (k) {
      var p = gamestate.players[k]
        ;

      if (p.name) {
        msg += p.points + ": " + p.name + ' \n';
      }
    });

    return msg;
  }

  function simpleBroadcast(msg) {
    var to = []
      ;

    Object.keys(gamestate.players).forEach(function (k) {
      var p = gamestate.players[k]
        ;

      to.push(p.number);
    });
    to.push(gamestate.master);

    simpleSend(to, msg);
  }

  function showMessages(id) {
    var filter = new MozSmsFilter() // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsFilter
      , cursor
      ;

    filter.read = false;
    if ('undefined' !== typeof id) {
      filter.threadId = id;
    }

    // Get the messages from the latest to the first
    cursor = navigator.mozMobileMessage.getMessages(filter, true);

    cursor.onsuccess = function () {
      var msg = this.result
        ;

      /*
      $.ajax({
        url: '/api/phones/:secret/messages'.replace(':secret', secret)
      , type: 'POST'
        // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsMessage.receiver
      , data: { body: msg.body, sender: msg.sender, receiver: msg.receiver }
      //, contentType: 'application/json; charset=UTF-8'
      }).then(function (data) {
        log.log(JSON.stringify(data));
      }, function (err) {
        log.error(JSON.stringify(err));
      });
      */

      /*
      navigator.mozMobileMessage.
      MozMobileMessageManager.markMessageRead(id, isRead)
      MozSmsManager.markMessageRead(id, isRead)
      */
      log.log(this.result.sender + ': ' + this.result.body);
      handleMessage(this.result.sender, this.result.body);
      /*
      var message = this.result
        , time = message.timestamp.toDateString()
        ;

      console.log(time + ': ' + (message.body || message.subject)); // SMS || MMS
      $("#response").append("<div>Got new message [" + time + "]"
        + "<br>" + (message.body || message.subject)
        + "</div>"
      );

      if (!this.done) {
        this.continue();
      }
      */
    };
  }

  function listenForSms() {
    log.log('Initializing SMS Listener (requires sending)');
    var requests = navigator.mozMobileMessage.send(
          [gamestate.master]
        , "How many players should we wait for?"
        )
      ;

    gamestate.mstate = 'numplayers';

    requests.forEach(function (request) {
      request.onsuccess = function () {
        // TODO send confirm
        log.log('[sent] ' + Object.keys(this.result));
        log.log(this.result);
      };
      request.onerror = function () {
        // TODO send error
        log.error('[error] ' + this.result);
        log.error(this.error.name + ':' + this.error.message);
        log.error(JSON.stringify(this.error));
        log.error(this.error.toString());
      };
    });

    navigator.mozMobileMessage.addEventListener('received', function (msg) {
      // https://developer.mozilla.org/en-US/docs/Web/API/MozSmsMessage
      log.log("SMS received");
      log.log(JSON.stringify(msg));

      showMessages(msg.id);
    });
  }

  // Receive the push notifications
  if (window.navigator.mozSetMessageHandler) {
    listenForPush();
    listenForSms();
  } else {
    // No message handler
    log("mozSetMessageHandler missing");
  }
});
