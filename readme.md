# digipolis-login

**Note that this is still a work in progress and subject to changes and improvements**

## Setup

Mprofiel-login is implemented as an express router.

Setup as follows:
Ǹote that you should request a contract with mprofile and configure a callback url on the api manager.
```js
const session = require('express-session');
const app = express();
app.use(session({
  secret: 'blabla'
}))
const profileLogin = require('digipolis-mprofiel-login');
// load session with corresponding persistence (postgres, mongo....)
app.use(profileLogin(app, {
  oauthDomain: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  domain: 'http://localhost:' + process.env.PORT,
  baseUrl: // optional, defaults to /api/mprofile when mprofiel, /api/aprofile when aprofiel
  backendRedirect: Boolean // optional, defaults to false.
  errorRedirect: String // optional, defaults to /. Redirect url when logging in fails.
  auth: {
    service: profileLogin.APROFIEL // profileLogin.MPROFIEL (defaults to aprofiel)
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: 'all' // optional, defaults to all
  },
  key: 'aprofiel' // where the user is stored on the session (req.session.aprofiel), defaults to user
  refresh: Boolean // defaults to false
  fetchPermissions: Boolean // should fetch permissions
  applicationName: String // required if fetchPermissions == true, should be name in User management,
  apiKey: String // required if fetchPermissions == true
}));
```

This middleware exposes two routes.
```js
  `${baseUrl}/isloggedin`
  `${baseUrl}/callback`
```

## /isloggedin

The `isloggedin` endpoint can be used to check if a user currently has a session. If a user is logged in, it returns:
```js
{
  isLoggedin: true,
  user: { ... }
}
```
If fetchPermissions is set to `true`, _user.permissions_ contains the permissions (only possible for M-Profiel).  
An optional query `fromUrl` parameter can be provided when requesting the `/isloggedin` route. When the login was successful, the user will be redirected to the root (by default) or to the `fromUrl` parameter.

If no user is logged in, the following format is returned if `backendRedirect` is set to `false`
```js
{
  isLoggedin: false,
  redirectUrl: url // url you can redirect to to login in the application
}
```

If `backendRedirect` is set to `true` the backend attempts a redirect.

## Callback

Endpoint that you should not use manually, is used to return from the identity server and fetches a user corresponding to the login and stores it on the session.

## Refresh

When the `refresh` option is enabled, the following (example) token object will be available on the session:
```js
{
  accessToken: 'D20A4360-EDD3-4983-8383-B64F46221115'
  refreshToken: '469FDDA4-7352-4E3E-A810-D0830881AA02'
  expiresIn: '2020-12-31T23.59.59.999Z'
}
```
The access token will be refreshed automatically.
