'use strict';
const nock = require('nock');
const user = require('./user');

function nockGetUser(apiHost) {
  nock(apiHost)
    .get('/astad/mprofiel/v1/v1/me')
    .reply(200, user);
}

module.exports = {
  nockGetUser
};
