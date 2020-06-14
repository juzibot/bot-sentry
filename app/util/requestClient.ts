import axios from 'axios';
import { BASE_URL } from '../../config/config';


export default class RequestClient {
  async request(option: any) {
    const { data } = option;
    const url = BASE_URL + option.url;

    const headers = {
      Accept: 'application/json',
    };

    const requestConfig = {
      url,
      method: option.type,
      headers,
      params: {},
      data: {},
    };

    if (option.type === 'GET') {
      Object.assign(requestConfig.params, data);
    } else if (option.type === 'POST') {
      Object.assign(requestConfig.data, data);
    }

    let res;
    try {
      res = await axios(requestConfig);
    } catch (error) {
      return { err: 'Not found!' };
    }

    const body = res.data;
    if (body.errcode !== 0) {
      console.log(`
      ==================================================
      ERROR REQUEST BODY : 
      ${JSON.stringify(body)}
      ==================================================
      `);
    }
    return body.data;
  }

}

module.exports.RequestClient = RequestClient;
