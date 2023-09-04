import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    res.statusCode = 200;
    const dbStatus = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.send(dbStatus);
  }

  static async getStats(req, res) {
    res.statusCode = 200;
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };

    res.status(200).send(stats);
  }
}

export default AppController;
