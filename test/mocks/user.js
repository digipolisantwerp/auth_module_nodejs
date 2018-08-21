'use strict';
const nock = require('nock');
const user = require('./user.json');

function nockGetAprofiel(apiHost) {
  nock(apiHost)
    .log(console.log)
    .get('/astad/aprofiel/v1/v1/me')
    .reply(200, {
      data: user
    });
}

module.exports = {
  nockGetAprofiel
};
