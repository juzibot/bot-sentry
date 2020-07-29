import { Controller } from 'egg';
import crypto = require('crypto');
import moment = require('moment');

import { xmlToJson } from '../util/xmlToJson';
import { PRIVATE_LIST, WARN_OPTIONS, NOTIFY_LIST, INIT_MESSAGE, BOT_SENTRY_NOTIFIER } from '../../config/config';
import { Message, BotDingDongInfo, DdrObject } from './schema';
import { sendMessage } from '../util/message';

export default class HomeController extends Controller {

  public static type = [ 1 ];

  public async check() {
    const { ctx, logger } = this;
    logger.info(`check(), time: ${new Date()}`);
    const query = ctx.query;
    const { signature, timestamp, nonce, echostr } = query;
    const str = [ timestamp, nonce, WARN_OPTIONS.MY_TOKEN ].sort().join('');
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

  private async processMessage(message: Message) {
    if (message.MsgType !== 'text') {
      return;
    }

    if (this.checkCommand(message, '#ding-start')) {
      await this.startMonitor(message);
      return this.responseMessage(message, INIT_MESSAGE);
    } else if (this.checkCommand(message, '#dong')) {
      await this.processDongMessage(message);
      return this.responseMessage(message, '@received-dong-message');
    } else if (this.checkCommand(message, '#ddr')) {
      const ddrString = await this.ddrList(message);
      return this.responseMessage(message, ddrString);
    } else if (this.checkCommand(message, '#dead')) {
      const ddrString = await this.deadList();
      return this.responseMessage(message, ddrString);
    } else if (this.checkCommand(message, '#info')) {
      const botId = message.Content.split('#')[0];
      const botInfo = await this.getBotInfo(botId);
      return this.responseMessage(message, botInfo);
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
    } else if (this.checkCommand(message, '#ZW')) {
      await this.clearWarnNum();
      return this.responseMessage(message, 'already cleared all!');
    } else if (this.checkCommand(message, '#type')) {
      HomeController.type = message.Content.split('#')[0].split(',').map(n => Number(n));
      return this.responseMessage(message, 'set monitor type');
    } else if (this.checkCommand(message, '#token')) {
      const token = message.Content.split('#')[0];
      const wxidListOfToken = await this.getWxidListByToken(token);
      return this.responseMessage(message, wxidListOfToken);
    } else if (this.checkCommand(message, '#I WANT TO RECEIVE WARNING NOTIFIER!')) {
      const user = message.FromUserName;
      const userList = await this.getValue(BOT_SENTRY_NOTIFIER);
      userList.push(user);
      await this.setValue(BOT_SENTRY_NOTIFIER, userList);
      return this.responseMessage(message, 'Done!');
    }

    const commandInfo = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot\nbotId#info: see the detail info of this bot';
    return this.responseMessage(message, commandInfo);
  }

  private async getWxidListByToken(token: string) {
    const list = await this.getValue(token);

    const strList = list.map(object => `【${object.wxid}】\nBotName: ${object.botName}\nloginTime: ${moment(object.loginTime * 1000).format('MM-DD HH:mm:ss')}\n\n`);
    return strList.join('').toString();
  }

  private async getTokenType(token: string) {
    const { ctx } = this;
    const userList = await ctx.model.User.find();

    if (!userList || userList.length === 0) {
      return [];
    }

    const tokens = userList.map(user => user.tokens).reduce((pre, cur) => pre.concat(cur), []);
    const tokenObject = tokens.filter(t => t.token === token);
    if (tokenObject.length !== 1) {
      this.logger.error(`can not find tokenObject by token: ${token}, length: ${tokenObject.length}`);
      return 1;
    }
    return tokenObject[0].type;
  }

  private async startMonitor(message: Message) {
    const strArr = message.Content.split('#');
    const botId = strArr[0];
    let botName = '';
    let token = '';
    let tokenType = '';

    if (strArr.length === 4) {
      botName = strArr[1];
      token = strArr[2];
      tokenType = await this.getTokenType(token);
    } else {
      return;
    }

    if (!token) {
      return;
    }


    const obj = await this.getValue(message.FromUserName);
    if (obj) {
      obj.warnNum = 0;
      obj.responseTime = Math.floor(Date.now() / 1000);
      await this.setValue(message.FromUserName, obj);
    } else {
      const cacheObject = {
        botId,
        botName,
        token,
        tokenType,
        startTime: parseInt(message.CreateTime, 10),
        warnNum: 0,
        dingNum: 0,
        dongNum: 0,
        responseTime: parseInt(message.CreateTime, 10),
      };
      await this.setValue(message.FromUserName, cacheObject);
      await this.setValue(botId, message.FromUserName);

      await this.addWxidToToken(botId, botName, token);
    }
  }

  private async addWxidToToken(botId: string, botName: string, token: string) {
    const botInfo = {
      wxid: botId,
      botName,
      token,
      loginTime: Date.now(),
    };
    let botInfoList = await this.getValue(token);
    if (botInfoList && botInfoList.length) {
      const existBot = botInfoList.filter(bot => bot.wxid === botInfo.wxid);
      if (existBot && !existBot.length) {
        botInfoList.push(botInfo);
      }
    } else {
      botInfoList = [ botInfo ];
    }
    await this.setValue(token, botInfoList);
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

  private async ddrList(message: Message) {
    const MAX = WARN_OPTIONS.MAX_OBJECT_OF_DDR_MSG;
    const keys = await this.allKeys();
    let deadNum = 0;
    let onlineNum = 0;
    let totalDing = 0;
    let totalDong = 0;
    const ddrObjectList: DdrObject[] = [];
    for (const key of keys) {
      const cacheObject: BotDingDongInfo | undefined = await this.getValue(key);
      if (cacheObject && cacheObject.botId && cacheObject.dingNum) {
        const ddr = this.getDDR(cacheObject);
        totalDing += this.getRealDingNum(cacheObject);
        totalDong += cacheObject.dongNum;
        const deadFlag = cacheObject.warnNum >= WARN_OPTIONS.WARNING_TIMES ? '【offline】' : '';
        cacheObject.warnNum >= WARN_OPTIONS.WARNING_TIMES ? deadNum++ : onlineNum++;
        const object = {
          content: `【${cacheObject.botName || cacheObject.botId}】${deadFlag}\nbotId: ${cacheObject.botId}\nDing/Dong: ${this.getRealDingNum(cacheObject)}/${cacheObject.dongNum}\nDDR: ${ddr}%\n\n`,
          ddr,
        };
        ddrObjectList.push(object);
      }
    }
    const _ddrObjectList = ddrObjectList.sort((a, b) => a.ddr - b.ddr).map(object => object.content);
    let page = 0;
    const totalPage = Math.ceil(_ddrObjectList.length / MAX);
    while (_ddrObjectList.length !== 0) {
      const partial = _ddrObjectList.splice(0, MAX);
      page++;
      const totalDDR = this._getDDR(totalDing, totalDong);
      const line = '--------------------------\n';
      const pageStr = totalPage === 1 ? '' : `totalPage: ${totalPage}, curPage: ${page}\n`;
      const titleAbstract = `【Statistics】\ntotalDDR: ${totalDDR}%\nonline: ${onlineNum}, offline: ${deadNum}\n${pageStr}${line}`;
      const msg = titleAbstract + partial.join('');
      await sendMessage(msg, message.FromUserName);
    }
    return totalPage === 0 ? 'No alive bot.' : 'All bots info load finished!';
  }

  private getRealDingNum(object: BotDingDongInfo) {
    const { startTime } = object;
    const now = Date.now();
    const realDingNum = startTime ? Math.floor((now / 1000 - startTime) / 60) : 0;;
    return realDingNum;
  }

  private _getDDR(ding: number, dong: number) {
    const ddr = ding === 0 ? 0.00 : Number(((dong / ding) * 100).toFixed(2));
    return ddr > 100 ? 100 : ddr;
  }

  private getDDR(object: BotDingDongInfo) {
    const { dongNum } = object;
    const realDingNum = this.getRealDingNum(object);
    return this._getDDR(realDingNum, dongNum);
  }

  private async deadList() {
    const deadList: string[] = [];
    const keys = await this.allKeys();
    const botNumber = keys.length;
    if (!botNumber) {
      return 'No dead bot due to no active bot!';
    }
    for (const key of keys) {
      const object = await this.getValue(key);
      if (object && object.botId && object.warnNum >= WARN_OPTIONS.WARNING_TIMES) {
        const ddr = this.getDDR(object);
        deadList.push(`【${object.botName || object.botId}】\nBotId: ${object.botId}\nDeadTime: ${moment(object.responseTime * 1000).format('MM-DD HH:mm:ss')}\nDDR: ${ddr}%\n\n`);
      }
    }
    if (deadList.length) {
      return deadList.join('').toString();
    }
    return 'No dead bot!';
  }

  private async getBotInfo(botId: string) {
    const key = await this.getValue(botId);
    if (!key) {
      return `Wrong botId[${botId}], please check it again!`;
    }
    const object = await this.getValue(key);
    const ddr = this.getDDR(object);
    const info = `【${object.botName}】\nBotId: ${object.botId} \nDDR: ${ddr}% \nDingNum: ${this.getRealDingNum(object)} \nDongNum: ${object.dongNum}\nWarnNum: ${object.warnNum} \nStartTime: ${moment(object.startTime * 1000).format('MM-DD HH:mm:ss')} \nResTime: ${moment(object.responseTime * 1000).format('MM-DD HH:mm:ss')}`;
    return info;
  }

  private async clearWarnNumByBotId(botId: string) {
    const key = await this.getValue(botId);
    if (!key) {
      return `Wrong botId[${botId}], please check it again!`;
    }
    const cacheObject = await this.getValue(key);
    cacheObject.warnNum = 0;
    cacheObject.responseTime = Math.floor(Date.now() / 1000);
    await this.setValue(key, cacheObject);
  }

  private async resetDingDongByBotId(botId: string) {
    const key = await this.getValue(botId);
    if (!key) {
      return `Wrong botId[${botId}], please check it again!`;
    }
    const cacheObject = await this.getValue(key);
    cacheObject.dingNum = 0;
    cacheObject.dongNum = 0;
    cacheObject.warnNum = 0;
    cacheObject.responseTime = Math.floor(Date.now() / 1000);
    await this.setValue(key, cacheObject);
  }

  private async delObjectByBotId(message: Message, botId: string): Promise<string> {
    if (message.FromUserName !== NOTIFY_LIST[0]) {
      return 'you have no permition';
    }
    const key = await this.getValue(botId);
    if (!key) {
      return `Wrong botId[${botId}], please check it again!`;
    }
    await this.deleteKey(botId);
    await this.deleteKey(key);
    return 'already deleted!';
  }

  private async clearWarnNum() {
    const keys = await this.allKeys();
    for (const key of keys) {
      const object = await this.getValue(key);
      if (object && object.botId) {
        object.warnNum = 0;
        object.responseTime = Math.floor(Date.now() / 1000);
        await this.setValue(key, object);
      }
    }
  }

  private checkCommand(message: Message, command: string) {
    if (PRIVATE_LIST.includes(command) && message.FromUserName !== NOTIFY_LIST[0]) {
      return false;
    }
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
    const duringTime = cacheObject.responseTime === cacheObject.startTime ? '0s' : this.secondsToDhms(cacheObject.responseTime - cacheObject.startTime);
    return `【WARN MESSAGE(${cacheObject.botName || cacheObject.botId})】
LoginTime: ${moment(cacheObject.startTime * 1000).format('MM-DD HH:mm:ss')}
LogoutTime: ${moment(cacheObject.responseTime * 1000).format('MM-DD HH:mm:ss')}
DuringTime: ${duringTime}
BotId: ${cacheObject.botId}
Token: ${cacheObject.token}`;
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

  /**
   * Redis Operations
   */
  public async allKeys(): Promise<string[]> {
    const { app } = this;
    return app.redis.keys('*');
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
}
