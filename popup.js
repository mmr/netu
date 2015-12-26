// Constants
var bitsInOneMbit = 1000000;
var bitsInOneByte = 8;

// TODO (mmr) : globals... yeah
var host = null;
var user = null;
var pass = null;
var maxBw = null;

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

function handleErr(err, main) {
    var data = '<p>Something bad happened: ' + err + '<p/>';
    main.innerHTML = data;
    main.appendChild(buttons);
}

function refresh() {
  var maxBwInBps = (maxBw * bitsInOneMbit / bitsInOneByte);
  var hash = btoa(user + ':' + pass);
  var baseUrl = 'http://' + host + '/userRpm/';
  var namesUrl = baseUrl + 'AssignedIpAddrListRpm.htm';
  var statsUrl = baseUrl + 'SystemStatisticRpm.htm?Num_per_page=100';
  var conf = {
    'headers': new Headers({
      'Authorization': 'Basic ' + hash
    })
  };

  var buttons = createButtons();
  var main = document.getElementById('main');
  fetch(statsUrl, conf).then(function(resp) {
    return resp.text();
  }).catch(function(err) {
    handleErr(err, main);
  }).then(function(body) {
    var stats = parseStats(body);
    var statsIps = Object.keys(stats);
    statsIps.sort(function(a, b){ return stats[b] - stats[a]; });

    fetch(namesUrl, conf).then(function(response) {
      return response.text();
    }).then(function(body) {
      var ips = parseIpList(body);

      var data = '<table border="1">';
      statsIps.forEach(function(key) {
        var name = ips[key];
        var stat = stats[key] / 2;
        var perc = Math.round((stat * 100 / maxBwInBps) * 100) / 100;
        data += '<tr><td>' + name  + '</td><td>' + stat + '</td><td>' + perc + '%</td></tr>';
      });
      data += '</table>';
      main.innerHTML = data;
      main.appendChild(buttons);
    }).catch(function(err) {
      handleErr(err, main);
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
  var main = document.getElementById('main');
  main.innerHTML = '';
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
  setUp();
}

document.addEventListener('DOMContentLoaded', onReady);
