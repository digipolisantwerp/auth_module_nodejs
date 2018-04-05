'use strict';

let config;
const REQUIRED_PROPS = ['oauthDomain', 'apiHost', 'domain', 'auth.clientId', 'auth.clientSecret'];
const REQUIRED_PERMISSION_PROPS = ['apiKey', 'apiHost', 'applicationName'];
const getProp = require('lodash.get');

const defaultConfig = {
  baseUrl: '/api/mprofile',
  authPath: '/v1/authorize',
  auth: {
    response_type: 'code',
    service: 'astad.mprofiel.v1',
    scope: 'all',
    save_consent: true
  },
  backendRedirect: false,
  fetchPermissions: false
};

function checkConfigValidity(options) {
  REQUIRED_PROPS.forEach(key => {
    if (!getProp(options, key)) {
      throw new Error(`At least ${REQUIRED_PROPS.join(', ')} are required properties}`);
    }
  });

  if (!options.fetchPermissions) {
    return;
  }

  REQUIRED_PERMISSION_PROPS.forEach(key => {
    if (!getProp(options, key)) {
      throw new Error(`At least 
      ${REQUIRED_PERMISSION_PROPS.join(', ')} are required properties} when fetchPermissions == true`);
    }
  });
}
function createConfig(options) {
  checkConfigValidity(options);
  const auth = Object.assign({}, defaultConfig.auth, options.auth);
  return Object.assign({}, defaultConfig, options, {auth: auth});
  return config;
}

module.exports = {
  createConfig
};
