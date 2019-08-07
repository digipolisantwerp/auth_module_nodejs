const mockExpress = require('express')();
const createRouter = require('../lib/router');
const correctConfig = require('./mocks/correctConfig');
const assert = require('assert');
const reqres = require('reqres');

describe.skip('test #loggedout', function onDescribe() {
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


  it('should 404 when service provider is not known', (done) => {
    const router = createRouter(mockExpress, correctConfig);

    const req = reqres.req({
      url: '/auth/event/loggedout/blaprofiel',
      method: 'GET'
    });

    const res = reqres.res({});

    res.on('end', () => {
      assert(
         res.sendStatus.calledWith(404)
       );

      return done();
    });
    try {
      router.handle(req, res);
    } catch (e) {
      console.log('e', e.stack);
    }
  })
})