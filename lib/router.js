'use strict';

const Router = require('express').Router;
const createConfig = require('./config').createConfig;
const createController = require('./controller');

const preventBrowserCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Vary', '*');
  res.header('Pragma', 'no-cache');
  next();
}

module.exports = function loadRoutes(app, options) {
  const config = createConfig(options);

  const basePath = config.basePath;
  const controller = createController(config);

  const router = new Router();
  // Prevent browser cache on auth calls

  router.get(`${basePath}/login/callback`, preventBrowserCache, controller.callback);
  router.get(`${basePath}/login/:service`, preventBrowserCache, controller.login);
  router.get(`${basePath}/logout/:service`, preventBrowserCache, controller.logout);
  router.get(`${basePath}/isloggedin/:service`, preventBrowserCache, controller.isLoggedinInService);
  router.get(`${basePath}/isloggedin`, preventBrowserCache, controller.isLoggedin);
  router.get(`${basePath}/logout/callback/:service`, preventBrowserCache, controller.logoutCallback);

  app.use(controller.refresh);

  return router;
};
