'use strict';

let config;
const REQUIRED_PROPS = ['oauthDomain', 'apiHost', 'domain', 'auth.clientId', 'auth.clientSecret'];
const REQUIRED_PERMISSION_PROPS = ['auth.apiKey', 'apiHost', 'applicationName'];
const getProp = require('lodash.get');

const defaultConfig = {
  basePath: '/auth/mprofile',
  authPath: '/v1/authorize',
  auth: {
    response_type: 'code',
    service: 'astad.aprofiel.v1',
    scope: 'all',
    saveConsent: true,
    apiKey: false
  },
  key: 'user',
  backendRedirect: false,
  errorRedirect: '/',
  fetchPermissions: false,
  refresh: false,
  hooks: {
    authSuccess: false,
    authFailure: false,
    logout: false
  }
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
  const defaultBasePath = auth.service === 'astad.mprofiel.v1' ? '/auth/mprofile' : '/auth/aprofile';
  return Object.assign({}, defaultConfig, options, { auth: auth }, {
    basePath: options.basePath || defaultBasePath
  });
}

module.exports = {
  createConfig
};
