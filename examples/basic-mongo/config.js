module.exports = {
  mongoConnectionString: process.env.MONGO_CONNECTIONSTRING || 'mongodb://localhost:27017/basic-mongo-auth',
  port: process.env.PORT || '2000',
  session:{
    name: 'authsessionid',
    secret: 'thisisthesessionsecretusedtosigncookie',
    resave: false,
    saveUninitialized: true,
  },
  auth: {
    oauthHost: 'https://api-oauth2-o.antwerpen.be',
    apiHost: 'https://api-gw-o.antwerpen.be',
    errorRedirect: '/',
    basePath: '/auth',
    auth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
    serviceProviders: {
      aprofiel: {
        scopes: '',
        url: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/v1/me',
        identifier: 'astad.aprofiel.v1',
        tokenUrl: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/oauth2/token',
        redirectUri: 'https://custom.antwerpen.be/auth/callback',
        hooks: {
          loginSuccess: [],
          logoutSuccess: []
        }
      }
    }
  }
}
