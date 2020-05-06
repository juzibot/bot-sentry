export interface BotDingDongInfo {
  botId: string;
  dingNum: number;
  dongNum: number;
  warnNum: number;
  startTime: number;
  responseTime: number;
}

export interface Message {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  Content: string;
  MsgId: string;
}
