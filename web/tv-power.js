(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.homePower = api; }
}(this, function () {
  'use strict';
  function cancelled() { var error = new Error('Idle shutoff cancelled.'); error.cancelled = true; return error; }
  function create(options) {
    var ready = false;
    var pending;
    function cancel(session) { return options.request('cancel', session).catch(function () {}); }
    return {
      prepare: function () {
        if (!pending) {
          pending = options.request('pair').then(function (result) {
            if (result.status !== 'ready') { throw new Error('TV power-control permission was not confirmed.'); }
            ready = true; return { ready: true };
          }).then(function (value) { pending = null; return value; },
            function (error) { ready = false; pending = null; throw error; });
        }
        return pending;
      },
      powerOff: function (guard) {
        if (!ready) { return Promise.reject(new Error('TV power-control permission is required.')); }
        if (typeof guard !== 'function' || !guard()) { return Promise.reject(cancelled()); }
        return options.request('reserve').then(function (result) {
          if (result.status !== 'reserved' || !/^[a-f0-9]{32}$/.test(result.session || '')) {
            throw new Error('The TV could not prepare its power-off request.');
          }
          // Authentication is complete and the native helper holds the socket.
          // Recheck input/visibility before committing; confirm has no new auth wait.
          if (!guard()) { return cancel(result.session).then(function () { throw cancelled(); }); }
          return options.request('confirm', result.session).then(function (value) {
            if (value.status !== 'power-requested') { throw new Error('The TV did not accept its power-off request.'); }
            return { requestSent: true, standbyVerified: false };
          });
        });
      }
    };
  }
  return { create: create };
}));
