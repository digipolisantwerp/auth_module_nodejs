import cookieParser from 'cookie';
import pino from 'pino';

import { getSessions } from '../sessionStore';
import { getAccessToken } from '../accessToken';
import { isValidCallbackUrl } from '../util/isValidCallbackUrl';

function getFallbackFromUrl(req, port) {
  return `${req.protocol}://${req.hostname}${port ? `:${port}` : ''}${req.originalUrl}`;
}

function getFromUrl(req, port, allowedDomains) {
  if (
    (!req.query.fromUrl && !req.query.fromurl)
    || !isValidCallbackUrl(req.query.fromUrl || req.query.fromurl, allowedDomains)
  ) {
    return encodeURIComponent(getFallbackFromUrl(req, port));
  }

  return encodeURIComponent(req.query.fromUrl || req.query.fromurl);
}

function getSessionWithAssuranceLevel(sessions, assuranceLevel) {
  return sessions.find((session) => session.assuranceLevel === assuranceLevel && !session.authenticationMethod.includes('mprofiel'));
}

export default function sso(options) {
  const {
    clientId,
    clientSecret,
    consentUrl,
    key = 'user',
    basePath = '/auth',
    logLevel = 'error',
    port = false,
    ssoCookieName = 'dgp.auth.ssokey',
    shouldUpgradeAssuranceLevel = true,
    allowedDomains,
  } = options;

  const loginPath = `${basePath}/login`;
  const logger = pino({
    name: '@digipolis/auth-sso-middleware',
    level: logLevel,
  });
  return async (req, res, next) => {
    const cookieHeader = req.get('cookie');
    if (!cookieHeader) {
      return next();
    }

    // if we already have a session && we do not need assurance levels, do nothing
    if (req.session[key] && !shouldUpgradeAssuranceLevel) {
      return next();
    }

    const cookies = cookieParser.parse(cookieHeader);
    const ssoKey = cookies[ssoCookieName];
    if (!ssoKey) {
      return next();
    }

    const user = req.session[key] || {};
    const assuranceLevel = user.assuranceLevel || 'none';

    if (assuranceLevel === 'high') {
      return next();
    }

    try {
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      const { sessions = [] } = await getSessions(consentUrl, ssoKey, accessToken);
      logger.debug({ sessions });
      if (!sessions || sessions.length === 0) {
        return next();
      }

      const baseRedirectUrl = `${loginPath}?fromUrl=${getFromUrl(req, port, allowedDomains)}`;
      const highSession = getSessionWithAssuranceLevel(sessions, 'high');

      if (highSession) {
        logger.debug(`redirect with ${highSession.authenticationMethod}`);
        return res.redirect(`${baseRedirectUrl}&auth_methods=${highSession.authenticationMethod}`);
      }

      if (assuranceLevel === 'substantial') {
        return next();
      }

      const substantialSession = getSessionWithAssuranceLevel(sessions, 'substantial');
      if (substantialSession) {
        logger.debug(`redirect with ${substantialSession.authenticationMethod}`);
        return res.redirect(`${baseRedirectUrl}&auth_methods=${substantialSession.authenticationMethod}`);
      }

      if (assuranceLevel !== 'none') {
        return next();
      }

      const lowSession = getSessionWithAssuranceLevel(sessions, 'low');
      if (lowSession) {
        return res.redirect(`${baseRedirectUrl}&auth_methods=iam-aprofiel-userpass`);
      }
    } catch (exception) {
      logger.error(exception);
    }

    return next();
  };
}
