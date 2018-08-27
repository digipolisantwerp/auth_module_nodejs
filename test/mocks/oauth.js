'use strict';
const mockery = require('mockery');
const uuid = require('uuid');
mockery.enable({
  useCleanCache: true,
  warnOnReplace: false,
  warnOnUnregistered: false
});

let createdInstance;
let errorToReturn = false;

function setError(err) {
  errorToReturn = err;
}

function getCreatedInstance() {
  return createdInstance;
}

class OAuth2 {
  constructor(clientId, clientSecret, apiHost, irr1, endpoint) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiHost = apiHost;
    this.endpoint = endpoint;
    createdInstance = this;
  }

  getOAuthAccessToken(code, options, callback) {
    this.code = code;
    this.accessTokenOptions = options;
    const token = uuid.v4();
    const refresh = uuid.v4();
    if(errorToReturn) {
      callback(errorToReturn);
      errorToReturn = false;
      return;
    }

    setTimeout(() => callback(null, token, refresh, {
      access_token: token,
      expires_in: 2 * 60 * 60
    }));
  }
}

mockery.registerMock('oauth', {
  OAuth2: OAuth2
});

module.exports = {
  getCreatedInstance,
  setError
};

