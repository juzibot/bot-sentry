import axios from 'axios';
import NodeCache = require('node-cache');
import { Config } from '../../config/config';

const myCache = new NodeCache({
  stdTTL: 1.8 * 60 * 60,
  checkperiod: 2.0 * 60 * 60,
});

export async function getToken() {
  let token = myCache.get('token');
  if (token) {
    return token;
  }
  const result: {
    errcode: number;
    errmsg: string;
    data: any;
  } = await axios.get(`${Config.BASE_URL}/cgi-bin/token?grant_type=client_credential&appid=${Config.APPID}&secret=${Config.APPSECRET}`);
  if (result.errcode && result.errmsg) {
    console.log(`Get token errcode: ${result.errcode}, errmsg: ${result.errmsg}`);
  }

  token = result.data.access_token;
  myCache.set('token', token);
  return token;
}
