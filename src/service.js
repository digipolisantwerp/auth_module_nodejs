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
    const body = await response.json();

    if (!response.ok) {
      throw body;
    }

    return body;
  }

  async function loginUser(code) {

    const userToken = await getUserTokenFromAuthorizationCode(code, clientId, clientSecret, url);
    const user = await requestUserWithToken(userToken.accessToken);
    return { user, userToken };
  }

  function refresh(token) {
    return refreshToken(token, clientId, clientSecret, url);
  }

  return {
    loginUser,
    requestUserWithToken,
    refresh
  };
}
