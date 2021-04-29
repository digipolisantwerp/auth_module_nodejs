import assert from 'assert';
import reqres from 'reqres';

import createSSOMiddleware from '../src/middleware/sso';
import correctConfig from './mocks/correctConfig';
import { nockGetSessions } from './mocks/sessionStore';
import {
  emptySessions,
  onlyLowSession,
  lowSubstantialSessions,
  lowHighSessions,
  highSession,
  substantialSession,
} from './mocks/sessionStoreResponses';


describe('test sso middleware', function onDescribe() {
  // nockGetSession({ssoKey: 'fakessokey', payload: emptySessions})
  const middleware = createSSOMiddleware(correctConfig);
  it('no cookie header should result in next being called', function onIt(done) {
    const req = reqres.req({
      get: () => ''
    });

    const res = reqres.res();


    middleware(req, res, () => {
      assert(true);
      return done();
    });
  });

  it('cookie header without ssoKey should result in next', function onIt(done) {
    const req = reqres.req({
      get: () => 'AOS=op5ssja3rjrdqaqavt5clop1e1'
    });

    const res = reqres.res();


    middleware(req, res, () => {
      assert(true);
      return done();
    });
  });

  it('cookie header with ssoKey but empty sessions should result in next', function onIt(done) {
    const ssoKey = 'fakessokey';
    nockGetSessions({ ssoKey, payload: emptySessions });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
    });

    const res = reqres.res();


    middleware(req, res, () => {
      assert(true);
      return done();
    });
  });

  it('user with assuranceLevel = high should result in next', function onIt(done) {
    const req = reqres.req({
      get: () => 'AOS=op5ssja3rjrdqaqavt5clop1e1',
      session: {
        user: {
          assuranceLevel: 'high'
        }
      }
    });

    const res = reqres.res();


    middleware(req, res, () => {
      assert(true);
      return done();
    });
  });

  it('user with assurancelevel substantial but with high session should result in redirect', function onIt(done) {
    const ssoKey = 'fakessokey';
    let redirectValue;
    nockGetSessions({ ssoKey, payload: lowHighSessions });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
        user: {
          assuranceLevel: 'substantial'
        }
      }
    });
    const res = reqres.res({
      redirect(val) {
        redirectValue = val;
        this.emit('end');
      }
    });

    res.on('end', () => {
      assert(redirectValue.includes(highSession.authenticationMethod));
      done();
    });

    middleware(req, res, () => {});
  });

  it('user with assurancelevel substantial but with substantial session should result in next', function onIt(done) {
    const ssoKey = 'fakessokey';
    nockGetSessions({ ssoKey, payload: lowSubstantialSessions });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
        user: {
          assuranceLevel: 'substantial'
        }
      }
    });
    const res = reqres.res({
      redirect(val) {
        this.emit('end');
      }
    });

    res.on('end', () => {
      assert(false);
      done();
    });

    middleware(req, res, () => {
      return done();
    });
  });

  it('user with assurancelevel low but with substantial session should result in redirect', function onIt(done) {
    const ssoKey = 'fakessokey';
    let redirectValue;
    nockGetSessions({ ssoKey, payload: lowSubstantialSessions });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
        user: {
          assuranceLevel: 'low'
        }
      }
    });
    const res = reqres.res({
      redirect(val) {
        redirectValue = val;
        this.emit('end');
      }
    });

    res.on('end', () => {
      assert(redirectValue.includes(substantialSession.authenticationMethod));
      done();
    });

    middleware(req, res, () => {});
  });

  it('user with assurancelevel low but with low session should result in next', function onIt(done) {
    const ssoKey = 'fakessokey';
    let redirectValue;
    nockGetSessions({ ssoKey, payload: onlyLowSession });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
        user: {
          assuranceLevel: 'low'
        }
      }
    });
    const res = reqres.res({
      redirect(val) {
        redirectValue = val;
        this.emit('end');
      }
    });

    res.on('end', () => {
      assert(false);
      done();
    });

    middleware(req, res, () => {
      return done();
    });
  });

  it('no user but with low session should result in redirect', function onIt(done) {
    const ssoKey = 'fakessokey';
    let redirectValue;
    nockGetSessions({ ssoKey, payload: onlyLowSession });
    const req = reqres.req({
      get: () => `AOS=op5ssja3rjrdqaqavt5clop1e1; dgp.auth.ssokey=${ssoKey}`,
      session: {
      }
    });
  
    const res = reqres.res({
      redirect(val) {
        redirectValue = val;
        this.emit('end');
      }
    });

    res.on('end', () => {
      assert(redirectValue.includes('iam-aprofiel-userpass'));
      done();
    });

    middleware(req, res, () => {});
  });



});