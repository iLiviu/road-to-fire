import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventsService, AppEventType, AppEvent } from '../../services/events.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { ConfigService } from '../../services/config.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';

/**
 * Component that is placed over the RemoteStorage widget and adds a "close" button when a remote backend
 * is not connected, allowing user to quickly disable cloud sync.
 */
@Component({
  selector: 'app-rstoragewidget-close-button',
  templateUrl: './rstoragewidget-close-button.component.html',
  styleUrls: ['./rstoragewidget-close-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RStorageWidgetCloseButtonComponent implements OnInit, OnDestroy {

  visible: boolean;

  private componentDestroyed$ = new Subject();

  constructor(private eventsService: EventsService, private storageService: StorageService, private configService: ConfigService,
    private dialogsService: DialogsService, private cdr: ChangeDetectorRef) {

    this.eventsService.events$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(event => this.handleEvents(event));
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Fired when user clicks the close button
   */
  async disableCloudSync() {
    const response = await this.dialogsService.confirm('Do you want to disable cloud sync?');
    if (response) {
      this.storageService.toggleCloudSync(false);
      const cfg = await this.configService.readConfig();
      cfg.saveOnCloud = false;
      this.configService.saveConfig(cfg);
    }
  }

  /**
   * Listen for events signaling that a cloud storage account is set up or not
   * @param event event that was triggered
   */
  private handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.CLOUD_STORAGE_CONNECTED:
        this.visible = false;
        this.cdr.markForCheck();
        break;
      case AppEventType.CLOUD_STORAGE_NOT_CONNECTED:
        this.visible = true;
        this.cdr.markForCheck();
        break;
    }
  }
}
