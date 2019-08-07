'use strict';

const mockExpress = require('express')();
const createRouter = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');
const assert = require('assert');
const reqres = require('reqres');
const user = require('./mocks/user.json');

describe('test #isLoggedin', function onDescribe() {
  it('#isLoggedin() should return user of session', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/isloggedin',
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
          user: user,
          mprofiel: user,
          isLoggedin: true
        })
      );

      return done();
    });

    router.handle(req, res);
  });

  it('#isLoggedin() should return false when no user', function onIt(done) {
    const router = createRouter(mockExpress, correctConfig);
    const req = reqres.req({
      url: '/auth/isloggedin',
      session: {
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
