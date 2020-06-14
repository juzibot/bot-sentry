import axios from 'axios';
import NodeCache = require('node-cache');
import RequestClient from './requestClient';
import { BASE_URL, APPID, APPSECRET, NOTIFY_LIST } from '../../config/config';

const myCache = new NodeCache({
  stdTTL: 1.8 * 60 * 60,
  checkperiod: 2.0 * 60 * 60,
});

const client = new RequestClient();

async function getToken() {
  let token = myCache.get('token');
  if (token) {
    return token;
  }
  const result: {
    errcode: number;
    errmsg: string;
    data: any;
  } = await axios.get(`${BASE_URL}/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`);
  if (result.errcode && result.errmsg) {
    console.log(`Get token errcode: ${result.errcode}, errmsg: ${result.errmsg}`);
  }

  token = result.data.access_token;
  myCache.set('token', token);
  return token;
}

export async function sendMessage(text: string, toUser: string = NOTIFY_LIST[0]) {

  const token = await getToken();
  const data = {
    touser: toUser,
    msgtype: 'text',
    text: {
      content: text,
    },
  };
  const requestData = {
    data,
    type: 'POST',
    url: `/cgi-bin/message/custom/send?access_token=${token}`,
  };

  await client.request(requestData);
}
