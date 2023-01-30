import createRouter from './router';
import createSsoMiddleware from './middleware/sso';

const REQUIRED_ROUTER_CONFIG_PROPS = [
  'clientId',
  'clientSecret',
  'oauthHost',
];

const REQUIRED_SSO_MIDDLEWARE_CONFIG_PROPS = [
  'clientId',
  'clientSecret',
  'consentUrl',
];

function validateConfig(requiredProps, config) {
  requiredProps.forEach((prop) => {
    if (config[prop] == null) {
      throw new Error(`${prop} is required config`);
    }
  });
}

const toExport = {
  createRouter: (app, config) => {
    validateConfig(REQUIRED_ROUTER_CONFIG_PROPS, config);
    return createRouter(app, config);
  },
  createSsoMiddleware: (config) => {
    validateConfig(REQUIRED_SSO_MIDDLEWARE_CONFIG_PROPS, config);
    return createSsoMiddleware(config);
  },
};

export default toExport;
