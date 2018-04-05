'use strict';

const app = require('express')();
const mprofielLogin = require('./index');
app.use(mprofielLogin({
  oauthDomain: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  domain: 'https://www.astad.vagrant/user/oauth2/callback',
  backendRedirect: false, // optional, defaults to false.
	auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
  },
  fetchPermissions: false, // should fetch permissions
  applicationName: 'String', // required if fetchPermissions == true, should be name in User management,
  apiKey: 'String' // required if fetchPermissions == true
}));

app.listen(5000);