'use strict';

const router = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');
const config = require('../lib/config');
const expect = require('chai').expect;
const reqres = require('reqres');
const user = require('./mocks/user.json');
const querystring = require('querystring');

function getRedirectUrl(conf) {
  const query = Object.assign({}, conf.auth, {
    client_id: conf.auth.clientId,
    redirect_uri: `${conf.domain}${conf.baseUrl}/callback`
  });

  delete query.clientId;
  delete query.clientSecret;

  return `${conf.oauthDomain}${conf.authPath}?${querystring.stringify(query)}`;
}
describe('test #callback', function onDescribe() {
  let mprofileRouter;

});
