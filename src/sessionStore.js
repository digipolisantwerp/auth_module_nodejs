
import fetch from 'isomorphic-fetch';

export async function getSessions(consentUrl, ssoKey, accessToken) {
  const response = await fetch(
    `${consentUrl}/sessions/${ssoKey}`,
    {
      method: 'GET',
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw Object.assign(body, { status: response.status });
  }

  return body;
}


export async function deleteSessions(consentUrl, ssoKey, accessToken) {
  const response = await fetch(
    `${consentUrl}/sessions/${ssoKey}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    },
  );

  if(!response.ok) {
    throw new Error('failed to delete sessions');
  }

  return {};
}
