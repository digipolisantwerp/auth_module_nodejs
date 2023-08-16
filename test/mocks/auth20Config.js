module.exports = {
  oauthHost: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  errorRedirect: '/',
  basePath: '/auth',
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    apiKey: 'my-api-string',
  },
  serviceProviders: {
    aprofiel: {
      version: 'v2',
      scopes: 'astad.aprofiel.v1.name astad.aprofiel.v1.username',
      auth_methods: 'iam-aprofiel-userpass',
      minimal_assurance_level: 'low',
      url: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1/me',
      tokenUrl: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: [],
      },
    },
    eid: {
      version: 'v2',
      scopes: 'astad.aprofiel.v1.username astad.aprofiel.v1.name astad.aprofiel.v1.avatar astad.aprofiel.v1.email astad.aprofiel.v1.phone crspersoon.givenName',
      url: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1/me',
      key: 'eid',
      auth_methods: 'fas-citizen-bmid,fas-citizen-totp,fas-citizen-otp,iam-aprofiel-userpass',
      minimal_assurance_level: 'low',
      tokenUrl: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: [],
      },
    },
  },
};
