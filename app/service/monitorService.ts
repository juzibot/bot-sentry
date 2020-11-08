import { Service } from 'egg';
import { MonitorInfo } from '../schemas/monitorBO';

/**
 * MonitorService Service
 */
export default class MonitorService extends Service {

  public async collectMonitorInfo(data: MonitorInfo) {
    const { ctx, logger } = this;
    logger.info('collectMonitorInfo()');
    const {
      company,
      tokenNum,
      stopTokenNum,
      removeTokenNum,
      missTokenNum,
      deadTokenNum,
      detailInfo,
    } = data;
    const monitorDBObject = {
      company,
      tokenNum,
      stopTokenNum,
      removeTokenNum,
      missTokenNum,
      deadTokenNum,
      detailInfo,
    };
    await ctx.model.Monitor.create(monitorDBObject);
  }
}
