'use strict';
const OAuth2 = require('oauth').OAuth2;
const request = require('request');
const async = require('async');

module.exports = function createService(config) {
  function createOAuth() {
    return new OAuth2(
      config.auth.clientId,
      config.auth.clientSecret,
      config.apiHost,
      null,
      '/astad/mprofiel/v1/oauth2/token',
      null
    );
  }

  function requestUserWithToken(token, callback) {
    request({
      url: `${config.apiHost}/astad/mprofiel/v1/v1/me`,
      auth: {
        bearer: token
      },
      json: true
    }, (err, response, body) => {
      if (err) {
        return callback(err);
      }
      if (response.statusCode >= 400) {
        return callback(Object.assign({ status: response.statusCode }, (body || {})));
      }

      // const resp = typeof body === 'object' ? body : JSON.parse(body.trim());
      // const user = resp.data || {};
      return callback(null, body.data);
    });
  }

  function requestPermissionsWithToken(token, cb) {

    request({
      url: `${config.apiHost}/acpaas/meauthz/v1/applications/${config.applicationName}/permissions`,
      auth: {
        bearer: token
      },
      headers: {
        apikey: config.apiKey
      },
      json: true
    }, (err, response, body) => {
      if (err) {
        return cb(err);
      }
      if (response.statusCode >= 400) {
        return cb(Object.assign({ status: response.statusCode }, (body || {})));
      }

      return cb(err, body.permissions || []);
    });
  }

  function loginUser(code, callback) {
    const oauth = createOAuth();
    oauth.getOAuthAccessToken(code, {
      'grant_type': 'authorization_code'
    }, (err, token) => {
      if (err) {
        return callback(err);
      }

      const actions = {
        user: cb => requestUserWithToken(token, cb)
      };

      if (config.fetchPermissions) {
        actions.permissions = cb => requestPermissionsWithToken(token, cb);
      }

      async.parallel(actions, (error, results) => {
        if (error) {
          return callback(error);
        }
        const user = results.user;
        if (results.permissions) {
          user.permissions = results.permissions;
        }

        return callback(null, user);
      });
    });
  }
}


module.exports = {
  loginUser
};
