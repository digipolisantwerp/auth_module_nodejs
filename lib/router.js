'use strict';

const Router = require('express').Router;
const createConfig = require('./config').createConfig;
const createController = require('./controller');

module.exports = function loadRoutes(app, options) {
  const config = createConfig(options);

  const basePath = config.basePath;
  const controller = createController(config);

  const router = new Router();
  // Prevent browser cache on auth calls
  router.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Vary', '*');
    res.header('Pragma', 'no-cache');
    next();
  });
  router.get(`${basePath}/login/callback`, controller.callback);
  router.get(`${basePath}/login/:service`, controller.login);
  router.get(`${basePath}/logout/:service`, controller.logout);
  router.get(`${basePath}/isloggedin/:service`, controller.isLoggedinInService);
  router.get(`${basePath}/isloggedin`, controller.isLoggedin);
  router.get(`${basePath}/logout/callback/:service`, controller.logoutCallback);


  app.use(controller.refresh);

  return router;
};
