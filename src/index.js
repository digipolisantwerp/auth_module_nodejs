import createRouter from './router';
import createSsoMiddleware from './middleware/sso';


const REQUIRED_CONFIG_PROPS = [
  'clientId', 
  'clientSecret',
  'oauthHost'
];

function validateConfig(config) {

  REQUIRED_CONFIG_PROPS.forEach(prop => {
    if(config[prop] == null) {
      throw new Error(`${prop} is required config`);
    }
  });
}

const toExport =  {
  createRouter: (app, config) => {
    validateConfig(config);
    return createRouter(app, config);
  },
  createSsoMiddleware: (config) => {
    validateConfig(config);
    return createSsoMiddleware(config);
  }
};

export default toExport;
