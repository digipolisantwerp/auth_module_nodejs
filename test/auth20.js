'use strict';
const assert = require('assert');
const mockExpress = require('express')();
const reqres = require('reqres');
const createRouter = require('../lib/router');
const auth20Config = require('./mocks/auth20Config');

it('should work with authentication20 config', function onIt(done) {
  const router = createRouter(mockExpress, auth20Config);
  const host = 'http://www.app.com';
  const fromUrl = 'test.com/d';
  let redirectUrl = false;
  const req = reqres.req({
    url: '/auth/login/eid?fromUrl',
    query: {
      fromUrl,
    },
    get: () => host,
    session: {
      save: (cb) => cb(),
    },
  });
  const res = reqres.res({
    header: () => {},
    redirect(val) {
      redirectUrl = val
      this.emit('end');
    }
  });
  res.redirect.bind(res);

  res.on('end', () => {
    assert(redirectUrl);
    assert(redirectUrl.includes('/v2/authorize'))

    return done();
  });

  router.handle(req, res);
});
