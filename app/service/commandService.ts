import { Service } from 'egg';
import { WARN_OPTIONS, BOT_SENTRY_NOTIFIER, NOTIFIER } from '../../config/config';
import moment = require('moment');
import { Message, DdrObject, BotDingDongInfo } from '../schemas/messageBO';

/**
 * CommandService Service
 */
export default class CommandService extends Service {

  public async startMonitor(message: Message) {
    const { ctx } = this;

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

    const obj = await ctx.service.redisService.getValue(message.FromUserName);
    if (obj) {
      obj.botName = botName;
      obj.token = token;
      obj.tokenType = tokenType;
      obj.warnNum = 0;
      obj.loginTime = Math.floor(Date.now() / 1000);
      obj.responseTime = Math.floor(Date.now() / 1000);
      await ctx.service.redisService.setValue(message.FromUserName, obj);
    } else {
      const cacheObject = {
        botId,
        botName,
        token,
        tokenType,
        startTime: parseInt(message.CreateTime, 10),
        loginTime: parseInt(message.CreateTime, 10),
        warnNum: 0,
        dingNum: 0,
        dongNum: 0,
        responseTime: parseInt(message.CreateTime, 10),
      };
      await ctx.service.redisService.setValue(message.FromUserName, cacheObject);
      await ctx.service.redisService.setValue(botId, message.FromUserName);

      await this.addWxidToToken(botId, botName, token);
    }
  }

  public async getTokenType(token: string) {
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

  public async addWxidToToken(botId: string, botName: string, token: string) {
    const { ctx } = this;

    const botInfo = {
      wxid: botId,
      botName,
      token,
      loginTime: Date.now(),
    };
    let botInfoList = await ctx.service.redisService.getValue(token);
    if (botInfoList && botInfoList.length) {
      const existBot = botInfoList.filter(bot => bot.wxid === botInfo.wxid);
      if (existBot && !existBot.length) {
        botInfoList.push(botInfo);
      }
    } else {
      botInfoList = [ botInfo ];
    }
    await ctx.service.redisService.setValue(token, botInfoList);
  }

  public async processDongMessage(message: Message): Promise<void> {
    const { ctx } = this;

    const cacheObject = await ctx.service.redisService.getValue(message.FromUserName);
    if (!cacheObject) {
      throw new Error(`can not get cache info for ${message.FromUserName}`);
    }
    cacheObject.dongNum += 1;
    cacheObject.warnNum = 0;
    cacheObject.responseTime = parseInt(message.CreateTime, 10);
    await ctx.service.redisService.setValue(message.FromUserName, cacheObject);
  }

  public async ddrList(message: Message) {
    const { ctx } = this;

    const MAX = WARN_OPTIONS.MAX_OBJECT_OF_DDR_MSG;
    const keys = await ctx.service.redisService.allKeys();
    let deadNum = 0;
    let onlineNum = 0;
    let totalDing = 0;
    let totalDong = 0;

    // generate bot object
    const ddrObjectList: DdrObject[] = [];
    for (const key of keys) {
      const cacheObject: BotDingDongInfo | undefined = await ctx.service.redisService.getValue(key);
      if (cacheObject && cacheObject.botId && cacheObject.dingNum) {
        const ddr = ctx.helper.getDDR(cacheObject);
        totalDing += ctx.helper.getRealDingNum(cacheObject);
        totalDong += cacheObject.dongNum;
        const deadFlag = cacheObject.warnNum >= WARN_OPTIONS.WARNING_TIMES;
        cacheObject.warnNum >= WARN_OPTIONS.WARNING_TIMES ? deadNum++ : onlineNum++;
        const object = {
          content: `${this.getPreText(cacheObject, deadFlag)}Ding/Dong: ${ctx.helper.getRealDingNum(cacheObject)}/${cacheObject.dongNum}\nDDR: ${ddr}%\n\n`,
          ddr,
        };
        ddrObjectList.push(object);
      }
    }

    // sort object list and pagenation
    const sortedObjectList = ddrObjectList.sort((a, b) => a.ddr - b.ddr).map(object => object.content);
    let page = 0;
    const totalPage = Math.ceil(sortedObjectList.length / MAX);
    while (sortedObjectList.length !== 0) {
      const partial = sortedObjectList.splice(0, MAX);
      page++;
      const totalDDR = ctx.helper.calculateDDR(totalDing, totalDong);
      const line = '--------------------------\n';
      const pageStr = totalPage === 1 ? '' : `totalPage: ${totalPage}, curPage: ${page}\n`;
      const titleAbstract = `【Statistics】\ntotalDDR: ${totalDDR}%\nonline: ${onlineNum}, offline: ${deadNum}\n${pageStr}${line}`;
      const msg = titleAbstract + partial.join('');
      await ctx.service.messageService.sendMessage(msg, message.FromUserName);
    }
    return totalPage === 0 ? 'No alive bot.' : 'All bots info load finished!';
  }

  public async deadList(message: Message) {
    const { ctx } = this;

    const MAX = WARN_OPTIONS.MAX_OBJECT_OF_DDR_MSG;
    const deadList: string[] = [];
    const keys = await ctx.service.redisService.allKeys();
    const botNumber = keys.length;
    if (!botNumber) {
      return 'No dead bot due to no active bot!';
    }
    for (const key of keys) {
      const object = await ctx.service.redisService.getValue(key);
      if (object && object.botId && object.warnNum >= WARN_OPTIONS.WARNING_TIMES) {
        const baseInfo = ctx.helper.getBaseInfo(object);
        deadList.push(`${this.getPreText(object)}${baseInfo}\n\n`);
      }
    }

    // sort object list and pagenation
    let page = 0;
    const totalPage = Math.ceil(deadList.length / MAX);
    while (deadList.length !== 0) {
      const partial = deadList.splice(0, MAX);
      page++;
      const line = '--------------------------\n';
      const pageStr = totalPage === 1 ? '' : `totalPage: ${totalPage}, curPage: ${page}\n`;
      const titleAbstract = `【Dead List】\n${pageStr}${line}`;
      const msg = titleAbstract + partial.join('');
      await ctx.service.messageService.sendMessage(msg, message.FromUserName);
    }
    return totalPage === 0 ? 'No dead bot.' : 'All dead bots info load finished!';
  }

  private async getUserIdAndBotInfoByBotId(botId: string) {
    const { ctx } = this;
    let errMsg = '';
    const userId = await ctx.service.redisService.getValue(botId);
    if (!userId) {
      errMsg = `Wrong botId[${botId}], please check it again!`;
    }
    const botInfo = await ctx.service.redisService.getValue(userId);
    if (!botInfo) {
      errMsg = `Wrong userId[${userId}], botId[${botId}], please check it again!`;
    }
    return { userId, botInfo, errMsg };
  }

  public async getBotInfo(botId: string) {
    const { ctx } = this;

    const { botInfo, errMsg } = await this.getUserIdAndBotInfoByBotId(botId);
    if (errMsg) {
      return [ errMsg ];
    }
    const baseInfo = ctx.helper.getBaseInfo(botInfo);
    const info = `${this.getPreText(botInfo)}DingNum: ${ctx.helper.getRealDingNum(botInfo)} \nDongNum: ${botInfo.dongNum}\nWarnNum: ${botInfo.warnNum}\n${baseInfo}`;
    const token = botInfo.token;
    return [ info, token ];
  }

  private getPreText(object: BotDingDongInfo, isDead = false) {
    return `【${object.botName || object.botId}】${isDead ? '【offline】' : ''}\nBotId: ${object.botId}\n`;
  }

  public async clearWarnNumByBotId(botId: string) {
    const { ctx } = this;

    const { userId, botInfo, errMsg } = await this.getUserIdAndBotInfoByBotId(botId);
    if (errMsg) {
      return errMsg;
    }
    botInfo.warnNum = 0;
    botInfo.responseTime = Math.floor(Date.now() / 1000);
    await ctx.service.redisService.setValue(userId, botInfo);
  }

  public async resetDingDongByBotId(botId: string) {
    const { ctx } = this;

    const { userId, botInfo, errMsg } = await this.getUserIdAndBotInfoByBotId(botId);
    if (errMsg) {
      return errMsg;
    }
    botInfo.dingNum = 0;
    botInfo.dongNum = 0;
    botInfo.warnNum = 0;
    botInfo.responseTime = Math.floor(Date.now() / 1000);
    await ctx.service.redisService.setValue(userId, botInfo);
  }

  public async delObjectByBotId(message: Message, botId: string): Promise<string> {
    const { ctx } = this;

    if (message.FromUserName !== NOTIFIER.SU_CHANG) {
      return 'you have no permition';
    }
    const { userId, errMsg } = await this.getUserIdAndBotInfoByBotId(botId);
    if (errMsg) {
      return errMsg;
    }
    await ctx.service.redisService.deleteKey(botId);
    await ctx.service.redisService.deleteKey(userId);
    return 'already deleted!';
  }

  public async clearWarnNum() {
    const { ctx } = this;

    const keys = await ctx.service.redisService.allKeys();
    for (const key of keys) {
      const object = await ctx.service.redisService.getValue(key);
      if (object && object.botId) {
        object.warnNum = 0;
        object.responseTime = Math.floor(Date.now() / 1000);
        await ctx.service.redisService.setValue(key, object);
      }
    }
  }

  public async subscribeWarningMessage(message: Message) {
    const { ctx } = this;

    const user = message.FromUserName;
    const userList = await ctx.service.redisService.getValue(BOT_SENTRY_NOTIFIER);
    userList.push(user);
    await ctx.service.redisService.setValue(BOT_SENTRY_NOTIFIER, userList);
    return 'Done!';
  }

  public async unSubscribeWarningMessage(message: Message) {
    const { ctx } = this;

    const user = message.FromUserName;
    const userList = await ctx.service.redisService.getValue(BOT_SENTRY_NOTIFIER);
    const index = userList.indexOf(user);
    if (index === -1) {
      return 'You are not in NOTIFIER LIST!';
    }
    userList.splice(index, 1);
    await ctx.service.redisService.setValue(BOT_SENTRY_NOTIFIER, userList);
    return 'Done!';
  }

  public async getWxidListByToken(token: string) {
    const { ctx } = this;

    const list = await ctx.service.redisService.getValue(token);
    if (!list || list.length === 0) {
      return `can not find wxid list by this token: ${token}, please check it again.`;
    }

    const strList = list.map(object => `【${object.wxid}】\nBotName: ${object.botName}\nloginTime: ${moment((object.startTime || object.loginTime) * 1000).format('MM-DD HH:mm:ss')}\n\n`);
    return strList.join('').toString();
  }

  public warnMessage(cacheObject: BotDingDongInfo, baseInfo: string): string {
    return `【掉线报警(${cacheObject.botName || cacheObject.botId})】\nBotId: ${cacheObject.botId}\n${baseInfo}`;
  }

  public warnMessageMarkdown(cacheObject: BotDingDongInfo, baseInfo: string): string {
    return `【掉线报警(${cacheObject.botName || cacheObject.botId})】\n> BotId: ${cacheObject.botId}\n${baseInfo}\n> Token: ${cacheObject.token}`;
  }

}
