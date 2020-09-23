// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportMonitor from '../../../app/model/Monitor';
import ExportUser from '../../../app/model/User';

declare module 'egg' {
  interface IModel {
    Monitor: ReturnType<typeof ExportMonitor>;
    User: ReturnType<typeof ExportUser>;
  }
}
