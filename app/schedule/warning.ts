import { Subscription } from 'egg';
import { sendMessage } from '../util/message';
import HomeController from '../controller/home';
import { NOTIFY_LIST, WARN_OPTIONS } from '../../config/config';

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
      immediate: false,
    };
  }

  async subscribe() {
    const { ctx, app } = this;
    const keys = await app.redis.keys('*');
    ctx.logger.info(`Ready to send #ding for each bot, bot length: ${keys.length}`);

    keys.forEach(async (key: string) => {
      // send #ding
      const _cacheObject = await app.redis.get(key);
      if (!_cacheObject) {
        throw new Error(`can not get cache object by key : ${key}`);
      }

      const cacheObject = JSON.parse(_cacheObject);
      if (cacheObject.botId && cacheObject.warnNum < WARN_OPTIONS.WARNING_TIMES) {
        await sendMessage('#ding', key);
        cacheObject.dingNum += 1;
        await app.redis.set(key, JSON.stringify(cacheObject));
      }

      // warning
      const flag = Math.round(Date.now() / 1000) - cacheObject.responseTime;
      if (cacheObject.warnNum && cacheObject.warnNum === WARN_OPTIONS.WARNING_TIMES && flag > WARN_OPTIONS.TIMEOUT) {
        const warnMessage = HomeController.warnMessage(cacheObject);
        NOTIFY_LIST.map(id => sendMessage(warnMessage, id));
        cacheObject.warnNum += 1;
        await app.redis.set(key, JSON.stringify(cacheObject));
        return;
      } else if (cacheObject.responseTime && flag > WARN_OPTIONS.TIMEOUT) {
        cacheObject.warnNum += 1;
        await app.redis.set(key, JSON.stringify(cacheObject));
      }
    });
  }

}

module.exports = Warning;
