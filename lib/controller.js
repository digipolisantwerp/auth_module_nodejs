'use strict';
const querystring = require('querystring');
const createService = require('./service');
const async = require('async');
const uuid = require('uuid');

const EXPIRY_MARGIN = 5 * 60 * 1000;
module.exports = function createController(config) {
  const service = createService(config);

  function createLoginUrl(host, serviceName, key) {
    const query = {
      client_id: config.auth.clientId,
      redirect_uri: `${host}${config.basePath}/callback`,
      state: key,
      scope: config.serviceProviders[serviceName].scopes,
      service: config.serviceProviders[serviceName].identifier,
      save_consent: true,
      response_type: 'code'
    }

    return `${config.oauthHost}${config.authPath}?${querystring.stringify(query)}`;
  }



  function login(req, res) {
    const serviceName = req.params.service || req.session.currentServiceProvider;

    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(401);
    }

    const host = `${req.protocol}://${req.get('host')}`
    const key = `${serviceName}_${uuid.v4()}`;
    const url = createLoginUrl(host, serviceName, key);
    req.session[`${serviceName}_key`] = key;
    if (req.query.fromUrl) {
      req.session.fromUrl = req.query.fromUrl;
    }
  
    return req.session.save(() => res.redirect(url));
  }

  function isLoggedin(req, res) {
    const user = req.session.user;
    if (user) {
      return res.json({
        isLoggedin: true,
        user: user
      });
    }

    return res.json({
      isLoggedin: false,
    })
  }

  function callback(req, res) {

    if (!req.query.code || !req.query.state) {
      return res.redirect(config.errorRedirect);
    }

    const state = req.query.state;
    const serviceName = state.split('_')[0];

    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(400);
    }

    if (req.query.state !== req.session[`${serviceName}_key`]) {
      return res.sendStatus(401);
    }

    let hooks = [];
    const configuredHooks = config.serviceProviders[serviceName].hooks;
    if (configuredHooks && Array.isArray(configuredHooks.authSuccess)) {
      hooks = configuredHooks.authSuccess.map(hook => {
        return (next) => hook(req, res, next);
      });
    }

    service.loginUser(req.query.code, serviceName, (err, user, token) => {
      if (err) {
        console.log(err);
        return res.redirect(config.errorRedirect);
      }

      req.session.user = user;
      req.session.token = token;
      req.session.currentServiceProvider = serviceName;

      async.series(hooks, (error) => {
        if (error) {
          console.log(error);
          return res.redirect(config.errorRedirect);
        }

        req.session.save(() => res.redirect(req.session.fromUrl || '/'));
      });
    });
  }

  function logout(req, res) {
    req.session.destroy(() => res.sendStatus(204));
  }

  function refresh(req, res, next) {
    if (!req.session.hasOwnProperty("token")) {
      return next();
    }

    service.refresh(req.session.token, req.session.currentServiceProvider, (err, token) => {
      if (err) {
        login(req, res);
        delete req.session.user;
        delete req.session.token;
        return;
      }

      if (!token) {
        return next();
      }

      req.session.token = token;

      req.session.save(() => {
        next();
      });
    });
  }

  return {
    login,
    logout,
    isLoggedin,
    callback,
    refresh
  }
}
