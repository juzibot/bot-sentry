import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  config.mongoose = {
    client: {
      url: 'mongodb://52.82.27.110/donut',
      options: { useUnifiedTopology: true },
    },
  };
  return config;
};
