// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportMessage from '../../../app/controller/message';
import ExportMonitor from '../../../app/controller/monitor';

declare module 'egg' {
  interface IController {
    message: ExportMessage;
    monitor: ExportMonitor;
  }
}
