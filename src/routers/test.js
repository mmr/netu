/* Fake router stats for test purposes */

// For the test convenience, we use:
// host: as number of participant hosts
// user: maxBw
// If host or user contains the word 'fail' the
// failure callback is called

var HOSTS = [
  'Prefect',
  'Kitty\'s iPhone',
  'Ganymede',
  'Kalliope',
  'Nosferatu',
  'Chromecast',
  'Cthulhu',
  'Rincewind',
];

var DEFAULT_MAX_HOSTS = HOSTS.length;
var DEFAULT_MAX_BW_IN_BPS = 100000000;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shouldFail(host, user) {
  return host.indexOf('fail') > -1 || user.indexOf('fail') > -1;
}

function getStats(host, user, pass, successCb, failureCb) {
  if (shouldFail(host, user)) {
    failureCb({'message': 'Fizzles'});
    return;
  }

  // Host is the number of hosts in test
  var maxHosts = parseInt(host, 10) || DEFAULT_MAX_HOSTS;

  // User is the maxBw
  var maxBw = parseInt(user, 10) || DEFAULT_MAX_BW_IN_BPS;

  var freeBw = maxBw;
  var stats = {};
  for (var i = 0; i < maxHosts && freeBw > 0; i++) {
    var name = HOSTS[i];
    var stat = rand(1, freeBw / 3);
    stats[name] = stat;
    freeBw -= stat;
  }

  successCb(stats);
}

// Linting
/* exported getStats */
