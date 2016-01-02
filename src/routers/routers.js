self.addEventListener('message', function (e) {
  var data = e.data;
  var routerScript = data.routerScript;
  var host = data.host;
  var user = data.user;
  var pass = data.pass;

  function onSuccess(ips, stats) {
    postMessage({
      'status': 'success',
      'ips': ips,
      'stats': stats,
    });
  }

  function onFailure(err) {
    postMessage({
      'status': 'failure',
      'err': err,
    });
  }

  importScripts('routers/' + routerScript);
  var stats = getStats(host, user, pass, onSuccess, onFailure);
  self.postMessage(stats);
});
