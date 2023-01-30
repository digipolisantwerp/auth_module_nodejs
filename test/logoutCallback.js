import assert from 'assert';
import reqres from 'reqres';
import createRouter from '../src/router';

import correctConfig from './mocks/correctConfig';

const mockExpress = require('express')();

describe('GET /logout/callback', () => {
  it('should remove session when callback is triggered', (done) => {
    const router = createRouter(mockExpress, correctConfig);

    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/callback',
      method: 'GET',
      query: {
        state: '1234',
      },
      get: () => undefined,
      session: {
        save: (cb) => cb(),
        user: {},
        userToken: {},
        aprofiel_logoutKey: '1234',
        regenerate: (cb) => cb(),
      },
    });
    const res = reqres.res({
      header: () => {},
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
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

  it('should redirect to the given logoutUrl', (done) => {
    const router = createRouter(mockExpress, correctConfig);
    const logoutFromUrl = 'https://google.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/callback',
      method: 'GET',
      query: {
        state: '1234',
      },
      get: () => undefined,
      session: {
        save: (cb) => cb(),
        user: {},
        userToken: {},
        aprofiel_logoutKey: '1234',
        logoutFromUrl,
        regenerate: (cb) => cb(),
      },
    });
    const res = reqres.res({
      header: () => {},
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert.equal(redirectUrl, logoutFromUrl);
      return done();
    });

    router.handle(req, res);
  });
});
