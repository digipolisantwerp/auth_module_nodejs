'use strict';
const OAuth2 = require('oauth').OAuth2;
const request = require('request');
const async = require('async');
const URL = require('url-parse');
module.exports = function createService(config) {
  function createOAuth(serviceName) {
    const url = new URL(config.serviceProviders[serviceName].tokenUrl);
    return new OAuth2(
      config.auth.clientId,
      config.auth.clientSecret,
      url.origin,
      null,
      url.pathname,
      null
    );
  }

  function createToken(results, refreshToken, serviceName) {
    return {
      accessToken: results.access_token,
      refreshToken,
      expiresIn: new Date(new Date().getTime() + (results.expires_in * 1000)),
      serviceName,
      isRefreshing: false
    }
  }

  function requestUserWithToken(token, serviceName, callback) {
    const url = config.serviceProviders[serviceName].url;
    request({
      url: url,
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

      body.token = token;
      return callback(null, body.data || body);
    });
  }

  function requestPermissionsWithToken(token, cb) {

    request({
      url: `${config.apiHost}/acpaas/meauthz/v1/applications/${config.applicationName}/permissions`,
      auth: {
        bearer: token
      },
      headers: {
        apikey: config.auth.apiKey
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

  function loginUser(code, serviceName, callback) {
  
    const oauth = createOAuth(serviceName);
    oauth.getOAuthAccessToken(code, {
      'grant_type': 'authorization_code'
    }, (err, accessToken, refreshToken, OAuthToken) => {
      if (err) {
        return callback(err);
      }

      const actions = {
        user: cb => requestUserWithToken(accessToken, serviceName, cb)
      };

      if (serviceName === 'mprofiel' && config.serviceProviders.mprofiel && config.serviceProviders.mprofiel.fetchPermissions) {
        actions.permissions = cb => requestPermissionsWithToken(accessToken, cb);
      }

      async.parallel(actions, (error, results) => {
        if (error) {
          return callback(error);
        }
        const user = results.user;
        if (results.permissions) {
          user.permissions = results.permissions;
        }

        return callback(null, user, createToken(OAuthToken, refreshToken));
      });
    });
  }

  function refresh(token, service, callback) {

    const oauth = createOAuth(service);
    oauth.getOAuthAccessToken(token.refreshToken, {
      'grant_type': 'refresh_token'
    }, (err, accessToken, refreshToken, OAuthToken) => {
      if (err) {
        return callback(err);
      }

      return callback(null, createToken(OAuthToken, refreshToken));
    });
  }

  return {
    loginUser,
    requestPermissionsWithToken,
    requestUserWithToken,
    refresh
  };
}


