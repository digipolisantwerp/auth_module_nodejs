'use strict';

const router = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');
const config = require('../lib/config');
const expect = require('chai').expect;
const reqres = require('reqres');
const user = require('./mocks/user.json');
const querystring = require('querystring');

function getRedirectUrl(conf) {
  const query = Object.assign({}, conf.auth, {
    client_id: conf.auth.clientId,
    redirect_uri: `${conf.domain}${conf.baseUrl}/callback`
  });

  delete query.clientId;
  delete query.clientSecret;

  return `${conf.oauthDomain}${conf.authPath}?${querystring.stringify(query)}`;
}

describe('test #isLoggedin', function onDescribe() {
  let mprofileRouter;

  it('#isLoggedin() should return user of session', function onIt(done) {
    mprofileRouter = router(correctConfig);

    const req = reqres.req({
      url: '/api/aprofile/isloggedin',
      session: {
        user: user
      }
    });
    const res = reqres.res();
    try {
      mprofileRouter.handle(req, res);
    } catch (e) {
      return done(e);
    }
    res.on('end', () => {
      res.json.calledWith({
        user: user,
        isLoggedin: true
      });
      return done();
    });
  });

  it('#isLoggedin() should return login url when no user', function onIt(done) {
    mprofileRouter = router(correctConfig);
    const req = reqres.req({
      url: '/api/aprofile/isloggedin',
      session: {
        save: cb => cb()
      }
    });
    const res = reqres.res();
    mprofileRouter.handle(req, res);

    res.on('end', () => {
      res.json.calledWith({
        isLoggedin: false,
        url: getRedirectUrl(correctConfig)
      });
      return done();
    });
  });

  it('#isLoggedin() should return login url when no user and store fromUrl', function onIt(done) {
    mprofileRouter = router(correctConfig);
    const req = reqres.req({
      url: '/api/aprofile/isloggedin',
      query: {
        fromUrl: 'google.com'
      },
      session: {
        save: cb => cb()
      }
    });
    const res = reqres.res();
    mprofileRouter.handle(req, res);

    res.on('end', () => {
      res.json.calledWith({
        isLoggedin: false,
        url: getRedirectUrl(correctConfig)
      });
      expect(req.session.fromUrl).to.equal('google.com');
      return done();
    });
  });

  it('#isLoggedIn should redirect to login url if backendRedirect == true', function onIt(done) {
    const conf = Object.assign({}, correctConfig, {
      backendRedirect: true
    });
    mprofileRouter = router(conf);
    const req = reqres.req({
      url: '/api/aprofile/isloggedin'
    });
    const res = reqres.res();
    mprofileRouter.handle(req, res);

    res.on('end', () => {

      res.redirect.calledWith(getRedirectUrl(correctConfig));
      return done();
    });
  });
});
