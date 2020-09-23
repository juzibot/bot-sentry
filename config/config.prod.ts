import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.mongoose = {
    client: {
      url: 'mongodb://68.79.47.251/donut',
      options: { useUnifiedTopology: true },
    },
  };
  return config;
};
