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
    const { app } = this;
    const objectStr = await app.redis.get(key);
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
    const { app } = this;
    await app.redis.set(key, JSON.stringify(value));
  }

}
