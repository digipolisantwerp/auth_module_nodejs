'use strict';

const Router = require('express').Router;
const validateConfig = require('./configValidation');
const createController = require('./controller');

module.exports = function loadRoutes(config) {
  validateConfig(config);

  const baseUrl = config.baseUrl;
  const controller = createController(options);
  const router = new Router();

  router.get(`${baseUrl}/isloggedin`, controller.isLoggedin);
  router.get(`${baseUrl}/callback`, controller.callback);
  router.post(`${baseUrl}/logout`, controller.logout);

  return router;
};
