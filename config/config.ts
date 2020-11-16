export const BASE_URL = 'https://api.weixin.qq.com';
export const APPID = process.env.APPID;
export const APPSECRET = process.env.APPSECRET;

export const INIT_MESSAGE = 'Hi, bot maintainer! \n\nThe message from bot is send by wechaty-puppet-donut, our AIM is to monitor your bot login / logout status. \n\nPlease just ignore this conversation, if you have any question about wechaty, please contact with \n\n[WeChat Account]: botorange22 \n\nThank you very much!';

export const ERROR_COMMAND = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot\nbotId#info: see the detail info of this bot\n#SAN: subscribe alarm notification\n#USAN: unsubscribe alarm notification';

export const SECRET_TOKEN = process.env.SECRET_TOKEN || '8a3fd8c8459588a9';

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
  // NOTIFIER.GAO_YUAN,
  // NOTIFIER.JUZI_BOT,
];

export const BOT_SENTRY_NOTIFIER = 'bot_sentry_notifier';

export const QINGDUN_EXTERNAL_ALERT_URL = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ac1bf810-921c-4c4f-b3c1-a434e9196e96';
export const QINGDUN_ALERT_URL = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=c91e012a-4390-40f3-8dd1-eeb70d7977c9';
export const DONUT_ALERT_URL = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=67fe4966-77ca-4a5e-a3aa-02e30d63d536';

export const QINGDUN_TOKEN_LIST: string[] = [
  'puppet_donut_f9b71b155a9c1225',
  'puppet_donut_9b11217ec182e6a9',
  'puppet_donut_cb9e2e63dc4abe15',
  'puppet_donut_2f61382f0163c909',
  'puppet_donut_d1064978dd4f37c7',
  'puppet_donut_5979f6d473256c78',
  'puppet_donut_f3987b647fd57cd1',
  'puppet_donut_b78c49027081601a',
  'puppet_donut_7a3e5a9e565fb526',
  'puppet_donut_7dd14e36ef76393b',
  'puppet_donut_89fc821247f99210',
  'puppet_donut_c6ae36b8a9069996',
  'puppet_donut_99feedf9140f0488',
  'puppet_donut_e6563a04f77028ec',
  'puppet_donut_cd1f63dc8da95402',
  'puppet_donut_53bfa0c3b620a6e8',
  'puppet_donut_a4123dacc8cba3ae',
  'puppet_donut_d7f010fa11a02ffa',
  'puppet_donut_5bf1f1fd440a954a',
  'puppet_donut_c337b4722814d887',
  'puppet_donut_b2daf667ddf1769b',
  'puppet_donut_be82858fecfa64cb',
  'puppet_donut_cd590da7ca14e347',
  'puppet_donut_2d1d4e0ce148e974',
  'puppet_donut_0da37a277028d008',
  'puppet_donut_c818b23616a7c82d',
  'puppet_donut_11805dbc56b377d6',
  'puppet_donut_788ba77325f96442',
  'puppet_donut_489c259333794db5',
  'puppet_donut_0ee2539d3da6cdd4',
  'puppet_donut_3daf8021ccd3a5e7',
  'puppet_donut_1a2804eddc13643c',
  'puppet_donut_165e18d3442c2e94',
  'puppet_donut_3c9ee3e06716b31e',
  'puppet_donut_7058b45aef29814c',
  'puppet_donut_90961d61b0e23c56',
  'puppet_donut_58a2912a59e19573',
  'puppet_donut_75084dcc273cb57e',
  'puppet_donut_ebdd8ebad5258c41',
  'puppet_donut_eb06504b23d042c9',
  'puppet_donut_7f1a0e2971dbdecb',
  'puppet_donut_45f1a50035045c62',
  'puppet_donut_7f3448055beb367c',
  'puppet_donut_8fba424c5c4354bb',
  'puppet_donut_e96a2488884a19d4',
  'puppet_donut_eb41244ae0d2d6f5',
  'puppet_donut_bcef58f6839983fa',
  'puppet_donut_c1fbe008823138c4',
  'puppet_donut_68f2be5d25421899',
  'puppet_donut_c607e9c525543247',
  'puppet_donut_a9c1542fed83e4b4',
  'puppet_donut_c4acea2af5dd315e',
  'puppet_donut_5130df7c91b84fc3',
  'puppet_donut_9fad101de26c0457',
  'puppet_donut_23c0a990d195c5ae',
  'puppet_donut_ea43fd2d2c3a9158',
  'puppet_donut_7656c6152656ddca',
  'puppet_donut_e434ac709cce875b',
  'puppet_donut_8506cf591ad868ae',
  'puppet_donut_bea8381218f00d66',
  'puppet_donut_b9ecee83eaf455fc',
  'puppet_donut_fd1ab919b2d1a601',
  'puppet_donut_e984d46fa8ce3cd9',
  'puppet_donut_eea56753c460fd6a',
  'puppet_donut_f4ecea90e74328f6',
  'puppet_donut_917c5d11e4095714',
  'puppet_donut_138d33d7cfc7c3ea',
  'puppet_donut_085c988e52e7e22b',
  'puppet_donut_0dc71a860c6c16c9',
  'puppet_donut_6706432100cbff79',
  'puppet_donut_6d996cecf78aef83',
  'puppet_donut_840abba436adca3e',
  'puppet_donut_9dea3083048980f3',
  'puppet_donut_d5443d7185684f8a',
  'puppet_donut_f011d257b8913f64',
  'puppet_donut_908e3baec653c082',
  'puppet_donut_2df34e27fef3763c',
  'puppet_donut_f177decab4257666',
  'puppet_donut_e90f27812f13baf6',
  'puppet_donut_8119cddd58545d09',
  'puppet_donut_c61cbfcdfd90e6aa',
  'puppet_donut_23433d1d498afac0',
  'puppet_donut_1117979bb2b210c5',
  'puppet_donut_0e12391eab7e90ed',
  'puppet_donut_fa6a42873d487ef9',
];
