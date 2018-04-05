'use strict';
const querystring = require('querystring');
const createService = require('./service');
const getProp = require('lodash.get');


module.exports = function createController(config) {
  const service = createService(config);
  function isLoggedin(req, res) {
    const user = getProp(req.session, config.key);
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
      return res.status(400).json('authorization code missing');
    }

    service.loginUser(req.query.code, (err, user) => {
      if (err) {
        return res.status(err.status || 500).json(err);
      }
      
      if (config.key !== '') {
        req.session[key] = user;
      } else {
        req.session.user = user;
      }

      req.session.save(() => {
        if (req.session.fromUrl) {
          return res.redirect(req.session.fromUrl);
        }

        return res.redirect('/');
      });
    });
  }

  function logout(req, res) {
    req.session.destroy(() => res.sendStatus(204));
  }

  return {
    logout,
    isLoggedin,
    callback
  }
}

