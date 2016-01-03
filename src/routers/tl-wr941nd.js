/* TP-LINK WR941ND router stats fetcher script */
var dataRe = /^<SCRIPT[^>]+>([^<]+)<\/SCRIPT>/;
var ipsRe = /^"([^"]+)", "[^"]+", "([\d.]+)"/gm;
var statsRe = /"([^"]+)",(?:[^,]+,){4} (\d+)/g;

function parseIpList(body) {
  var data = dataRe.exec(body)[1];
  var ips = {};
  var m = null;
  while ((m = ipsRe.exec(data)) !== null) {
    var name = m[1];
    var ip = m[2];
    ips[ip] = name;
  }
  return ips;
}

function parseStats(body) {
  var data = dataRe.exec(body)[1];
  var stats = {};
  var m = null;
  while ((m = statsRe.exec(data)) !== null) {
    var ip = m[1];
    var stat = parseInt(m[2], 10);
    if (stat > 0) {
      stats[ip] = stat;
    }
  }
  return stats;
}

function translateNames(stats, names) {
  var translated = {};
  Object.keys(stats).forEach(function(ip) {
    var name = names[ip];
    translated[name] = stats[ip];
  });
  return translated;
}

function getStats(host, user, pass, successCb, failureCb) {
  var hash = btoa(user + ':' + pass);
  var baseUrl = 'http://' + host + '/userRpm/';
  var namesUrl = baseUrl + 'AssignedIpAddrListRpm.htm';
  var statsUrl = baseUrl + 'SystemStatisticRpm.htm?Num_per_page=100';
  var conf = {
    headers: new Headers({
      Authorization: 'Basic ' + hash,
    }),
  };

  // Fetch ip:name map
  fetch(namesUrl, conf).then(function(resp) {
    return resp.text();
  }).catch(function(err) {
    failureCb(err);
  }).then(function(ipsBody) {
    if (!ipsBody) {
      return;
    }

    // Get ip:name map
    var names = parseIpList(ipsBody);

    // Fetch stats for each ip
    fetch(statsUrl, conf).then(function(resp) {
      return resp.text();
    }).then(function(statsBody) {
      // Translate ip to name and return to success callback
      var stats = translateNames(parseStats(statsBody), names);
      successCb(stats);
    }).catch(function(err) {
      failureCb(err);
    });
  });
}

// Linting
/* exported getStats */
