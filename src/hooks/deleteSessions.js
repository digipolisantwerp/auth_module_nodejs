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
  return async (req, res, next) => {
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
      console.log(clientId, clientSecret);
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      console.log('accesstoken', accessToken);
      await deleteSessions(consentUrl, ssoKey, accessToken);
    } catch (exception) {
      console.log('the exception is here');
      console.log(exception);
    }

    return next();
  };
}