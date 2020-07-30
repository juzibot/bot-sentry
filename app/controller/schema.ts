export interface BotDingDongInfo {
  botId: string;
  botName: string;
  token: string;
  tokenType: number;
  dingNum: number;
  dongNum: number;
  warnNum: number;
  startTime: number;
  responseTime: number;
}

export interface UserTokenInfo {
  online: boolean;
  memo: string;
  createTime: number;
  updateTime: number;
  expireTime: number;
  token: string;
  type: number;
  _id: string;
}

export interface Message {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  Content: string;
  MsgId: string;
}

export interface DdrObject {
  content: string;
  ddr: number;
}

export enum COMMAND {
  DING_START = '#ding-start',
  DONG = '#dong',
  DDR = '#ddr',
  DEAD = '#dead',
  INFO = '#info',
  CLEAR = '#clear',
  RESET = '#reset',
  DEL = '#del',
  ZW = '#ZW',
  TYPE = '#type',
  TOKEN = '#token',
  SUBSCRIBE = '#I WANT TO RECEIVE WARNING NOTIFIER!',
  UNSUBSCRIBE = '#I DO NOT WANT TO RECEIVE WARNING NOTIFIER ANY MORE!',
}

export const COMMAND_LIST = [
  COMMAND.DING_START,
  COMMAND.DONG,
  COMMAND.DDR,
  COMMAND.DEAD,
  COMMAND.INFO,
  COMMAND.CLEAR,
  COMMAND.RESET,
  COMMAND.DEL,
  COMMAND.ZW,
  COMMAND.TYPE,
  COMMAND.TOKEN,
  COMMAND.SUBSCRIBE,
  COMMAND.UNSUBSCRIBE,
];
