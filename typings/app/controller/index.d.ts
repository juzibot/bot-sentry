// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportSchema from '../../../app/controller/schema';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    schema: ExportSchema;
  }
}
