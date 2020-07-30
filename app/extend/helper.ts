import { BotDingDongInfo } from '../controller/schema';

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

  secondsToDhms(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? d + 'd ' : '';
    const hDisplay = h > 0 ? h + 'h ' : '';
    const mDisplay = m > 0 ? m + 'm ' : '';
    const sDisplay = s > 0 ? s + 's' : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
  },
};
