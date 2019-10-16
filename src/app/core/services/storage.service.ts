import { Injectable } from '@angular/core';

import { LoggerService } from './logger.service';
import { StorageSerializer, DefaultStorageSerializer } from '../models/storage-serializer';

export class EncryptionError extends Error {
  constructor(message?: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, EncryptionError.prototype);
  }
}


export class UnsupportedEncryptionError extends EncryptionError {
  constructor() {
    super('Encryption unsupported!');
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnsupportedEncryptionError.prototype);
  }
}


export enum StorageChangeOrigin {
  window = 'window',
  local = 'local',
  remote = 'remote',
  conflict = 'conflict'
}

export interface StorageChangeEvent {
  /**  Absolute path of the changed node, from the storage root */
  path: string;
  /** Path of the changed node, relative to this baseclient's scope root */
  relativePath: string;
  /** origin of the change */
  origin: StorageChangeOrigin;
  /** Old body of the changed node (local version in conflicts; undefined if creation)*/
  oldValue: any;
  /** New body of the changed node (remote version in conflicts; undefined if deletion)*/
  newValue: any;
  /** Old contentType of the changed node (local version for conflicts; undefined if creation)*/
  oldContentType: string;
  /** New contentType of the changed node (remote version for conflicts; undefined if deletion)*/
  newContentType: string;

}

/**
 * Generic storage module interface
 */
export interface StorageModule {
  /**
   * Set listener to monitor storage changes
   */
  setChangeListener(listener: (event: StorageChangeEvent) => void): void;

  /**
   * Wipe entire module data.
   */
  wipeStorage(): Promise<void>;

  /**
   * Unique module identifier
   */
  getId(): string;

  /**
   * Export all module data
   */
  export(): Promise<any>;

  /**
   * Import module data
   */
  import(exportedData: any): Promise<void>;
}


/**
 * Abstract storage service
 */
@Injectable()
export abstract class StorageService {

  protected _serializer: StorageSerializer;
  protected syncInProgress = false;
  protected offline = false;

  constructor(protected logger: LoggerService) {
    this._serializer = new DefaultStorageSerializer();

  }

  /**
   * Stop cloud sync
   */
  abstract disableCloudSync(): void;

  /**
   * Toggles cloud synchronizations
   * @param enabled if `true`, enables cloud synchronization, otherwise disables it
   */
  abstract toggleCloudSync(enabled: boolean): void;

  /**
   * Tests if a cloud storage is configured and active or not.
   * @return `true` if a remote storage backend is configured, `false` otherwise
   */
  abstract isCloudSyncEnabled(): boolean;

  /**
   * Loads a storage module, and returns it's instance
   * @param module module to add
   * @return module instance
   */
  abstract addStorageModule(module: any): any;

  /**
   * Get a specific module using it's id
   * @param moduleId module id
   * @return module instance
   */
  abstract getModule(moduleId: string): any;

  get serializer() {
    return this._serializer;
  }

  /**
   * Export entire storage in JSON format
   */
  abstract exportToJSON(): Promise<string>;

  /**
   * Import json formatted data into the storage.
   * Clears storage before importing.
   */
  abstract importFromJSON(jsonStr: string): Promise<void>;

  /**
   * returns if storage is encrypted or not
   * @return `true` if storage is encrypted, `false` otherwise
   */
  abstract isEncryptionEnabled(): boolean;

  /**
   * Encrypt/decrypt entire storage
   *
   * @param enable enable/disalbe encryption
   * @param password password that will be used to encrypt data
   */
  abstract toggleEncryption(enable: boolean, password: string): Promise<void>;

  /**
  * Verifies if the user provided password matches the password used to encrypt the storage.
  *
  * @param password the user provided password
  * @return `true` if storage is not encrypted or if user provided password matches the password used
  * to encrypt the storage
  */
  abstract verifyPassword(password: string): Promise<boolean>;

  /**
   * Wipe entire storage. Goes through each loaded module and wipes it's storage.
   * @param wipeCloudStorage if `true` wipes the cloud storage too, otherwise, wipes only local storage
   */
  abstract wipeStorage(wipeCloudStorage: boolean): Promise<void>;

  /**
   * Check if synchronization is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Returns `true` if working in offline mode, `false` if online
   */
  isOffline(): boolean {
    return this.offline;
  }

  /**
   * Wait for synchronization to complete, if cloud sync is enabled
   */
  waitForSync(): Promise<void> {
    const syncDonePromise = new Promise<void>((resolve, reject) => {
      if (!this.isCloudSyncEnabled()) {
        resolve();
      } else {
        const timer = setInterval(() => {
          if (!this.isSyncInProgress()) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      }
    });
    return syncDonePromise;
  }
}
