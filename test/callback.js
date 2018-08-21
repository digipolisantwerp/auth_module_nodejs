'use strict';

const config = require('../lib/config');
const correctConfig = require('./mocks/correctConfig');
const oauth = require('./mocks/oauth');
oauth.getCreatedInstance();
const expect = require('chai').expect;
const createController = require('../lib/controller');
const reqres = require('reqres');
const user = require('./mocks/user');
const userJSON = require('./mocks/user.json');


describe('test #callback', function onDescribe() {

  it('callback should add user to session', (done) => {
    const conf = config.createConfig(correctConfig)
    user.nockGetAprofiel(conf.apiHost);
    const controller = createController(conf);
    const res = reqres.res();
    const req = {
      query: {
        code: '1234'
      },
      session: {
        save: (cb) => cb()
      }
    }
    controller.callback(req, res);
    res.on('end', () => {
      expect(req.session.user).to.eql(userJSON);
      return done();
    });
  });

  it('authSuccess hook should run on callback', (done) => {
    let count = 0;
    const newConfig = Object.assign({}, correctConfig, {
      hooks: {
        authSuccess: [
          (req, res, next) => {
            count++;
            return next();
          },
          (req, res, next) => {
            count +=5;
            return next();
          },
          (req, res, next) => {
            req.session.count = count;
            return next();
          }
        ]
      }
    });


    const conf = config.createConfig(newConfig)
    user.nockGetAprofiel(conf.apiHost);
    const controller = createController(conf);
    const res = reqres.res();
    const req = {
      query: {
        code: '1234'
      },
      session: {
        save: (cb) => cb()
      }
    }

    controller.callback(req, res);
    res.on('end', () => {
      expect(req.session.user).to.eql(userJSON);
      expect(req.session.count).to.eql(count);
      return done();
    });

  });
});
