const express = require('express');
const session = require('express-session');
// for this to work, run npm run build in the root of this repository
const { createRouter } = require('../..');

const app = express();

const authConfig = {
  basePath: '/auth',
  clientId: process.env.CLIENT_ID || 'your-client-id',
  clientSecret: process.env.CLIENT_SECRET || 'your-client-secret',
  oauthHost: 'https://api-oauth2-o.antwerpen.be',
  fetchAssuranceLevel: false,
  consentUrl: 'https://api-gw-o.antwerpen.be/acpaas/consent/v1',
  scopeGroups: {
    personalInformation: [
      'astad.aprofiel.v1.avatar',
      'astad.aprofiel.v1.email',
    ],
    high: ['crspersoon.nationalnumber'],
  },
  defaultScopes: ['astad.aprofiel.v1.name'],
  url: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1',
  hooks: {
    loginSuccess: [
      (req, res, next) => {
        console.log(req.query);
        req.session.user.hookTest = 'hello';
        return next();
      },
    ],
  },
};

app.use(session({
  secret: 'keyboard cat',
}));

app.enable('trust proxy');
app.use(createRouter(app, authConfig));
app.get('/', (req, res) => {
  res.send(`<pre>${JSON.stringify(req.session, null, 2)}</pre>`);
});

app.listen(2000, () => console.log('listening on port 2000'));
