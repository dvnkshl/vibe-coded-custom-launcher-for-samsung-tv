(function () {
  'use strict';
  // Friend design demo: ALWAYS inert, including in a Tizen runtime.
  function preview() { return Promise.resolve({ preview: true }); }
  window.tvBridge = {
    mode: 'preview',
    getSources: function () { return Promise.resolve([1, 2, 3, 4].map(function (number) {
      return { type: 'HDMI', number: number, connected: null };
    })); },
    selectSource: preview, openSettings: preview, openSamsungHome: preview,
    prepareStandby: function () { return Promise.resolve({ preview: true, ready: true }); },
    powerOff: function () { return Promise.resolve({ preview: true, requestSent: false, standbyVerified: false }); }
  };
}());
