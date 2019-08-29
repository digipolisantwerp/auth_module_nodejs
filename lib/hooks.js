const async = require('async');

function runHooks(configuredHook, req, res, next) {
  if (!configuredHook || !Array.isArray(configuredHook)) {
    return next();
  }

  const hooks = configuredHook.map(hook => {
    return (next) => hook(req, res, next);
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
