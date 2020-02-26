import cookieParser from 'cookieparser';
import { getSessions } from '../sessionStore';


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


export default function createAssuranceLevelAndAuthMethodHook({key = 'user', ssoCookieName = 'dgp.auth.ssokey', consentUrl}) {
  return async (req, res, next) => {
    const { accessToken = false } = req.session[`${key}Token`] || {};
    if (!accessToken) {
      return next();
    }

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
      const { sessions = [] } = await getSessions(consentUrl, ssoKey, token.accessToken);
      const {assuranceLevel, authenticationMethod } = getHighestAssuranceLevelSession(sessions);
      req.session[key].assuranceLevel = assuranceLevel;
      req.session[key].authenticationMethod = authenticationMethod;

    } catch (e) {
      console.log(e);
    }

    return next();

  }
}