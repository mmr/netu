// Linting
/* global importScripts */
/* global getStats */

self.addEventListener('message', function (e) {

  function onSuccess(stats) {
    self.postMessage({
      'status': 'success',
      'stats': stats,
    });
  }

  function onFailure(err) {
    self.postMessage({
      'status': 'failure',
      'err': err.message,
    });
  }

  var data = e.data;
  var routerScript = data.routerScript;
  var host = data.host;
  var user = data.user;
  var pass = data.pass;

  importScripts(routerScript);
  getStats(host, user, pass, onSuccess, onFailure);
});
