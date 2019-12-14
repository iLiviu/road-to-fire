import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatSnackBarModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatCardModule, MatToolbarModule,
  MatTooltipModule, MatIconModule
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PageNotFoundComponent } from './core/pages/page-not-found/page-not-found.component';
import { LoggerService } from './core/services/logger.service';
import { EventDrivenLoggerService } from './core/services/event-driven-logger.service';
import { EventsService } from './core/services/events.service';
import { ConfigService } from './core/services/config.service';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './core/pages/login/login.component';
import { StorageService } from './core/services/storage.service';
import { AboutModule } from './modules/about/about.module';
import { DialogsModule } from './modules/dialogs/dialogs.module';
import { RemoteStorageService } from './core/services/remote-storage.service';
import { AppStorageService } from './core/services/app-storage.service';
import { RSAppStorageService } from './core/services/rs-app-storage.service';
import { environment } from '../environments/environment';
import { UpdateService } from './core/services/update.service';
import { RStorageWidgetCloseButtonComponent } from './core/components/rstoragewidget-close-button/rstoragewidget-close-button.component';

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    LoginComponent,
    RStorageWidgetCloseButtonComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LayoutModule,
    FlexLayoutModule,
    MatSnackBarModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    FormsModule,
    AboutModule,
    DialogsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  exports: [
  ],
  entryComponents: [],
  providers: [
    AuthService,
    EventsService,
    ConfigService,
    UpdateService,
    { provide: StorageService, useClass: RemoteStorageService },
    { provide: AppStorageService, useClass: RSAppStorageService },
    { provide: LoggerService, useClass: EventDrivenLoggerService },
    { provide: HAMMER_GESTURE_CONFIG, useClass: HammerGestureConfig },
  ],
  bootstrap: [AppComponent, RStorageWidgetCloseButtonComponent]
})
export class AppModule {
  constructor() {

  }
}
