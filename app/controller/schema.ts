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
