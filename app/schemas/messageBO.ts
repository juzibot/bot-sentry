export interface Message {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  Content: string;
  MsgId: string;
}

export interface BotDingDongInfo {
  botId: string;
  botName: string;
  token: string;
  tokenType: number;
  dingNum: number;
  dongNum: number;
  warnNum: number;
  startTime: number;
  loginTime: number;
  responseTime: number;
}

export interface DdrObject {
  content: string;
  ddr: number;
}

export interface XMLObject {
  xml: Message;
}

export interface TemplateObject {
  name: string;
  wxid: string;
  time: string;
  remark: string;
}
