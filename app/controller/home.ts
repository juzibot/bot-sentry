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

    await this.warning();
    ctx.body = await this.processMessage(message);
  }

  private async processMessage(message: Message) {
    if (message.MsgType === 'text' && message.Content.indexOf('#ding-start') !== -1) {
      await sendMessage('#ding', message.FromUserName);
      setInterval(async () => {
        await sendMessage('#ding', message.FromUserName);
        const cacheObject = await memoryCard.get(message.FromUserName);
        cacheObject.dingNum += 1;
        await memoryCard.set(message.FromUserName, cacheObject);
      }, 60 * 1000);

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
        throw new Error(`can not get memory for ${message.FromUserName}`)
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
    const { logger } = this
    logger.info('warning()');
    logger.info(`
    ===========================================
    The bot length: ${await memoryCard.size}
    ===========================================
    `)
    for await (const key of memoryCard.keys()) {
      const cacheObject = await memoryCard.get(key);
      logger.info(`
      =============================================
      object: ${util.inspect(cacheObject)}
      =============================================
      `);
      const flag = Math.round(Date.now() / 1000) - cacheObject.responseTime;
      const botId = cacheObject.botId;
      if (cacheObject.warnNum >= Config.WARNING_TIMES) {
        logger.info(`
        ================================================================================================
            This bot: ${botId} has already warned more than ${Config.WARNING_TIMES}, it will never warn any more.
        ================================================================================================
        `);
        return;
      }
      if (cacheObject.responseTime && flag > Config.TIMEOUT) {
        logger.info(`
        ==============================================================
          This bot: ${botId} has no response message, will warning now
        ==============================================================
        `);
        const warnMessage = this.warnMessage(cacheObject);
        sendMessage(warnMessage);
        // sendMessage(warnMessage, Config.MANAGER_GAO);
        cacheObject.warnNum += 1;
        await memoryCard.set(key, cacheObject);
      }
    }
  }

  private warnMessage(cacheObject: BotDingDongInfo): string {
    return `【Bot掉线通知(${cacheObject.botId})】
登录时间：${this.timeConverter(cacheObject.startTime)}
离线时间：${this.timeConverter(cacheObject.responseTime)}
在线时长：${this.secondsToDhms(cacheObject.responseTime - cacheObject.startTime)}
DDR: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}%`;
  }

  private timeConverter(UNIX_timestamp: number){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

  private secondsToDhms(seconds: number) {
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + " D " : "";
    var hDisplay = h > 0 ? h + " H " : "";
    var mDisplay = m > 0 ? m + " M " : "";
    var sDisplay = s > 0 ? s + " S" : "";
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
    let ddrString = 'DDR LIST: \n';
    let flag = false;
    for await (const key of memoryCard.keys()) {
      const cacheObject: BotDingDongInfo | undefined = await memoryCard.get(key);
      if (cacheObject) {
        flag = true;
        ddrString += `ID: ${cacheObject.botId}, DDR: ${(cacheObject.dongNum / cacheObject.dingNum * 100).toFixed(2)}% \n`;
      }
    }

    return flag ? ddrString : 'No alive bot.';
  }
}
