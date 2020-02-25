
import { deleteSessions } from '../sessionStore';
import { getAccessToken } from '../accessToken';

export default function getDeleteSessionsHook(options) {
  const {
    clientId,
    clientSecret,
    url,
    consentUrl
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
      const accessToken = await getAccessToken(clientId, clientSecret, url);
      await deleteSessions(consentUrl, ssoKey, accessToken);
    } catch (exception) {
      console.log(exception);
    }

    return next();
  };
}