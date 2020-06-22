'use strict';
const assert = require('assert');
const reqres = require('reqres');


import correctConfig from './mocks/correctConfig';
import createController from '../src/controller'
require('./mocks/oauth');

describe('test #refresh middleware', function onDescribe() {
  it('refresh() should continue when no token was found on the session', function onIt(done) {
    const controller = createController(correctConfig);
    const req = reqres.req({
      session: {
      },
      save: (cb) => cb()
    });
    const res = reqres.req({});


    controller.refreshToken(req, res, (err) => {
      assert(!err);
      done();
    });
  });

  it('refresh() should call the refresh service and check if the token is expired', function onIt(done) {
    const controller = createController(correctConfig);
    const req = reqres.req({
      session: {
        userToken: {
          accessToken: "abc",
          serviceName: 'aprofiel',
          expiresIn: new Date(new Date().getTime())
        },
        save: (cb) => cb()
      }
    });
    const res = reqres.req({});


    controller.refreshToken(req, res, (err) => {
      assert(!err);
      done();
    });
  });

  it('refresh() should call the refresh service and refresh the token without errors', function onIt(done) {
    const controller = createController(correctConfig);
    const req = reqres.req({
      session: {
        userToken: {
          accessToken: "abc",
          expiresIn: new Date(new Date().getTime() + 1000)
        },
        save: (cb) => cb()
      }
    });
    const res = reqres.res({});

    controller.refreshToken(req, res, (err) => {
      assert(!err);
      assert(req.session.userToken.expiresIn > new Date());
      done();
    });
  });
});
