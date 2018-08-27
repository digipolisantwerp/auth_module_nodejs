## todo
- token documentatie
- meer uitleg over de hooks
# digipolis-login

Digipolis-login is implemented as an `Express` router. It exposes a couple of endpoints
that can be used in your application to handle the process of logging into a user's 
AProfile, mprofile or eid via oAuth.

## Setup
You should use `express-session` in your application to enable session-storage.
After this step, you can load the `digipolis-login` middleware

`app.use(require('digipolis-login)(app, configuration));`

Be sure to load this middleware before your other routes, otherwise the automatic refresh of the user's token won't work properly.

**Configuration:**

- **oauthHost** *string*: The domain corresponding to the oauth implementation 
  (e.g: https://api-oauth2-o.antwerpen.be').
- **apiHost** *string*: the hostname corresponding to the API gateway (e.g: https://api-gw-o.antwerpen.be).
- **basePath=/auth (optional)** *string*: the basePath which is appended to the exposed endpoints.
- **errorRedirect=/ (optional)** *string*: where to redirect if the login fails (e.g: /login)
- **auth** (credentials can be acquired from the api store)
  - **clientId** *string*: client id of your application
  - **clientSecret** *string*: client secret of your application
  - **apiKey** *string*: required to fetch permissions (not needed otherwise)
- **serviceProviders**: object of the available oauth login services (currently aprofiel & MProfiel). You only need to configure the ones that you need.
  - **aprofiel** (optional if not needed): 
    - **scopes** *string*: The scopes you want of the profile (space separated identifiers)
    - **url** *string*: the url where to fetch the aprofile after the login succeeded
    - **identifier** *string*: the service identifier, used to create login url.
    - **tokenEndpoint** *string*: where the service should get the accesstoken
    - **hooks (optional)**: async execution is supported
      - **authSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of digipolis-login: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
  - **mprofiel** (optional if not needed):
    - **scopes** *string*: the scopes you want for the profile
    - **url** *string*: url where to fetch the profile
    - **fetchPermissions=false** *boolean*: whether to fetch permissions in the User Man. engine
    - **applicationname** *string*: required if permissions need to be fetched 
    - **identifier=astad.mprofiel.v1** *string*: the service identifier, used to create the login url.
     - **tokenEndpoint** *string*: where the service should get the accesstoken
    - **hooks (optional)**: async execution is supported
      - **authSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of digipolis-login: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
  - **eid** (optional if not needed):
    - **scopes** *string*: the scopes you want for the profile
    - **url** *string*: url where to fetch the profile
    - **identifier=acpaas.fasdatastore.v1** *string*: the service identifier, used to create the login url.
     - **tokenEndpoint** *string*: where the service should get the accesstoken
    - **hooks (optional)**: async execution is supported
      - **authSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of digipolis-login: function signature is the same as middleware `(req, res, next)`. these will run after successful login.


## Example implementation
```js
const session = require('express-session');
const app = express();
app.use(session({
  secret: 'blabla'
}))

const profileLogin = require('digipolis-login');
// load session with corresponding persistence (postgres, mongo....)
const authSuccessHook = (req, res, next) => {
  req.session.isEmployee = false;
  if(req.digipolisLogin && req.digipolisLogin.serviceName === 'mprofiel') {
    req.session.isEmployee = true;
  }

  req.session.save(() => next());
} 
app.use(profileLogin(app, {
  oauthHost: 'https://api-oauth2-o.antwerpen.be',
  apiHost: 'https://api-gw-o.antwerpen.be',
  errorRedirect: '/',
  basePath: '/auth',
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    apiKey: 'my-api-string', // required if fetchPermissions == true
  },
  serviceProviders: {
    aprofiel: {
      scopes: '',
      url: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/v1/me',
      identifier:'astad.aprofiel.v1',
      tokenEndpoint: '/astad/aprofiel/v1/oauth2/token',
      hooks: {
        authSuccess: []
      }
    },
    mprofiel: {
      scopes: 'all',
      url: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/v1/me',
      identifier: 'astad.mprofiel.v1',
      fetchPermissions: false,
      applicationName: 'this-is-my-app',
      tokenEndpoint: '/astad/mprofiel/v1/oauth2/token',
      hooks: {
        authSuccess: []
      }
    },
    eid: {
      scopes: 'name nationalregistrationnumber',
      url: 'https://api-gw-o.antwerpen.be/acpaas/fasdatastore/v1/me',
      identifier:'acpaas.fasdatastore.v1',
      tokenEndpoint: '/acpaas/fasdatastore/v1/oauth2/token',
      hooks: {
        authSuccess: []
      }
    },
  }
}));
```

## Session 
Only one kind of profile can be logged in at any given moment. User information is available on `req.session.user`, the access token is available on `req.session.token`

```
{
  accessToken: 'D20A4360-EDD3-4983-8383-B64F46221115'
  refreshToken: '469FDDA4-7352-4E3E-A810-D0830881AA02'
  expiresIn: '2020-12-31T23.59.59.999Z'
}
```
To identify which service is used for the current loggedIn user, you can use 
`req.session.currentServiceProvider`. This property can come in handy in your hooks.
## Available Routes

Each route is prepended with the configured `basePath`, if no basePath is given,
default basePaths will be used. /api/aprofile if the package is used for aprofiel login,
api/mprofile for mprofiel login.


### GET {basePath}/login/{serviceName}?fromUrl={thisiswheretoredirectafterlogin}
This endpoints tries to redirect the user to the login page of the service corresponding to the serviceName (aprofiel, mprofiel).
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

Hooks defined in the `serviceProviders[serviceName].hooks.authSuccess` will be called here.
Session data can be modified in such a hook.

### POST {basePath}/logout

Destroys the session in the application.

