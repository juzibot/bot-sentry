// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import { EggAppConfig } from 'egg';
import ExportConfigDefault from '../../config/config.default';
import * as ExportConfig from '../../config/config';
type ConfigDefault = ReturnType<typeof ExportConfigDefault>;
type Config = typeof ExportConfig;
type NewEggAppConfig = ConfigDefault & Config;
declare module 'egg' {
  interface EggAppConfig extends NewEggAppConfig { }
}