// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportTest from '../../../app/service/Test';
import ExportCommandService from '../../../app/service/commandService';
import ExportMessageService from '../../../app/service/messageService';
import ExportMonitorService from '../../../app/service/monitorService';
import ExportRedisService from '../../../app/service/redisService';

declare module 'egg' {
  interface IService {
    test: AutoInstanceType<typeof ExportTest>;
    commandService: AutoInstanceType<typeof ExportCommandService>;
    messageService: AutoInstanceType<typeof ExportMessageService>;
    monitorService: AutoInstanceType<typeof ExportMonitorService>;
    redisService: AutoInstanceType<typeof ExportRedisService>;
  }
}
