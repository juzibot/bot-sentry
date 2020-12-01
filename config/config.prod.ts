import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.mongoose = {
    client: {
      url: 'mongodb://161.189.20.226/donut',
      options: { useUnifiedTopology: true },
    },
  };
  return config;
};
