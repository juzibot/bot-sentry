import { Service } from 'egg';

/**
 * RedisService Service
 */
export default class RedisService extends Service {

  public async allKeys(): Promise<string[]> {
    const { app } = this;
    return app.redis.keys('*');
  }

  public async deleteKey(key: string): Promise<void> {
    const { app } = this;
    await app.redis.del(key);
  }

  public async getValue(key: string): Promise<any> {
    const { logger, app } = this;
    logger.info(`getValue(${key})`);
    const objectStr = await app.redis.get(key);
    console.log(`objectStr : ${objectStr}`);
    if (objectStr) {
      try {
        return JSON.parse(objectStr);
      } catch (error) {
        return objectStr;
      }
    }
    return null;

  }

  public async setValue(key: string, value: any): Promise<void> {
    const { logger, app } = this;
    logger.info(`setValue(${key}, ${JSON.stringify(value)})`);
    await app.redis.set(key, JSON.stringify(value));
  }

}
