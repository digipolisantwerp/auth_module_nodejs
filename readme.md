## todo
- token documentatie

# digipolis-login

Digipolis-login is implemented as an `Express` router. It exposes a couple of endpoints
that can be used in your application to handle the process of logging into a user's 
AProfile or mprofile via oAuth.

## Setup
You should use `express-session` in your application to enable session-storage.
After this step, you can load the `digipolis-login` middleware

`app.use(require('digipolis-login)(app, configuration));`

Be sure to load this middleware before your other routes, otherwise the automatic refresh of the user's token won't work properly.

**Configuration:**

- **oauthDomain** *string*: The domain corresponding to the oauth implementation 
  (e.g: https://api-oauth2-o.antwerpen.be')
- **apiHost** *string*: the hostname corresponding to the API gateway (e.g: https://api-gw-o.antwerpen.be)
- **domain** *string*: the domain for your own application (e.g.: https://myapp.com or http://localhost:8080),
- **basePath='/auth/aprofile' || '/auth/mprofile'** *string*: the basePath which is appended to the exposed endpoints (e.g: api/auth)
- **errorRedirect** *string*: where to redirect if the login fails (e.g: /login)
- **auth** (credentials can be acquired from the api store)
  - **service='astad.aprofiel.v1'**: 'astad.mprofiel.v1' or 'astad.aprofiel.v1' (exposed via package under APROFIEL, MPROFIEL props)
  - **clientId** *string*: client id of your application
  - **clientSecret** *string*: client secret of your application
  - **scope='all'** *string*: scopes to get for the user
  - **saveConsent** *boolean*: whether the given consent should be saved. default true 
  - **apiKey** *string*: required to fetch permissions (not needed otherwise)
- **key='user'** *string*: where to store the user on your session (e.g.: profile, the user will be stored `req.session.profile`) 
- **refresh=false** *boolean*: whether the oauth access token should be refreshed before expiration
- **fetchPermissions=false** *boolean*: if permissions for the logged in user should be fetched (**ONLY WORKS FOR MPROFILE**)
- **applicationName** *string*: required if fetchPermissions == true, should be the same as the name in user management.

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
  basePath: // optional, defaults to /api/mprofile when mprofiel, /api/aprofile when aprofiel
  backendRedirect: Boolean // optional, defaults to false.
  errorRedirect: String // optional, defaults to /. Redirect url when logging in fails.
  auth: {
    service: profileLogin.APROFIEL // profileLogin.MPROFIEL (defaults to aprofiel)
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: 'all' // optional, defaults to all
    apiKey: String, // required if fetchPermissions == true
  },
  key: 'aprofiel' // where the user is stored on the session (req.session.aprofiel), defaults to user
  refresh: Boolean // defaults to false
  fetchPermissions: Boolean // should fetch permissions
  applicationName: String // required if fetchPermissions == true, should be name in User management,

  hooks: {
    authSuccess: [
      function,
      function 
      function // signature (req, res, next)
    ]
  }
}));
```

## Available Routes

Each route is prepended with the configured `basePath`, if no basePath is given,
default basePaths will be used. /api/aprofile if the package is used for aprofiel login,
api/mprofile for mprofiel login.

### GET {basePath}/login?fromUrl={thisiswheretoredirectafterlogin}
This endpoints tries to redirect the user to the login page of the corresponding service.
(this will not work if the endpoint is called with an AJAX call)

the `fromUrl` query parameter can be used to redirect the user to a given page after login.

### GET {basePath}/login/redirect?fromUrl={thisiswheretoredirectafterlogin}
This endpoints tries to redirect the user to the login page of the corresponding service.
(this will not work if the endpoint is called with an AJAX call)

the `fromUrl` query parameter can be used to redirect the user to a given page
after login.

### GET {basePath}/isloggedin

The `isloggedin` endpoint can be used to check if a user currently has a session. If a user is logged in, it returns:
```js
{
  isLoggedin: true,
  user: { ... }
}
```
If fetchPermissions is set to `true`, `user.permissions` contains the permissions.  

If the user is not logged in, the following payload is returned.
```js
{
  isLoggedin: false
}
```

### GET {basePath}/callback

Endpoint that you should not use manually, is used to return from the identity server and fetches a user corresponding to the login and stores it on the session.

If a redirect url was given through the `fromUrl` in the `login` or `login/redirect` endpoint, the user will be redirected to this url after the callback has executed successfully.


If the callback is does not originate from the login flow triggered from the application,
it will trigger a 401. (this is checked with the state param).

### POST {basePath}/logout

Destroys the session in the application.

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
