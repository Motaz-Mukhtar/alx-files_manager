import { ObjectId } from 'mongodb';
import { mkdir, writeFile } from 'fs/promises';
import { v4 } from 'uuid';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';
import dbClient from '../utils/db';

const errorMessage = { error: 'Unauthorized' };
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static postUpload(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const file = await fileUtils.validateFileData(req);    
    if (!user) return res.status(401).send(errorMessage);
    if (file.error) return res.status(400).send(file.error);

    file.userId = user._id.toString();
    if (file.type === 'folder') {
      await dbClient.filesCollection.insertOne(file);
      return res.status(201).send(file);
    }
    const fileName = v4();

    const filePath = `${FOLDER_PATH}/${fileName}`;
    const buffer = Buffer.from(file.data, 'base64');    
    try {
      await mkdir(filePath, { recursive: true });
      await writeFile(filePath, buffer, { encoding: 'utf8' });
    } catch (error) {
      return res.status(400).send({ error });
    }
    file.localPath = filePath;

    await dbClient.filesCollection.insertOne(file);
    return res.status(201).send(file);
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    const user = await userUtils.getUserBasedOnToken(req);
    
    if (!user) return res.status(401).send(errorMessage);
    const file = await fileUtils.getFileBaseOnUserID({userId: ObjectId(user._id)});

    if (!file) return status(404).send({ error: 'Not found' });

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

    const fileArray = files.map((file) => { return {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }})

    return res.status(200).send(fileArray);
  }

  static async putPublish(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const fileId = req.params.id;

    if (!user) return res.status(401).send(errorMessage);

    const file = await fileUtils.getFileBaseOnUserID({ userId: ObjectId(user._id) })

    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.filesCollection.find({ _id: ObjectId(fileId) }, { $set: { isPublic: true } })
    const publicFile = await dbClient.filesCollection.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send(publicFile)
  }

  static async putUnpublish(req, res) {
    const user = await userUtils.getUserBasedOnToken(req);
    const fileId = req.params.id;

    if (!user) return res.status(401).send(errorMessage);

    const file = await  fileUtils.getFileBaseOnUserID({ userId: ObjectId(user._id) })

    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.filesCollection.find({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    const publicFile = await dbClient.filesCollection.findOne({ _id: ObjectId(fileId) });
    return res.status(200).send(publicFile)

  }
}

export default FilesController;