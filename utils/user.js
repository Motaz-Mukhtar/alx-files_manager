import redisClient from 'redis';
import dbClient from 'db';

const errorMessage = { error: 'Unauthorized' };

class userUtils {
  static async getUserBasedOnToken(request) {
    const Xtoken = request.header('X-Token');

    if (!Xtoken) return undefined;

    const key = `auth_${Xtoken}`;
    const userId = await redisClient.get(key);

    if (!userId) return undefined;

    const user = await dbClient.usersCollection.findOne({ _id: userId });

    if (!user) return undefined;

    return user;
  }

  static async getUser(query) {
    const user = db.usersCollection.findOne(query);
    return user;
  }
}

export default userUtils;