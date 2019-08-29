# @digipolis/auth

@digipolis/auth is implemented as an `Express` router. It exposes a couple of endpoints
that can be used in your application to handle the process of logging into a user's
AProfile, mprofile or eid via oAuth.

## Setup
You should use `express-session` in your application to enable session-storage.
After this step, you can load the `@digipolis/auth` middleware

```js
app.use(require('@digipolis/auth')(app, configuration));
```

Be sure to load this middleware before your other routes, otherwise the automatic refresh of the user's token won't work properly.

Also set the `trust proxy` application variable to `true`. Otherwise the callback URL might be constructed with protocol `http` instead of `https`.

```js
// Trust proxy to make sure the @digipolis/auth module can construct the correct OAuth2 callback URL
app.enable('trust proxy');
```

### API Store configuration

For this module to fully work, some configuration on the API store is required.
After creating your application on the api store, you should create a contract with the Aprofiel/Mprofiel API.

![Create Contract](/assets/create-contract.png "Create contract")

The next step is to navigate to your applications and clicking on actions

![actions](/assets/oauth-config.png "actions")


Click on oauth2 config. You'll find your clientId and secret here.

![configure callback](/assets/callback.png "callback")

You'll need to configure your callback path here
normally, it will be `<protocol>://<your-domain>/auth/login/callback`
(this module exposes  this endpoint)

**Unless you configured a custom redirectUri. in this case, you should enter this one**

### Event Handler configuration (only needed for Single log out)

Navigate to the eventhandler and go to the oauth namespace
![oauth namespace](/assets/oauth-namespace.png "oauth namespace")

Click on the topic related to your login methodology and click on + (add subscription)
![add subscription](/assets/add-subscription.png "add  subscription")

Configure your endpoint with the correct params:

![subscription configuration](/assets/sub-config.png "subscription configuration")
the push url is `<protocol>://<hostname>{basePath}/event/loggedout/{service}`
(basePath defaults to auth).

You should add a custom header which corresponds to the headerKey in your logout configuration (defaults to `x-logout-token`). Add your token.
(this token will not be known to your application, only the hashed version)

save your subscription.



### Module Configuration

- **oauthHost** *string*: The domain corresponding to the oauth implementation
  (e.g: https://api-oauth2-o.antwerpen.be').
- **apiHost** *string*: the hostname corresponding to the API gateway (e.g: https://api-gw-o.antwerpen.be).
- **basePath=/auth (optional)** *string*: the basePath which is appended to the exposed endpoints.
- **errorRedirect=/ (optional)** *string*: where to redirect if the login fails (e.g: /login)
- **logout** (optional, but needed for SLO with the event handler)
  - **headerKey** *string*: the name of the http header where the key is located (defaults to `x-logout-token`)
  - **securityHash** *string* bcrypt hash of the token that will be placed in the http header.
  - **sessionStoreLogoutAdapter** *Function*: function that returns a promise when the sessionStore has been successfully updated and rejects otherwise. This adapter is responsible for  removing the session. [More information](#creating-and-using-sessionstorelogoutadapters)
- **auth** (credentials can be acquired from the api store)
  - **clientId** *string*: client id of your application
  - **clientSecret** *string*: client secret of your application
  - **apiKey** *string*: required to fetch permissions (not needed otherwise)
- **serviceProviders**: object of the available oauth login services (currently aprofiel & MProfiel). You only need to configure the ones that you need.
  - **aprofiel** (optional if not needed):
    - **scopes** *string*: The scopes you want of the profile (space separated identifiers)
    - **url** *string*: the url where to fetch the aprofile after the login succeeded
    - **identifier** *string*: the service identifier, used to create login url.
    - **tokenUrl** *string*: where the service should get the accesstoken
    - **redirectUri (optional)** *string*: custom redirect callback uri, do not use unless absolutely necessary
    - **refresh** *boolean*: whether or not to refresh the access token (experimental)
    - **key=user** *string*: the key under the session (e.g. key=profile => req.session.profile)
    - **hooks (optional)**: async execution is supported
      - **loginSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of @digipolis/auth: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
      - **logoutSuccess** *array of functions*: hooks that are triggered when logout is successful

  - **mprofiel** (optional if not needed):
    - **scopes** *string*: the scopes you want for the profile
    - **url** *string*: url where to fetch the profile
    - **key=user** *string*: the key under the session (e.g. key=profile => req.session.profile)
    - **fetchPermissions=false** *boolean*: whether to fetch permissions in the User Man. engine
    - **applicationname** *string*: required if permissions need to be fetched
    - **authenticationType=form** *string*: `form` or `so`, can be used together, see example
    - **identifier=astad.mprofiel.v1** *string*: the service identifier, used to create the login url.
     - **tokenUrl** *string*: where the service should get the accesstoken
     - **redirectUri (optional)** *string*: custom redirect callback uri
     - **refresh** *boolean*: whether or not to refresh the access token (experimental)
    - **hooks (optional)**: async execution is supported
      - **loginSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of @digipolis/auth: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
      - **logoutSuccess** *array of functions*: hooks that are triggered when logout is successful
  - **eid** (optional if not needed):
    - **scopes** *string*: the scopes you want for the profile
    - **url** *string*: url where to fetch the profile
    - **key=user** *string*: the key under the session (e.g. key=profile => req.session.profile)
    - **identifier=acpaas.fasdatastore.v1** *string*: the service identifier, used to create the login url.
    - **tokenUrl** *string*: where the service should get the accesstoken
    - **redirectUri (optional)** *string*: custom redirect callback uri
    - **refresh** *boolean*: whether or not to refresh the access token (experimental)
    - **hooks (optional)**: async execution is supported
      - **loginSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of @digipolis/auth: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
      - **logoutSuccess** *array of functions*: hooks that are triggered when logout is successful

### Authentication 2.0
If you want to use authentication 2.0 you can do so by adding `version: 'v2'` to your config and add the necessary config.

  - **auth2aprofiel** (optional if not needed):
    - **version** *string*: authentication version you want to use. Defaults to v1.
    - **minimalAssuranceLevel** *string*: Minimal Assurance Level. For now we only support `low` and `substantial`.
    - **authMethods** *string*: the authentication methods you want to allow. (e.g. `iam-aprofiel-userpass` for simple username/password based authentication) 
    - **scopes** *string*: the scopes you want for the profile
    - **url** *string*: url where to fetch the profile
    - **key=user** *string*: the key under the session (e.g. key=profile => req.session.profile)
    - **tokenUrl** *string*: where the service should get the accesstoken
    - **redirectUri (optional)** *string*: custom redirect callback uri
    - **refresh** *boolean*: whether or not to refresh the access token (experimental)
    - **hooks (optional)**: async execution is supported
      - **loginSuccess**  *array of functions*: function that can be plugged in to modify the behaviour of @digipolis/auth: function signature is the same as middleware `(req, res, next)`. these will run after successful login.
      - **logoutSuccess** *array of functions*: hooks that are triggered when logout is successful

Concerning the authentication methods, we support:
| Name                  | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| fas-citizen-bmid      | Belgian Mobile ID (e.g. Itsme)                                 |
| fas-citizen-eid       | Authentication with eID-card and pin-code                      |
| fas-citizen-otp       | Authentication with one time password      (e.g. sms)          |
| fas-citizen-totp      | Time-based one time password   (e.g. Google Authenticator)     |
| iam-aprofiel-userpass | Our default aprofiel authentication with username and password |

#### Authentication 2.0 example config
```js
    auth2eid: {
      version: 'v2',
      scopes: 'astad.aprofiel.v1.username astad.aprofiel.v1.name astad.aprofiel.v1.avatar astad.aprofiel.v1.email astad.aprofiel.v1.phone crspersoon.givenName',
      url: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1/me',
      key: 'auth2eid',
      authMethods: 'fas-citizen-bmid,fas-citizen-totp,fas-citizen-otp,iam-aprofiel-userpass',
      minimalAssuranceLevel: 'low',
      tokenUrl: 'https://api-gw-o.antwerpen.be/acpaas/shared-identity-data/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: []
      }
    }
```

## Creating and using SessionStoreLogoutAdapters

Your sessionstore can be backed by your server's memory or a database system like postgres, mongodb. Because we have no generic way to query each type of store,
we introduce the concept of adapters.

`function adapter(sessionKey: String, accessTokenKey: String, userInformation: Object): Promise`

An adapter should return a promise which resolves if it succeeds in altering the session or rejects when it fails.

It has 3 arguments:

- **sessionKey**: this is the key under which your user is stored in the session (this is the same as the key property in your serviceProvider, defaults to `user`). essentially,
this is the property that should be removed from your session to remove the user's information
- **accessTokenKey**:  this is the key of the accessToken property inside your session, which should also be removed.
- **userInformation**: this is an object that contains the information of the user that has been loggedout.
  - **user**: the id of the user,
  - **timestamp**: timestamp of logout. Could be used to ignore the request if the logout was long ago.


### Available adapters
Existing adapters will be added here.

### Example of an adapter implementation 
```
// this is a non functional example,
function createAdapter(options) {
  const {
    connectionString
  } = options;

  const db = createConnection(connectionString);

  return function adapter(sessionKey, accessTokenKey, userInformation) {
    return new Promise((resolve, reject) => {
          const session = db.query({
        [`session.${sessionKey}.id]: userInformation.user
    });

     // alter record and resave or do it in one query.
     // be aware that multiple sessions could have the same userId,
     // maybe we should also check whether the session is currently valid.

      return resolve();
    })
  }

  const authConfig = require(./authConfig);

  const adapter = createAdapter({
    connectionString: process.env.connectionString
  });

  Object.assign(authConfig, {
    logout: {
      adapter,
      securityHash: 'blabla
    }
  });
}
```

## Example implementation
```js
const session = require('express-session');
const app = express();
app.use(session({
  secret: 'blabla'
}))

const profileLogin = require('@digipolis/auth');
// load session with corresponding persistence (postgres, mongo....)
const loginSuccessHook = (req, res, next) => {
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
      tokenUrl: 'https://api-gw-o.antwerpen.be/astad/aprofiel/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: []
      }
    },
    mprofiel: {
      scopes: 'all',
      url: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/v1/me',
      identifier: 'astad.mprofiel.v1',
      fetchPermissions: false,
      applicationName: 'this-is-my-app',
      tokenUrl: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: []
      }
    },
    mprofiel-so: {
      scopes: 'all',
      url: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/v1/me',
      identifier: 'astad.mprofiel.v1',
      fetchPermissions: false,
      applicationName: 'this-is-my-app',
      authenticationType: 'so'
      tokenUrl: 'https://api-gw-o.antwerpen.be/astad/mprofiel/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: []
      }
    },
    eid: {
      scopes: 'name nationalregistrationnumber',
      url: 'https://api-gw-o.antwerpen.be/acpaas/fasdatastore/v1/me',
      key: 'eid'
      identifier:'acpaas.fasdatastore.v1',
      tokenUrl: 'https://api-gw-o.antwerpen.be//acpaas/fasdatastore/v1/oauth2/token',
      hooks: {
        loginSuccess: [],
        logoutSuccess: []
      }
    },
  }
}));
```

## Session
Multiple profile can be logged in at the same time, if a key is configured inside the serviceProvider configuration. If no key is given, the default key `user` (`req.session.user`) is used, and the possibility exists that a previous user is overwritten by another when logging in.

The token can be found under `req.session.userToken` if the default key is used, otherwise it can be found under `req.session[configuredKey + Token]` e.g: token configured is `aprofiel` , the access token will be found under `req.session.aprofielToken`
```
{
  accessToken: 'D20A4360-EDD3-4983-8383-B64F46221115'
  refreshToken: '469FDDA4-7352-4E3E-A810-D0830881AA02'
  expiresIn: '2020-12-31T23.59.59.999Z'
}
```

## Available Routes

Each route is prepended with the configured `basePath`, if no basePath is given,
default basePath `auth` will be used.


### GET {basePath}/login/{serviceName}?fromUrl={thisiswheretoredirectafterlogin}&lng={language}
This endpoints tries to redirect the user to the login page of the service corresponding to the serviceName (aprofiel, mprofiel, eid).
(this will not work if the endpoint is called with an AJAX call)

the `fromUrl` query parameter can be used to redirect the user to a given page
after login.

the `lng` query parameter can be used to define the language. Currently supported: `nl`, `de`, `fr` and `en`

### GET {basePath}/isloggedin

The `isloggedin` endpoint can be used to check if the user is currently loggedIn in any of the configured services if he is logged in in some services, the following payload will be returned:
```js
{
  isLoggedin: true,
  user: { ... },
  mprofiel: {...} // this corresponds to the key that is configured in the serviceProvider
}
```

If the user is not logged in in any of the services, the following payload is returned.
```js
{
  isLoggedin: false
}
```

### GET {basePath}/isloggedin/{service}

check whether the user is logged in in the specified service. If he is logged in:

{
  isLoggedin: true,
  [serviceKey]: {...} // this corresponds to the key that is configured in the serviceProvider, defaults to user
}
```

If the user is not logged in int the service, the following payload is returned.
```js
{
  isLoggedin: false
}
```

### GET {basePath}/login/callback

Endpoint that you should not use manually, is used to return from the identity server and fetches a user corresponding to the login and stores it on the session.

If a redirect url was given through the `fromUrl` in the `login`  endpoint, the user will be redirected to this url after the callback has executed successfully.

If the callback is does not originate from the login flow triggered from the application,
it will trigger a 401. (this is checked with the state param).

Hooks defined in the `serviceProviders[serviceName].hooks.loginSuccess` will be called here.
Session data can be modified in such a hook.

### GET {basePath}/logout/{service}?fromUrl={thisiswheretoredirectafterlogout}

Redirects the user to the logout for the specified service. This will cause the session to be destroyed on the IDP.

the `fromUrl` query parameter can be used to redirect the user to a given page
after logout.

### GET {basePath}/logout/callback/{service}

Cleans up the session after the initial logout.

### POST {basePath}/event/loggedout/{service}

Endpoint which can be used to logout events from the eventhandler. This is used to remove a user's session when the user has logged out in an other application.

