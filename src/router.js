import { Router, json } from 'express';
import createController from './controller';

function preventBrowserCache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Vary', '*');
  res.header('Pragma', 'no-cache');
  return next();
};

export default function loadRoutes(app, config) {

  const { basePath = '/auth' } = config;
  const {
    loginCallback,
    login,
    logout,
    isLoggedin,
    logoutCallback,
    loggedoutEvent,
    refreshToken
  } = createController(config);

  const router = new Router();
  // warning printen als trust proxy niet enabled is? of standaard enablen?
  router.get(`${basePath}/login/callback`, preventBrowserCache, loginCallback);
  router.get(`${basePath}/login`, preventBrowserCache, login);
  router.get(`${basePath}/logout`, preventBrowserCache, logout);
  router.get(`${basePath}/isloggedin`, preventBrowserCache, isLoggedin);
  router.get(`${basePath}/logout/callback`, preventBrowserCache, logoutCallback);
  router.post(`${basePath}/event/loggedout`, json(), loggedoutEvent);
  app.use(refreshToken);

  return router;
};
