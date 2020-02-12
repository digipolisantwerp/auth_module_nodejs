const express = require('express');
const connectMongo = require('connect-mongo');
const session = require('express-session');
const auth = require('@digipolis/auth');


let {
  session: sessionConfig,
  auth: authConfig,
  mongoConnectionString,
  port = 2000
} = require('./old-config');


const app = express();
const MongoStore = connectMongo(session);

// if the redirect after login should be https, this option is necessary
// if your application is behind a reverse proxy (which is the case on openshift)
app.enable('trust proxy');

// append the session store to the sessionconfig
sessionConfig = Object.assign(sessionConfig, {
  store: new MongoStore({
    url: mongoConnectionString
  })
});

// use the s
app.use(session(sessionConfig));
app.use(auth(app, authConfig));

app.listen(port, () => console.log(`express server listening on port ${port}`));