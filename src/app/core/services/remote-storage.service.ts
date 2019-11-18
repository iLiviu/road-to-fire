import { Injectable } from '@angular/core';
import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';
import * as CryptoJS from 'crypto-js';

import { LoggerService } from './logger.service';
import { APP_CONSTS } from 'src/app/config/app.constants';
import { RemoteStorageModule, RSModuleExportData, RSModuleExportObject } from '../models/remotestorage-module';
import { StorageService, UnsupportedEncryptionError } from './storage.service';
import { StorageSerializer } from '../models/storage-serializer';
import { EventsService } from './events.service';
import { Dictionary } from 'src/app/shared/models/dictionary';
import { HashObject, RSAppStorage } from './rs-app-storage.service';


const JSON_EXPORT_FORMAT = 'rtf_json';
const JSON_EXPORT_VERSION = 1;

interface RemoteStorageExport {
  format: string;
  version: number;
  modules: Dictionary<RSModuleExportObject[]>;
}

/**
 * RemoteStorage storage service.
 * Stores the application data in both local storage and syncs it to user's cloud storage account.
 * The data is optionally encrypted using AES and a hash of the password is saved in the storage
 * for verification.
 */
@Injectable()
export class RemoteStorageService extends StorageService implements StorageSerializer {


  private moduleIDs: string[] = [];
  private encryptStorage = false;
  private encryptionKey: string;
  private remoteStorage: any;
  private loadedRSModules: RemoteStorageModule[] = [];
  private defaultRSModule: RSAppStorage;
  private storageReady = false;
  private widget: any;

  constructor(protected logger: LoggerService, protected eventsService: EventsService) {
    super(logger);
    this._serializer = this;
    this.initRemoteStorage();
  }

  /**
   * Initialize RemoteStorage object and widget
   * The widget requires a container with id "rstorageWidget" to be present in the UI
   */
  private initRemoteStorage() {
    this.syncInProgress = true;

    this.remoteStorage = new RemoteStorage({
      changeEvents: {
        local: false,
        window: false,
        remote: true,
        conflict: true
      },
      //      logging: true,
    });

    this.remoteStorage.setApiKeys({
      dropbox: APP_CONSTS.STORAGE_API_KEYS.DROPBOX,
      googledrive: APP_CONSTS.STORAGE_API_KEYS.GOOGLE_DRIVE,
    });

    const self = this;
    this.remoteStorage.on('network-offline', () => {
      self.offline = true;
      self.syncInProgress = false;
      self.logger.error('Working in offline mode');
      self.eventsService.offlineModeToggled(true);
    });

    // this is only fired after coming back from offline mode. Does not get fired on init
    this.remoteStorage.on('network-online', () => {
      self.offline = false;
      self.syncInProgress = true;
      self.logger.info('We are back online');
      self.eventsService.offlineModeToggled(false);
    });

    this.remoteStorage.on('error', (err: Error) => {
      self.logger.error(`Sync error: ${err.message}`);
    });

    this.remoteStorage.on('connected', (err: Error) => {
    });

    this.remoteStorage.on('disconnected', (err: Error) => {
      // when cloud account is disconnected, storage is wiped so send notification
      self.toggleCloudSync(false);
      this.setPassword(null);
      self.eventsService.storageWiped();
    });

    this.remoteStorage.on('ready', () => {
      this.storageReady = true;
    });

    this.remoteStorage.on('not-connected', () => {
      self.syncInProgress = false;
      self.offline = true;
    });


    this.remoteStorage.on('sync-req-done', () => {
      if (!self.isOffline()) {
        self.syncInProgress = true;
      }
    });

    this.remoteStorage.on('sync-done', () => {
      self.syncInProgress = false;
    });

    this.bypassServiceWorker();

    this.widget = new Widget(this.remoteStorage);
    this.widget.attach('rstorageWidget');
  }

  isCloudSyncEnabled() {
    return (this.remoteStorage.remote && this.remoteStorage.remote.token) ? true : false;
  }

  disableCloudSync() {
    if (this.isCloudSyncEnabled()) {
      this.remoteStorage.remote.configure({
        userAddress: null,
        href: null,
        storageApi: null,
        token: null,
        properties: null
      });
      this.remoteStorage.setBackend(undefined);
    }
  }

  getRemoteStorageInstance(): any {
    return this.remoteStorage;
  }

  /**
   * Toggles cloud synchronizations and shows/hides RemoteStorage widget in UI.
   *
   * @param enabled if `true`, enables cloud synchronization, otherwise disables it
   */
  toggleCloudSync(enabled: boolean) {
    document.getElementById('rstorageWidget').style.display = (enabled ? 'block' : 'none');
    if (!enabled) {
      this.disableCloudSync();
    }
  }

  /**
   * Generates a hash from a given password
   * @param password password to generate a hash for
   * @param salt the salt to be used for the hash
   */
  private generatePasswordHash(password: string, salt: any) {
    const hash = CryptoJS.PBKDF2(password, salt, { keySize: 512 / 32, iterations: 512 });
    return CryptoJS.enc.Hex.stringify(hash);
  }

  /**
   * Generate and store the hash for a given password.
   * The hash is later used to verify if user provides correct storage password
   * @param password password to store hash for
   */
  private storePasswordHash(password: string): Promise<void> {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const hash = this.generatePasswordHash(password, salt);
    const hashObj: HashObject = {
      hash: hash,
      salt: CryptoJS.enc.Hex.stringify(salt),
    };

    return this.defaultRSModule.storeAppPasswordHash(hashObj);
  }


  /**
   * Remove stored password hash.
   */
  private removePasswordHash(): Promise<void> {
    return this.defaultRSModule.removeAppPasswordHash();
  }

  /**
   * Set the password used to encrypt/decrypt data
   * @param password user password
   */
  private setPassword(password: string) {
    this.encryptStorage = password !== null;
    this.encryptionKey = password;
  }


  addStorageModule(module: any): any {
    this.remoteStorage.addModule(module);
    this.remoteStorage.access.claim(module.name, 'rw');
    this.remoteStorage.caching.enable('/' + module.name + '/');
    const newModule: RemoteStorageModule = this.remoteStorage[module.name];
    this.loadedRSModules.push(newModule);
    this.moduleIDs.push(module.name);
    // we added a new module that will have to sync
    if (!this.offline) {
      this.syncInProgress = true;
      if (this.storageReady) {
        this.remoteStorage.startSync();
      }
    }
    return newModule;
  }

  /**
   * Set a module as default (main) module.
   * This is required to store data like encryption password hash
   * @param module module to set as default
   */
  async setDefaultStorageModule(module: RSAppStorage) {
    this.defaultRSModule = module;
  }

  getModule(moduleId: string): any {
    return this.remoteStorage[moduleId];
  }

  async toggleEncryption(enable: boolean, password: string): Promise<void> {
    if (this.isEncryptionEnabled() === enable) {
      return; // encryption status is already the required one
    }

    if (enable) {
      this.setPassword(password);
    } else {
      this.encryptStorage = false;
    }

    // we need to rewrite data in each module
    const promises = [];
    for (const rsModule of this.loadedRSModules) {
      promises.push(rsModule.forceReWriteAll());
    }
    await Promise.all(promises);

    if (enable) {
      await this.storePasswordHash(password);
    } else {
      await this.removePasswordHash();
      this.setPassword(null);
    }
  }

  private async wipeModulesStorage(): Promise<void> {
    const promises = [];
    for (const rsModule of this.loadedRSModules) {
      const promise = rsModule.wipeStorage();
      promises.push(promise);
    }
    await Promise.all(promises);
    this.encryptStorage = false;
  }


  async wipeStorage(wipeCloudStorage: boolean = true): Promise<void> {
    if (!wipeCloudStorage) {
      // disconnect from remote storage and wipe entire local storage
      this.remoteStorage.disconnect();
      this.toggleCloudSync(false);
    }
    await this.wipeModulesStorage();

    if (wipeCloudStorage) {
      // we need to wait for sync to be done, before disconnecting from cloud storage
      await this.waitForSync();
      this.remoteStorage.disconnect();
      this.toggleCloudSync(false);
    }
  }

  async exportToJSON(): Promise<string> {
    const promises = [];
    for (const rsModule of this.loadedRSModules) {
      const promise = rsModule.export();
      promises.push(promise);
    }
    const objects: RSModuleExportData[] = await Promise.all(promises);
    const exportData: RemoteStorageExport = {
      format: JSON_EXPORT_FORMAT,
      version: JSON_EXPORT_VERSION,
      modules: {}
    };
    for (const obj of objects) {
      exportData.modules[obj.moduleId] = obj.data;
    }
    return JSON.stringify(exportData);
  }

  async importFromJSON(jsonStr: string): Promise<void> {
    // first ensure that the data is a valid export
    const exportData: RemoteStorageExport = JSON.parse(jsonStr);
    if (!exportData.format || exportData.format !== JSON_EXPORT_FORMAT) {
      throw new Error('Invalid export format');
    } else if (exportData.version !== JSON_EXPORT_VERSION) {
      throw new Error('The data was exported by a more recent version of the app. Please update the app first!');
    }
    for (const rsModule of this.loadedRSModules) {
      if (!exportData.modules[rsModule.getId()]) {
        throw new Error('Module data not present in import: ' + rsModule.getId());
      }
    }

    // clear storage before import and wait for changes to sync
    await this.wipeModulesStorage();
    await this.waitForSync();

    const promises = [];
    for (const rsModule of this.loadedRSModules) {
      const promise = rsModule.import(exportData.modules[rsModule.getId()]);
      promises.push(promise);
    }
    await Promise.all(promises);
    // wait for changes to sync before we continue
    await this.waitForSync();
    // notify that config was changed
    this.eventsService.configUpdatedRemotely(this.defaultRSModule.getId());
  }


  /**
  * Verifies password against stored hash
  * The password hash is stored in synced storage in case encryption is updated remotely
  * @param password the user provided password
  */
  async verifyPassword(password: string): Promise<boolean> {
    const hashObj = await this.defaultRSModule.getAppPasswordHash();
    if (hashObj && hashObj.hash) {
      if (!password) {
        return false;
      }
      const response = hashObj.hash === this.generatePasswordHash(password, CryptoJS.enc.Hex.parse(hashObj.salt));
      if (response) {
        this.setPassword(password);
      }
      return response;
    } else {
      return true;
    }
  }


  /**
   * if encryption is enabled, encrypt the object before storing it
   * @param obj object to be serialized
   */
  serialize(obj: any): any {
    if (this.encryptStorage) {
      const serializedData = JSON.stringify(obj);
      const iv = CryptoJS.lib.WordArray.random(16);
      const encryptedData = CryptoJS.AES.encrypt(serializedData, this.encryptionKey, { iv: iv });
      return {
        encryptedData: encryptedData.toString(),
        iv: CryptoJS.enc.Base64.stringify(iv),
      };
    } else {
      return obj;
    }
  }

  isEncryptionEnabled(): boolean {
    return this.encryptStorage;
  }


  /**
   * If encryption is enabled, decrypt the object, after it has been read from storage
   * @param obj object to be unserialized
   */
  unserialize(obj: any) {
    if (this.encryptionKey) {
      if (!obj || !obj.encryptedData || !obj.iv) {
        return obj;
      }
      const iv = CryptoJS.enc.Base64.parse(obj.iv);
      const decryptedData = CryptoJS.AES.decrypt(obj.encryptedData, this.encryptionKey, { iv: iv });
      const serializedData = decryptedData.toString(CryptoJS.enc.Utf8);
      obj = JSON.parse(serializedData);
      return obj;
    } else {
      if (obj && obj.encryptedData && obj.iv) {
        throw new UnsupportedEncryptionError();
      }
      return obj;
    }
  }

  /**
   * Requests that the app's storage be marked as persistent if browser supports persistent storage.
   * User may be prompted to allow the action.
   */
  grantPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(function (persistent) {
      });
    }
  }

  /**
   * Checks if a given URL is a remoteStorage request.
   * We do this by checking if the url path matches any of the loaded RS modules, or if we
   * make a call to Dropbox or Google Drive APIs.
   * @param url url to check
   */
  private isRSRequest(url: string) {
    url = url.toLowerCase();
    for (const moduleId of this.moduleIDs) {
      if (url.indexOf('/' + moduleId + '/') >= 0) {
        return true;
      }
    }
    return /api\.dropbox\.com|\.googleapis.com/.test(url);
  }

  /**
   * Add `ngsw-bypass` parameter to a given URL
   * @param url url to modify
   */
  private applyBypassToURL(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.append('ngsw-bypass', 'true');
      url = urlObj.toString();
    } catch (err) {
      // given string was not a valid URL
    }
    return url;


  }

  /**
   * Intercepts all HTTP requests and modifies remoteStorage request URLs so that the service worker
   * does not handle this URLS. We use this to correctly identify when in offline mode, as service
   * worker always returns 504 protocol error code when offline instead of network error.
   * We intercept both XMLHttpRequest and fetch()
   */
  private bypassServiceWorker() {
    const self = this;
    const oldXHROpen = (<any>window).XMLHttpRequest.prototype.open;
    (<any>window).XMLHttpRequest.prototype.open = function (method: any, url: any, async: any, user: any, password: any) {
      let args: any;
      if (self.isRSRequest(url)) {
        url = self.applyBypassToURL(url);
        args = [method, url, async, user, password];
      } else {
        args = <any>arguments;
      }
      const response = oldXHROpen.apply(this, args);
      return response;
    };

    const oldFetch = window.fetch;
    window.fetch = function (resource: any, init: any) {
      let url: string;
      if (typeof resource === 'string') {
        url = resource;
      } else if (resource.url) { // Request object
        url = resource.url;
      }
      if (url && self.isRSRequest(url)) {
        url = self.applyBypassToURL(url);
        if (typeof resource === 'string') {
          resource = url;
        } else {
          resource.url = url;
        }
      }
      return oldFetch.apply(this, [resource, init]);
    };
  }


}
