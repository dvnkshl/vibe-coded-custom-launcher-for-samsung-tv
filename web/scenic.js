(function () {
  'use strict';
  // Presentation only. Native actions remain in tv-bridge.js.
  var KEY = 'q80b.launcher.scenic.v1';
  var prefs = { photo: 'yosemite', clockLeft: false };
  var photos = window.scenicPhotos || [];
  var layers = [document.getElementById('photo-a'), document.getElementById('photo-b')];
  var currentPhoto = 'yosemite';
  var currentLayer = 0;
  var revision = 0;
  var panelOpen = false;
  var timer;
  var weatherStarted = false;
  var weatherBusy = false;
  var ROTATION_INTERVAL = 5 * 60000;

  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY));
    if (saved) {
      if (photos.some(function (photo) { return photo.key === saved.photo; })) { prefs.photo = saved.photo; }
      prefs.clockLeft = saved.clockLeft === true;
    }
  } catch (ignore) {}
  function persist() { try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (ignore) {} }
  function fit() {
    var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    var canvas = document.getElementById('tv-canvas');
    document.documentElement.style.setProperty('--ui-scale', String(scale));
    canvas.style.width = (1280 * scale) + 'px';
    canvas.style.height = (720 * scale) + 'px';
    canvas.style.left = ((window.innerWidth - 1280 * scale) / 2) + 'px';
    canvas.style.top = ((window.innerHeight - 720 * scale) / 2) + 'px';
  }
  function schedule() {
    window.clearTimeout(timer);
    if (document.hidden || panelOpen || photos.length < 2) { return; }
    timer = window.setTimeout(function () {
      var index = photos.map(function (photo) { return photo.key; }).indexOf(currentPhoto);
      choosePhoto(photos[(index + 1) % photos.length].key);
    }, ROTATION_INTERVAL);
  }
  function choosePhoto(key) {
    var photo = photos.filter(function (item) { return item.key === key; })[0];
    if (!photo) { schedule(); return; }
    if (photo.key === currentPhoto) {
      layers[currentLayer].style.objectPosition = photo.position;
      schedule(); return;
    }
    window.clearTimeout(timer);
    var request = ++revision;
    var incoming = layers[1 - currentLayer];
    var image = new Image();
    image.onload = function () {
      if (request !== revision) { return; }
      incoming.src = photo.file; incoming.style.objectPosition = photo.position;
      var outgoing = layers[currentLayer];
      incoming.classList.add('is-current'); outgoing.classList.remove('is-current');
      currentLayer = 1 - currentLayer; currentPhoto = key; prefs.photo = key;
      // A 4K image occupies about 33MB decoded. Release the retired photo once
      // its crossfade ends instead of retaining two decoded backgrounds.
      window.setTimeout(function () {
        if (!outgoing.classList.contains('is-current')) { outgoing.removeAttribute('src'); }
      }, 1400);
      image.onload = null; image.onerror = null;
      persist(); schedule();
    };
    image.onerror = function () { if (request === revision) { schedule(); } };
    image.src = photo.file;
  }
  function setClockLeft(value) {
    prefs.clockLeft = value === true;
    document.body.classList.toggle('clock-left', prefs.clockLeft);
    document.getElementById('clock-left').checked = prefs.clockLeft;
    persist();
  }
  function weatherUnavailable() {
    document.getElementById('temperature').textContent = '—°';
    document.getElementById('weather-condition').textContent = 'Weather unavailable';
  }
  function renderWeather(value) {
    var detail = window.homeInfo.conditions(value.code, value.isDay);
    var icons = {
      moon: '<path d="M24 23A12 12 0 0 1 12 6a12 12 0 1 0 12 17Z"/>',
      sun: '<circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/>',
      cloud: '<path d="M8 24h16a6 6 0 0 0 0-12h-1a8 8 0 0 0-15-2 7 7 0 0 0 0 14Z"/>',
      rain: '<path d="M7 21h18a5 5 0 0 0-1-10 8 8 0 0 0-15-1 6 6 0 0 0-2 11ZM10 25l-2 4m10-4-2 4m10-4-2 4"/>',
      snow: '<path d="M7 21h18a5 5 0 0 0-1-10 8 8 0 0 0-15-1 6 6 0 0 0-2 11ZM10 25v5m-2-2h4m10-3v5m-2-2h4"/>',
      fog: '<path d="M7 21h18a5 5 0 0 0-1-10 8 8 0 0 0-15-1 6 6 0 0 0-2 11ZM5 25h22M8 29h16"/>',
      thunder: '<path d="M7 21h18a5 5 0 0 0-1-10 8 8 0 0 0-15-1 6 6 0 0 0-2 11Zm10-1-5 7h5l-2 4 8-8h-6Z"/>'
    };
    document.querySelector('#weather>svg').innerHTML = icons[detail.icon] || icons.cloud;
    document.getElementById('temperature').textContent = value.temperature + '°';
    document.getElementById('weather-condition').textContent = detail.label;
  }
  function refreshWeather() {
    if (document.hidden || weatherBusy) { return; }
    weatherBusy = true;
    var request = new XMLHttpRequest();
    request.open('GET', window.homeInfo.endpoint, true); request.timeout = 8000;
    function failed() { weatherBusy = false; weatherUnavailable(); }
    request.onload = function () {
      weatherBusy = false;
      try {
        if (request.status !== 200) { throw new Error('weather'); }
        renderWeather(window.homeInfo.normalizeWeather(JSON.parse(request.responseText), Date.now()));
      } catch (ignore) { weatherUnavailable(); }
    };
    request.onerror = failed; request.ontimeout = failed; request.send();
  }
  window.scenicUI = {
    setClockLeft: setClockLeft,
    setPanelOpen: function (value) { panelOpen = value; schedule(); },
    startWeather: function () {
      if (weatherStarted) { return; }
      weatherStarted = true; refreshWeather();
      window.setInterval(refreshWeather, 15 * 60000);
    }
  };
  window.addEventListener('resize', fit);
  document.addEventListener('visibilitychange', function () {
    schedule();
    if (!document.hidden && weatherStarted) { refreshWeather(); }
  });
  fit(); setClockLeft(prefs.clockLeft); choosePhoto(prefs.photo);
  if (window.tizen && window.console) {
    var renderInfo = { version:'0.7.2', viewport:[window.innerWidth,window.innerHeight],
      screen:[window.screen.width,window.screen.height], devicePixelRatio:window.devicePixelRatio,
      canvasTransform:'none', layoutScale:Math.min(window.innerWidth / 1280,window.innerHeight / 720) };
    console.log('[Q80B_RENDER] ' + JSON.stringify(renderInfo));
    try {
      window.tizen.systeminfo.getPropertyValue('DISPLAY', function (display) {
        console.log('[Q80B_DISPLAY] ' + JSON.stringify({width:display.resolutionWidth,height:display.resolutionHeight}));
      }, function () {});
    } catch (ignore) {}
  }
}());
