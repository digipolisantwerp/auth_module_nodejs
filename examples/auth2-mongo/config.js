module.exports = {
  mongoConnectionString: process.env.MONGO_CONNECTIONSTRING || 'mongodb://localhost:27017/basic-mongo-auth',
  port: process.env.PORT || '2000',
  session:{
    name: process.env.SESSION_NAME || 'authsessionid',
    secret: process.env.SESSION_SECRET || 'thisisthesessionsecretusedtosigncookie',
    resave: false,
    saveUninitialized: true,
  },
  auth: {
    oauthHost: process.env.OAUTH_HOST || 'https://api-oauth2-a.antwerpen.be',
    apiHost: process.env.API_HOST || 'https://api-gw-a.antwerpen.be',
    errorRedirect: process.env.AUTH_ERROR_REDIRECT || '/',
    basePath: process.env.AUTH_BASEPATH || '/auth',
    auth: {
      clientId: process.env.CLIENT_ID || 'c63f6918-1e3d-4566-9430-ed6b61c3862d',
      clientSecret: process.env.CLIENT_SECRET || 'e7be6215-9b15-4d8c-8a42-681187d7cd85',
    },
    serviceProviders: {
      aprofiel: {
        version: 'v2',
        serviceName: 'aprofiel',
        scopes: process.env.APROFIEL_SCOPES || 'astad.aprofiel.v1.name astad.aprofiel.v1.avatar',
        url: process.env.APROFIEL_URL || 'https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1/me',
        identifier: process.env.APROFIEL_IDENTIFIER || 'astad.aprofiel.v1',
        tokenUrl: process.env.APROFIEL_TOKENURL || 'https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1/oauth2/token',
        authMethods: 'fas-citizen-bmid,fas-citizen-totp,fas-citizen-otp,iam-aprofiel-userpass,fas-citizen-eid',
        minimalAssuranceLevel: 'low',
        hooks: {
          loginSuccess: [],
          logoutSuccess: []
        }
      }
    }
  }
}
