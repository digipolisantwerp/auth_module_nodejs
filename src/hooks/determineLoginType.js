

export default function createDetermineLoginTypeMiddleware({
  key = 'user',
}) {

  return (req, res, next) => {
    let {
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
  }

}
