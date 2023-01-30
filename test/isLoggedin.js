import assert from 'assert';
import reqres from 'reqres';
import createRouter from '../src/router';
import correctConfig from './mocks/correctConfig';
import user from './mocks/user.json';

const mockExpress = require('express')();

describe('GET /isLoggedin', () => {
  it('#isLoggedin() should return user of session', (done) => {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/isloggedin',
      session: {
        user,
        mprofiel: user,
      },
    });

    const res = reqres.res({
      header: () => {},
    });

    res.on('end', () => {
      assert(
        res.json.calledWith({
          user,
          isLoggedin: true,
        }),
      );

      return done();
    });

    router.handle(req, res);
  });

  it('#isLoggedin() should return false when no user', (done) => {
    const router = createRouter(mockExpress, correctConfig);
    const req = reqres.req({
      url: '/auth/isloggedin',
      session: {
        save: (cb) => cb(),
      },
    });

    const res = reqres.res({
      header: () => {},
    });

    res.on('end', () => {
      assert(
        res.json.calledWith({
          isLoggedin: false,
        }),
      );
      return done();
    });

    router.handle(req, res);
  });
});
