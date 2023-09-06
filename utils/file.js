import { ObjectId } from 'mongodb';
import dbClient from './db';

class fileUtils {
  static async validateFileData(req) {
    const file;
    const { name, type, isPublic = false, data } = req.body;
    let { parentId = 0 } = req.body;

    if (!name) return { error: 'Missing name' };
    if (!type || type !== 'folder' | 'file' | 'image') {
      return { error: 'Missing type' };
    }
    if (!data && type != 'folder') return { error: 'Missing data' };

    if (parentId != 0) {
      file = await this.getFile({ _id: ObjectId(parentId) });
      
    } else {
      file = null;
    }

    if (!file) return { error: 'Parent not found' };
    else if (file.type !== 'folder') return { error: 'Parent is not a folder' };

    const fileObject = { name, type, parentId, isPublic, data };
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