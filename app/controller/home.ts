import { Controller } from 'egg';
import crypto = require('crypto');

import { xmlToJson } from '../util/xmlToJson';
import { PRIVATE_LIST, WARN_OPTIONS, NOTIFY_LIST, INIT_MESSAGE } from '../../config/config';
import { Message, COMMAND_LIST, COMMAND } from './schema';

export default class HomeController extends Controller {

  public static type = [ 1 ];

  public async check() {
    const { ctx, logger } = this;
    logger.info(`check(), time: ${new Date()}`);
    const query = ctx.query;
    const { signature, timestamp, nonce, echostr } = query;
    const str = [ timestamp, nonce, WARN_OPTIONS.MY_TOKEN ].sort().join('');
    const result = crypto.createHash('sha1').update(str).digest('hex');

    if (result === signature) {
      ctx.body = echostr;
    }
  }

  public async receiveMessage() {
    const { ctx, logger } = this;
    logger.info('receiveMessage()');
    const xmlBody = ctx.request.body;

    const xmlObject = await xmlToJson(xmlBody);
    const message: Message = xmlObject.xml;

    ctx.body = await this.processMessage(message);
  }

  private async processMessage(message: Message) {
    const { ctx } = this;
    if (message.MsgType !== 'text') {
      return;
    }
    const command = COMMAND_LIST.map(_command => this.checkCommand(message, _command)).filter(str => !!str)[0];
    let responseData = '';

    const key = message.Content.split('#')[0];

    switch (command) {
      case COMMAND.DING_START:
        await ctx.service.commandService.startMonitor(message);
        responseData = INIT_MESSAGE;
        break
      case COMMAND.DONG:
        await ctx.service.commandService.processDongMessage(message);
        responseData = '@received-dong-message'
        break
      case COMMAND.DDR:
        const ddrString = await ctx.service.commandService.ddrList(message);
        responseData = ddrString
        break
      case COMMAND.DEAD:
        const deadString = await ctx.service.commandService.deadList();
        responseData = deadString
        break
      case COMMAND.INFO:
        const botInfo = await ctx.service.commandService.getBotInfo(key);
        responseData = botInfo
        break
      case COMMAND.CLEAR:
        await ctx.service.commandService.clearWarnNumByBotId(key);
        responseData = 'already cleared!'
        break
      case COMMAND.RESET:
        await ctx.service.commandService.resetDingDongByBotId(key);
        responseData = 'already reset!'
        break
      case COMMAND.DEL:
        const resMsg = await ctx.service.commandService.delObjectByBotId(message, key);
        responseData = resMsg
        break
      case COMMAND.ZW:
        await ctx.service.commandService.clearWarnNum();
        responseData = 'already cleared all!'
        break
      case COMMAND.TYPE:
        HomeController.type = key.split(',').map(n => Number(n));
        responseData = `set monitor type to ${key}`
        break
      case COMMAND.TOKEN:
        const wxidListOfToken = await ctx.service.commandService.getWxidListByToken(key);
        responseData = wxidListOfToken
        break
      case COMMAND.SUBSCRIBE:
        await ctx.service.commandService.subscribeWarningMessage(message)
        responseData = 'Done!'
        break
      case COMMAND.UNSUBSCRIBE:
        await ctx.service.commandService.unSubscribeWarningMessage(message);
        responseData = 'Done!'
        break
      default:
        responseData = 'Error command!\n\nCommand List:\n#ddr: show all bot ding-dong rate\n#dead: show all dead bot\nbotId#info: see the detail info of this bot';
        break
    }
    return this.responseMessage(message, responseData);
  }

  private checkCommand(message: Message, command: string) {
    if (PRIVATE_LIST.includes(command) && message.FromUserName !== NOTIFY_LIST[0]) {
      return 'NO_PERMITION';
    }
    return message.Content.includes(command) ? command : 'UNKNOWN_COMMAND';
  }

  private responseMessage(message: Message, text: string): string {
    return `<xml>
      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${text}]]></Content>
    </xml>`;
  }

}
