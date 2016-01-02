// Add router scripts here
var routers = {
  'TP-LINK TL-WR941ND': 'tl-wr941nd.js',
}

// Constants
var bitsInOneMbit = 1000000;
var bitsInOneByte = 8;
var minPercToShow = 1;
var w = 400;
var h = 400;
var r = h/2;
var color = d3.scale.category20c();
var mainId = 'main';

// TODO (mmr) : globals... yeah
var router = null;
var host = null;
var user = null;
var pass = null;
var maxBw = null;
var main = null;
var routersWorker = null;

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
  new d3pie(mainId, {
    'header': {
      'title': {
        'text': 'Net Usage',
        'fontSize': 22,
        'font': 'exo'
      },
    },
    'size': {
      'canvasHeight': 400,
      'canvasWidth': 590,
      'pieOuterRadius': '88%'
    },
    'labels': {
      'outer': {
        'format': 'label',
        'pieDistance': 32
      },
      'mainLabel': {
        'font': 'exo'
      },
      'percentage': {
        'color': '#e1e1e1',
        'font': 'exo',
        'decimalPlaces': 0
      },
      'value': {
        'color': '#e1e1e1',
        'font': 'exo'
      },
      'lines': {
        'enabled': true
      },
      'truncation': {
        'enabled': true
      }
    },
    'effects': {
      'pullOutSegmentOnClick': {
        'effect': 'linear',
        'speed': 400,
        'size': 8
      }
    },
    'misc': {
      'gradient': {
        'enabled': true,
        'percentage': 100
      }
    },
    'data': {
      'sortOrder': 'value-desc',
      'smallSegmentGrouping': {
        'enabled': true,
        'value': minPercToShow
      },
      'content': data
    }
  });
}

function getChartData(ips, stats) {
  var maxBwInBps = (maxBw * bitsInOneMbit / bitsInOneByte);
  var unusedBw = maxBwInBps;
  var statsIps = Object.keys(stats);
  var data = [];
  statsIps.forEach(function(key) {
    var label = ips[key];
    var stat = stats[key];
    data.push({label: label, value: stat});
    unusedBw -= stat;
  });
  data.push({label: 'free', value: unusedBw});
  return data;
}

function refresh() {
  var routerScript = routers[router];
  worker.postMessage({
    'routerScript': routerScript,
    'host': host,
    'user': user,
    'pass': pass,
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

function getSelectValue(name) {
  var sel = document.getElementById(name);
  return sel.options[sel.selectedIndex].value;
}

function saveSettings() {
  // TODO (mmr) : sanity check/validate user input
  router = getSelectValue('router');
  host = getInputValue('host');
  user = getInputValue('user');
  pass = getInputValue('pass');
  maxBw = getInputValue('maxBw');
  chrome.storage.sync.set({
    'router': router,
    'host': host,
    'user': user,
    'pass': pass,
    'maxBw': maxBw
  }, function() {
    refresh();
  });
}

function createButton(name, action) {
  var button = document.createElement('button');
  button.id = name;
  button.innerText = name;
  button.addEventListener('click', action);
  return button;
}

function createSelect(name, defaultValue, placeholder) {
  var span = document.createElement('span');
  input = " <select";
  input += " id='" + name + "'";
  input += " name='" + name + "'";
  input += ">";
  input += "<option value='' disabled>" + placeholder +  "</option>";

  routers.forEach(function(routerName) {
    input += "<option value='" + routerName + "'";
    if (routerName === defaultValue) {
      input += " selected";
    }
    input += ">" + routerName + "</option>";
  });
  input += "</select>";

  span.innerHTML = input;
  return span;
}

function createSettingsForm() {
  var routerSelect = createSelect('router',  router, 'Router');
  var hostInput = createInput('host', 'text', host, 'Host');
  var userInput = createInput('user', 'text', user, 'User');
  var passInput = createInput('pass', 'password', pass, 'Password');
  var maxBwInput = createInput('maxBw', 'text', maxBw, 'MaxBw in Mbit/s');
  var saveButton = createButton('Save', saveSettings);

  var fieldSet = document.createElement('fieldset');
  var legend = document.createElement('legend');
  legend.innerText = 'Settings';
  fieldSet.appendChild(legend);
  fieldSet.appendChild(routerSelect);
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

function setUpRoutersWorker() {
  routersWorker = new Worker('routers/routers.js');
  routersWorker.addEventListener('message', function(e) {
    var data = e.data;
    clear();
    if (data.status === 'success') {
      var chartData = getChartData(data.ips, data.stats);
      drawPie(chartData);
    } else {
      handleErr(data.err);
    }
    main.appendChild(createButtons());
  }, false);
}

function setUp() {
  setUpRoutersWorker();

  // TODO (mmr) : extract fields list
  // If settings is in storage, gets data, if not show settings form
  chrome.storage.sync.get(['router', 'host', 'user', 'pass', 'maxBw'], function (items) {
    router = items['router'];
    host = items['host'];
    user = items['user'];
    pass = items['pass'];
    maxBw = items['maxBw'];

    if (router && host && user && pass && maxBw) {
      refresh();
    } else {
      showSettingsForm();
    }
  });
}

function onReady() {
  main = document.getElementById(mainId);
  setUp();
}

document.addEventListener('DOMContentLoaded', onReady);
