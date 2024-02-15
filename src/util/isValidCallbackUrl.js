export function isValidCallbackUrl(url, allowedDomains = ['antwerpen.be']) {
  const callbackUrl = new URL(url);

  if (callbackUrl.protocol !== 'https:') {
    return false;
  }

  const regex = new RegExp(`(${allowedDomains.map((allowedDomain) => `${allowedDomain.replace('.', '\\.')}$`).join('|')})`);
  return regex.test(callbackUrl.host);
}
