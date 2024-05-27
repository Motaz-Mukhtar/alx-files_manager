import { ObjectId } from 'mongodb';
import { existsSync, promises, fsPromises } from 'fs';
import { v4 } from 'uuid';
import mime from 'mime-types';
import userUtils from '../utils/user.js';
import fileUtils from '../utils/file.js';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

const errorMessage = { error: 'Unauthorized' };
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const file = await fileUtils.validateFileData(req);
    if (!user) return res.status(401).send(errorMessage);
    if (file.error) return res.status(400).send({ error: file.error });

    file.userId = user._id.toString();
    if (file.type === 'folder') {
      await dbClient.filesCollection.insertOne(file);
      return res.status(201).send(file);
    }
    const fileName = v4();

    const filePath = `${FOLDER_PATH}/${fileName}`;
    const buffer = Buffer.from(file.data, 'base64');
    try {
      await promises.mkdir(filePath, { recursive: true });
      await promises.writeFile(filePath, buffer, { encoding: 'utf8' });
    } catch (error) {
      return res.status(400).send({ error });
    }
    file.localPath = filePath;

    await dbClient.filesCollection.insertOne(file);
    return res.status(201).send(file);
  }

  static async getShow(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);

    if (!user) return res.status(401).send(errorMessage);
    const file = await fileUtils.getFileBaseOnUserID({ userId: ObjectId(user._id) });

    if (!file) return res.status(404).send({ error: 'Not found' });

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);

    if (!user) return res.status(401).send(errorMessage);

    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;
    const limit = req.query.limit || 20;
    const skip = page * limit;

    const files = await dbClient.filesCollection.find({ parentId: ObjectId(parentId) })
      .skip(skip).limit(limit).toArray();

    const fileArray = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return res.status(200).send(fileArray);
  }

  static async putPublish(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const fileId = req.params.id;

    if (!user) return res.status(401).send(errorMessage);

    const file = await fileUtils.getFileBaseOnUserID({ userId: ObjectId(user._id) });

    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.filesCollection.find({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });
    const publicFile = await dbClient.filesCollection.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send(publicFile);
  }

  static async putUnpublish(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const fileId = req.params.id;

    if (!user) return res.status(401).send(errorMessage);

    const file = await fileUtils.getFileBaseOnUserID({ userId: ObjectId(user._id) });

    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.filesCollection.find({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    const publicFile = await dbClient.filesCollection.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send(publicFile);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const token = req.headers('X-Token');
    const userId = redisClient.get(`auth_${token}`);

    const file = await fileUtils.getFile({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    if (!file.isPublic || file.userId !== userId) return res.status(404).send({ error: 'Not found' });

    if (file.type === 'folder') return res.status(400).send({ error: 'A folder doesn\'t have content' });
    const localPath = `${FOLDER_PATH}/${file.name}`;
    const fileExists = existsSync(localPath);
    if (!fileExists) return res.status(404).send({ error: 'Not found' });
    let data;
    try {
      data = await fsPromises.readFile(localPath);
    } catch (error) {
      return res.status(404).send({ error: 'Not Found' });
    }
    const mimeType = mime.contentType(file.name);

    res.setHeader('Content-Type', mimeType);

    return res.status(200).send(data);
  }
}

export default FilesController;
