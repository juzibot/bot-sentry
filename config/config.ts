export const BASE_URL = 'https://api.weixin.qq.com';
export const APPID = process.env.APPID;
export const APPSECRET = process.env.APPSECRET;

export const INIT_MESSAGE = 'Hi, bot maintainer! \n\nThe message from bot is send by wechaty-puppet-donut, our AIM is to monitor your bot login / logout status. \n\nPlease just ignore this conversation, if you have any question about wechaty, please contact with \n\n[WeChat Account]: botorange22 \n\nThank you very much!';

export const ERROR_COMMAND = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot\nbotId#info: see the detail info of this bot\n#SAN: subscribe alarm notification\n#USAN: unsubscribe alarm notification';

export enum WARN_OPTIONS {
  MY_TOKEN = '5f6f30b388ca0401',
  WARNING_TIMES = 3,
  MAX_OBJECT_OF_DDR_MSG = 7,
  TIMEOUT = 100,
}

export enum NOTIFIER {
  SU_CHANG = 'owRfxwoWHK_iwYZxuFmXFjF0vbqo', // su
  GAO_YUAN = 'owRfxwrr-SCyLFGmCXBX8A_TzzoU', // gao
  JUZI_BOT = 'owRfxwtsRGulmOxiyDrHVupd2gic', // Juzi.Bot
  // 'owRfxwjXYizqQxxEN_Y0YitRPUH0', // yin
}

export const NOTIFY_LIST = [
  NOTIFIER.SU_CHANG,
  NOTIFIER.GAO_YUAN,
  NOTIFIER.JUZI_BOT,
];

export const BOT_SENTRY_NOTIFIER = 'bot_sentry_notifier';
