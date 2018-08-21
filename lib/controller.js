'use strict';
const querystring = require('querystring');
const createService = require('./service');
const getProp = require('lodash.get');
const async = require('async');

module.exports = function createController(config) {
  const service = createService(config);
  function isLoggedin(req, res) {
    const user = getProp(req.session || {}, config.key || 'user');
    if (user) {
      return res.json({
        isLoggedin: true,
        user: user
      });
    }

    if (req.query.fromUrl) {
      req.session.fromUrl = req.query.fromUrl;
    }


    const query = Object.assign({}, config.auth, {
      client_id: config.auth.clientId,
      redirect_uri: `${config.domain}${config.baseUrl}/callback`
    });
    delete query.clientId;
    delete query.clientSecret;

    const url = `${config.oauthDomain}${config.authPath}?${querystring.stringify(query)}`;
    if (config.backendRedirect) {
      return res.redirect(url);
    }

    req.session.save(() => {
      return res.json({
        isLoggedin: false,
        redirectUrl: url
      });
    });
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

    service.loginUser(req.query.code, (err, user, token) => {
      if (err) {
        console.log(err);
        return res.status(err.status || 500).json(err);
      }

      req.session[config.key] = user;

      if (config.refresh) {
        req.session.token = token;
      }

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
    logout,
    isLoggedin,
    callback,
    refresh
  }
}
