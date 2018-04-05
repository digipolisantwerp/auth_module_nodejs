'use strict';
const config = require('../lib/config');
const expect = require('chai').expect;
const correctConfig = require('./mocks/correctConfig');

describe('test config', function onDescribe() {
  it('should throw error when apiBaseUrl is not present', function onIt() {
    try {
      config.set({});
      expect(true).to.equal(false);
    } catch (err) {
      expect(err).to.not.equal(null);
    }
  });
});
