var user = 'user';
var pass = 'pass';
var hash = btoa(user + ':' + pass);
var baseUrl = 'http://192.168.1.1/';
var namesUrl = baseUrl + 'userRpm/AssignedIpAddrListRpm.htm';
var conf = {
  'headers': new Headers({
    'Authorization': 'Basic ' + hash
  })
};

function parseIpList(body) {
  var el = document.createElement('span');
  el.innerHTML = body;
  var data = el.children[0].text;
  var items = data.replace(/(?:^[^"]+)|(?:, 0,0 \);$)|["\s]/g, '').split(/,/);
  var ips = {};
  for (var i = 0; i < items.length; i += 4) {
    ips[items[i + 2]] = items[i];
  }
  return ips;
}

function refresh() {
  var n = document.getElementById('main');
  fetch(namesUrl, conf).then(function(response) {
    return response.text();
  }).then(function(body) {
    n.innerHTML = parseIpList(body);
  });
}

function onReady() {
  document.getElementById('refresh').addEventListener('click', refresh);
  refresh();
}

document.addEventListener('DOMContentLoaded', onReady);
