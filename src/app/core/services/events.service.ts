import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum AppEventType {
  ACCOUNT_ADDED,
  ACCOUNT_REMOVED,
  ACCOUNT_UPDATED,
  ASSET_ADDED,
  ASSET_REMOVED,
  ASSET_UPDATED,
  MENU_TOGGLE,
  TRANSACTION_ADDED,
  TRANSACTION_REMOVED,
  TRANSACTION_UPDATED,
  RECURRING_TRANSACTION_ADDED,
  RECURRING_TRANSACTION_REMOVED,
  RECURRING_TRANSACTION_UPDATED,
  CONFIG_REMOTE_UPDATE,
  ENCRYPTION_REMOTE_UPDATE,
  CONFIG_LOADED,
  STORAGE_READY,
  ENCRYPTION_TOGGLED,
  NOTIFICATION_ADDED,
  NOTIFICATION_UPDATED,
  NOTIFICATION_REMOVED,
  STORAGE_WIPED,
  QUOTES_UPDATE_STARTED,
  QUOTES_UPDATED,
  PORTFOLIO_MODULE_LOADED,
  MENU_UPDATED,
  OFFLINE_MODE_TOGGLED,
  CLOUD_STORAGE_CONNECTED,
  CLOUD_STORAGE_NOT_CONNECTED,
}

export interface ConfigLoadedData {
  moduleId: string;
  config: Object;
}

export interface AppEvent {
  type: AppEventType;
  data: any;
}
/**
 * Service that provides communication between components through events
 */
@Injectable({
  providedIn: 'root'
})
export class EventsService {

  private eventSource = new Subject<AppEvent>();

  readonly events$ = this.eventSource.asObservable();

  constructor() { }

  private triggerEvent(event: AppEvent) {
    this.eventSource.next(event);
  }

  /**
   * A new asset was added
   * @param assetId the unique id of the asset
   */
  assetAdded(assetId: number) {
    this.triggerEvent({
      type: AppEventType.ASSET_ADDED,
      data: assetId
    });
  }

  /**
   * An asset has been deleted
   * @param assetId the unique id of the asset
   */
  assetRemoved(assetId: number) {
    this.triggerEvent({
      type: AppEventType.ASSET_REMOVED,
      data: assetId
    });
  }

  /**
   * The data of an asset has been modified
   * @param assetId the unique id of the asset
   */
  assetUpdated(assetId: number) {
    this.triggerEvent({
      type: AppEventType.ASSET_UPDATED,
      data: assetId
    });
  }


  /**
   * User requests that sidenav should be opened/closed
   */
  toggleSideNav() {
    this.triggerEvent({
      type: AppEventType.MENU_TOGGLE,
      data: null
    });
  }

  /**
   * A new transaction has been added
   * @param txId the unique id of the transaction
   */
  transactionAdded(txId: number) {
    this.triggerEvent({
      type: AppEventType.TRANSACTION_ADDED,
      data: txId
    });
  }

  /**
   * The data of a transaction has been modified
   * @param txId the unique id of the transaction
   */
  transactionUpdated(txId: number) {
    this.triggerEvent({
      type: AppEventType.TRANSACTION_UPDATED,
      data: txId
    });
  }

  /**
   * A transaction has been deleted
   * @param txId the unique id of the transaction
   */
  transactionRemoved(txId: number) {
    this.triggerEvent({
      type: AppEventType.TRANSACTION_REMOVED,
      data: txId
    });
  }

  /**
   * A new recurring transaction has been added
   * @param txId the unique id of the transaction
   */
  recurringTransactionAdded(txId: number) {
    this.triggerEvent({
      type: AppEventType.RECURRING_TRANSACTION_ADDED,
      data: txId
    });
  }

  /**
   * The data of a recurring transaction has been modified
   * @param txId the unique id of the transaction
   */
  recurringTransactionUpdated(txId: number) {
    this.triggerEvent({
      type: AppEventType.RECURRING_TRANSACTION_UPDATED,
      data: txId
    });
  }

  /**
   * A recurring transaction has been deleted
   * @param txId the unique id of the transaction
   */
  recurringTransactionRemoved(txId: number) {
    this.triggerEvent({
      type: AppEventType.RECURRING_TRANSACTION_REMOVED,
      data: txId
    });
  }

  /**
   * A new account has been added
   * @param accId the unique id of the account
   */
  accountAdded(accId: number) {
    this.triggerEvent({
      type: AppEventType.ACCOUNT_ADDED,
      data: accId,
    });
  }

  /**
   * An account has been deleted
   * @param accId the unique id of the account
   */
  accountRemoved(accId: number) {
    this.triggerEvent({
      type: AppEventType.ACCOUNT_REMOVED,
      data: accId,
    });
  }

  /**
   * Data of an account has been modified
   * @param accId the unique id of the account
   */
  accountUpdated(accId: number) {
    this.triggerEvent({
      type: AppEventType.ACCOUNT_UPDATED,
      data: accId,
    });
  }

  /**
   * Configuration has been updated remotely for a module
   * @param module module identifier
   */
  configUpdatedRemotely(module: string) {
    this.triggerEvent({
      type: AppEventType.CONFIG_REMOTE_UPDATE,
      data: module,
    });
  }

  /**
   * Storage encryption was changed remotely
   */
  encryptionStateChangedRemotely() {
    this.triggerEvent({
      type: AppEventType.ENCRYPTION_REMOTE_UPDATE,
      data: null,
    });
  }



  /**
   * The storage has been unlocked and is ready to be read/written
   */
  storageReady() {
    this.triggerEvent({
      type: AppEventType.STORAGE_READY,
      data: null,
    });
  }

  /**
   * The storage encryption status was changed
   * @param newValue `true` if notification was enabled, `false` if it was disabled
   */
  encryptionToggled(newValue: boolean) {
    this.triggerEvent({
      type: AppEventType.ENCRYPTION_TOGGLED,
      data: newValue,
    });
  }

  /**
   * A new notification has been added
   * @param notificationId the unique id of the notification
   */
  notificationAdded(notificationId: number) {
    this.triggerEvent({
      type: AppEventType.NOTIFICATION_ADDED,
      data: notificationId,
    });
  }

  /**
   * A notification has been deleted
   * @param notificationId the unique id of the notification
   */
  notificationRemoved(notificationId: number) {
    this.triggerEvent({
      type: AppEventType.NOTIFICATION_REMOVED,
      data: notificationId,
    });
  }

  /**
   * A notification's state has been updated
   * @param notificationId the unique id of the notification
   */
  notificationUpdated(notificationId: number) {
    this.triggerEvent({
      type: AppEventType.NOTIFICATION_UPDATED,
      data: notificationId,
    });
  }

  /**
   * The config for a specific module has been loaded
   * @param moduleId id of module for which configuration was loaded
   */
  configLoaded(moduleId: string, config: Object) {
    const data: ConfigLoadedData = {
      moduleId: moduleId,
      config: config,
    };
    this.triggerEvent({
      type: AppEventType.CONFIG_LOADED,
      data: data,
    });
  }

  /**
   * The storage has been erased
   */
  storageWiped() {
    this.triggerEvent({
      type: AppEventType.STORAGE_WIPED,
      data: null,
    });
  }

  /**
   * The quote update process for the assets has started
   */
  quotesUpdateStarted() {
    this.triggerEvent({
      type: AppEventType.QUOTES_UPDATE_STARTED,
      data: null,
    });
  }

  /**
   * The quote update process for the assets has finished
   */
  quotesUpdateFinished() {
    this.triggerEvent({
      type: AppEventType.QUOTES_UPDATED,
      data: null,
    });
  }

  /**
   * The portfolio module is loaded
   */
  portfolioModuleLoaded() {
    this.triggerEvent({
      type: AppEventType.PORTFOLIO_MODULE_LOADED,
      data: null,
    });
  }

  /**
   * Fired when menu items were added/ removed/ updated
   */
  menuUpdated() {
    this.triggerEvent({
      type: AppEventType.MENU_UPDATED,
      data: null,
    });
  }

  /**
   * Fired when offline mode changes
   * @param isOffline `true` if working in offline mode
   */
  offlineModeToggled(isOffline: boolean) {
    this.triggerEvent({
      type: AppEventType.OFFLINE_MODE_TOGGLED,
      data: isOffline,
    });
  }

  /**
   * Fired if cloud storage is active
   */
  cloudStorageConnected() {
    this.triggerEvent({
      type: AppEventType.CLOUD_STORAGE_CONNECTED,
      data: null,
    });
  }

  /**
   * Fired if cloud storage is inactive
   */
  cloudStorageNotConnected() {
    this.triggerEvent({
      type: AppEventType.CLOUD_STORAGE_NOT_CONNECTED,
      data: null,
    });
  }

}
