import cookieParser from 'cookie';

import { getSessions } from '../sessionStore';
import { getAccessToken } from '../accessToken';


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

export default function sso(options) {
  const {
    clientId,
    clientSecret,
    key = 'user',
    consentUrl,
    basePath = '/auth',
    port = false,
    ssoCookieName = 'dgp.auth.ssokey',
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


    if(assuranceLevel === 'high') {
      return next();
    }

    try {
      console.log('consentUrl', consentUrl);
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      console.log('has accesstoken', accessToken);
      const { sessions = [] } = await getSessions(consentUrl, ssoKey, accessToken);

      if (!sessions || sessions.length === 0) {
        return next();
      }

      const baseRedirectUrl = `${loginPath}?fromUrl=${getFromUrl(req, port)}`;

      const highSession = getSessionWithAssuranceLevel(sessions, 'high');
      if(highSession) {
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
  }
}

