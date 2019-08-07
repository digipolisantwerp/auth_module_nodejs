'use strict';
const async = require('async');
const bcrypt = require('bcryptjs');
const querystring = require('querystring');
const uuid = require('uuid');

const createService = require('./service');
const helpers = require('./helpers');

const EXPIRY_MARGIN = 5 * 60 * 1000;
module.exports = function createController(config) {
  const service = createService(config);

  function createLoginUrl(host, serviceName, key, lng) {
    const serviceProvider = config.serviceProviders[serviceName] || {};
    const query = {
      client_id: config.auth.clientId,
      redirect_uri: serviceProvider.redirectUri || `${host}${config.basePath}/login/callback`,
      state: key,
      scope: serviceProvider.scopes,
      service: serviceProvider.identifier,
      save_consent: true,
      response_type: 'code',
    }

    if(serviceProvider.authenticationType) {
      query.auth_type = serviceProvider.authenticationType;
    }

    if(lng) {
      query.lng = lng;
    }

    return `${config.oauthHost}${config.authPath}?${querystring.stringify(query)}`;
  }

  function createLogoutUrl(serviceName, options) {
    const serviceProvider = config.serviceProviders[serviceName] || {};
    const data = JSON.stringify({
      user_id: options.userId,
      access_token: options.token,
      redirect_uri: options.redirectUri
    });

    const query = {
      client_id: config.auth.clientId,
      service: config.serviceProviders[serviceName].identifier,
      data: helpers.encrypt(data, config.auth.clientSecret),
    };

    if(serviceProvider.authenticationType) {
      query.auth_type = serviceProvider.authenticationType;
    }

    return `${config.oauthHost}/v1/logout/redirect/encrypted?${querystring.stringify(query)}`;
  }

  function login(req, res) {
    const serviceName = req.params.service;

    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(404);
    }

    const host = helpers.getHost(req);
    const key = `${serviceName}_${uuid.v4()}`;
    const url = createLoginUrl(host, serviceName, key, req.query.lng);
    req.session[`${serviceName}_key`] = key;
    req.session.fromUrl = req.query.fromUrl || '/';

    return req.session.save(() => res.redirect(url));
  }

  function isLoggedinInService(req, res) {
    const serviceName = req.params.service;
    const key = config.serviceProviders[serviceName].key || 'user';
    const user = req.session[key];
    if (user) {
      return res.json({
        isLoggedin: true,
        [key]: user
      });
    }

    return res.json({
      isLoggedin: false,
    });
  }

  function isLoggedin(req, res) {
    const users = {};

    Object.keys(config.serviceProviders).forEach(serviceProviderKey => {
      const userKey = config.serviceProviders[serviceProviderKey].key || 'user';
      if(req.session[userKey]) {
        users[userKey] = req.session[userKey];
      }
    });

    if(Object.keys(users).length === 0) {
      return res.json({
        isLoggedin: false
      });
    }
      return res.json(Object.assign({
        isLoggedin: true,
      }, users));
  }

  function callback(req, res) {
    if (!req.query.code || !req.query.state) {
      return res.redirect(config.errorRedirect);
    }

    const state = req.query.state;
    const serviceName = state.split('_')[0];

    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(404);
    }

    if (req.query.state !== req.session[`${serviceName}_key`]) {
      let loginUrl = `${config.basePath}/login/${serviceName}`;
      const fromUrl = req.session.fromUrl;
      if (fromUrl) {
        loginUrl = `${loginUrl}?fromUrl=${fromUrl}`;
      }
      return res.redirect(loginUrl);
    }

    delete req.session[`${serviceName}_key`];
    let hooks = [];
    const configuredHooks = config.serviceProviders[serviceName].hooks;
    if (configuredHooks && Array.isArray(configuredHooks.loginSuccess)) {
      hooks = configuredHooks.loginSuccess.map(hook => {
        return (next) => hook(req, res, next);
      });
    }

    service.loginUser(req.query.code, serviceName, (err, user, token) => {
      if (err) {
        console.log('error tijdens login', err);
        return res.redirect(config.errorRedirect);
      }

      const sessionKey = config.serviceProviders[serviceName].key || 'user';
      user.serviceType = serviceName;
      req.session[sessionKey] = user;
      req.session[`${sessionKey}Token`] = token;

      async.series(hooks, (error) => {
        if (error) {
          console.log(error);
          return res.redirect(config.errorRedirect);
        }
        req.session.save(() => res.redirect(req.session.fromUrl || '/'));
      });
    });
  }

  function logoutCallback(req, res) {
    const serviceName = req.params.service;
    const state = req.query.state;
    const logoutState = req.session[`${serviceName}_logoutKey`];

    if (state !== logoutState) {
      return res.sendStatus(401);
    }

    if(!config.serviceProviders[serviceName]) {
      return res.sendStatus(404);
    }

    const key = config.serviceProviders[serviceName].key || 'user';

    let hooks = [];
    const configuredHooks = config.serviceProviders[serviceName].hooks;
    if (configuredHooks && Array.isArray(configuredHooks.logoutSuccess)) {
      hooks = configuredHooks.logoutSuccess.map(hook => {
        return (next) => hook(req, res, next);
      });
    }
    async.series(hooks, () => {
      delete req.session[key];
      delete req.session[`${key}Token`];
      delete req.session[`${serviceName}_logoutKey`];
      const tempSession = req.session;
      req.session.regenerate(() =>  {
        Object.assign(req.session, tempSession);
        req.session.save(() => res.redirect(tempSession.logoutFromUrl || '/'));
      });
    });

  }

  function logout(req, res) {
    const serviceName = req.params.service;
    if (!config.serviceProviders[serviceName]) {
      return res.sendStatus(404);
    }

    const serviceProvider = config.serviceProviders[serviceName];
    const key = serviceProvider.key || 'user';
    const token = req.session[`${key}Token`];
    const authenticationType = serviceProvider.authenticationType;
    if(!req.session[key]) {
      return res.redirect('/');
    }

    req.session.logoutFromUrl = req.query.fromUrl || '/';
    const state = uuid.v4();
    req.session[`${serviceName}_logoutKey`] = state;
    const logoutUrl = createLogoutUrl(serviceName, {
      redirectUri: `${helpers.getHost(req)}${config.basePath || '/auth'}/logout/callback/${serviceName}?state=${state}`,
      token: token.accessToken,
      userId: req.session[key].id,
      authenticationType
    });

    res.redirect(logoutUrl);
  }

  function refresh(req, res, next) {
    let tokenKeys = []
    const tokensRefreshFunctions = {};
    Object.keys(config.serviceProviders).map(serviceProviderKey => {
      const serviceProvider = config.serviceProviders[serviceProviderKey];

      if(!serviceProvider.refresh) {
        return;
      }
      const tokenKey = `${serviceProvider.key || 'user'}Token`;
      const token = req.session[tokenKey];
      if(tokenKeys.indexOf(tokenKey) === -1 && token) {
        tokenKeys.push(tokenKey);
        if(new Date(token.expiresIn) <= new Date(Date.now() + EXPIRY_MARGIN)) {
          tokensRefreshFunctions[tokenKey] = cb => service.refresh(token, serviceProviderKey, cb);
        }
      }
    });

    if(Object.keys(tokensRefreshFunctions).length === 0) {
      return next();
    }

    async.parallel(tokensRefreshFunctions, (err, result) => {
      if(err) {
        return next();
      }

      req.session = Object.assign(req.session, result);
      req.session.save(() => next());
    });
  }

  function loggedout(req, res, next) {
    const {
      headerKey = 'x-logout-token',
      securityHash = '',
      adapter = false
    } = config.logout || {};

    const serviceProvider = config.serviceProviders[req.params.service] || false;
    const token = req.get(headerKey);

    if (!serviceProvider) {
      return res.sendStatus(404);
    }

    if (!adapter) {
      return res.sendStatus(200);
    }
    if (!bcrypt.compareSync(token, securityHash)) {
      return res.sendStatus(401);
    }

    adapter(serviceProvider.key || 'user', req.body)
      .then(() => res.sendStatus(200))
      .catch(() => res.sendStatus(500));
  }

  return {
    login,
    logout,
    logoutCallback,
    isLoggedinInService,
    isLoggedin,
    callback,
    refresh,
    loggedout
  }

}
