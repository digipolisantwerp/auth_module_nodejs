'use strict';

const Router = require('express').Router;
const createConfig = require('./config').createConfig;
const createController = require('./controller');

module.exports = function loadRoutes(app, options) {
  const config = createConfig(options);

  const basePath = config.basePath;
  const controller = createController(config);

  const router = new Router();
  router.get(`${basePath}/login/callback`, controller.callback);
  router.get(`${basePath}/login/:service`, controller.login);
  router.get(`${basePath}/logout/:service`, controller.logout);
  router.get(`${basePath}/isloggedin/:service`, controller.isLoggedinInService);
  router.get(`${basePath}/isloggedin`, controller.isLoggedin);
  router.get(`${basePath}/logout/callback/:service`, controller.logoutCallback);

  
  app.use(controller.refresh);

  return router;
};
