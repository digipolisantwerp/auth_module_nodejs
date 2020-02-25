import { parseBody } from './helpers';
import { getUserTokenFromAuthorizationCode, refreshToken } from './accessToken';

export default function createService(config) {
  const {
    clientId,
    clientSecret,
    url,
  } = config;

  async function requestUserWithToken(token) {
    const response = await fetch(
      `${url}/me`,
      {
        headers: {
          Authorization: `bearer ${token}`
        }
      }
    );

    return parseBody(response);
  }

  async function loginUser(code) {

    const userToken = await getUserTokenFromAuthorizationCode(code, clientId, clientSecret, url);
    const user = await requestUserWithToken(userToken.accessToken);

    return { user, userToken };
  }

  function refresh(token) {
    return refreshToken(token);
  }

  return {
    loginUser,
    requestUserWithToken,
    refresh
  };
}
