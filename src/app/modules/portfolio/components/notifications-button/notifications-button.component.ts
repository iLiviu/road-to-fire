import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounce } from 'lodash-decorators';

import { AppNotification, AppNotificationType } from '../../models/notification';
import { PortfolioService } from '../../services/portfolio.service';
import { AppEvent, AppEventType, EventsService } from 'src/app/core/services/events.service';
import { AssetManagementService } from '../../services/asset-management.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { TransactionData } from '../../models/transaction';

interface AppNotificationEx extends AppNotification {
  pendingDelete: boolean;
}

/** Component to display a "notifications" button, displaying the number of unread notifications.
 * When clicked, displays the list of notifications, that can be viewed or deleted.
*/
@Component({
  selector: 'app-notifications-button',
  templateUrl: './notifications-button.component.html',
  styleUrls: ['./notifications-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsButtonComponent implements OnInit, OnDestroy {

  notifications: AppNotificationEx[] = [];
  unreadNotificationsCount = 0;

  private eventSubscription: Subscription;


  constructor(private portfolioService: PortfolioService, private eventsService: EventsService,
    private assetManagementService: AssetManagementService, private logger: LoggerService,
    private dialogsService: DialogsService, private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.eventSubscription = this.eventsService.events$.subscribe((event) => {
      this.handleEvents(event);
    });
    this.updateNotifications();
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  /**
   * Listen for "notification" events
   * @param event event that was triggered
   */
  protected handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.NOTIFICATION_ADDED:
        this.onNotificationAdded(event.data);
        break;
      case AppEventType.NOTIFICATION_REMOVED:
        this.onNotificationsUpdated();
        break;
      case AppEventType.NOTIFICATION_UPDATED:
        this.onNotificationsUpdated();
        break;
    }
  }

  /**
   * Called when a notification is added.
   * Display a snackBar with the notification title
   */
  async onNotificationAdded(notificationId: number) {
    const notification = await this.portfolioService.getNotification(notificationId);
    const snack = this.snackBar.open(notification.title, 'View', {
      duration: 6000,
    });
    snack.onAction()
      .subscribe(() => {
        this.viewNotification(notification);
      });

    this.onNotificationsUpdated();
  }

  @debounce(100)
  onNotificationsUpdated() {
    this.updateNotifications();
  }

  /**
   * Opens a dialog that displays detailed information about a notification
   * @param notification notification to view
   */
  async viewNotification(notification: AppNotification) {
    let canDelete = false;
    if (notification.type === AppNotificationType.TRANSACTION_DONE) {
      const tx = await this.portfolioService.getTransaction(notification.data);
      if (tx) {
        this.assetManagementService.viewTransaction(tx);
      } else {
        this.logger.error('Invalid transaction: ' + notification.data);
      }
    } else if (notification.type === AppNotificationType.PENDING_TRANSACTION) {
      const tx = <TransactionData>notification.data;
      if (tx) {
        const approved = await this.assetManagementService.approveTransaction(tx);
        if (approved) {
          canDelete = true;
        }
      } else {
        this.logger.error('Invalid transaction!');
      }
    } else if (notification.type === AppNotificationType.INFORMATIVE) {
      this.dialogsService.info(notification.data, notification.title);
    } else if (notification.type === AppNotificationType.RECURRING_TRANSACTION) {
      const tx = await this.portfolioService.getRecurringTransaction(notification.data);
      if (tx) {
        const edited = await this.assetManagementService.editRecurringTransaction(tx);
        if (edited) {
          canDelete = true;
        }
      } else {
        this.logger.error('Invalid transaction!');
        canDelete = true;
      }
    }
    if (canDelete) {
      this.deleteNotification(<AppNotificationEx>notification);
    } else {
      this.portfolioService.markNotificationAsRead(notification);
      this.updateUnreadNotificationsCount();
    }
    this.cdr.detectChanges();
  }

  deleteNotificationClick(event: Event, notification: AppNotificationEx) {
    event.stopPropagation();
    this.deleteNotification(notification);
  }

  /**
   * Used for ngFor trackBy. Returns the item's notification id
   */
  notificationIdTrackFn(index: number, item: AppNotification) {
    if (item && item.id) {
      return item.id;
    }
    return null;
  }

  /**
   * Refresh the notifications list
   */
  private async updateNotifications() {
    const notifications = await this.portfolioService.getNotifications();
    // notifications should be sorted by date, in descending order (ISO date string comparison)
    this.notifications = <AppNotificationEx[]>notifications
      .sort((a, b) => a.date < b.date ? 1 : -1);
    this.updateUnreadNotificationsCount();
    this.cdr.markForCheck();
  }

  updateUnreadNotificationsCount() {
    this.unreadNotificationsCount = this.notifications.reduce(
      (acc, notif) => acc + (notif.unread && !notif.pendingDelete ? 1 : 0), 0);
  }

  /**
   * Deletes a specific notification
   * @param notification notification to delete
   */
  private async deleteNotification(notification: AppNotificationEx) {
    notification.pendingDelete = true;
    this.updateUnreadNotificationsCount();
    try {
      this.portfolioService.deleteNotification(notification);
      // remove from list
      const idx = this.notifications.indexOf(notification);
      if (idx >= 0) {
        this.notifications.splice(idx, 1);
        this.cdr.markForCheck();
      }
    } catch (err) {
      // an error occurred so show notification in list again
      delete notification.pendingDelete;
    }
  }
}
