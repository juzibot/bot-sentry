import { Subscription } from 'egg';
import MessageController from '../controller/message';
import { WARN_OPTIONS } from '../../config/config';

class CheckDeadBot extends Subscription {
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
      interval: '20m',
      immediate: true,
    };
  }

  async subscribe() {
    const { ctx } = this;
    const keys = await ctx.service.redisService.allKeys();

    let num = 0;
    const deadTokenList: string[] = [];
    await Promise.all(keys.map(async (key: string) => {
      const cacheObject = await ctx.service.redisService.getValue(key);

      if (cacheObject && cacheObject.botId && MessageController.type.includes(cacheObject.tokenType)) {
        const diffTime = Math.floor(Date.now() / 1000) - cacheObject.responseTime;
        if (cacheObject.warnNum > WARN_OPTIONS.WARNING_TIMES) {
          if (diffTime < 2 * 24 * 3600) {
            num++;
            await ctx.service.messageService.sendMessage('#ding', key);
          } else {
            deadTokenList.push(cacheObject.token);
          }
        }
      }
    }));
    ctx.logger.info(`
    ==================================================
    bot response in 2 days number: ${num}
    dead token list length: ${deadTokenList.length}
    list detail: ${deadTokenList}
    ==================================================
    `);
  }

}

module.exports = CheckDeadBot;
