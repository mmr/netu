// Constants
var bitsInOneMbit = 1000000;
var bitsInOneByte = 8;
var w = 400;
var h = 400;
var r = h/2;
var color = d3.scale.category20c();

// TODO (mmr) : globals... yeah
var host = null;
var user = null;
var pass = null;
var maxBw = null;
var main = null;

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

function createButtons() {
  var span = document.createElement('span');
  span.appendChild(createButton('Refresh', refresh));
  span.appendChild(createButton('Settings', showSettingsForm));
  return span;
}

function handleErr(err) {
  var data = '<p>Something bad happened: ' + err + '<p/>';
  main.innerHTML = data;
  main.appendChild(createButtons());
}

function clear() {
  main.innerHTML = '';
}

function drawPie(data) {
  var mainId = '#' + main.id;
  var vis = d3.select(mainId).append('svg:svg').data([data])
    .attr('width', w)
    .attr('height', h)
    .append('svg:g')
    .attr('transform', 'translate('+ r + ',' + r + ')');

  var pie = d3.layout.pie().value(function(d){ return d.value; } );
  var arc = d3.svg.arc().outerRadius(r);
  var arcs = vis.selectAll('g.slice')
    .data(pie).enter().append('svg:g').attr('class', 'slice');

  arcs.append('svg:path')
    .attr('fill', function(d, i) {
      return color(i);
    })
    .attr('d', function(d) {
      return arc(d);
    });

  arcs.append('svg:text')
    .attr('transform',function(d) {
      d.innerRadius = 0;
      d.outerRadius = r;
      return 'translate(' + arc.centroid(d) + ')';
    })
    .attr('text-anchor', 'middle').text(function(d, i) {
      return data[i].label + ' ' + data[i].value + '%';
    });
}

function getData(stats, body) {
  var maxBwInBps = (maxBw * bitsInOneMbit / bitsInOneByte);
  var unusedPerc = 100;
  var ips = parseIpList(body);
  var statsIps = Object.keys(stats);
  var data = [];
  //statsIps.sort(function(a, b){ return stats[b] - stats[a]; });
  statsIps.forEach(function(key) {
    var name = ips[key];
    var stat = stats[key] / 2;
    var perc = Math.round((stat * 100 / maxBwInBps) * 100) / 100;
    if (perc > 1) {
      data.push({label: name, value: perc});
      unusedPerc -= perc;
    }
  });
  data.push({label: '', value: unusedPerc});
  return data;
}

function refresh() {
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
    handleErr(err);
  }).then(function(body) {
    var stats = parseStats(body);

    fetch(namesUrl, conf).then(function(resp) {
      return resp.text();
    }).then(function(body) {
      var data = getData(stats, body);
      clear();
      drawPie(data);
      main.appendChild(createButtons());
    }).catch(function(err) {
      handleErr(err);
    });
  });
}

function createInput(name, type, defaultValue, placeholder) {
  var span = document.createElement('span');
  input = " <input";
  input += " id='" + name + "'";
  input += " name='" + name + "'";
  input += " type='" + type + "'";
  input += " value='" + (defaultValue === undefined ? '' : defaultValue) + "'";
  input += " placeholder = '" + placeholder + "'";
  input += " />";
  span.innerHTML = input;
  return span;
}

function getInputValue(name) {
  return document.getElementById(name).value;
}

function saveSettings() {
  host = getInputValue('host');
  user = getInputValue('user');
  pass = getInputValue('pass');
  maxBw = getInputValue('maxBw');
  chrome.storage.sync.set({
      'host': host,
      'user': user,
      'pass': pass,
      'maxBw': maxBw
    }, function() {
      refresh();
    }
  );
}

function createButton(name, action) {
  var button = document.createElement('button');
  button.id = name;
  button.innerText = name;
  button.addEventListener('click', action);
  return button;
}

function createSettingsForm() {
  var hostInput = createInput('host', 'text', host, 'Host');
  var userInput = createInput('user', 'text', user, 'User');
  var passInput = createInput('pass', 'password', pass, 'Password');
  var maxBwInput = createInput('maxBw', 'text', maxBw, 'MaxBw in Mbit/s');
  var saveButton = createButton('Save', saveSettings);

  var fieldSet = document.createElement('fieldset');
  var legend = document.createElement('legend');
  legend.innerText = 'Settings';
  fieldSet.appendChild(legend);
  fieldSet.appendChild(hostInput);
  fieldSet.appendChild(userInput);
  fieldSet.appendChild(passInput);
  fieldSet.appendChild(maxBwInput);
  fieldSet.appendChild(saveButton);
  return fieldSet;
}

function showSettingsForm() {
  clear();
  main.appendChild(createSettingsForm());
}

function setUp() {
  // If settings is in storage, gets data, if not show settings form
  chrome.storage.sync.get(['host', 'user', 'pass', 'maxBw'], function (items) {
    host = items['host'];
    user = items['user'];
    pass = items['pass'];
    maxBw = items['maxBw'];

    if (host && user && pass && maxBw) {
      refresh();
    } else {
      showSettingsForm();
    }
  });
}

function onReady() {
  main = document.getElementById('main');
  setUp();
}

document.addEventListener('DOMContentLoaded', onReady);
