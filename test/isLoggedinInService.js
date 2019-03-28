'use strict';

const mockExpress = require('mock-express')();
const createRouter = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');
const assert = require('assert');
const reqres = require('reqres');
const user = require('./mocks/user.json');

describe('test #isLoggedinInService', function onDescribe() {
  it('#isLoggedinInService() should return user of session for service', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/isloggedin/mprofiel',
      session: {
        user: user,
        mprofiel: user
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {

      assert(
        res.json.calledWith({
          mprofiel: user,
          isLoggedin: true
        })
      );

      return done();
    });

    router.handle(req, res);
  });

  it('#isLoggedinInService() should return false when no user', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const req = reqres.req({
      url: '/auth/isloggedin/mprofiel',
      session: {
        user: user,
        save: cb => cb()
      }
    });

    const res = reqres.res({
        header: () => {}
    });

    res.on('end', () => {
      assert(
        res.json.calledWith({
          isLoggedin: false,
        })
      );
      return done();
    });

    router.handle(req, res);
  });
});
