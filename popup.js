var user = 'user';
var pass = 'pass';
var hash = btoa(user + ':' + pass);
var baseUrl = 'http://192.168.1.1/userRpm/';
var namesUrl = baseUrl + 'AssignedIpAddrListRpm.htm';
var statsUrl = baseUrl + 'SystemStatisticRpm.htm';
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
  var data = getText(body, 0);
  var re = /"([^"]+)",(?:[^,]+,){4} (\d+)/g;
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
    console.log(1);
    return resp.text();
  }).then(function(body) {
    console.log(2);
    var stats = parseStats(body);
    fetch(namesUrl, conf).then(function(response) {
      console.log(3);
      return response.text();
    }).then(function(body) {
      console.log(4);
      var ips = parseIpList(body);

      var msg = '<table>';
      for (var ip in ips) {
        console.log(5, ip);
        var name = ips[ip];
        var stat = stats[ip];
        msg += '<tr><td>' + name  + '</td><td>' + stat + '</td></tr>';
      }
      msg += '</table>';

      console.log(6, msg);
      n.innerHTML = msg;
    });
  });
}

function onReady() {
  document.getElementById('refresh').addEventListener('click', refresh);
  refresh();
}

document.addEventListener('DOMContentLoaded', onReady);
