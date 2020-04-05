import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LoggerService, LogLevel } from './core/services/logger.service';
import { StorageService } from './core/services/storage.service';
import { APP_CONSTS } from './config/app.constants';
import { EventsService, AppEventType, ConfigLoadedData, AppEvent } from './core/services/events.service';
import { ConfigService } from './core/services/config.service';
import { UpdateService } from './core/services/update.service';
import { AppConfig } from './core/models/app-storage';
import { DialogsService } from './modules/dialogs/dialogs.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  loading: boolean;

  private componentDestroyed$ = new Subject();
  private waitForReload = false;

  /**
   * We initialize the services that are needed when app starts
   */
  constructor(protected titleService: Title, private logger: LoggerService, private snackBar: MatSnackBar,
    private storageService: StorageService, private router: Router, private eventsService: EventsService,
    private configService: ConfigService, private ngZone: NgZone, private dialogService: DialogsService,
    protected update: UpdateService, private cdr: ChangeDetectorRef) {
    this.loading = true;
    titleService.setTitle(APP_CONSTS.TITLE);

    this.eventsService.events$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(event => this.handleEvents(event));
  }

  async handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.CONFIG_LOADED:
        const cfgLoadedData = <ConfigLoadedData>event.data;
        if (cfgLoadedData.moduleId === this.configService.storage.getId()) {
          const cfg = <AppConfig>cfgLoadedData.config;
          if (!cfg.wizardDone) {
            this.ngZone.run(() => this.navigateToWizard());
          }
        }
        break;
      case AppEventType.STORAGE_WIPED:
        this.ngZone.run(() => this.navigateToWizard());
        break;
      case AppEventType.ENCRYPTION_REMOTE_UPDATE:
        this.encryptionStateChanged();
        break;
      case AppEventType.CONFIG_REMOTE_UPDATE:
        if (event.data === this.configService.storage.getId()) {
          this.reloadApp();
        }
        break;
    }
  }

  reloadApp() {
    window.location.reload();
  }

  navigateToWizard() {
    if (this.router.url !== '/portfolio/wizard') {
      this.router.navigate(['portfolio/wizard']);
    }
  }

  ngOnInit(): void {
    this.logger.asObservable()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(event => {
        let cssClass = '';
        switch (event.level) {
          case LogLevel.Info: cssClass = 'success-panel'; break;
          case LogLevel.Warn: cssClass = 'error-panel'; break;
          case LogLevel.Error: cssClass = 'error-panel'; break;

        }
        // no UI interaction here, queue the event
        setTimeout(() => {
          this.snackBar.open(event.message, '', {
            duration: 3000,
            panelClass: [cssClass]
          });
        });
      });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  /**
   * Listen to navigation events in order to detect when page is loading.
   */
  ngAfterViewInit() {
    this.router.events
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.loading = true;
          this.cdr.markForCheck();
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private async encryptionStateChanged() {
    if (!this.waitForReload) {
      this.waitForReload = true;
      const dialogRef = this.dialogService.loadingScreen('Synchronizing...');
      // reload after sync is done
      await this.storageService.waitForSync();
      this.reloadApp();
//      dialogRef.close();
    }

  }


}
