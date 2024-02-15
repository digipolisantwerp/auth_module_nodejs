const config = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  oauthHost: 'https://api-oauth2-a.antwerpen.be',
  basePath: '/auth',
  defaultScopes: [
    'astad.aprofiel.v1.name',
    'astad.aprofiel.v1.avatar',
    'astad.aprofiel.v1.email',
  ],
  scopeGroups: {
    address: ['crspersoon.housenumber', 'crspersoon.streetname'],
    personal: ['crspersoon.nationalnumber', 'crspersoon.nationality'],
  },
  url: 'https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1',
  consentUrl: 'https://api-gw-a.antwerpen.be/acpaas/consent/v1',
  refresh: true,
  allowedDomains: ['test.com']
};

export default config;
