import axios from 'axios';
import util = require('util');
import NodeCache = require('node-cache');
const config = require('../../config/config').config;

const myCache = new NodeCache({
  stdTTL: 1.8 * 60 * 60,
  checkperiod: 2.0 * 60 * 60,
});

export async function getToken() {
  let token = myCache.get('token');
  if (token) {
    console.log(`the token is : ${token}`);
    return token;
  }
  const result: {
    errcode: number;
    errmsg: string;
    data: any;
  } = await axios.get(`${config.BASE_URL}/cgi-bin/token?grant_type=client_credential&appid=${config.APPID}&secret=${config.APPSECRET}`);
  if (result.errcode && result.errmsg) {
    console.log(`Get token errcode: ${result.errcode}, errmsg: ${result.errmsg}`);
  }
  console.log(`result : ${util.inspect(result.data)}`);

  token = result.data.access_token;
  myCache.set('token', token);
  return token;
}
