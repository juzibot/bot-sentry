import { Service } from 'egg';

import axios from 'axios';
import NodeCache = require('node-cache');
import RequestClient from '../util/requestClient';
import { BASE_URL, APPID, APPSECRET, NOTIFY_LIST } from '../../config/config';
import { TemplateObject } from '../schemas/messageBO';

const myCache = new NodeCache({
  stdTTL: 1.8 * 60 * 60,
  checkperiod: 2.0 * 60 * 60,
});

const client = new RequestClient();

const TEMPLATE_MESSAGE_ID = 'vXoSPoWAOZ11s_ZpsEaWVIVfziq06-EwO8j8-13ITGY';

/**
 * MessageService Service
 */
export default class MessageService extends Service {

  public async sendMessage(text: string, touser: string = NOTIFY_LIST[0]) {

    const token = await this.getToken();
    const data = {
      touser,
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

  public async sendTemplateMessage(object: TemplateObject, touser: string) {

    const token = await this.getToken();
    const { wxid, time, remark } = object;

    const data = {
      touser,
      template_id: TEMPLATE_MESSAGE_ID,
      topcolor: '#FF0000',
      data: {
        first: {
          value: `微信：${wxid} 掉线报警`,
        },
        performance: {
          value: '微信号5分钟内未响应系统监控消息，可能发生故障或退出登录。',
        },
        time: {
          value: time,
        },
        remark: {
          value: remark,
        },
      },
    };
    const requestData = {
      data,
      type: 'POST',
      url: `/cgi-bin/message/template/send?access_token=${token}`,
    };

    await client.request(requestData);
  }

  private async getToken() {
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
}
