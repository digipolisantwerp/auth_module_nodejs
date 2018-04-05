'use strict';
const mockery = require('mockery');
const uuid = require('uuid');
mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
});

let createdInstance;

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
    setTimeout(() => callback(null, token));
  }
}

mockery.registerMock('oauth', {
  OAuth2: OAuth2
});

module.exports = {
  getCreatedInstance
};

