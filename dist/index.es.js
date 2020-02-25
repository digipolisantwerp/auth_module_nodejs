import { Router, json } from 'express';
import bcrypt from 'bcryptjs';
import qs from 'querystring';
import uuid from 'uuid';
import async from 'async';
import { createHash, createCipheriv } from 'crypto';
import { OAuth2 } from 'oauth';
import cookieParser from 'cookie';
import fetch$1 from 'isomorphic-fetch';

var authMethodsConfig = {
  citizen: {
    low: ['iam-aprofiel-userpass', 'fas-citizen-bmid', 'fas-citizen-otp', 'fas-citizen-totp', 'fas-citizen-eid'],
    substantial: ['fas-citizen-bmid', 'fas-citizen-otp', 'fas-citizen-totp', 'fas-citizen-eid'],
    high: ['fas-citizen-eid']
  },
  enterprise: {
    substantial: ['fas-enterprise-bmid', 'fas-enterprise-otp', 'fas-enterprise-totp', 'fas-enterprise-eid'],
    high: ['fas-enterprise-eid']
  }
};

const ALGORITHM = 'aes-128-ctr';
function logoutEncrypt(text, password) {
  const hash = createHash('sha1');
  hash.update(password);
  const key = hash.digest().slice(0, 16);
  const ivBuffer = Buffer.alloc(16);
  const cipher = createCipheriv(ALGORITHM, key, ivBuffer);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}
function getHost(req) {
  return `${req.protocol}://${req.get('host')}`;
}
function runHooks(configuredHook, req, res, next) {
  if (!configuredHook || !Array.isArray(configuredHook)) {
    return next();
  }

  const hooks = configuredHook.map(hook => cb => hook(req, res, cb));
  async.series(hooks, next);
}
function parseBody(response) {
  const contentType = response.headers.get('content-type');

  if (!contentType) {
    return Promise.resolve();
  }

  if (contentType.includes('json')) {
    return response.json();
  }

  if (contentType.includes('text')) {
    return response.text();
  }

  if (contentType.includes('form-data') >= 0) {
    return response.formData();
  }

  return response;
}

const tokenStore = {};
const ACCESS_TOKEN_PATH = '/oauth2/token';
const EXPIRY_MARGIN = 1000 * 60 * 5; // 5 minute margin

function createUserToken(results, refreshToken) {
  return {
    accessToken: results.access_token,
    refreshToken,
    expiresIn: new Date(new Date().getTime() + results.expires_in * 1000 - EXPIRY_MARGIN),
    isRefreshing: false
  };
}

function getNewAccessToken(clientId, clientSecret, url) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);
  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken('', {
      grant_type: 'client_credentials'
    }, (err, accessToken, refreshToken, results) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        accessToken,
        expiry: Date.now() + results.expires_in * 1000 - EXPIRY_MARGIN
      });
    });
  });
}

function getUserTokenFromAuthorizationCode(code, clientId, clientSecret, url) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);
  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken(code, {
      grant_type: 'authorization_code'
    }, (err, accessToken, refreshToken, results) => {
      if (err) {
        return reject(err);
      }

      const userToken = createUserToken(results, refreshToken);
      return resolve(userToken);
    });
  });
}
function refreshToken(token) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);
  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken(token.refreshToken, {
      'grant_type': 'refresh_token'
    }, (err, accessToken, refreshToken, results) => {
      if (err) {
        return reject(err);
      }

      const userToken = creatUserToken(results, refreshToken);
      return resolve(userToken);
    });
  });
}
async function getAccessToken(clientId, clientSecret, url) {
  if (tokenStore.token && tokenStore.token.expiry > Date.now()) {
    return tokenStore.token.accessToken;
  }

  tokenStore.token = await getNewAccessToken(clientId, clientSecret, url);
  return tokenStore.token.accessToken;
}

function createService(config) {
  const {
    clientId,
    clientSecret,
    url
  } = config;

  async function requestUserWithToken(token) {
    const response = await fetch(`${url}/me`, {
      headers: {
        Authorization: `bearer ${token}`
      }
    });
    return parseBody(response);
  }

  async function loginUser(code) {
    const userToken = await getUserTokenFromAuthorizationCode(code, clientId, clientSecret, url);
    const user = await requestUserWithToken(userToken.accessToken);
    return {
      user,
      userToken
    };
  }

  function refresh(token) {
    return refreshToken(token);
  }

  return {
    loginUser,
    requestUserWithToken,
    refresh
  };
}

const EXPIRY_MARGIN$1 = 5 * 60 * 1000;
function createController(config) {
  const {
    clientId,
    clientSecret,
    oauthHost,
    defaultScopes = 'username',
    scopeGroups = {},
    refresh = false,
    hooks = {},
    basePath = '/auth',
    errorRedirect = '/',
    key: objectKey = 'user'
  } = config;
  const service = createService(config);

  function determineScopes(options) {
    let scopes = [...defaultScopes];

    if (!options.scopeGroups) {
      return scopes.join(' ');
    }

    const groups = options.scopeGroups.split(',');
    groups.forEach(group => {
      if (scopeGroups[group]) {
        scopes.push(...scoupeGroups[group]);
      }
    });
    return scopes.join(' ');
  }

  function determineAuthMethods(options) {
    let {
      auth_methods = false,
      minimal_assurance_level = 'low',
      context = 'citizen'
    } = options;

    if (auth_methods && auth_methods.length > 0) {
      return auth_methods;
    }

    if (!['citizen', 'enterprise'].includes(context)) {
      console.log(`context ${context} not known, fallback to citizen`);
      context = 'citizen';
    }

    if (!['low', 'substantial', 'high'].includes(minimal_assurance_level)) {
      console.log(`${minimal_assurance_level} not known, fallback to lowest available`); // enterprise does not have low.

      minimal_assurance_level = 'low';
    }

    if (context === 'enterprise' && minimal_assurance_level === 'low') {
      minimal_assurance_level = 'substantial';
    }

    return authMethodsConfig[context][minimal_assurance_level].join(',');
  }

  function createLoginUrl(host, stateKey, options) {
    const query = {
      client_id: clientId,
      redirect_uri: `${host}${basePath}/login/callback`,
      state: stateKey,
      scope: determineScopes(options),
      save_consent: true,
      response_type: 'code',
      auth_methods: determineAuthMethods(options),
      minimal_assurance_level: options.minimal_assurance_level || 'low'
    };

    if (options.lng) {
      query.lng = options.lng;
    }

    Object.keys(query).forEach(key => {
      if (!query[key]) {
        delete query[key];
      }
    });
    return `${oauthHost}/v2/authorize?${qs.stringify(query)}`;
  }

  function createLogoutUrl({
    userId,
    token,
    redirectUri
  }) {
    const data = JSON.stringify({
      user_id: userId,
      access_token: token,
      redirect_uri: redirectUri
    });
    const query = {
      client_id: clientId,
      service: 'astad.aprofiel.v1',
      data: logoutEncrypt(data, clientSecret),
      auth
    };
    return `${oauthHost}/v2/logout/redirect/encrypted?${qs.stringify(query)}`;
  }

  function login(req, res) {
    const host = getHost(req);
    const stateKey = uuid.v4();
    const url = createLoginUrl(host, stateKey, req.query);
    console.log(url);
    req.session[`loginKey`] = stateKey;
    req.session.fromUrl = req.query.fromUrl || '/';
    runHooks(hooks.preLogin, req, res, () => {
      return req.session.save(() => res.redirect(url));
    });
  }

  function isLoggedin(req, res) {
    if (!req.session[objectKey]) {
      return res.json({
        isLoggedin: false
      });
    }

    return res.json({
      isLoggedin: true,
      [objectKey]: req.session[objectKey]
    });
  }

  async function loginCallback(req, res) {
    if (!req.query.code || !req.query.state) {
      return res.redirect(errorRedirect);
    }

    if (req.query.state !== req.session[`loginKey`]) {
      let loginUrl = `${basePath}/login`;
      const fromUrl = req.session.fromUrl;

      if (fromUrl) {
        loginUrl = `${loginUrl}?fromUrl=${fromUrl}`;
      }

      return res.redirect(loginUrl);
    }

    delete req.session[`loginKey`];
    const {
      user,
      userToken
    } = await service.loginUser(req.query.code);
    req.session[objectKey] = user;
    req.session[`${objectKey}Token`] = userToken;
    runHooks(hooks.loginSuccess, req, res, error => {
      if (error) {
        console.log(error);
        return res.redirect(errorRedirect);
      }

      req.session.save(() => res.redirect(req.session.fromUrl || '/'));
    });
  }

  function logoutCallback(req, res) {
    runHooks(hooks.logoutSuccess, req, res, () => {
      delete req.session[objectKey];
      delete req.session[`${objectKey}Token`];
      const tempSession = req.session;
      req.session.regenerate(() => {
        Object.assign(req.session, tempSession);
        req.session.save(() => res.redirect(tempSession.logoutFromUrl || '/'));
      });
    });
  }

  function logout(req, res) {
    const logoutFromUrl = req.query.fromUrl || req.query.fromurl || '/';

    if (!req.session[objectKey]) {
      return res.redirect(logoutFromUrl);
    }

    const token = req.session[`${objectKey}Token`];
    req.session.logoutFromUrl = logoutFromUrl; // used to prevent eventhandler from deleting this application

    req.session.isLogoutOrigin = true;
    const logoutParams = {
      redirectUri: `${helpers.getHost(req)}${basePath}/logout/callback`,
      token: token.accessToken,
      userId: req.session[objectKey].profile.id
    };
    const logoutUrl = createLogoutUrl(logoutParams);
    runHooks(hooks.preLogout, req, res, () => {
      req.session.save(() => res.redirect(logoutUrl));
    });
  }

  function loggedoutEvent(req, res) {
    const {
      headerKey = 'x-logout-token',
      securityHash = '',
      sessionStoreLogoutAdapter: adapter = false
    } = config.logout || {};
    const token = req.get(headerKey) || '';

    if (!adapter) {
      return res.sendStatus(200);
    }

    if (!bcrypt.compareSync(token, securityHash)) {
      return res.sendStatus(401);
    }

    const accessTokenKey = `${objectKey}Token`;
    return adapter(sessionKey, accessTokenKey, req.body).then(() => res.sendStatus(200)).catch(err => res.status(500).json(err));
  }

  async function refreshToken(req, res, next) {
    if (!refresh) {
      return next();
    }

    const tokenKey = `${objectKey}Token`;
    const token = req.session[tokenKey];

    if (new Date(token.expiresIn) >= new Date(Date.now() + EXPIRY_MARGIN$1)) {
      return next();
    }

    const newToken = await service.refresh(token);
    req.session = Object.assign(req.session, {
      [tokenKey]: newToken
    });
    return req.session.save(() => next());
  }

  return {
    login,
    logout,
    logoutCallback,
    isLoggedin,
    loginCallback,
    refreshToken,
    loggedoutEvent
  };
}

function preventBrowserCache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Vary', '*');
  res.header('Pragma', 'no-cache');
  return next();
}
function loadRoutes(app, config) {
  const {
    basePath = '/auth'
  } = config;
  const {
    loginCallback,
    login,
    logout,
    isLoggedin,
    logoutCallback,
    loggedoutEvent,
    refreshToken
  } = createController(config);
  const router = new Router(); // warning printen als trust proxy niet enabled is? of standaard enablen?

  router.get(`${basePath}/login/callback`, preventBrowserCache, loginCallback);
  router.get(`${basePath}/login`, preventBrowserCache, login);
  router.get(`${basePath}/logout`, preventBrowserCache, logout);
  router.get(`${basePath}/isloggedin`, preventBrowserCache, isLoggedin);
  router.get(`${basePath}/logout/callback`, preventBrowserCache, logoutCallback);
  router.post(`${basePath}/event/loggedout`, json(), loggedoutEvent);
  app.use(refreshToken);
  return router;
}

async function getSessions(consentUrl, ssoKey, accessToken) {
  let body;
  let response;

  try {
    response = await fetch$1(`${consentUrl}/sessions/${ssoKey}`, {
      method: 'GET',
      headers: {
        Authorization: `bearer ${accessToken}`
      }
    });
    body = await response.json();
  } catch (e) {
    console.log(e);
    body = {};
    response = response || {};
  }

  if (!response.ok) {
    throw Object.assign(body, {
      status: response.status
    });
  }

  return body;
}

function getFallbackFromUrl(req, port) {
  return `${req.protocol}://${req.hostname}${port ? `:${port}` : ''}${req.originalUrl}`;
}

function getFromUrl(req, port) {
  const rawFromUrl = req.query.fromUrl || req.query.fromurl || getFallbackFromUrl(req, port);
  return encodeURIComponent(rawFromUrl);
}

function getSessionWithAssuranceLevel(sessions, assuranceLevel) {
  return sessions.find(session => session.assuranceLevel === assuranceLevel && !session.authenticationMethod.includes('mprofiel'));
}

function sso(options) {
  const {
    clientId,
    clientSecret,
    key = 'user',
    consentUrl,
    basePath,
    port = false,
    ssoCookieName = 'dgp.auth.ssokey'
  } = options;
  const loginPath = `${basePath}/login`;
  return async (req, res, next) => {
    const cookieHeader = req.get('cookie');

    if (!cookieHeader) {
      return next();
    }

    const cookies = cookieParser.parse(cookieHeader);
    const ssoKey = cookies[ssoCookieName];
    console.log('ssoKey', ssoKey);

    if (!ssoKey) {
      return next();
    }

    const user = req.session[key] || {};
    const assuranceLevel = user.assuranceLevel || 'none';

    if (assuranceLevel === 'high') {
      return next();
    }

    try {
      console.log('consentUrl', consentUrl);
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      console.log('has accesstoken', accessToken);
      const {
        sessions = []
      } = await getSessions(consentUrl, ssoKey, accessToken);

      if (!sessions || sessions.length === 0) {
        return next();
      }

      const baseRedirectUrl = `${loginPath}?fromUrl=${getFromUrl(req, port)}`;
      const highSession = getSessionWithAssuranceLevel(sessions, 'high');

      if (highSession) {
        return res.redirect(`${baseRedirectUrl}&auth_methods=${highSession.authenticationMethod}`);
      }

      if (assuranceLevel === 'substantial') {
        return next();
      }

      const substantialSession = getSessionWithAssuranceLevel(sessions, 'substantial');

      if (substantialSession) {
        return res.redirect(`${baseRedirectUrl}&auth_methods=${substantialSession.authenticationMethod}`);
      }

      if (assuranceLevel !== 'none') {
        return next();
      }

      if (getSessionWithAssuranceLevel(sessions, 'low')) {
        return res.redirect(`${baseRedirectUrl}&auth_methods=iam-aprofiel-userpass`);
      }
    } catch (exception) {
      console.log(exception);
      console.log(exception.cause);
    }

    return next();
  };
}

const REQUIRED_CONFIG_PROPS = ['clientId', 'clientSecret', 'oauthHost'];

function validateConfig(config) {
  REQUIRED_CONFIG_PROPS.forEach(prop => {
    if (config[prop] == null) {
      throw new Error(`${prop} is required config`);
    }
  });
}

const toExport = {
  createRouter: (app, config) => {
    validateConfig(config);
    return loadRoutes(app, config);
  },
  CreateSsoMiddleware: config => {
    validateConfig(config);
    return sso(config);
  }
};

export default toExport;
