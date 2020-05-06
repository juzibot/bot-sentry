import util = require('util');
import RequestClient from '../util/requestClient';
import { getToken } from '../controller/tokenManager';
import { Config } from '../../config/config';

const client = new RequestClient();

export async function sendMessage(text: string, toUser: string = Config.MANAGER_SU) {
  console.log(`sendMessage(${text}, ${toUser})`);

  const token = getToken();
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

  const result = await client.request(requestData);
  console.log(util.inspect(result));
}
