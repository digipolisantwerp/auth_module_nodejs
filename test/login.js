import assert from 'assert';
import reqres from 'reqres';
import createRouter from '../src/router';
import correctConfig from './mocks/correctConfig';

const mockExpress = require('express')();

describe('GET /login', () => {
  it('should redirect to login', (done) => {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'test.com/d';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login',
      query: {
        fromUrl,
      },
      get: () => host,
      session: {
        save: (cb) => {
          cb();
        },
      },
    });
    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
    });

    res.on('end', () => {
      assert(redirectUrl);
      assert(req.session.fromUrl === fromUrl);
      assert(redirectUrl.includes(encodeURIComponent(host)));
      assert(redirectUrl.includes(encodeURIComponent(correctConfig.clientId)));
      const scopes = correctConfig.defaultScopes.join(' ');
      assert(
        redirectUrl
          .includes(encodeURIComponent(scopes)),
      );
      return done();
    });

    router.handle(req, res);
  });

  it('should redirect to login with language if supplied', (done) => {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    const fromUrl = 'test.com/d';
    const lng = 'de';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login',
      query: {
        fromUrl,
        lng,
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
      },
    });
    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl);
      assert(redirectUrl.includes(encodeURIComponent(lng)));
      return done();
    });

    router.handle(req, res);
  });

  it('should replace auth method "astad.aprofiel.v1" with "iam-aprofiel-userpass"', (done) => {
    const router = createRouter(mockExpress, correctConfig);
    const host = 'http://www.app.com';
    let redirectUrl = false;

    const req = reqres.req({
      url: '/auth/login',
      query: {
        auth_methods: 'astad.aprofiel.v1',
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
      },
    });

    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl);
      assert(redirectUrl.includes('auth_methods=iam-aprofiel-userpass'));
      return done();
    });

    router.handle(req, res);
  });

  it('should redirect to login with extra scopes if scopeGroups query param is supplied', (done) => {
    const config = { ...correctConfig,
      scopeGroups: {
        address: ['crspersoon.housenumber', 'crspersoon.streetname'],
        personal: ['crspersoon.nationalnumber', 'crspersoon.nationality'],
      } };

    const router = createRouter(mockExpress, config);
    const host = 'http://www.app.com';
    let redirectUrl = false;
    const req = reqres.req({
      url: '/auth/login',
      query: {
        scopeGroups: 'address,personal',
      },
      get: () => host,
      session: {
        save: (cb) => cb(),
      },
    });
    const res = reqres.res({
      header: () => { },
      redirect(val) {
        redirectUrl = val;
        this.emit('end');
      },
    });

    res.redirect.bind(res);

    res.on('end', () => {
      assert(redirectUrl);

      const scopes = config.scopeGroups.address
        .concat(config.scopeGroups.personal)
        .join(' ');
      assert(
        redirectUrl
          .includes(encodeURIComponent(scopes)),
      );
      return done();
    });

    router.handle(req, res);
  });

  describe('minimal_assurance_level query parameter', () => {
    it('no query param should result in low and associated auth methods(no context)', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
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
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=low'));
        assert(redirectUrl.includes('iam-aprofiel-userpass'));
        return done();
      });

      router.handle(req, res);
    });

    it('no query param and context enterprise should result in substantial', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          context: 'enterprise',
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=substantial'));
        assert(!redirectUrl.includes('iam-aprofiel-userpass'));
        return done();
      });

      router.handle(req, res);
    });

    it('substantial query param should result in associated auth methods', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          minimal_assurance_level: 'substantial',
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=substantial'));
        assert(!redirectUrl.includes('iam-aprofiel-userpass'));
        return done();
      });

      router.handle(req, res);
    });

    it('high query param should result in associated auth methods', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          minimal_assurance_level: 'high',
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=high'));
        assert(redirectUrl.includes('fas-citizen-eid'));
        return done();
      });

      router.handle(req, res);
    });

    it('high and context enterprise should result in associated auth methods', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          minimal_assurance_level: 'high',
          context: 'enterprise',
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=high'));
        assert(redirectUrl.includes('fas-enterprise-eid'));
        assert(redirectUrl.includes('save_consent=true'));
        return done();
      });
      router.handle(req, res);
    });

    it('save_consent = false should result in a loginUrl which does not save consent', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          minimal_assurance_level: 'high',
          context: 'enterprise',
          save_consent: false,
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('level=high'));
        assert(redirectUrl.includes('save_consent=false'));
        assert(!redirectUrl.includes('force_auth=false'));
        assert(redirectUrl.includes('fas-enterprise-eid'));
        return done();
      });
      router.handle(req, res);
    });

    it('force_auth = true should result in a loginUrl which forces a login', (done) => {
      const router = createRouter(mockExpress, correctConfig);
      const host = 'http://www.app.com';
      let redirectUrl = false;
      const req = reqres.req({
        url: '/auth/login',
        query: {
          minimal_assurance_level: 'high',
          context: 'enterprise',
          save_consent: false,
          force_auth: true,
        },
        get: () => host,
        session: {
          save: (cb) => cb(),
        },
      });
      const res = reqres.res({
        header: () => { },
        redirect(val) {
          redirectUrl = val;
          this.emit('end');
        },
      });

      res.redirect.bind(res);

      res.on('end', () => {
        assert(redirectUrl);
        assert(redirectUrl.includes('force_auth=true'));
        return done();
      });
      router.handle(req, res);
    });
  });
});
