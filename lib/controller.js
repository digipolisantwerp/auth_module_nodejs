'use strict';
const querystring = require('querystring');
const createService = require('./service');
const getProp = require('lodash.get');
const async = require('async');

module.exports = function createController(config) {
  const service = createService(config);

  function createLoginUrl(key) {
    const query = {
      client_id: config.auth.clientId, 
      redirect_uri: `${config.domain}${config.basePath}/callback`,
      state: config.auth.service,
      scope: config.auth.scope,
      save_consent: config.auth.saveConsent
    }

    return `${config.oauthDomain}${config.authPath}?${querystring.stringify(query)}`;
  }



  function login(req, res) {
    const url = createLoginUrl();

    if (req.query.fromUrl) {
      req.session.fromUrl = req.query.fromUrl;
    }
  

    return res.redirect(url);
  }

  function isLoggedin(req, res) {
    const user = getProp(req.session || {}, config.key || 'user');
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

    let hooks = [];
    if (config.hooks && Array.isArray(config.hooks.authSuccess)) {
      hooks = config.hooks.authSuccess.map(hook => {
        return (next) => hook(req, res, next);
      });
    }

    service.loginUser(req.query.code, req.query.state || config.auth.service, (err, user, token) => {
      if (err) {
        console.log(err);
        return res.status(err.status || 500).json(err);
      }

      req.session[config.key] = user;
      req.session.token = token;

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
    if (!req.session.hasOwnProperty("token")) {
      return next();
    }

    service.refresh(req.session.token, (err, token) => {
      if (err) {
        delete req.session.user;
        delete req.session.token;
        return isLoggedin(req, res);
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
    loginRedirect,
    logout,
    isLoggedin,
    callback,
    refresh
  }
}
