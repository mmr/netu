/* Fake router stats for test purposes */

// For the test convenience, we use:
// host: as number of participant hosts
// user: maxBw
// If host or user contains the word 'fail' the
// failure callback is called

var DEFAULT_MAX_HOSTS = 10;
var DEFAULT_MAX_BW_IN_BPS = 100000000;

var HOSTS = [
  'jaspion',
  'Úñíçôdè Têst',
  '"[<(hue)>]"',
  'really-long-name-that-could-break-our-layout',
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shouldFail(host, user) {
  return host.indexOf('fail') > -1 || user.indexOf('fail') > -1;
}

function getStats(host, user, pass, successCb, failureCb) {
  if (shouldFail(host, user)) {
    failureCb('Failure');
    return;
  }

  // Host is the number of hosts in test
  var maxHosts = parseInt(host) || DEFAULT_MAX_HOSTS;

  // User is the maxBw
  var maxBw = parseInt(user) || DEFAULT_MAX_BW_IN_BPS;

  var freeBw = maxBw;
  var stats = {};
  for (var i = 0; i < maxHosts && freeBw > 0; i++) {
    var name = HOSTS[rand(0, HOSTS.length - 1)] + i;
    var stat = rand(1, freeBw);
    stats[name] = stat;
    freeBw -= stat;
  }

  successCb(stats);
}

// Linting
/* exported getStats */