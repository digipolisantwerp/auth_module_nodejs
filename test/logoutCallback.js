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
      url: '/auth/logout/callback/aprofiel',
      method: 'GET',
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

  it('should 401 when state incorrect', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/callback/aprofiel',
      method: 'GET',
      query: {
        state: '12345'
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
      assert(res.sendStatus.calledWith(401));
      return done();
    });

    router.handle(req, res);
  });

  it('should 401 when serviceprovider unknown', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/callback/dprof',
      method: 'GET',
      query: {
        state: '12345'
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
      assert(res.sendStatus.calledWith(401));
      return done();
    });

    router.handle(req, res);
  });
});
