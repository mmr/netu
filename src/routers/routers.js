'use strict'

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
      'err': err,
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
