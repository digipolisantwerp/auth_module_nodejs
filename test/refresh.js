'use strict';
const assert = require('assert');
const reqres = require('reqres');

const correctConfig = require('./mocks/correctConfig');
const createController = require('../lib/controller');
require('./mocks/oauth');

const copy = (o) => {
  let output;
  let v;
  let key;

  output = Array.isArray(o) ? [] : {};
  for (key in o) {
      v = o[key];
      output[key] = (typeof v === "object") ? copy(v) : v;
  }

  return output;
}

describe('test refresh', function onDescribe() {
  it('refresh() should continue when no token was found on the session', function onIt(done) {
    const config = copy(correctConfig);
    const controller = createController(config);
    const req = reqres.req({
      session: {
      },
      save: (cb) => cb()
    });
    const res = reqres.req({});

    config.refresh = true;

    controller.refresh(req, res, (err) => {
      assert(!err);
      done();
    });
  });

  it('refresh() should call the refresh service and check if the token is expired', function onIt(done) {
    const config = copy(correctConfig);
    const controller = createController(config);
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

    config.refresh = true;

    controller.refresh(req, res, (err) => {
      assert(!err);
      done();
    });
  });

  it('refresh() should call the refresh service and refresh the token without errors', function onIt(done) {
    const config = copy(correctConfig);
    const controller = createController(config);
    const req = reqres.req({
      session: {
        currentServiceProvider: 'aprofiel',
        token: {
          accessToken: "abc",
          expiresIn: new Date(new Date().getTime() + 1000)
        },
        save: (cb) => cb()
      }
    });
    const res = reqres.res({});

    config.auth.service = "aprofiel";
    config.refresh = true;

    controller.refresh(req, res, (err) => {
      assert(!err);
      assert(req.session.token.expiresIn > new Date());
      done();
    });
  });
});
