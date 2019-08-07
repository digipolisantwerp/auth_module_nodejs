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
    oauthHost: process.env.OAUTH_HOST || 'https://api-oauth2-o.antwerpen.be',
    apiHost: process.env.API_HOST || 'https://api-gw-o.antwerpen.be',
    errorRedirect: process.env.AUTH_ERROR_REDIRECT || '/',
    basePath: process.env.AUTH_BASEPATH || '/auth',
    auth: {
      clientId: process.env.CLIENT_ID || 'your-client-id',
      clientSecret: process.env.CLIENT_SECRET || 'your-client-secret',
    },
    serviceProviders: {
      aprofiel: {
        scopes: process.env.APROFIEL_SCOPES || 'username',
        url: process.env.APROFIEL_URL || 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/v1/me',
        identifier: process.env.APROFIEL_IDENTIFIER || 'astad.aprofiel.v1',
        tokenUrl: process.env.APROFIEL_TOKENURL || 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/oauth2/token',
        hooks: {
          loginSuccess: [],
          logoutSuccess: []
        }
      }
    }
  }
}
