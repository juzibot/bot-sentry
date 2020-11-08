import { Service } from 'egg';
import axios from 'axios';

export default class ReportService extends Service {

  public async sendNotification(
    content: string,
    url: string,
    mention?: boolean,
  ) {
    if (!url) {
      this.logger.info('no xiaoju monitor alert url, skip sending monitor alert.');
      return;
    }
    await this.send(content, url, mention);
  }

  private async send(
    content: string,
    url: string,
    mention?: boolean,
  ) {
    /**
     * Send regular report message
     */
    await this.sendRequest(url, {
      msgtype: 'markdown',
      markdown: { content },
    });
    /**
     * When mention is required, will trigger the mention message to mention everyone
     */
    if (mention) {
      await this.sendRequest(url, {
        msgtype: 'text',
        text: {
          content: '请大家关注一下上面的监控信息',
          mentioned_list: [ '@all' ],
        },
      });
    }
  }

  private async sendRequest(
    url: string,
    data: any,
  ) {
    try {
      await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10 * 1000,
      });
    } catch (e) {
      this.logger.error(`Sending notification failed, reason:
      ${e.stack}\n\nData: \n${JSON.stringify(data)}`);
      throw e;
    }
  }

}
