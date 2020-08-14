import { parseString } from 'xml2js';
import { BotDingDongInfo, XMLObject } from '../schemas/messageBO';
import moment = require('moment');

module.exports = {
  getRealDingNum(object: BotDingDongInfo) {
    const { startTime } = object;
    const now = Date.now();
    const realDingNum = startTime ? Math.floor((now / 1000 - startTime) / 60) : 0;
    return realDingNum;
  },

  calculateDDR(ding: number, dong: number) {
    const ddr = ding === 0 ? 0.00 : Number(((dong / ding) * 100).toFixed(2));
    return ddr > 100 ? 100 : ddr;
  },

  getDDR(object: BotDingDongInfo) {
    const { dongNum } = object;
    const realDingNum = this.getRealDingNum(object);
    return this.calculateDDR(realDingNum, dongNum);
  },

  formatNumber(num: number) {
    return num < 10 ? `0${num}` : num;
  },

  secondsToDhms(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? this.formatNumber(d) + 'd ' : '';
    const hDisplay = h > 0 ? this.formatNumber(h) + 'h ' : '';
    const mDisplay = m > 0 ? this.formatNumber(m) + 'm ' : '';
    const sDisplay = s > 0 ? this.formatNumber(s) + 's' : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
  },

  getBaseInfo(object: BotDingDongInfo) {
    const time = object.loginTime || object.startTime;
    const duringTime = object.responseTime === time ? '0s' : this.secondsToDhms(object.responseTime - time);
    const ddr = this.getDDR(object);
    const info = `注册时间: ${moment(object.startTime * 1000).format('MM-DD HH:mm:ss')}\n登录时间: ${moment(time * 1000).format('MM-DD HH:mm:ss')}\n在线时长: ${duringTime}\n最近响应时间: ${moment(object.responseTime * 1000).format('MM-DD HH:mm:ss')}\nDDR: ${ddr}%`;
    return info;
  },

  xmlToJson(xml: string): Promise<XMLObject> {
    return new Promise((resolve, reject) => {
      parseString(xml, { explicitArray: false }, (err, result: XMLObject) => {
        if (err) {
          reject(err);
        }
        return resolve(result);
      });
    });
  },

};
