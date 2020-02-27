import cookieParser from 'cookie';
import { getSessions } from '../sessionStore';
import { getAccessToken } from '../accessToken';


function getHighestAssuranceLevelSession(sessions = []) {
  let highestAssuranceLevelSession = {
    assuranceLevel: 'low',
    authenticationMethod: 'iam-aprofiel-userpass'
  };

  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].assuranceLevel === 'high') {
      return sessions[i];
    }

    if (sessions[i].assuranceLevel === 'substantial') {
      highestAssuranceLevelSession = session[i];
    }
  }

  return highestAssuranceLevelSession;
}


export default function createAssuranceLevelAndAuthMethodHook({
  clientId,
  clientSecret,
  consentUrl,
  key = 'user', 
  ssoCookieName = 'dgp.auth.ssokey',
 }) {

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
      const accessToken = await getAccessToken(clientId, clientSecret, consentUrl);
      const { sessions = [] } = await getSessions(consentUrl, ssoKey, accessToken);
      const { assuranceLevel, authenticationMethod } = getHighestAssuranceLevelSession(sessions);
      req.session[key].assuranceLevel = assuranceLevel;
      req.session[key].authenticationMethod = authenticationMethod;

    } catch (e) {
      console.log(e);
    }

    return next();

  }
}