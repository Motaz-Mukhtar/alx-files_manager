import redis from 'redis';

class RedisClient {
  constructor() {
    this._client = redis.createClient();
    this._
  }

  isAlive () {
    this._client.on('connect', () => return true);
    return false;
  }

  async get (key) {
    return await this._client.get(key);
  }

  async set (key, value, duration) {

  }

  async del (key) {

  }
}

const redisClient = new RedisClient();
export default dredisClient;
