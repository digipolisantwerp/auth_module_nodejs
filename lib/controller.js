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
      save_consent: true
    }

    return `${config.oauthHost}${config.authPath}?${querystring.stringify(query)}`;
  }



  function login(req, res) {
    const serviceName = req.params.service;

    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(401);
    }

    const key = `${serviceName}_${uuid.v4()}`;
    const url = createLoginUrl(req.get('host'), key, scope);
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
      user: false
    })
  }

  function callback(req, res) {

    if (!req.query.code) {
      return res.redirect(config.errorRedirect);
    }

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
      hooks = config[serviceName].hooks.authSuccess.map(hook => {
        req.digipolisLogin = {
          serviceName
        };
        return (next) => hook(req, res, next);
      });
    }

    service.loginUser(req.query.code, serviceName, (err, user, token) => {
      if (err) {
        console.log(err);
        return res.status(err.status || 500).json(err);
      }

      req.session.user = user;
      req.session.token = token;
      req.session.currentServiceProvider = serviceName;

      async.series(hooks, (error) => {
        if (error) {
          return res.status(error.status || 500).json(error);
        }
        req.session.save(() => {
          if (req.session.fromUrl) {
            return res.redirect(req.session.fromUrl);
          }

          return res.redirect('/');
        });
      })

    });
  }

  function logout(req, res) {
    req.session.destroy(() => res.sendStatus(204));
  }

  function refresh(req, res, next) {
    if (!req.session.hasOwnProperty('token')) {
      return next();
    }

    const token = req.session.token;

    // Use a margin: if multiple requests enter the application,
    // each request will try to refresh the token, causing failure.
    // SOLUTION: refresh before expiry, write to the session that the token
    // is refreshing, other requests can still use the old token


    if (new Date(tokes.expiresIn).valueOf() > (Date.now() - EXPIRY_MARGIN)) {
      return next();
    }

    if (token.isRefreshing) {
      return next();
    }

    req.session.token.isRefreshing = true;

    req.session.save(() => {
      service.refresh(token, req.session.currentServiceProvider, (err, token) => {
        if (err || !token) {
          delete req.session.user;
          delete req.session.token;
          return next();
        }

        req.session.token = token;

        req.session.save(() => next());
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
