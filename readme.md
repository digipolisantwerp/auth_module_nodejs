## todo
- remove backendRedirect option, als twee endpoints exposen?
- saveConsent in readme
# digipolis-login

Digipolis-login is implemented as an `Express` router. It exposes a couple of endpoints
that can be used in your application to handle the process of logging into a user's 
AProfile or mprofile via oAuth.

## Setup
You should use `express-session` in your application to enable session-storage.
After this step, you can load the `digipolis-login` middleware

`app.use(require('digipolis-login)(app, configuration));`

**Configuration:**

- **oauthDomain** *string*: The domain corresponding to the oauth implementation 
  (e.g: https://api-oauth2-o.antwerpen.be')
- **apiHost** *string*: the hostname corresponding to the API gateway (e.g: https://api-gw-o.antwerpen.be)
- **domain** *string*: the domain for your own application (e.g.: https://myapp.com or http://localhost:8080),
- **baseUrl** *string*: the baseUrl which is appended to the exposed endpoints (e.g: api/auth)
- **errorRedirect** *string*: where to redirect if the login fails (e.g: /login)
- **auth** (credentials can be acquired from the api store)
  - **service**: 'astad.mprofiel.v1' or 'astad.aprofiel.v1' (exposed via package under APROFIEL, MPROFIEL props)
  - **clientId** *string*: client id of your application
  - **clientSecret** *string*: client secret of your application
  - **scope** *string*: scopes to get for the user
- **key** *string*: where to store the user on your session (e.g.: profile, the user will be stored `req.session.profile`) 
- **refresh** *boolean*: whether the oauth access token should be refreshed before expiration
- **fetchPermissions** *boolean*: if permissions for the logged in user should be fetched (**ONLY WORKS FOR MPROFILE**)
- **applicationName** *string*: required if fetchPermissions == true, should be the same as the name in user management.
- **apiKey** *string*: required to fetch permissions (not needed otherwise)
- **hooks**
  - **authSuccess** *array of functions*: function that can be plugged in to modify the behaviour of digipolis-login: function signature is the same as middleware `(req, res, next)`
## Example implementation
```
const session = require('express-session');
const app = express();
app.use(session({
  secret: 'blabla'
}))

const profileLogin = require('digipolis-login');
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
  apiKey: String, // required if fetchPermissions == true
  hooks: {
    authSuccess: [
      function,
      function 
      function // signature (req, res, next)
    ]
  }
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
