'use strict';
const assert = require('assert');
const createRouter = require('../lib/router');
const reqres = require('reqres');
const mockExpress = require('mock-express')();
const correctConfig = require('./mocks/correctConfig');

describe('GET /logout/:serviceProvider/callback', function onDescribe() {


  it('should remove session when callback is triggered', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/aprofiel/callback',
      method: 'POST',
      query: {
        state: '1234'
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {},
        userToken: {},
        aprofiel_logoutKey: '1234',
        regenerate: (cb) => cb()
      },
    });
    const res = reqres.res({
      redirect(val) {
        redirectUrl = val
        this.emit('end');
      }
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl);
      assert(!req.session.userToken);
      assert(!req.session.user);
      assert(redirectUrl === '/');
      return done();
    });

    router.handle(req, res);
  });
});
