// TODO (mmr) : this should be given by the user from a form
var user = 'user';
var pass = 'pass';
var routerIp = '192.168.1.1';
var maxBwInMbps = 10;

// Constants
var bitsInOneMbit = 1000000;
var bitsInOneByte = 8;
var maxBwInBps = (maxBwInMbps * bitsInOneMbit / bitsInOneByte);
var hash = btoa(user + ':' + pass);
var baseUrl = 'http://' + routerIp + '/userRpm/';
var namesUrl = baseUrl + 'AssignedIpAddrListRpm.htm';
var statsUrl = baseUrl + 'SystemStatisticRpm.htm?Num_per_page=100';
var conf = {
  'headers': new Headers({
    'Authorization': 'Basic ' + hash
  })
};

function getText(body, index) {
  var el = document.createElement('span');
  el.innerHTML = body;
  return el.children[index].text;
}

function parseIpList(body) {
  var data = getText(body, 0);
  var items = data.replace(/(?:^[^"]+)|(?:, 0,0 \);$)|["\s]/g, '').split(/,/);
  var ips = {};
  for (var i = 0; i < items.length; i += 4) {
    ips[items[i + 2]] = items[i];
  }
  return ips;
}

function parseStats(body) {
  var data = xx_data = getText(body, 0);
  var re = xx_re = /"([^"]+)",(?:[^,]+,){4} (\d+)/g;
  var stats = {};
  var m = null;
  while ((m = re.exec(data)) !== null) {
    stats[m[1]] = m[2];
  }
  return stats;
}

function refresh() {
  var n = document.getElementById('main');

  fetch(statsUrl, conf).then(function(resp) {
    return resp.text();
  }).then(function(body) {
    var stats = parseStats(body);
    var statsIps = Object.keys(stats);
    statsIps.sort(function(a, b){ return stats[b] - stats[a]; });

    fetch(namesUrl, conf).then(function(response) {
      return response.text();
    }).then(function(body) {
      var ips = parseIpList(body);

      var msg = '<table border="1">';
      statsIps.forEach(function(key) {
        var name = ips[key];
        var stat = stats[key];
        var perc = Math.round((stat * 100 / maxBwInBps) * 100) / 100;
        msg += '<tr><td>' + name  + '</td><td>' + stat + '</td><td>' + perc + '%</td></tr>';
      });
      msg += '</table>';

      n.innerHTML = msg;
    });
  });
}

function onReady() {
  document.getElementById('refresh').addEventListener('click', refresh);
  refresh();
}

document.addEventListener('DOMContentLoaded', onReady);
