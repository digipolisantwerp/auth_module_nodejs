'use strict';

const correctConfig = require('./mocks/correctConfig');
const oauth = require('./mocks/oauth');
const createRouter = require('../lib/router');
const reqres = require('reqres');
const mockExpress = require('mock-express')();
const assert = require('assert');
const user = require('./mocks/user');
const userJSON = require('./mocks/user.json');

oauth.getCreatedInstance();

describe('test #callback', function onDescribe() {

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

  it('callback should 404 when serviceProvider is unknown', (done) => {
    const errorRedirect = '/error';
    const config = Object.assign(correctConfig, {
      errorRedirect
    })
    const router = createRouter(mockExpress, config);
    const req = reqres.req({
      url: '/auth/login/callback',
      query: {
        code: 'blabla',
        state: 'nonExisting_1234'
      },
      session: {
        save: cb => cb()
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
    user.nockGetAprofiel(correctConfig.apiHost);
    const errorRedirect = '/error';
    const fromUrl = '/fromUrl'
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
        aprofiel_key: key,
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
    user.nockGetAprofiel(correctConfig.apiHost);
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
        aprofiel_key: key,
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(res.redirect.calledWith('/'));
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
    user.nockGetAprofiel(correctConfig.apiHost, 400);
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
        aprofiel_key: key
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

  it('should call hooks', (done) => {
    user.nockGetAprofiel(correctConfig.apiHost);
    const hookTest = 'blabla'
    const aprofielConfig = Object.assign({}, correctConfig.serviceProviders.aprofiel);
    aprofielConfig.hooks = {
      loginSuccess: [
        (req, res, next) => {
          req.session.hookTest = hookTest;
          return req.session.save(() => next());
        },
        (req, res, next) => {
          req.session.hookTest2 = hookTest;
          return req.session.save(() => next());
        }
      ]
    }

    const config = Object.assign({}, correctConfig);
    config.serviceProviders.aprofiel = aprofielConfig;

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
        aprofiel_key: key
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert.equal(req.session.hookTest, hookTest);
      assert.equal(req.session.hookTest2, hookTest);
      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log(e);
      return done(e);
    }
  });

  it('should redirect to error page if hooks fail', (done) => {
    user.nockGetAprofiel(correctConfig.apiHost);
    const aprofielConfig = Object.assign({}, correctConfig.serviceProviders.aprofiel);
    aprofielConfig.hooks = {
      loginSuccess: [
        (req, res, next) => {
          return next({message: 'this is an error'})
        }
      ]
    }

    const config = Object.assign({}, correctConfig);
    config.serviceProviders.aprofiel = aprofielConfig;

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
        aprofiel_key: key
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(res.redirect.calledWith(config.errorRedirect));
      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log(e);
      return done(e);
    }
  });


  it('should use a custom redirect uri', (done) => {
    user.nockGetAprofiel(correctConfig.apiHost);
    const errorRedirect = '/error';
    const config = Object.assign({}, correctConfig, {
      errorRedirect,
      serviceProviders: {
        aprofiel: Object.assign({}, correctConfig.serviceProviders.aprofiel, {redirectUri: '/custom/callback'})
      }
    })
    const router = createRouter(mockExpress, config);
    router.get('/custom/callback', (req, res, next) => {
      return res.send('ok');
    });

    const key = 'aprofiel_1234'
    const req = reqres.req({
      url: '/custom/callback',
      query: {
        code: 'blabla',
        state: key
      },
      session: {
        save: cb => cb(),
        aprofiel_key: key,
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(res.send.calledOnce);
      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log(e);
      return done(e);
    }
  });
});
