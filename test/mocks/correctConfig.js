'use strict';
const uuid = require('uuid');

module.exports = {
  oauthDomain: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  domain: 'http://localhost:' + process.env.PORT,
  auth: {
    clientId: uuid.v4(),
    clientSecret: uuid.v4()
  }
};
