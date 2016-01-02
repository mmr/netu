/*
function getText(body, index) {
  var el = document.createElement('span');
  el.innerHTML = body;
  return el.children[index].text;
}
*/

function parseIpList(body) {
  // var data = getText(body, 0);
  var data = body;
  var items = data.replace(/(?:^[^"]+)|(?:, 0,0 \);$)|["\s]/g, '').split(/,/);
  var ips = {};
  for (var i = 0; i < items.length; i += 4) {
    ips[items[i + 2]] = items[i];
  }
  return ips;
}

function parseStats(body) {
  // var data = getText(body, 0);
  var data = body;
  var re = /"([^"]+)",(?:[^,]+,){4} (\d+)/g;
  var stats = {};
  var m = null;
  while ((m = re.exec(data)) !== null) {
    stats[m[1]] = m[2];
  }
  return stats;
}

function handleErr(err) {
  var data = '<p>Something bad happened: ' + err + '<p/>';
  main.innerHTML = data;
  main.appendChild(createButtons());
}

function getStats(host, user, pass, successCb, failureCb) {
  var hash = btoa(user + ':' + pass);
  var baseUrl = 'http://' + host + '/userRpm/';
  var namesUrl = baseUrl + 'AssignedIpAddrListRpm.htm';
  var statsUrl = baseUrl + 'SystemStatisticRpm.htm?Num_per_page=100';
  var conf = {
    'headers': new Headers({
      'Authorization': 'Basic ' + hash
    })
  };

  fetch(statsUrl, conf).then(function(resp) {
    return resp.text();
  }).catch(function(err) {
    failureCb(err);
  }).then(function(body) {
    var stats = parseStats(body);

    fetch(namesUrl, conf).then(function(resp) {
      return resp.text();
    }).then(function(body) {
      var ips = parseIpList(body);
      successCb(ips, stats);
    }).catch(function(err) {
      failureCb(err);
    });
  });
}
