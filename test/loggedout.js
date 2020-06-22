const assert = require('assert');
const bcrypt = require('bcryptjs');
const reqres = require('reqres');
const uuid = require('uuid');


const mockExpress = require('express')();
import createRouter from '../src/router';
import correctConfig from './mocks/correctConfig';

describe('POST /event/loggedout', function onDescribe() {
  const adapterPromiseResolve = () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    })
  };

  const adapterPromiseReject = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(), 1000);
    })
  };

  it('should 200 when no suitable adapter present', (done) => {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST'
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(200)
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log('e', e.stack);
    }
  });

  it('should 401 when key does not match hash', (done) => {
    const key = 'thisispass'
    const config = Object.assign({}, correctConfig, {
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(key),
        sessionStoreLogoutAdapter: adapterPromiseResolve
      }
    });
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey] : 'nonematching'
      },

      get: (key) => req.headers[key]
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(401)
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log('e', e.stack);
    }
  });

  it('should 200 when key matches hash and adapter resolves', (done) => {
    const token = uuid.v4();
    const config = Object.assign({}, correctConfig, {
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(token),
        sessionStoreLogoutAdapter: adapterPromiseResolve
      }
    });
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey] : token
      },

      get: (key) => req.headers[key]
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(200)
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log('e', e.stack);
    }
  });


  it('should 500 when key matches hash and adapter rejects', (done) => {
    const token = uuid.v4();
    const config = Object.assign({}, correctConfig, {
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(token),
        sessionStoreLogoutAdapter: adapterPromiseReject
      }
    });
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey] : token
      },

      get: (key) => req.headers[key]
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.status.calledWith(500)
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log('e', e.stack);
    }
  });


})