import nock from 'nock';
import config from './correctConfig';

export function nockGetSessions({ssoKey, status = 200, payload = {}}) {
  nock(config.consentUrl)
    .get(`/sessions/${ssoKey}`)
    .reply(status, payload )
}

export function nockDeleteSessions({ssoKey, status = 200}) {
  nock(config.consentUrl)
    .delete(`/sessions/${ssoKey}`)
    .reply(status);
}