import { Subscription } from 'egg';
import MessageController from '../controller/message';
import { WARN_OPTIONS, NOTIFIER } from '../../config/config';
import { TemplateObject, BotDingDongInfo } from '../schemas/messageBO';
import moment = require('moment');

class Warning extends Subscription {
  /**
   * @property {Object} schedule
   *  - {String} type - schedule type, `worker` or `all` or your custom types.
   *  - {String} [cron] - cron expression, see [below](#cron-style-scheduling)
   *  - {Object} [cronOptions] - cron options, see [cron-parser#options](https://github.com/harrisiirak/cron-parser#options)
   *  - {String | Number} [interval] - interval expression in millisecond or express explicitly like '1h'. see [below](#interval-style-scheduling)
   *  - {Boolean} [immediate] - To run a scheduler at startup
   *  - {Boolean} [disable] - whether to disable a scheduler, usually use in dynamic schedule
   *  - {Array} [env] - only enable scheduler when match env list
   */
  static get schedule() {
    return {
      type: 'all',
      // cron: '0 0 3 * * *',
      interval: '1m',
      immediate: true,
    };
  }

  async subscribe() {
    const { ctx } = this;
    const keys = await ctx.service.redisService.allKeys();

    const notifierList = await ctx.service.messageService.getOrInitNotifierList();
    let num = 0;
    let activeNum = 0;
    await Promise.all(keys.map(async (key: string) => {
      const cacheObject = await ctx.service.redisService.getValue(key);

      if (cacheObject && cacheObject.botId && MessageController.type.includes(cacheObject.tokenType)) {
        num++;
        if (cacheObject.warnNum > WARN_OPTIONS.WARNING_TIMES) {
          ctx.logger.info(`DEAD bot name: ${cacheObject.botName}, num: ${num}`);
          return;
        }

        // send #ding
        if (cacheObject.warnNum < WARN_OPTIONS.WARNING_TIMES) {
          activeNum++;
          ctx.logger.info(`ACTIVE bot name: ${cacheObject.botName}, num: ${num}`);
          await ctx.service.messageService.sendMessage('#ding', key);
          cacheObject.dingNum += 1;
        }

        // warning
        if (cacheObject.warnNum === WARN_OPTIONS.WARNING_TIMES) {
          await this.sendWarnMessage(cacheObject, notifierList);
        }

        const diffTime = cacheObject.responseTime && Math.round(Date.now() / 1000) - cacheObject.responseTime;
        if (diffTime > WARN_OPTIONS.TIMEOUT && cacheObject.warnNum <= WARN_OPTIONS.WARNING_TIMES) {
          cacheObject.warnNum += 1;
        }
        await ctx.service.redisService.setValue(key, cacheObject);
      }
    }));
    ctx.logger.info(`
    ==================================================
    all bot num: ${num}, active bot num: ${activeNum}
    ==================================================
    `)
  }

  private async sendWarnMessage(cacheObject: BotDingDongInfo, notifierList: string[]) {
    const { ctx } = this;
    const baseInfo = ctx.helper.getBaseInfo(cacheObject);
    const warnMessage = ctx.service.commandService.warnMessage(cacheObject, baseInfo);

    notifierList.map(async (id: string) => {
      if (id === NOTIFIER.JUZI_BOT) { // for JuziBot forward this message to ALARM-ROOM
        await ctx.service.messageService.sendMessage(warnMessage, id);
      } else {
        const object: TemplateObject = {
          name: cacheObject.botName,
          wxid: cacheObject.botId,
          time: moment(cacheObject.responseTime * 1000).format('MM-DD HH:mm:ss'),
          remark: baseInfo,
        };
        await this.ctx.service.messageService.sendTemplateMessage(object, id);
      }
    });
  }

}

module.exports = Warning;
