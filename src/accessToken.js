import { OAuth2 } from 'oauth';

const tokenStore = {};
const ACCESS_TOKEN_PATH = '/oauth2/token';
const EXPIRY_MARGIN = 1000 * 60 * 5; // 5 minute margin

function createUserToken(results, refreshToken) {
  return {
    accessToken: results.access_token,
    refreshToken,
    expiresIn: new Date(new Date().getTime() + (results.expires_in * 1000) - EXPIRY_MARGIN),
    isRefreshing: false,
  };
}

function getNewAccessToken(clientId, clientSecret, url) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);
  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken('', { grant_type: 'client_credentials' }, (err, accessToken, _refreshToken, results) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        accessToken,
        expiresIn: Date.now() + (results.expires_in * 1000) - EXPIRY_MARGIN,
      });
    });
  });
}

export function getUserTokenFromAuthorizationCode(code, clientId, clientSecret, url) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);

  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken(
      code,
      { grant_type: 'authorization_code' },
      (err, _accessToken, refreshToken, results) => {
        if (err) {
          return reject(err);
        }

        const userToken = createUserToken(results, refreshToken);
        return resolve(userToken);
      },
    );
  });
}

export function refreshAccessToken(token, clientId, clientSecret, url) {
  const oauth2 = new OAuth2(clientId, clientSecret, url, null, ACCESS_TOKEN_PATH);
  return new Promise((resolve, reject) => {
    oauth2.getOAuthAccessToken(
      token.refreshToken,
      { grant_type: 'refresh_token' },
      (err, _accessToken, refreshToken, results) => {
        if (err) {
          return reject(err);
        }

        const userToken = createUserToken(results, refreshToken);
        return resolve(userToken);
      },
    );
  });
}

export async function getAccessToken(clientId, clientSecret, url) {
  if (tokenStore.token && tokenStore.token.expiresIn > Date.now()) {
    return tokenStore.token.accessToken;
  }

  tokenStore.token = await getNewAccessToken(clientId, clientSecret, url);
  return tokenStore.token.accessToken;
}
