import async from 'async';
import {
  createHash,
  createCipheriv
} from 'crypto';

const ALGORITHM = 'aes-128-ctr';

export function logoutEncrypt(text, password) {
  const hash = createHash('sha1');
  hash.update(password);
  const key = hash.digest().slice(0, 16);
  const ivBuffer = Buffer.alloc(16);
  const cipher = createCipheriv(ALGORITHM, key, ivBuffer);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

export function getHost(req) {
  return `${req.protocol}://${req.get('host')}`
}



export function runHooks(configuredHook, req, res, next) {
  if (!configuredHook || !Array.isArray(configuredHook)) {
    return next();
  }

  const hooks = configuredHook
    .map(hook => (cb) => hook(req, res, cb));

  async.series(hooks, next);
}


export function parseBody(response) {
  const contentType = response.headers.get('content-type');

  if (!contentType) {
    return Promise.resolve();
  }

  if (contentType.includes('json')) {
    return response.json();
  }

  if (contentType.includes('text')) {
    return response.text();
  }

  if (contentType.includes('form-data') >= 0) {
    return response.formData();
  }


  return response;
}