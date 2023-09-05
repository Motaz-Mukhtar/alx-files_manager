import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const errorMessage = { error: 'Unauthorized' };

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    if (await dbClient.usersCollection.findOne({ email })) {
      return res.status(400).send({ error: 'Already exist' });
    }
    const data = { email, password: sha1(password) };
    const newUser = await dbClient.usersCollection.insertOne(data);
    return res.status(201).send({ id: newUser.insertedId, email });
  }

  static async getMe(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);

    if (!user) return res.status(401).send(errorMessage);

    const userObject = { id: user._id.toString(), email: user.email };
    return res.status(200).send(userObject);
  }
}

export default UsersController;
