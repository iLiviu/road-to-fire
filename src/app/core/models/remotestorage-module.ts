import { StorageSerializer } from './storage-serializer';
import { StorageChangeEvent, StorageModule, UnsupportedEncryptionError } from '../services/storage.service';
import { Dictionary } from 'src/app/shared/models/dictionary';

/**
 * Meta information about a storage object type
 */
export interface RSModuleObjectType {
  /** path to a single object or a folder containing multiple objects */
  path: string;
  /** object type identifier */
  alias: string;
  /** true if `path` is a folder, that contains multiple objects  */
  collectionType: boolean;
}

export interface RSModuleExportObject {
  /** path to a single object or a folder containing multiple objects */
  path: string;
  /** object type identifier */
  alias: string;
  data: any;
}

export interface RSModuleExportData {
  moduleId: string;
  data: RSModuleExportObject[];
}


export interface RemoteStorageModule extends StorageModule {
  /**
   * Read and restore all serializable objects (used to add/remove encryption)
   */
  forceReWriteAll(): Promise<void>;

  /**
   * Get all meta info for all object types stored by this module
   */
  getObjectTypes(): RSModuleObjectType[];

  /**
   * Get all meta info for all serializable object types stored by this module
   */
  getSerializableObjectTypes(): RSModuleObjectType[];


  /**
   * Get storage client to be used directly by external objects
   */
  getPrivateClient(): any;
}

/**
 * Base class for a RemoteStorage module
 */
export abstract class BaseRemoteStorageModule implements RemoteStorageModule {

  /** Max file age, in seconds to cache an object in local storage, before requesting the cloud stored version.
   * Use false to always use local version .
   */
  protected maxFileAge = false;
  protected serializer: StorageSerializer;
  /**  RemoteStorage client handling "private" app data */
  protected privateClient: any;
  /** RemoteStorage client handling "public" app data */
  protected publicClient: any;
  private changeListener: (event: StorageChangeEvent) => void;

  constructor(privateClient: any, publicClient: any, serializer: StorageSerializer) {
    this.privateClient = privateClient;
    this.publicClient = publicClient;
    this.serializer = serializer;
    this.privateClient.on('change', this.onChange);

  }

  /**
   * Retrieve an object from storage and deserialize it
   */
  protected getObject = async (path: string): Promise<any> => {
    const response = await this.privateClient.getObject(path, this.maxFileAge);
    return this.serializer.unserialize(response);
  }

  /**
   * Retrieve all objects from a folder and deserialize them
   */
  protected getAll = async (folder: string): Promise<Dictionary<any>> => {
    const items = await this.privateClient.getAll(folder, this.maxFileAge);
    if (items) {
      for (const path of Object.keys(items)) {
        items[path] = this.serializer.unserialize(items[path]);
      }
    }
    return items;
  }

  /**
   * Store an object in storage, serializing it first
   */
  protected storeObject(objectType: string, path: string, obj: any): Promise<any> {
    const serializedObj = this.serializer.serialize(obj);
    const promise = this.privateClient.storeObject(objectType, path, serializedObj);
    return promise;
  }

  abstract getId(): string;

  async forceReWriteAll(): Promise<void> {
    const readPromises: Promise<void>[] = [];
    const storePromises: Promise<any>[] = [];
    const objectTypes = this.getSerializableObjectTypes();
    for (const objType of objectTypes) {
      if (objType.collectionType) {
        const readPromise = this.getAll(objType.path)
          .then((items) => {
            for (const path in items) {
              if (typeof items[path] === 'object') {
                storePromises.push(this.storeObject(objType.alias, objType.path + path, items[path]));
              }
            }
          });
        readPromises.push(readPromise);
      } else {
        const readPromise = this.getObject(objType.path)
          .then((obj) => {
            if (typeof obj === 'object') {
              storePromises.push(this.storeObject(objType.alias, objType.path, obj));
            }
          });
        readPromises.push(readPromise);
      }
    }
    // wait for all reads to complete
    await Promise.all(readPromises);
    // wait for all writes to complete
    await Promise.all(storePromises);
  }


  getPrivateClient(): any {
    return this.privateClient;
  }

  async export(): Promise<RSModuleExportData> {
    const exportData: RSModuleExportObject[] = [];
    const readPromises: Promise<void>[] = [];
    const objectTypes = this.getObjectTypes();
    for (const objType of objectTypes) {
      if (objType.collectionType) {
        const readPromise = this.privateClient.getAll(objType.path, this.maxFileAge)
          .then((items: Object) => {
            for (const path in items) {
              if (items[path] && typeof items[path] === 'object') {
                const exportObj: RSModuleExportObject = {
                  alias: objType.alias,
                  path: objType.path + path,
                  data: items[path],
                };
                exportData.push(exportObj);
              }
            }
          });
        readPromises.push(readPromise);
      } else {
        const readPromise = this.privateClient.getObject(objType.path, this.maxFileAge)
          .then((obj: any) => {
            if (obj) {
              const exportObj: RSModuleExportObject = {
                alias: objType.alias,
                path: objType.path,
                data: obj,
              };
              exportData.push(exportObj);
            }
          });
        readPromises.push(readPromise);
      }
    }

    // wait for all reads to complete
    await Promise.all(readPromises);
    return {
      moduleId: this.getId(),
      data: exportData,
    };
  }

  async import(exportedData: RSModuleExportObject[]): Promise<void> {
    const promises = [];
    for (const exportObj of exportedData) {
      const promise = this.privateClient.storeObject(exportObj.alias, exportObj.path, exportObj.data);
      promises.push(promise);
    }
    await Promise.all(promises);
  }

  /**
   * Wipe entire module data. Uses meta data to get all stored objects
   */
  async wipeStorage(): Promise<void> {
    const removePromises: Promise<any>[] = [];
    const readPromises: Promise<any>[] = [];
    const objectTypes = this.getObjectTypes();
    for (const objType of objectTypes) {
      if (objType.collectionType) {
        const readPromise = this.privateClient.getListing(objType.path)
          .then((items: Dictionary<any>) => {
            for (const path in items) {
              // ignore directories
              if (path.charAt(path.length - 1) !== '/') {
                removePromises.push(this.privateClient.remove(objType.path + path));
              }
            }
          });
        readPromises.push(readPromise);
      } else {
        removePromises.push(this.privateClient.remove(objType.path));
      }
    }
    if (readPromises.length > 0) {
      // wait for all reads from folders
      await Promise.all(readPromises);
    }
    if (removePromises.length > 0) {
      // wait for all items to be removed
      await Promise.all(removePromises);
    }
  }

  /**
   * Fired when storage is modified either locally or remote
   */
  onChange = (event: StorageChangeEvent) => {
    // we need to unserialize (decrypt) raw data first
    try {
      if (event.oldValue) {
        event.oldValue = this.serializer.unserialize(event.oldValue);
      }
      if (event.newValue) {
        event.newValue = this.serializer.unserialize(event.newValue);
      }
    } catch (e) {
      if (e instanceof UnsupportedEncryptionError) {
        // data is encrypted with an unknown password (user probably not logged in)
        event.oldValue = null;
        event.newValue = null;
      } else {
        throw e;
      }
    }
    this.dataChanged(event);
    if (this.changeListener) {
      this.changeListener(event);
    }
  }

  protected abstract dataChanged(event: StorageChangeEvent): void;

  /**
   * Set listener to monitor both local & remote storage changes
   */
  setChangeListener(listener: (event: StorageChangeEvent) => void) {
    this.changeListener = listener;
  }

  abstract getObjectTypes(): RSModuleObjectType[];

  abstract getSerializableObjectTypes(): RSModuleObjectType[];

}
