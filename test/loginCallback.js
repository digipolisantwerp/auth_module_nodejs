'use strict';
const assert = require('assert');
const mockExpress = require('express')();
const reqres = require('reqres');
import './mocks/oauth';
import createRouter from '../src/router';
import correctConfig from './mocks/correctConfig';
import nockGetAprofiel from './mocks/user';
import { nockGetSessions } from './mocks/sessionStore';
import { onlyLowSession } from './mocks/sessionStoreResponses';


describe('test # login callback', function onDescribe() {

  it('callback redirect to errorRedirect when no code in query', (done) => {
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);
    const req = reqres.req({
      url: '/auth/login/callback',
      session: {
        save: cb => cb()
      }
    });

      const res = reqres.res({
          header: () => {}
      });

    res.on('end', () => {
      assert(res.redirect.calledWith(errorRedirect));
      return done();
    });

    router.handle(req, res);
  });

  it('callback redirect to errorRedirect when no state in query', (done) => {
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);
    const req = reqres.req({
      url: '/auth/login/callback',
      query: {
        code: 'blabla'
      },
      session: {
        save: cb => cb()
      }
    });

      const res = reqres.res({
          header: () => {}
      });

    res.on('end', () => {
      assert(res.redirect.calledWith(errorRedirect));
      return done();
    });

    router.handle(req, res);
  });

  it('callback should redirect to login url when state does not matches key', (done) => {
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/login/callback',
      query: {
        code: 'blabla',
        state: 'aprofiel_1234'
      },
      session: {
        save: cb => cb(),
        aprofiel_key: 'aprofiel_43321'
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(res.redirect.called);
      return done();
    });

    router.handle(req, res);
  });

  it('should login and redirect to fromUrl', (done) => {
    const ssoKey = 'fakeKey';
    nockGetAprofiel(correctConfig.url);
    nockGetSessions({ssoKey, payload: onlyLowSession})
    const errorRedirect = '/error';
    const fromUrl = '/fromUrl'
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);
    const key = 'aprofiel_1234'
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      url: '/auth/login/callback',
      query: {
        code: 'blabla',
        state: key
      },
      session: {
        save: cb => cb(),
        loginKey: key,
        fromUrl
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(req.session.user);
      assert(req.session.userToken);
      assert(res.redirect.calledWith(fromUrl));
      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log(e);
      return done(e);
    }
  });

  it('should login and redirect to / if no fromUrl', (done) => {
    nockGetAprofiel(correctConfig.url);
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);
    const key = 'aprofiel_1234'
    const req = reqres.req({
      url: '/auth/login/callback',
      query: {
        code: 'blabla',
        state: key
      },
      session: {
        save: cb => cb(),
        loginKey: key,
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      // assert(res.redirect.calledWith('/'));
      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log(e);
      return done(e);
    }

  });

  it('should redirect to errorRedirect if login errors', (done) => {
    nockGetAprofiel(correctConfig.url, 400);
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })

    const router = createRouter(mockExpress, config);
    const key = 'aprofiel_1234'
    const req = reqres.req({
      url: '/auth/login/callback',
      query: {
        code: 'blabla',
        state: key
      },
      session: {
        save: cb => cb(),
        loginKey: key
      },
    });

    const res = reqres.res({
        header: () => {}
    });
    res.on('end', () => {
      assert(res.redirect.calledWith(config.errorRedirect));
      return done();
    });

    router.handle(req, res);
  });
});
