'use strict';
const uuid = require('uuid');

module.exports = {
  oauthHost: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  errorRedirect: '/',
  basePath: '/auth',
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    apiKey: 'my-api-string', // required if fetchPermissions == true
  },
  serviceProviders: {
    aprofiel: {
      scopes: '',
      url: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/v1/me',
      identifier:'astad.aprofiel.v1',
      tokenUrl: 'https://api-gw-o.antwerpen.be//astad/aprofiel/v1/oauth2/token',
      hooks: {
        authSuccess: []
      }
    },
    mprofiel: {
      scopes: 'all',
      url: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/v1/me',
      identifier: 'astad.mprofiel.v1',
      fetchPermissions: false,
      applicationName: 'this-is-my-app',
      tokenUrl: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/oauth2/token',
      hooks: {
        authSuccess: []
      }
    },
  }
}
