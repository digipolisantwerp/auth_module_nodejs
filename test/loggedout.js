import * as uuid from 'uuid';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import reqres from 'reqres';
import createRouter from '../src/router';
import correctConfig from './mocks/correctConfig';

const mockExpress = require('express')();

describe('POST /event/loggedout', () => {
  const adapterPromiseResolve = () => new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });

  const adapterPromiseReject = () => new Promise((_resolve, reject) => {
    setTimeout(() => reject(), 1000);
  });

  it('should 200 when no suitable adapter present', (done) => {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(200),
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      done();
    }
  });

  it('should 401 when key does not match hash', (done) => {
    const key = 'thisispass';
    const config = { ...correctConfig,
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(key),
        sessionStoreLogoutAdapter: adapterPromiseResolve,
      } };
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey]: 'nonematching',
      },

      get: (getKey) => req.headers[getKey],
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(401),
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      done();
    }
  });

  it('should 200 when key matches hash and adapter resolves', (done) => {
    const token = uuid.v4();
    const config = { ...correctConfig,
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(token),
        sessionStoreLogoutAdapter: adapterPromiseResolve,
      } };
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey]: token,
      },

      get: (key) => req.headers[key],
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.sendStatus.calledWith(200),
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      done();
    }
  });

  it('should 500 when key matches hash and adapter rejects', (done) => {
    const token = uuid.v4();
    const config = { ...correctConfig,
      logout: {
        headerKey: 'key',
        securityHash: bcrypt.hashSync(token),
        sessionStoreLogoutAdapter: adapterPromiseReject,
      } };
    const router = createRouter(mockExpress, config);

    const req = reqres.req({
      url: '/auth/event/loggedout',
      method: 'POST',
      headers: {
        [config.logout.headerKey]: token,
      },

      get: (key) => req.headers[key],
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
        res.status.calledWith(500),
      );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      done();
    }
  });
});
