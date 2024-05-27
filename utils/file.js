import { ObjectId } from 'mongodb';
import dbClient from './db.js';

class fileUtils {
  static async validateFileData(req) {
    let file;
    const {
      name, type, isPublic = false, data,
    } = req.body;
    const { parentId = 0 } = req.body;

    if (!name) return { error: 'Missing name' };
    if (!type) {
      return { error: 'Missing type' };
    }
    if (type !== 'folder' && type !== 'file' && type !== 'image') return { error: 'Missing name' };
    if (!data && type !== 'folder') return { error: 'Missing data' };

    if (parentId !== 0) {
      file = await this.getFile({ _id: ObjectId(parentId) });
      if (!file) return { error: 'Parent not found' };
    }
    if (file && file.type !== 'folder') return { error: 'Parent is not a folder' };

    const fileObject = {
      name, type, parentId, isPublic, data,
    };
    return fileObject;
  }

  static async getFile(query) {
    const file = await dbClient.filesCollection.findOne(query);
    return file;
  }

  static async getFileBaseOnUserID(query) {
    const file = await dbClient.filesCollection.findOne(query);
    return file;
  }
}

export default fileUtils;
