export default function createDetermineLoginTypeMiddleware({
  key = 'user',
}) {
  return (req, _res, next) => {
    const {
      hinted = false,
      method = '',
    } = req.query;

    let type = 'citizen';
    if (hinted) {
      type = hinted;
    }

    if (method.indexOf('enterprise') > -1) {
      type = 'enterprise';
    }

    req.session[key].type = type;
    return next();
  };
}
