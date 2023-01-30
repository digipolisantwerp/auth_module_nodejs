module.exports = {
  mongoConnectionString: process.env.MONGO_CONNECTIONSTRING || 'mongodb://localhost:27017/basic-mongo-auth',
  port: process.env.PORT || '2000',
  '@digipolis/auth': {
    basePath: '/auth',
    clientId: process.env.CLIENT_ID || 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET || 'your-client-secret',
    oauthHost: 'https://api-oauth2-a.antwerpen.be',
    consentUrl: 'https://api-gw-a.antwerpen.be/acpaas/consent/v1',
    scopeGroups: {
      personalInformation: [
        'astad.aprofiel.v1.avatar',
        'astad.aprofiel.v1.email',
      ],
      high: ['crspersoon.nationalnumber'],
    },
    defaultScopes: ['astad.aprofiel.v1.name'],
    url: 'https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1',
    hooks: {
      loginSuccess: [
        (req, res, next) => {
          req.session.user.hookTest = 'hello';
          return next();
        },
      ],
    },
  },
};
