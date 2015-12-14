var cx = 0;

function refresh() {
  var n = document.getElementById('main');
  n.innerHTML = cx++;
}

function onReady() {
  document.getElementById('refresh').addEventListener('click', refresh);
  refresh();
}

document.addEventListener('DOMContentLoaded', onReady);
