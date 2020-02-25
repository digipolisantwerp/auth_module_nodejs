
import fetch from 'isomorphic-fetch';

export async function getSessions(consentUrl, ssoKey, accessToken) {
  let body;
  let response;

  try {
    response = await fetch(
      `${consentUrl}/sessions/${ssoKey}`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${accessToken}`,
        },
      },
    );

    body = await response.json();
  } catch (e) {
    console.log(e);
    body = {};
    response = response || {};
  }

  if (!response.ok) {
    throw Object.assign(body, { status: response.status });
  }

  return body;
}


export async function deleteSessions(consentUrl, ssoKey, accessToken) {
  let body;
  let response;

  try {
    response = await fetch(
      `${consentUrl}/sessions/${ssoKey}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `bearer ${accessToken}`,
        },
      },
    );

    body = await response.json();
  } catch (e) {
    body = {};
    response = response || {};
  }

  if (!response.ok) {
    throw Object.assign(body, { status: response.status });
  }

  return body;
}
