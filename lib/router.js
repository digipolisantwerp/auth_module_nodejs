'use strict';

const Router = require('express').Router;
const createConfig = require('./config').createConfig;
const createController = require('./controller');

module.exports = function loadRoutes(app, options) {
  const config = createConfig(options);

  const basePath = config.basePath;
  const controller = createController(config);

  const router = new Router();
  router.get(`${basePath}/login`, controller.login);
  router.get(`${basePath}/isloggedin`, controller.isLoggedin);
  router.get(`${basePath}/callback`, controller.callback);
  router.post(`${basePath}/logout`, controller.logout);

  if (config.refresh) {
    app.use(controller.refresh);
  }

  return router;
};
