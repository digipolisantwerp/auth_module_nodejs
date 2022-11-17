import bcrypt from 'bcryptjs';
import qs from 'querystring';
import uuid from 'uuid';
import pino from 'pino';
import getProp from 'lodash.get';

import authMethodsConfig from './authMethods';
import createService from './service';
import { getHost, logoutEncrypt, runHooks } from './helpers';
import createDeleteSessionsHook from './hooks/deleteSessions';
import createAssuranceLevelAndAuthMethodHook from './hooks/assuranceLevelAndAuthMethod';
import createDetermineLoginTypeHook from './hooks/determineLoginType';

const EXPIRY_MARGIN = 5 * 60 * 1000;
export default function createController(config) {
  const {
    basePath = '/auth',
    clientId,
    clientSecret,
    oauthHost,
    defaultScopes = ['aprofiel.username'],
    scopeGroups = {},
    refresh = false,
    hooks = {},
    errorRedirect = '/',
    key: objectKey = 'user',
    logLevel = 'error',
  } = config;

  const logger = pino({
    name: '@digipolis/auth-controller',
    level: logLevel,
  });

  let {
    preLogin: preLoginHooks = [],
    preLogout: preLogoutHooks = [],
    loginSuccess: loginSuccessHooks = [],
    logoutSuccess: logoutSuccessHooks = [],
  } = hooks;


  loginSuccessHooks.push(
    createAssuranceLevelAndAuthMethodHook(config),
    createDetermineLoginTypeHook(config)
  );

  logoutSuccessHooks.push(createDeleteSessionsHook(config));


  const service = createService(config);

  function determineScopes(options) {
    let scopes = [...defaultScopes];
    if (!options.scopeGroups) {
      return scopes.join(' ');
    }

    const groups = Array.isArray(options.scopeGroups) ? scopeGroups : options.scopeGroups.split(',');
    groups.forEach(group => {
      if (scopeGroups[group]) {
        scopes.push(...scopeGroups[group]);
      }
    })
    return scopes.join(' ');
  }

  function determineAuthMethods(options) {
    let {
      auth_methods = false,
      minimal_assurance_level = 'low',
      context = 'citizen'
    } = options;

    if (auth_methods && auth_methods.length > 0) {
      auth_methods = auth_methods.replace('astad.aprofiel.v1', 'iam-aprofiel-userpass');
      return auth_methods;
    }

    if (!['citizen', 'enterprise', 'enterprise-citizen'].includes(context)) {
      logger.info(`context ${context} not known, fallback to citizen`);
      context = 'citizen';
    }

    if (!['low', 'substantial', 'high'].includes(minimal_assurance_level)) {
      logger.info(`${minimal_assurance_level} not known, fallback to lowest available`);
      minimal_assurance_level = 'low';
    }

    // enterprise does not have low.
    if (['enterprise', 'enterprise-citizen'].includes(context) && minimal_assurance_level === 'low') {
      minimal_assurance_level = 'substantial';
    }

    return authMethodsConfig[context][minimal_assurance_level].join(',');
  }

  function createLoginUrl(host, stateKey, options) {
    const fallbackAssuranceLevel = options.context === 'enterprise' ? 'substantial' : 'low';
    const { save_consent = true, force_auth = false } = options;
    const query = {
      client_id: clientId,
      redirect_uri: `${host}${basePath}/login/callback`,
      state: stateKey,
      scope: determineScopes(options),
      save_consent,
      response_type: 'code',
      auth_methods: determineAuthMethods(options),
      minimal_assurance_level: options.minimal_assurance_level || fallbackAssuranceLevel
    }

    if (options.lng) {
      query.lng = options.lng;
    }

    if(force_auth) {
      query.force_auth = true;
    }

    Object.keys(query).forEach(key => {
      if (query[key] == null) {
        delete query[key];
      }
    });

    return `${oauthHost}/v2/authorize?${qs.stringify(query)}`;
  }

  function createLogoutUrl({ userId, token, redirectUri, authenticationMethod = 'iam-aprofiel-userpass' }) {

    const data = JSON.stringify({
      user_id: userId,
      access_token: token,
      redirect_uri: redirectUri
    });

    const query = {
      client_id: clientId,
      authenticationMethod,
      data: logoutEncrypt(data, clientSecret),
    };

    return `${oauthHost}/v2/logout/redirect/encrypted?${qs.stringify(query)}`;
  }

  function login(req, res) {
    const host = getHost(req);
    const stateKey = uuid.v4();
    const url = createLoginUrl(host, stateKey, req.query);
    req.session[`loginKey`] = stateKey;
    req.session.fromUrl = req.query.fromUrl || '/';
    runHooks(preLoginHooks, req, res, () => {
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
    logger.debug('login callback triggered');
    if (!req.query.code || !req.query.state) {
      logger.error(`code or state not in query params`);
      return res.redirect(errorRedirect);
    }

    if (req.query.state !== req.session[`loginKey`]) {
      logger.error(`state ${req.query.state} does not match loginKey ${req.session['loginKey']}`);
      let loginUrl = `${basePath}/login`;
      const fromUrl = req.session.fromUrl;
      if (fromUrl) {
        loginUrl = `${loginUrl}?fromUrl=${fromUrl}`;
      }
      return res.redirect(loginUrl);
    }


    delete req.session[`loginKey`];

    try {
      logger.debug('fetch user with code');
      const { user, userToken } = await service.loginUser(req.query.code);
      req.session[objectKey] = user;
      req.session[`${objectKey}Token`] = userToken;
      logger.debug('run hooks');
      runHooks(loginSuccessHooks, req, res, (error) => {
        if (error) {
          logger.error(error);
          return res.redirect(errorRedirect);
        }

        const username = getProp(user, 'dataSources.aprofiel.username');
        logger.debug(`finished hooks, redirecting ${username} to ${req.session.fromUrl || '/'}`);
        req.session.save(() => res.redirect(req.session.fromUrl || '/'));
      });
    } catch (err) {
      logger.error(err, 'error during logincallback');
      return res.redirect(errorRedirect);
    }

  }

  function logoutCallback(req, res) {
    runHooks(logoutSuccessHooks, req, res, () => {
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

    const token = req.session[`${objectKey}Token`]
    req.session.logoutFromUrl = logoutFromUrl;
    // used to prevent eventhandler from deleting this application
    req.session.isLogoutOrigin = true;
    const logoutParams = {
      redirectUri: `${getHost(req)}${basePath}/logout/callback`,
      token: token.accessToken,
      userId: req.session[objectKey].profile.id,
      authenticationMethod: req.session[objectKey].authenticationMethod
    };
    const logoutUrl = createLogoutUrl(logoutParams);
    runHooks(preLogoutHooks, req, res, () => {
      req.session.save(() => res.redirect(logoutUrl));
    });
  }

  async function loggedoutEvent(req, res) {
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
    try {
      await adapter(objectKey, accessTokenKey, req.body);
      return res.sendStatus(200);
    } catch (err) {
      console.log('error during logout event', err);
      return res.status(500).json(err);
    }
  }

  async function refreshToken(req, res, next) {

    if (!refresh) {
      return next();
    }

    const tokenKey = `${objectKey}Token`;
    const token = req.session[tokenKey];
    if (!token) {
      return next();
    }

    if (new Date(token.expiresIn) >= new Date(Date.now() + EXPIRY_MARGIN)) {
      return next();
    }

    const newToken = await service.refresh(token);
    req.session = Object.assign(req.session, { [tokenKey]: newToken });
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
  }
}
