'use strict';

const Router = require('express').Router;
const createConfig = require('./config').createConfig;
const createController = require('./controller');

module.exports = function loadRoutes(app, options) {
  const config = createConfig(options);

  const baseUrl = config.baseUrl;
  const controller = createController(config);

  const router = new Router();

  router.get(`${baseUrl}/isloggedin`, controller.isLoggedin);
  router.get(`${baseUrl}/callback`, controller.callback);
  router.post(`${baseUrl}/logout`, controller.logout);

  if (options.refresh) {
    app.use(controller.refresh);
  }

  return router;
};
