import cookieParser from 'cookie';
import { deleteSessions } from '../sessionStore';
import { getAccessToken } from '../accessToken';

export default function createDeleteSessionsHook(options) {
  const {
    clientId,
    clientSecret,
    consentUrl,
    ssoCookieName = 'dgp.auth.ssokey',
  } = options;
  return async (req, _res, next) => {
    const cookieHeader = req.get('cookie');

    if (!cookieHeader) {
      return next();
    }

    const cookies = cookieParser.parse(cookieHeader);
    const ssoKey = cookies[ssoCookieName];
    if (!ssoKey) {
      return next();
    }

    try {
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      await deleteSessions(consentUrl, ssoKey, accessToken);
    } catch (exception) {
      next(exception);
    }

    return next();
  };
}
