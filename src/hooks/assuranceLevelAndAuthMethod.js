import cookieParser from 'cookie';
import { getSessions } from '../sessionStore';
import assuranceLevelMapping from './authMethodAssuranceLevelMapping';


export default function createAssuranceLevelAndAuthMethodHook({
  key = 'user',
}) {

  return (req, res, next) => {
    let {
      method,
    } = req.query;
    if (method === 'astad.aprofiel.v1') {
      method = 'iam-aprofiel-userpass'
    }
    req.session[key].assuranceLevel = assuranceLevelMapping[method] || 'low';
    req.session[key].authenticationMethod = method || 'iam-aprofiel-userpass';

    return next();
  }
}
