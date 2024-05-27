import { v4 } from 'uuid';
import sha1 from 'sha1';

import redisClient from '../utils/redis.js';
import userUtils from '../utils/user.js';

const errorMessage = { error: 'Unauthorized' };

class AuthController {
  static async getConnect(req, res) {
    const Authorization = req.header('Authorization').split(' ')[1];
    // Convert from base64 to string (utf-8)
    const decodeAuth = atob(Authorization);

    const [email, password] = decodeAuth.split(':');

    if (!email || !password) return res.status(401).send(errorMessage);

    const user = await userUtils.getUser({ email, password: sha1(password) });

    if (!user) return res.status(401).send(errorMessage);

    const token = v4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 24 * 3600);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const token = req.header('X-Token');

    if (!user) return res.status(401).send(errorMessage);
    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

export default AuthController;
