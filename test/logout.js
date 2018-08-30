'use strict';
const assert = require('assert');
const createRouter = require('../lib/router');
const reqres = require('reqres');
const mockExpress = require('mock-express')();
const correctConfig = require('./mocks/correctConfig');

describe('GET /logout/:serviceProvider', function onDescribe() {
  it('should 404 if provider is not known', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/logout/aprofile',
      method: 'POST',
      session: {}
    });
    const res = reqres.res();

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
      method: 'POST',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
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
      method: 'POST',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {
          id: 'this-is-my-id'
        },
        token: {}
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
      assert(redirectUrl.includes(correctConfig.auth.clientId));
      assert(redirectUrl.includes(correctConfig.serviceProviders.aprofiel.identifier));
      return done();
    });

    router.handle(req, res);
  });
});
