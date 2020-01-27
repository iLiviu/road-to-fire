import { Injectable } from '@angular/core';

import { AppStorageService, CONFIG_ALIAS, PASS_HASH_ALIAS, CONFIG_PATH, PASS_HASH_PATH } from './app-storage.service';
import { StorageSerializer } from '../models/storage-serializer';
import { BaseRemoteStorageModule, RSModuleObjectType, RemoteStorageModule } from '../models/remotestorage-module';
import { AppStorage, AppConfig } from '../models/app-storage';
import { StorageService, StorageChangeEvent } from './storage.service';
import { RemoteStorageService } from './remote-storage.service';

const RSMODULE_NAME = 'roadtofire';

/**
 * Storage module responsible for reading and writing the application config
 */
export interface RSAppStorage extends RemoteStorageModule, AppStorage {
  /**
   * Get app password hash.
   * We don't unserialize the object
   */
  getAppPasswordHash(): Promise<HashObject>;

  /**
   * Remove stored app password hash.
   */
  removeAppPasswordHash(): Promise<void>;

  /**
   * Store app password hash.
   */
  storeAppPasswordHash(hashObj: HashObject): Promise<void>;

}


export interface HashObject {
  hash: string;
  salt: string;
}

/**
 * RemoteStorage implementation for the app storage module.
 * Stores app configuration and encryption password hash.
 */
@Injectable()
export class RSAppStorageService extends AppStorageService {


  constructor(protected storageService: StorageService) {
    super(storageService);
    (<RemoteStorageService>storageService).setDefaultStorageModule(<RSAppStorage>this.storage);
  }

  protected createStorageModule() {
    return createAppRStorageModule(this.storageService.serializer, (<RemoteStorageService>this.storageService));
  }
}

function createAppRStorageModule(serializer: StorageSerializer, remoteStorage: RemoteStorageService) {
  return {
    name: RSMODULE_NAME,
    builder: function (privateClient: any, publicClient: any) {

      privateClient.declareType(CONFIG_ALIAS, {
        'type': 'object',
        'properties': {
          'encryptedData': {
            'type': 'string',
          },
          'saveOnCloud': {
            'type': 'boolean'
          },
          'version': {
            'type': 'number'
          },
          'wizardDone': {
            'type': 'boolean'
          },
        }
      });

      privateClient.declareType(PASS_HASH_ALIAS, {
        'type': 'object',
        'properties': {
          'hash': {
            'type': 'string',
          },
          'salt': {
            'type': 'string'
          },
        }
      });

      return {
        exports: new class extends BaseRemoteStorageModule implements RSAppStorage {
          protected dataChanged(event: StorageChangeEvent): void {

          }

          readConfig(): Promise<AppConfig> {
            return this.getObject(CONFIG_PATH);
          }

          async saveConfig(cfg: AppConfig): Promise<void> {
            await this.storeObject(CONFIG_ALIAS, CONFIG_PATH, cfg);
            // we ask for persistent storage to avoid getting our data removed by browser
            // this will be fired when user first saves the config (wizard) or on consecutive config changes
            remoteStorage.grantPersistentStorage();
          }

          getAppPasswordHash(): Promise<HashObject> {
            return this.privateClient.getObject(PASS_HASH_PATH, this.maxFileAge);
          }

          storeAppPasswordHash(hashObj: HashObject): Promise<void> {
            return this.privateClient.storeObject(PASS_HASH_ALIAS, PASS_HASH_PATH, hashObj);
          }

          removeAppPasswordHash(): Promise<void> {
            return this.privateClient.remove(PASS_HASH_PATH);
          }


          getObjectTypes(): RSModuleObjectType[] {
            const types = this.getSerializableObjectTypes();
            types.push({ path: PASS_HASH_PATH, alias: PASS_HASH_ALIAS, collectionType: false });
            return types;
          }

          getSerializableObjectTypes(): RSModuleObjectType[] {
            return [{ path: CONFIG_PATH, alias: CONFIG_ALIAS, collectionType: false }];
          }

          getId(): string {
            return RSMODULE_NAME;
          }

        }(privateClient, publicClient, serializer)
      };
    }
  };
}
