'use strict';
const assert = require('assert');
const createRouter = require('../lib/router');
const reqres = require('reqres');
const mockExpress = require('mock-express')();
const correctConfig = require('./mocks/correctConfig');

describe('GET /login/:serviceProvider', function onDescribe() {
  it('should 401 if provider is not known', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/login/dprofile, ',
      session: {
      }
    });
    const res = reqres.res();

    res.on('end', () => {
      assert(res.sendStatus.calledWith(401));
      return done();
    });

    router.handle(req, res);

  });

  it('should redirect to login', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'test.com/d';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login/aprofiel?fromUrl',
      query: {
        fromUrl
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
      assert(req.session.fromUrl === fromUrl);
      assert(redirectUrl.includes(encodeURIComponent(host)));
      assert(redirectUrl.includes(encodeURIComponent(correctConfig.auth.clientId)));
      assert(redirectUrl.includes(encodeURIComponent('aprofiel_')));
      assert(
        redirectUrl
          .includes(encodeURIComponent(correctConfig.serviceProviders.aprofiel.identifier))
      );
      assert(
        redirectUrl
          .includes(encodeURIComponent(correctConfig.serviceProviders.aprofiel.scopes))
      );
      return done();
    });

    router.handle(req, res);
  });
});
