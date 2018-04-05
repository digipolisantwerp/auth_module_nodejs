## digipolis-login
**Note that this is still a work in progress and subject to changes and improvements**

Mprofiel-login is implemented as an express router.

Setup as follows:
Ǹote that you should request a contract with mprofile  and
configure a callback url on the api manager.
```
const session = require('express-session');
const app = express();
app.use(session({
  secret: 'blabla'
}))
const profileLogin = require('digipolis-mprofiel-login');
// load session with corresponding persistence (postgres, mongo....)
app.use(profileLogin({
	oauthDomain: 'https://api-oauth2-o.antwerpen.be',
	apiHost: 'https://api-gw-o.antwerpen.be',
	domain: 'http://localhost:' + process.env.PORT,
  baseUrl: // optional, defaults to /api/mprofile when mprofiel, /api/aprofile when aprofiel
  backendRedirect: boolean // optional, defaults to false.
	auth: {
    service: profileLogin.APROFIEL // profileLogin.MPROFIEL (defaults to aprofiel)
		clientId: 'your-client-id',
		clientSecret: 'your-client-secret'
	},
  key: 'aprofiel' // where the user is stored on the session (req.session.aprofiel), defaults to user
  fetchPermissions: Boolean // should fetch permissions
  applicationName: String // required if fetchPermissions == true, should be name in User management,
  apiKey: String // required if fetchPermissions == true
}));
```

this middleware exposes two routes.
```
  `${baseUrl}/isloggedin`
  `${baseUrl}/callback`
```

### /isloggedin
The `isloggedin` endpoint can be used to check if a user currently has a session.
if a user is logged in, it returns 
if fetchPermissions == true, user.permissions contains the permissions (not possible for aprofiel)
```
{
  isLoggedin: true,
  user: { ... }
}
```

If no user is logged in, the following format is returned if `backendRedirect` is set to `false`
```
{
  isLoggedin: false,
  redirectUrl: url // url you can redirect to to login in the application
}
```

if `backendRedirect` is set to `true` the backend attempts a redirect.

### callback
Endpoint that you should not use manually, is used to return from the identity server
and fetches a user corresponding to the login and stores it on the session.
