'use strict';
const assert = require('assert');
const mockExpress = require('express')();
const reqres = require('reqres');

const createRouter = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');

describe('GET /login/:serviceProvider', function onDescribe() {
  it('should 404 if provider is not known', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/login/dprofile, ',
      session: {
      }
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
        header: () => {},
      redirect(val) {
        redirectUrl = val
        this.emit('end');
      }
    });


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

  it('should redirect to login with language if supplied', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'test.com/d';
    const lng = 'de';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login/aprofiel?fromUrl',
      query: {
        fromUrl,
        lng
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
      assert(redirectUrl.includes(encodeURIComponent(lng)));
      return done();
    });

    router.handle(req, res);
  });

  it('should supply authenticationType if configured', function onIt(done) {
    const authenticationType = 'so';
    const soProvider = Object.assign({}, correctConfig.serviceProviders.mprofiel, {
      authenticationType
    });

    const configuration = Object.assign({}, correctConfig, {
      serviceProviders: {
        'mprofiel-so': soProvider
      }
    });
    const router = createRouter(mockExpress, configuration);
    const host = 'http://www.app.com';
    const fromUrl = 'test.com/d';
    const lng = 'de';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login/mprofiel-so?fromUrl',
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
      assert(redirectUrl.includes(`auth_type=${authenticationType}`));
      return done();
    });

    router.handle(req, res);
  });
});
