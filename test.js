const querystring = require('querystring');
const url = "client_id=d5d1e3a9-8136-46dd-aac4-bfbbec2d2d09&response_type=code&service=astad.aprofiel.v1&scope=astad.aprofiel.v1.username&redirect_uri=http://localhost/";

const obj = querystring.parse(url);
const qry = querystring.stringify(obj);
console.log(qry)
