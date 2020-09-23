import { Controller } from 'egg';
import { SECRET_TOKEN } from '../../config/config';

export default class MonitorController extends Controller {

  public async collector () {
    const { ctx, logger } = this;
    const data = ctx.request.body;
    const { secretToken } = data;

    logger.info(`data: ${JSON.stringify(data)}`)

    if (secretToken !== SECRET_TOKEN) {
      ctx.body = {
        status: 0,
      }
    } else {
      await ctx.service.monitorService.collectMonitorInfo(data)
      ctx.body = {
        status: 1,
      }
    }
  }

}
