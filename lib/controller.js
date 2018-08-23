'use strict';
const querystring = require('querystring');
const createService = require('./service');
const getProp = require('lodash.get');
const async = require('async');
const uuid = require('uuid');

module.exports = function createController(config) {
  const service = createService(config);

  function createLoginUrl(key) {
    const query = {
      client_id: config.auth.clientId, 
      redirect_uri: `${config.domain}${config.basePath}/callback`,
      state: key,
      scope: config.auth.scope,
      save_consent: config.auth.saveConsent
    }

    return `${config.oauthDomain}${config.authPath}?${querystring.stringify(query)}`;
  }



  function login(req, res) {
    const key = `${config.auth.service}_${uuid.v4()}`;
    const url = createLoginUrl(key);
    req.session[`${service}_key`] = key;
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

    const serviceIdentifier = state.split('_')[0];
    if(req.query.state !== req.session[`${serviceIdentifier}_key`]) {
      return res.sendStatus(401);
    }

    let hooks = [];
    if (config.hooks && Array.isArray(config.hooks.authSuccess)) {
      hooks = config.hooks.authSuccess.map(hook => {
        return (next) => hook(req, res, next);
      });
    }

    service.loginUser(req.query.code, serviceIdentifier || config.auth.service, (err, user, token) => {
      if (err) {
        console.log(err);
        return res.status(err.status || 500).json(err);
      }

      const serviceName = serviceIdentifier.indexOf('aprofiel') > -1 ? 'aprofiel' : 'mprofiel'
      req.session[config.key] = user;
      req.session[`${serviceName}Token`] = token;

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
    const serviceName = config.auth.service.indexOf('aprofiel') > -1 ? 'aprofiel' : 'mprofiel'
    const tokenKey =`${serviceName}token`

    if (!req.session.hasOwnProperty(tokenKey)) {
      return next();
    }

    service.refresh(req.session[tokenKey], (err, token) => {
      if (err) {
        delete req.session[config.key];
        delete req.session[tokenKey];
        return login(req, res);
      }

      if (!token) {
        return next();
      }

      req.session[tokenKey] = token;

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
