import { Controller } from 'egg';
import crypto = require('crypto');
import moment = require('moment');

import { xmlToJson } from '../util/xmlToJson';
import { Config } from '../../config/config';
import { Message, BotDingDongInfo } from '../util/schema';


export default class HomeController extends Controller {

  public async check() {
    const { ctx, logger } = this;
    logger.info(`check(), time: ${new Date()}`);
    const query = ctx.query;
    const { signature, timestamp, nonce, echostr } = query;
    const str = [ timestamp, nonce, Config.MY_TOKEN ].sort().join('');
    const result = crypto.createHash('sha1').update(str).digest('hex');

    if (result === signature) {
      ctx.body = echostr;
    }
  }

  public async receiveMessage() {
    const { ctx, logger } = this;
    logger.info('receiveMessage()');
    const xmlBody = ctx.request.body;

    const xmlObject = await xmlToJson(xmlBody);
    const message: Message = xmlObject.xml;

    ctx.body = await this.processMessage(message);
  }

  public async allKeys(): Promise<string[]> {
    return this.app.redis.keys('*');
  }

  public async getValue(key: string): Promise<any> {
    const { logger, app } = this;
    logger.info(`getValue(${key})`);
    const objectStr = await app.redis.get(key);
    console.log(`objectStr : ${objectStr}`);
    if (objectStr) {
      try {
        return JSON.parse(objectStr);
      } catch (error) {
        return objectStr;
      }
    }
    return null;

  }

  public async setValue(key: string, value: any): Promise<void> {
    const { logger, app } = this;
    logger.info(`setValue(${key}, ${JSON.stringify(value)})`);
    await app.redis.set(key, JSON.stringify(value));
  }

  private async processMessage(message: Message) {
    if (message.MsgType === 'text' && message.Content.indexOf('#ding-start') !== -1) {
      const strArr = message.Content.split('#');
      const botId = strArr[0];
      let botName = '';
      if (strArr.length === 3) {
        botName = strArr[1];
      }

      let cacheObject = await this.getValue(message.FromUserName);

      if (!cacheObject) {
        cacheObject = {
          botId,
          botName,
          startTime: parseInt(message.CreateTime, 10),
          warnNum: 0,
          dingNum: 0,
          dongNum: 0,
          responseTime: parseInt(message.CreateTime, 10),
        };
      } else {
        let num = 0;
        if (cacheObject.responseTime) {
          num = Math.floor((parseInt(message.CreateTime, 10) - cacheObject.responseTime) / 60);
        }
        cacheObject = {
          botId,
          botName,
          startTime: parseInt(message.CreateTime, 10),
          warnNum: 0,
          dingNum: num,
          dongNum: 0,
          responseTime: cacheObject.responseTime,
        };
      }
      await this.setValue(message.FromUserName, cacheObject);
      await this.setValue(botId, message.FromUserName);
      const NOTICE_INFO = 'Hi, bot maintainer! \n\nThe message from bot is send by wechaty-puppet-donut, our AIM is to monitor your bot login / logout status. \n\nPlease just ignore this conversation, if you have any question about wechaty, please contact with \n\n[WeChat Account]: botorange22 \n\nThank you very much!';
      return this.responseMessage(message, NOTICE_INFO);
    } else if (message.MsgType === 'text' && message.Content.indexOf('#dong') !== -1) {
      const cacheObject = await this.getValue(message.FromUserName);
      if (!cacheObject) {
        throw new Error(`can not get memory for ${message.FromUserName}`);
      }
      cacheObject.dongNum += 1;
      cacheObject.responseTime = parseInt(message.CreateTime, 10);
      await this.setValue(message.FromUserName, cacheObject);
      return this.responseMessage(message, '@received-dong-message');
    } else if (message.MsgType === 'text' && message.Content.indexOf('#ddr') !== -1) {
      const ddrString = await this.ddrStatistic();
      return this.responseMessage(message, ddrString);
    } else if (message.MsgType === 'text' && message.Content.indexOf('#dead') !== -1) {
      const ddrString = await this.deadList();
      return this.responseMessage(message, ddrString);
    } else if (message.MsgType === 'text' && message.Content.indexOf('#clear') !== -1) {
      const botId = message.Content.split('#')[0];
      await this.clearWarnNumByBotId(botId);
      return this.responseMessage(message, 'already cleared!');
    }
    const commandInfo = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot';
    return this.responseMessage(message, commandInfo);

  }

  public static warnMessage(cacheObject: BotDingDongInfo): string {
    return `【Bot掉线通知(${cacheObject.botName || cacheObject.botId})】
登录时间：${moment(cacheObject.startTime * 1000).format('YYYY-MM-DD HH:mm:ss')}
离线时间：${moment(cacheObject.responseTime * 1000).format('YYYY-MM-DD HH:mm:ss')}
在线时长：${this.secondsToDhms(cacheObject.responseTime - cacheObject.startTime)}
DDR: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}%`;
  }

  private async clearWarnNumByBotId(botId: string) {
    const key = await this.getValue(botId);
    const cacheObject = await this.getValue(key);
    cacheObject.warnNum = 0;
    cacheObject.responseTime = Math.floor(Date.now() / 1000);
    await this.setValue(key, cacheObject);
  }

  private static secondsToDhms(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? d + 'd ' : '';
    const hDisplay = h > 0 ? h + 'h ' : '';
    const mDisplay = m > 0 ? m + 'm ' : '';
    const sDisplay = s > 0 ? s + 's' : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }

  private responseMessage(message: Message, text: string): string {
    return `<xml>
      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${text}]]></Content>
    </xml>`;
  }

  private async ddrStatistic() {
    let ddrString = '【DDR LIST】 \n BotName/BotId \t DingNum \t DDR \n';
    let flag = false;

    const keys = await this.allKeys();
    for await (const key of keys) {
      const cacheObject: BotDingDongInfo | undefined = await this.getValue(key);
      if (cacheObject && cacheObject.botId) {
        flag = true;
        const ddr = cacheObject.dingNum === 0 ? '0.00' : (cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2);
        ddrString += `${cacheObject.botName || cacheObject.botId} \t ${cacheObject.dingNum} \t ${ddr}% \n`;
      }
    }

    return flag ? ddrString : 'No alive bot.';
  }

  private async deadList() {
    const deadStr = '【DEAD LIST】 \nBotName \t BotId\n';
    const deadList: string[] = [];
    const keys = await this.allKeys();
    const botNumber = keys.length;
    if (!botNumber) {
      return 'No dead bot due to no active bot!';
    }
    for await (const key of keys) {
      const object = await this.getValue(key);
      if (object && object.warnNum >= Config.WARNING_TIMES) {
        deadList.push(object.botName ? `${object.botName}(${object.botId})` : object.botId);
      }
    }
    if (deadList.length) {
      return deadStr + deadList.map(str => str + '\n').toString();
    }
    return 'No dead bot!';

  }
}
