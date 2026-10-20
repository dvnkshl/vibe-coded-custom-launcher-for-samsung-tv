(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.homeIdle = api; }
}(this, function () {
  'use strict';
  var TIMEOUT = 30 * 60 * 1000;
  var WARNING = 30 * 1000;

  function create(options) {
    var generation = 0;
    var deadline = null;
    var phase = 'paused';
    var warningTimer;
    var expiryTimer;
    function clear() {
      options.clearTimeout(warningTimer); options.clearTimeout(expiryTimer);
      options.onWarning(false);
    }
    function pause() {
      generation += 1; deadline = null; phase = 'paused'; clear();
    }
    function allowed(ticket) {
      return generation === ticket && deadline !== null && options.isEligible() &&
        options.now() >= deadline && (phase === 'waiting' || phase === 'warning' || phase === 'sending');
    }
    function resume() {
      pause();
      if (!options.isEligible()) { return; }
      var ticket = generation;
      deadline = options.now() + TIMEOUT; phase = 'waiting';
      warningTimer = options.setTimeout(function () {
        if (generation !== ticket) { return; }
        if (!options.isEligible()) { pause(); return; }
        phase = 'warning'; options.onWarning(true);
      }, TIMEOUT - WARNING);
      expiryTimer = options.setTimeout(function () {
        if (!allowed(ticket)) { if (generation === ticket) { pause(); } return; }
        phase = 'sending'; options.onWarning(false);
        var action;
        try { action = options.onExpire(function () { return allowed(ticket); }); }
        catch (error) { action = Promise.reject(error); }
        Promise.resolve(action).then(function () {
          if (generation === ticket) { phase = 'complete'; deadline = null; }
        }, function (error) {
          if (generation !== ticket) { return; }
          phase = 'failed'; deadline = null;
          if (options.onError) { options.onError(error); }
        });
      }, TIMEOUT);
    }
    return {
      resume: resume,
      pause: pause,
      activity: function (event) { if (event && event.isTrusted !== false) { resume(); } },
      state: function () { return { phase: phase, remaining: deadline === null ? null : Math.max(0, deadline - options.now()) }; }
    };
  }
  return { create: create, timeout: TIMEOUT, warning: WARNING };
}));
