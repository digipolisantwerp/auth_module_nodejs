# @digipolis/auth

This package contains two components:

1. a router which exposes a couple of endpoints which can be used to implement login in your application.
2. A middleware that can be used to enable single sign-on (SSO) between different apps inside the antwerp/digipolis ecosystem.

In this version aprofiel with assurance levels and different authentication methods is supported (for mprofiel support, check out version 1.X.X).

## Setup

You should use `express-session` in your application to enable session storage.

Be sure to load this middleware before other routes in your application, this enables the automatic refresh of the user's access token.

`trust proxy` should also be set to true to enable automatic generation of the applications login callback.

### Basic example

```js
import {
  createRouter, 
  createSSOMiddleware
} from '@digipolis/auth';
import Express from 'express';
import Session from 'express-session';

const app = new Express();
app.use(Session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.enable('trust proxy');


const authConfig = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  oauthHost: 'https://api-oauth2-a.antwerpen.be',
  basePath: '/auth',
  defaultScopes: [
    'astad.aprofiel.v1.name',
    'astad.aprofiel.v1.avatar',
    'astad.aprofiel.v1.email',
  ],
  scopeGroups: {
    address: ['crspersoon.housenumber', 'crspersoon.streetname'],
    personal: ['crspersoon.nationalnumber', 'crspersoon.nationality']
  },
  url: 'https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1' ,
  consentUrl: 'https://api-gw-a.antwerpen.be/acpaas/consent/v1',
};


// This exposes endpoints to enable login 
app.use(createRouter(app, authConfig));

// This middleware enables SSO
const sso = createSSOMiddleware(authConfig);

// The sso middleware should be used where you serve your application
// it relies on redirects, which cannot be used with ajax calls.
router
.get('/index', sso, (req, res) => res.send('hello world'));
```

### Configuration
The login router & the SSO middleware use the same configuration.

- **basePath**: *string* (default: '/auth')  
  Each of the routes in the auth router will be prepended with this property
- **clientId**: *string*  
  Client credentials from the API gateway (see section api store)
- **clienSecret**: *string*  
  Client credentials from the API gateway (see section api store)
- **consentUrl**: *string*  
  The url of the consent api, is necessary to enable SSO
  (also see section api store).  
  (e.g. https://api-gw-a.antwerpen.be/acpaas/consent/v1)
- **defaultScopes**: *string[]*
  list of scopes you will always use (see section scopes)
  Should be compatible with assurance level = low
- **errorRedirect**: *string* (default: '/')  
  Where your application should redirect when something goes wrong during the login process.
- **hooks**: *object*
  Hooks can be used to add custom logic to the login process. Can be used to modify your session or clean up when logging out.  
  Each hook has the same signature as express middleware  
  `(req, res, next) => {})`
  - **preLogin**: *function[]*  
    List of functions that will be executed before login
  - **preLogout**: *function[]*  
    List of functions that will be executed before logout
  - **loginSuccess**: *function[]*  
    List of functions that will be executed when login has succeeded
  - **logoutSuccess**: *function[]*  
    List of functions that will be executed when logout has succeeded
- **key**: *string* (default: 'user')  
  The loggedin user will be stored on `req.session`. This property defines where the user and his accessToken will be stored.  
  for 'user', the user will be at `req.session.user` and the accesstoken will be at `req.session.userToken` 
- **logout** (optional, but needed for SLO with the event handler)
  - **headerKey** *string*:  
    the name of the http header where the key is located (defaults to `x-logout-token`)
  - **securityHash** *string*  
    bcrypt hash of the token that will be placed in the http header.
  - **sessionStoreLogoutAdapter** *Function*:  
    function that returns a promise when the sessionStore has been successfully updated and rejects otherwise. This adapter is responsible for  removing the session. [More information](#creating-and-using-sessionstorelogoutadapters)
- **oauthHost**: *string* 
  this is where the actual login process starts after leaving your application. This is needed to generate a redirect url to the login page  
  (e.g.: https://api-oauth2-a.antwerpen.be)
- **refresh**: *boolean* (default false)  
  Enables automatic refresh of the user's access token
- **scopeGroups**: *object*  
  scopeGroups is an object where all keys should have an array of scopes as values. These can be used to request additional scopes when logging in through the use of the query parameter `scopeGroups` ([available scopes](#available-scopes)
- **url**: *String* 
  url where the user will be retrieved with after login has succeeded  
  (e.g.: https://api-gw-a.antwerpen.be/acpaas/shared-identity-data/v1)


### API Store configuration

For this module to fully work, some configuration on the API store is required.

After creating your application on the api store, you should create a contract with the Shared Identity API.

![Create Contract shared identity](/assets/shared-identity.png "Create contract shared identity")

and the Consent API (if you want to enable SSO)
![Create Contract consent](/assets/consent.png "Create contract consent")

The next step is to navigate to your applications and clicking on actions

![actions](/assets/oauth-config.png "actions")


Click on oauth2 config. You'll find your clientId and secret here.

![configure callback](/assets/callback.png "callback")

You'll need to configure your callback path here
normally, it will be `<protocol>://<your-domain>/auth/login/callback`
(this module exposes this endpoint) (change the basePath if you have configured another)

### Eventhandler configuration (for single log-off)
Navigate to the eventhandler and go to the oauth namespace
![oauth namespace](/assets/eventhandler.png "oauth namespace") 

Add a new wildcard subscription (
Configure your endpoint with the correct params:

![subscription configuration](/assets/config-event.png "subscription configuration")
the push url is `<protocol>://<hostname>{basePath}/event/loggedout/`
(basePath defaults to auth).

You should add a custom header which corresponds to the headerKey in your logout configuration (defaults to `x-logout-token`). Add your token.
(this token will not be known to your application, only the hashed version) (don't forget to click the plus symbol)


## How to use the Routes

### GET {basePath}/login
This endpoint can be used to login. There are some query parameters available to control in which ways the user can login and which scopes the user can use.

#### Query parameters
- **scopeGroups**  
  comma seperated list of the keys of the scopeGroups configured in your configuration. If none are given, only the default scopes from the configration are requested.
- **minimal_assurance_level** (default: low for context citizen, substantial for context enterprise)  
   possible values: low, substantial, high
  determines which authentication methods are available to the user (see [Available authentication methods](available-authentication-methods))
- **fromUrl** (default /)  
  Where the user should be redirected if the login process is successfull
- **context** (enterprise or citizen) (default citizen)  
  if the user should login as a citizen or as an enterprise user. Login in with context enterprise enables the application to fetch additional roles at the authz api with the access token of the user.
### GET {basePath}/isloggedin

The `isloggedin` endpoint can be used to check if the user is currently loggedIn
```js
{
  isLoggedin: true,
  user: { ... } // this corresponds to the key that is configured in the serviceProvider
}
```

If the user is not logged in the following payload is returned.
```js
{
  isLoggedin: false
}
```

### GET {basePath}/logout

Redirects the user to the logout for the specified service. This will cause the session to be destroyed on the IDP.

the `fromUrl` query parameter can be used to redirect the user to a given page
after logout.


# Available scopes
| Scope                           | Alias             | Minimal assurance level |
| ------------------------------- | ----------------- | ----------------------- |
| astad.aprofiel.v1.address       | aprofiel.address  | low                     |
| astad.aprofiel.v1.all           | aprofiel.all      | low                     |
| astad.aprofiel.v1.avatar        | aprofiel.avatar   | low                     |
| astad.aprofiel.v1.email         | aprofiel.email    | low                     |
| astad.aprofiel.v1.name          | aprofiel.name     | low                     |
| astad.aprofiel.v1.phone         | aprofiel.phone    | low                     |
| astad.aprofiel.v1.username      | aprofiel.username | low                     |
| crspersoon.birthdate            |                   | substantial             |
| crspersoon.death                |                   | substantial             |
| crspersoon.deathdate            |                   | substantial             |
| crspersoon.familyname           |                   | substantial             |
| crspersoon.gendercode           |                   | substantial             |
| crspersoon.givenName            |                   | substantial             |
| crspersoon.housenumber          |                   | substantial             |
| crspersoon.housenumberextension |                   | substantial             |
| crspersoon.municipalityname     |                   | substantial             |
| crspersoon.municipalityniscode  |                   | substantial             |
| crspersoon.nationality          |                   | substantial             |
| crspersoon.nationalnumber       |                   | substantial             |
| crspersoon.postalcode           |                   | substantial             |
| crspersoon.registrationstate    |                   | substantial             |
| crspersoon.streetname           |                   | substantial             |


# Available authentication methods


| Name                  | Assurance level | context | Description                                                       |
| --------------------- | --------------- | --------------------------------------------------------------------------- |
| iam-aprofiel-userpass | low             | citizen    | Our default aprofiel authentication with username and password |
| fas-citizen-bmid      | substantial     | citizen    | Belgian Mobile ID (e.g. Itsme)                                 |
| fas-citizen-otp       | substantial     | citizen    | Authentication with one time password      (e.g. sms)          |
| fas-citizen-totp      | substantial     | citizen    | Time-based one time password   (e.g. Google Authenticator)     |
| fas-citizen-eid       | high            | citizen    | Authentication with eID-card and pin-code                      |
| fas-enterprise-bmid   | substantial     | enterprise | Belgian Mobile ID (e.g. Itsme)                                 |
| fas-enterprise-otp    | substantial     | enterprise | Authentication with one time password      (e.g. sms)          |
| fas-enterprise-totp   | substantial     | enterprise | Time-based one time password   (e.g. Google Authenticator)     |
| fas-enterprise-eid    | high            | enterprise | Authentication with eID-card and pin-code                      |

# Creating and using SessionStoreLogoutAdapters

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