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

  /**
   * Redis Operations
   */
  public async allKeys(): Promise<string[]> {
    return this.app.redis.keys('*');
  }

  public async deleteKey(key: string): Promise<void> {
    const { app } = this;
    await app.redis.del(key);
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
    if (message.MsgType !== 'text') {
      return;
    }

    if (this.checkCommand(message, '#ding-start')) {
      await this.startMonitor(message);
      const NOTICE_INFO = 'Hi, bot maintainer! \n\nThe message from bot is send by wechaty-puppet-donut, our AIM is to monitor your bot login / logout status. \n\nPlease just ignore this conversation, if you have any question about wechaty, please contact with \n\n[WeChat Account]: botorange22 \n\nThank you very much!';
      return this.responseMessage(message, NOTICE_INFO);
    } else if (this.checkCommand(message, '#dong')) {
      await this.processDongMessage(message);
      return this.responseMessage(message, '@received-dong-message');
    } else if (this.checkCommand(message, '#ddr')) {
      const ddrString = await this.ddrList();
      return this.responseMessage(message, ddrString);
    } else if (this.checkCommand(message, '#dead')) {
      const ddrString = await this.deadList();
      return this.responseMessage(message, ddrString);
    } else if (this.checkCommand(message, '#clear')) {
      const botId = message.Content.split('#')[0];
      await this.clearWarnNumByBotId(botId);
      return this.responseMessage(message, 'already cleared!');
    } else if (this.checkCommand(message, '#reset')) {
      const botId = message.Content.split('#')[0];
      await this.resetDingDongByBotId(botId);
      return this.responseMessage(message, 'already reset!');
    } else if (this.checkCommand(message, '#del')) {
      const botId = message.Content.split('#')[0];
      const resMsg = await this.delObjectByBotId(message, botId);
      return this.responseMessage(message, resMsg);
    } else if (this.checkCommand(message, '#info')) {
      const botId = message.Content.split('#')[0];
      const botInfo = await this.getBotInfo(botId);
      return this.responseMessage(message, botInfo);
    }
    const commandInfo = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot\nbotId#info: see the detail info of this bot';
    return this.responseMessage(message, commandInfo);

  }

  private async startMonitor(message: Message) {
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
  }

  private async processDongMessage(message: Message): Promise<void> {
    const cacheObject = await this.getValue(message.FromUserName);
    if (!cacheObject) {
      throw new Error(`can not get memory for ${message.FromUserName}`);
    }
    cacheObject.dongNum += 1;
    cacheObject.responseTime = parseInt(message.CreateTime, 10);
    await this.setValue(message.FromUserName, cacheObject);
  }

  private async ddrList() {
    let flag = false;

    const keys = await this.allKeys();
    let deadNum = 0;
    let onlineNum = 0;
    const str: string[] = [];
    for (const key of keys) {
      const cacheObject: BotDingDongInfo | undefined = await this.getValue(key);
      if (cacheObject && cacheObject.botId) {
        flag = true;
        const ddr = cacheObject.dingNum === 0 ? '0.00' : (cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2);
        const deadFlag = cacheObject.warnNum >= Config.WARNING_TIMES ? '【offline】' : '';
        cacheObject.warnNum >= Config.WARNING_TIMES ? deadNum++ : onlineNum++;
        str.push(`【${cacheObject.botName || cacheObject.botId}】${deadFlag}\nbotId: ${cacheObject.botId}\nDing/Dong: ${cacheObject.dingNum}/${cacheObject.dongNum}\nDDR: ${ddr}%\n\n`);
      }
    }
    const preStr = `【Statistics】\nonline: ${onlineNum}, offline: ${deadNum}\n\n`;
    return flag ? preStr + str.join('') : 'No alive bot.';
  }

  private async deadList() {
    const deadList: string[] = [];
    const keys = await this.allKeys();
    const botNumber = keys.length;
    if (!botNumber) {
      return 'No dead bot due to no active bot!';
    }
    for await (const key of keys) {
      const object = await this.getValue(key);
      if (object && object.warnNum >= Config.WARNING_TIMES) {
        const ddr = object.dingNum === 0 ? '0.00' : (object.dongNum / object.dingNum * 100).toFixed(2);
        deadList.push(`【${object.botName || object.botId}】\nbotId: ${object.botId}\nStopTime: ${moment(object.responseTime * 1000).format('MM-DD HH:mm:ss')}\nDDR: ${ddr}\n\n`);
      }
    }
    if (deadList.length) {
      return deadList.join('').toString();
    }
    return 'No dead bot!';
  }

  private async clearWarnNumByBotId(botId: string) {
    const key = await this.getValue(botId);
    const cacheObject = await this.getValue(key);
    cacheObject.warnNum = 0;
    cacheObject.responseTime = Math.floor(Date.now() / 1000);
    await this.setValue(key, cacheObject);
  }

  private async resetDingDongByBotId(botId: string) {
    const key = await this.getValue(botId);
    const cacheObject = await this.getValue(key);
    cacheObject.dingNum = 0;
    cacheObject.dongNum = 0;
    cacheObject.warnNum = 0;
    cacheObject.responseTime = Math.floor(Date.now() / 1000);
    await this.setValue(key, cacheObject);
  }

  private async delObjectByBotId(message: Message, botId: string): Promise<string> {
    if (message.FromUserName !== Config.MANAGER_SU) {
      return 'you have no permition';
    }
    const key = await this.getValue(botId);
    await this.deleteKey(botId);
    await this.deleteKey(key);
    return 'already deleted!';
  }

  private async getBotInfo(botId: string) {
    const key = await this.getValue(botId);
    const object = await this.getValue(key);
    const ddr = object.dingNum === 0 ? '0.00' : (object.dongNum / object.dingNum * 100).toFixed(2);
    const info = `【${object.botName}】\nBotId: ${object.botId} \nDDR: ${ddr} \nDingNum: ${object.dingNum} \nDongNum: ${object.dongNum} \nStartTime: ${moment(object.startTime * 1000).format('MM-DD HH:mm:ss')} \nResTime: ${moment(object.responseTime * 1000).format('MM-DD HH:mm:ss')}`;
    return info;
  }

  private checkCommand(message: Message, command: string) {
    return message.Content.indexOf(command) !== -1;
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

  public static warnMessage(cacheObject: BotDingDongInfo): string {
    return `【掉线通知(${cacheObject.botName || cacheObject.botId})】
登录时间：${moment(cacheObject.startTime * 1000).format('MM-DD HH:mm:ss')}
离线时间：${moment(cacheObject.responseTime * 1000).format('MM-DD HH:mm:ss')}
在线时长：${this.secondsToDhms(cacheObject.responseTime - cacheObject.startTime)}
DDR: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}%`;
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

}
