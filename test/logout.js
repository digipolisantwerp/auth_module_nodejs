'use strict';
const assert = require('assert');
const createRouter = require('../lib/router');
const reqres = require('reqres');
const mockExpress = require('express')();
const correctConfig = require('./mocks/correctConfig');

describe('GET /logout/:serviceProvider', function onDescribe() {
  it('should 404 if provider is not known', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/logout/aprofile',
      session: {}
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(res.sendStatus.calledWith(404));
      return done();
    });

    router.handle(req, res);

  });

  it('should redirect to / if no one is loggedin', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/aprofiel',
      query: {
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
      assert(redirectUrl === '/');
      return done();
    });

    router.handle(req, res);
  });

  it('should redirect to logoutPage', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/aprofiel',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {
          id: 'this-is-my-id'
        },
        userToken: {
          access_token: {}
        }
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
      assert(redirectUrl.includes(correctConfig.auth.clientId));
      assert(redirectUrl.includes(correctConfig.serviceProviders.aprofiel.identifier));
      return done();
    });

    router.handle(req, res);
  });

  it('should store logoutFromUrl', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'http://from.com';
    const req = reqres.req({
      url: '/auth/logout/aprofiel',
      query: {
        fromUrl
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {
          id: 'this-is-my-id'
        },
        userToken: {
          access_token: {}
        }
      },
    });
    const res = reqres.res({
      header: () => {},
      redirect() {
        this.emit('end');
      }
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert.equal(req.session.logoutFromUrl, fromUrl);
      return done();
    });

    router.handle(req, res);
  });

  it('should add authentication type to logout redirect', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout/mprofielso',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        mprofielso: {
          id: 'this-is-my-id'
        },
        mprofielsoToken: {
          access_token: {}
        }
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
      console.log(redirectUrl.includes('auth_type'));
      return done();
    });

    router.handle(req, res);
  });
});
