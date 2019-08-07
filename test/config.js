'use strict';
const assert = require('assert');
const config = require('../lib/config');
describe('test config', function onDescribe() {
  it('should throw error when apiBasePath is not present', function onIt() {
    try {
      config.createConfig({});
      assert(false)
    } catch (err) {
      assert(err);
    }
  });
});
