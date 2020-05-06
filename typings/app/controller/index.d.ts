// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportMessage from '../../../app/controller/message';
import ExportTokenManager from '../../../app/controller/tokenManager';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    message: ExportMessage;
    tokenManager: ExportTokenManager;
  }
}
