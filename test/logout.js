'use strict';
const assert = require('assert');
import createRouter from '../src/router';
const reqres = require('reqres');
const mockExpress = require('express')();
import correctConfig from './mocks/correctConfig';
import { nockDeleteSessions } from './mocks/sessionStore';


describe('GET /logout', function onDescribe() {

  it('should redirect to / if no one is loggedin', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
      },
    });
    const res = reqres.res({
      header: () => { },
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
    const ssoKey = 'fakeSSO';
    nockDeleteSessions({ ssoKey });
    const router = createRouter(mockExpress, correctConfig);
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout',
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
        save: (cb) => cb(),
        user: {
          profile: {
            id: 'this-is-my-id'
          },
        },
        userToken: {
          accessToken: 'blabla'
        }
      },
    });

    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val
        this.emit('end');
      }
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl);
      assert(redirectUrl.includes(correctConfig.clientId));
      return done();
    });

    router.handle(req, res);
  });

  it('should store logoutFromUrl', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'http://from.com';
    const req = reqres.req({
      url: '/auth/logout',
      query: {
        fromUrl
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {
          profile: {
            id: 'this-is-my-id'
          },
        },
        userToken: {
          accessToken: 'blabla'
        }
      },
    });
    const res = reqres.res({
      header: () => { },
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

  it('should add authenticationmethod to logout redirect', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/logout',
      query: {
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
        user: {
          profile: {
            id: 'this-is-my-id'
          },
          authenticationMethod: 'iam-user-pass'
        },
        userToken: {
          accessToken: 'blabla'
        }
      },
    });
    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val
        this.emit('end');
      }
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl.includes('service=iam-user-pass'));
      return done();
    });

    router.handle(req, res);
  });
});
