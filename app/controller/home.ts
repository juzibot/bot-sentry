import { Controller } from 'egg';
import crypto = require('crypto');
import util = require('util');

import { MemoryCard } from 'memory-card';
import { xmlToJson } from '../util/xmlToJson';
import { sendMessage } from './message';
import { Config } from '../../config/config';
import { Message, BotDingDongInfo } from '../util/schema';


const MEMORY_CARD_NAME = 'bot-name';
const memoryCard = new MemoryCard(MEMORY_CARD_NAME);
memoryCard.load();

export default class HomeController extends Controller {

  public async check() {
    console.log(`check(), time: ${new Date()}`);
    const { ctx } = this;
    const query = ctx.query;
    const { signature, timestamp, nonce, echostr } = query;
    const str = [ timestamp, nonce, Config.MY_TOKEN ].sort().join('');
    const result = crypto.createHash('sha1').update(str).digest('hex');

    if (result === signature) {
      ctx.body = echostr;
    }
  }

  public async receiveMessage() {
    console.log('receiveMessage()');
    const { ctx } = this;
    const xmlBody = ctx.request.body;
    const xmlObject = await xmlToJson(xmlBody);
    const message: Message = xmlObject.xml;
    console.log(`receive message: ${util.inspect(message)}`);

    await this.warning();
    await this.processMessage(message);
  }

  private async processMessage(message: Message) {
    // start ding
    if (message.MsgType === 'text' && message.Content.indexOf('#ding-start') !== -1) {
      setInterval(async () => {
        await sendMessage('#ding', message.FromUserName);
      }, 10 * 1000);

      const botId = message.Content.split('#')[0];
      const cacheObject: BotDingDongInfo = {
        botId,
        startTime: parseInt(message.CreateTime, 10),
        warnNum: 0,
        dingNum: 1,
        dongNum: 0,
        responseTime: 0,
      };
      await memoryCard.set(message.FromUserName, cacheObject);
      return this.responseMessage(message, '@received-ding-start-message');
    } else if (message.MsgType === 'text' && message.Content.indexOf('#dong') !== -1) {
      const cacheObject = await memoryCard.get(message.FromUserName);
      if (!cacheObject) {
        // TODO： without #ding-start command
        /* cacheObject = {
          botId,
          startTime: message.CreateTime,
          warningTimes: 0,
        };
        await memoryCard.set(message.FromUserName, cacheObject); */
      }
      cacheObject.dongNum += 1;
      cacheObject.responseTime = parseInt(message.CreateTime, 10);
      await memoryCard.set(message.FromUserName, cacheObject);
      return this.responseMessage(message, '@received-dong-message');
    } else if (message.MsgType === 'text' && message.Content.indexOf('#ddr') !== -1) {
      const ddrString = await this.ddrStatistic();
      return this.responseMessage(message, ddrString);
    }
  }

  public async warning() {
    console.log('warning()');
    for await (const key of memoryCard.keys()) {
      const cacheObject = await memoryCard.get(key);
      console.log(`object: ${util.inspect(cacheObject)}`);
      const flag = Math.round(Date.now() / 1000) - cacheObject.responseTime;
      const botId = cacheObject.botId;
      if (cacheObject.warningTimes > Config.WARNING_TIMES) {
        console.log(`This bot: ${botId} has already warned more than ${Config.WARNING_TIMES}, it will never warn any more.`);
        return;
      }
      if (flag > Config.TIMEOUT) {
        console.log(`This bot: ${botId} has no longer response message.`);
        const warnMessage = this.warnMessage(cacheObject);
        sendMessage(warnMessage);
        // sendMessage(warnMessage, Config.MANAGER_GAO);
        cacheObject.warningTimes += 1;
        await memoryCard.set(key, cacheObject);
      }
    }
  }

  private warnMessage(cacheObject: BotDingDongInfo): string {
    return `【Bot掉线通知】：${cacheObject.botId}
    当前bot已经掉线，
    登录时间：${cacheObject.startTime}
    在线时长：${Math.floor(Date.now() / 1000) - cacheObject.startTime}
    DDR: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}%`;
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
    let ddrString = 'DDR LIST: \n';
    let flag = false;
    for await (const key of memoryCard.keys()) {
      const cacheObject: BotDingDongInfo | undefined = await memoryCard.get(key);
      if (cacheObject) {
        flag = true;
        ddrString += `bot id: ${cacheObject.botId}, ddr: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}% \n`;
      }
    }

    return flag ? ddrString : 'No alive bot.';
  }
}
