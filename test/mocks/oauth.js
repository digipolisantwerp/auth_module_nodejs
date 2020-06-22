import mockery from 'mockery';
import uuid from 'uuid';

mockery.enable({
  useCleanCache: true,
  warnOnReplace: false,
  warnOnUnregistered: false
});


class OAuth2 {
  constructor(clientId, clientSecret, apiHost, irr1, endpoint) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiHost = apiHost;
    this.endpoint = endpoint;
  }

  getOAuthAccessToken(code, options, callback) {
    this.code = code;
    this.accessTokenOptions = options;
    const token = uuid.v4();
    const refresh = uuid.v4();
    setTimeout(() => callback(null, token, refresh, {
      access_token: token,
      expires_in: 2 * 60 * 60
    }));
  }
}

mockery.registerMock('oauth', {
  OAuth2: OAuth2
});
