
const crypto = require('crypto');
const ALGORITHM = 'aes-128-ctr';

function encrypt(text, password) {
  const hash = crypto.createHash('sha1');
  hash.update(password);
  const key = hash.digest().slice(0, 16);
  const ivBuffer = Buffer.alloc(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, ivBuffer);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}


function getHost(req) {
  return `${req.protocol}://${req.get('host')}`
}


module.exports = {
  encrypt,
  getHost
};