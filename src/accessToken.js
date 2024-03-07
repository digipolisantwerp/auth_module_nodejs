import { OAuth2 } from 'oauth';
import pino from 'pino';

const tokenStore = {};
const ACCESS_TOKEN_PATH = '/oauth2/token';
const EXPIRY_MARGIN = 1000 * 60 * 5; // 5 minute margin

const logger = pino({
  name: '@digipolis/auth-accesstoken',
  level: 'error',
});

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
        logger.error('An error occurred while getting new access token with client credentials', err);
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
          logger.error('An error occurred while getting new access token with authorization code', err);
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
          logger.error('An error occurred while getting new access token with refresh token', err);
          return reject(err);
        }

        const userToken = createUserToken(results, refreshToken);
        return resolve(userToken);
      },
    );
  });
}

export async function getAccessToken(clientId, clientSecret, url) {
  try {
    if (tokenStore.token && tokenStore.token.expiresIn > Date.now()) {
      return tokenStore.token.accessToken;
    }

    tokenStore.token = await getNewAccessToken(clientId, clientSecret, url);
    return tokenStore.token.accessToken;
  } catch (error) {
    logger.error('An error occurred while getting new access token', error);
    return null;
  }
}
