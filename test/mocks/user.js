
import nock from 'nock';
import user from './user.json';

export default function nockGetAprofiel(apiHost, status) {
  nock(apiHost)
    .get('/me')
    .reply(status || 200, user);
}

