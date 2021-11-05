import { TestBed, fakeAsync, flush, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StorageService } from './core/services/storage.service';
import { MockStorageService } from './core/mocks/storage.service.mock';
import { AuthService } from './core/services/auth.service';
import { MockAuthService } from './core/mocks/auth.service.mock';
import { ConfigService } from './core/services/config.service';
import { MockConfigService } from './core/mocks/config.service.mock';
import { PortfolioStorageService } from './modules/portfolio/services/portfolio-storage.service';
import { MockPortfolioStorageService } from './modules/portfolio/mocks/portfolio-storage.service.mock';
import { UpdateService } from './core/services/update.service';
import { Title, BrowserModule } from '@angular/platform-browser';
import { EventsService } from './core/services/events.service';
import { AppStorageService } from './core/services/app-storage.service';
import { MockAppStorageService } from './core/mocks/app-storage.service.mock';
import { AppRoutingModule } from './app-routing.module';
import { AboutModule } from './modules/about/about.module';
import { DialogsModule } from './modules/dialogs/dialogs.module';
import { LoginComponent } from './core/pages/login/login.component';
import { PageNotFoundComponent } from './core/pages/page-not-found/page-not-found.component';
import { LayoutModule } from '@angular/cdk/layout';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { LoggerService } from './core/services/logger.service';
import { EventDrivenLoggerService } from './core/services/event-driven-logger.service';
import { Component, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { AppConfig } from './core/models/app-storage';
import { LocaleIDs } from './core/services/locale-service';

class MockUpdateService {
}

@Component({ template: '' })
class MockComponent { }


describe('AppComponent', () => {
  let router: Router;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        PageNotFoundComponent,
        LoginComponent,
        MockComponent,

      ],
      imports: [
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        LayoutModule,
        FlexLayoutModule,
        MatSnackBarModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatCardModule,
        MatToolbarModule,
        MatTooltipModule,
        FormsModule,
        AboutModule,
        DialogsModule,
        AppRoutingModule,
      ],
      providers: [
        { provide: StorageService, useClass: MockStorageService },
        { provide: AppStorageService, useClass: MockAppStorageService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: UpdateService, useClass: MockUpdateService },
        { provide: PortfolioStorageService, useClass: MockPortfolioStorageService },
        { provide: LoggerService, useClass: EventDrivenLoggerService },
      ],
    })
      .overrideModule(BrowserDynamicTestingModule, { set: { entryComponents: [MockComponent] } })
      .compileComponents();
    router = TestBed.inject(Router);
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should set proper title`, waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toEqual('Road To FIRE');
  }));

  it('should navigate to wizard page when storage wiped', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    router.resetConfig([
      { path: 'portfolio/:subpath', component: MockComponent },
    ]);
    const app = fixture.componentInstance;
    const eventsService = <EventsService>TestBed.inject(EventsService);
    eventsService.storageWiped();
    flush();
    fixture.detectChanges();
    expect(location.pathname).toBe('/portfolio/wizard');
  }));

  it('should navigate to wizard when config is reset', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    router.resetConfig([
      { path: 'portfolio/:subpath', component: MockComponent },
    ]);
    const app = fixture.componentInstance;
    const eventsService = <EventsService>TestBed.inject(EventsService);
    const cfg: AppConfig = {
      dateAndCurrencyFormat: LocaleIDs.EN_US,
      wizardDone: false,
      saveOnCloud: false,
      version: 1,
    };
    eventsService.configLoaded('roadtofire', cfg);
    flush();
    fixture.detectChanges();
    expect(location.pathname).toBe('/portfolio/wizard');
  }));

  it('should reload when config changed remotely', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const spy = spyOn(app, 'reloadApp');
    const eventsService = <EventsService>TestBed.inject(EventsService);
    eventsService.configUpdatedRemotely('roadtofire');
    flush();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  }));

  it('should reload when encryption mode changed remotely', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const spy = spyOn(app, 'reloadApp');
    const eventsService = <EventsService>TestBed.inject(EventsService);
    eventsService.encryptionStateChangedRemotely();
    flush();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  }));
});
