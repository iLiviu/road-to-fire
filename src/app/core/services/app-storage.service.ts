import { Injectable } from '@angular/core';

import { StorageService } from 'src/app/core/services/storage.service';
import { AppStorage } from '../models/app-storage';

export const CONFIG_ALIAS = 'config';
export const CONFIG_PATH = CONFIG_ALIAS;
export const PASS_HASH_ALIAS = 'pass-hash';
export const PASS_HASH_PATH = PASS_HASH_ALIAS;


/**
 * Abstract app storage service to be replaced by an actual implementation
 */
@Injectable()
export abstract class AppStorageService {
  readonly storage: AppStorage;

  constructor(protected storageService: StorageService) {
    // register this module in the storage service
    this.storage = this.storageService.addStorageModule(this.createStorageModule());
  }

  /**
   * Creates an instance of the storage module
   */
  protected abstract createStorageModule(): any;

}
