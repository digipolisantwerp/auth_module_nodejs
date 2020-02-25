import cookieParser from 'cookieparser';
import { getSessions } from '../sessionStore';


function getHighestAssuranceLevel(sessions = []) {
  let highestAssuranceLevel = 'low';

  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].assuranceLevel === 'high') {
      return 'high';
    }

    if (sessions[i].assuranceLevel === 'substantial') {
      highestAssuranceLevel = 'substantial';
    }
  }

  return highestAssuranceLevel;
}


export default function createAssuranceLevelHook({key = 'user', ssoCookieName = 'dgp.auth.ssokey', consentUrl}) {
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
      const assuranceLevel = getHighestAssuranceLevel(sessions);
      req.session[key].assuranceLevel = assuranceLevel;
    } catch (e) {
      console.log(e);
    }

    return next();

  }
}