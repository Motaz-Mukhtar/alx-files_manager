import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;
