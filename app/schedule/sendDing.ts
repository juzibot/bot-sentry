import { sendMessage } from '../controller/message';
/* import { MemoryCard } from 'memory-card';
const MEMORY_CARD_NAME = 'bot-name';
const memoryCard = new MemoryCard(MEMORY_CARD_NAME);
memoryCard.load(); */
const Subscription = require('egg').Subscription;
import HomeController from '../controller/home'
import { Config } from '../../config/config';

const memoryCard = HomeController.memoryCard
class SendDing extends Subscription {
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
      type: 'worker',
      // cron: '0 0 3 * * *',
      interval: '1m',
      immediate: true,
    };
  }

  async subscribe() {
    this.ctx.logger.info(`Ready to send #ding for each bot, bot lenght: ${await memoryCard.size}`);
    for await (const key of memoryCard.keys()) {
      // send #ding
      const cacheObject = await memoryCard.get(key);
      if (!cacheObject.warnNum) {
        await sendMessage('#ding', key);
        cacheObject.dingNum += 1;
        await memoryCard.set(key, cacheObject);
      }

      // warning
      const flag = Math.round(Date.now() / 1000) - cacheObject.responseTime;
      if (cacheObject.warnNum >= Config.WARNING_TIMES && flag > Config.TIMEOUT) {
        return;
      }
      if (cacheObject.responseTime && flag > Config.TIMEOUT) {
        const warnMessage = HomeController.warnMessage(cacheObject);
        sendMessage(warnMessage);
        // sendMessage(warnMessage, Config.MANAGER_GAO);
        cacheObject.warnNum += 1;
        await memoryCard.set(key, cacheObject);
      }
    }
  }

}

module.exports = SendDing;