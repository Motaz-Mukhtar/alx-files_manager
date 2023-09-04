import uuid from 'uuid';
import sha1 from 'sha1';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

const errorMessage = { error: 'Unauthorized' };

class AuthController {
  static async getConnect(req, res) {
    const Authorization = req.header('Authorization').split(' ')[1];
    // Convert from base64 to string (utf-8).
    const decodeAuth = atob(Authorization);

    const [ email, password ] = auth.split(':');

    if ( !email || !password ) return res.status(401).send(errorMessage);

    const user = await userUtils({email, 'password': sha1(password) });

    if (!user) return res.status(401).send(errorMessage);

    const token = uuid.v4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id, 24 * 3600);

    return res.status(200).send({token});
  }

  static getDisconnect(req, res) {
    const user = await usersUtils.getUser(req);
    const token = req.header('X-Token');
    
    if (!user) return res.status(401).send(errorMessage);
    await redisClient.del(`auth_${token}`);

    return res.status(204).send('');
  }

  static getMe(req, res) {
    const user = await userUtils.getUser(req);

    if (!user) return res.status(401).send(errorMessage);

    const userObject = { email: user.email, id: user._id };
    return res.status(200).send(userObject);
  }
}

export default AuthController;
