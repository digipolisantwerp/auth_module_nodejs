'use strict';
const nock = require('nock');
const user = require('./user.json');

function nockGetAprofiel(apiHost, status) {
  nock(apiHost)
    .get('/astad/aprofiel/v1/v1/me')
    .reply(status || 200, {
      data: user
    });
}

module.exports = {
  nockGetAprofiel
};
