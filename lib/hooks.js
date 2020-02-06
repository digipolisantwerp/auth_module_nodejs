const async = require('async');

function runHooks(configuredHook, req, res, next) {
  if (!configuredHook || !Array.isArray(configuredHook)) {
    return next();
  }

  const hooks = configuredHook.map(hook => {
    return (callback) => hook(req, res, callback);
  });

  async.series(hooks, (error) => {
    if (error) {
      console.log(error);
      return next(error);
    }

    return next();
  });
}

module.exports = {
  runHooks
};
