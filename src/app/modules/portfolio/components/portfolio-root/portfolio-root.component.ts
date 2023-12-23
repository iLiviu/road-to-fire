import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription, Subject } from 'rxjs';
import { map, filter, withLatestFrom, takeUntil } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import * as Hammer from 'hammerjs';
import { debounce } from 'lodash-decorators';

import * as WebAPK from 'src/web-apk';
import { EventsService, AppEventType, AppEvent } from 'src/app/core/services/events.service';
import { NavItem } from 'src/app/shared/models/nav-item';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioAccount } from '../../models/portfolio-account';
import { LoggerService } from 'src/app/core/services/logger.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { StorageService } from 'src/app/core/services/storage.service';

const accountsMenuItems: NavItem[] = [];

/**
 * All routes of portfolio module
 */
const MENU_ROUTES: NavItem[] = [
  { path: 'home', title: 'Dashboard', icon: 'dashboard', children: null },
  { path: 'accounts', title: 'Accounts', icon: 'account_balance', children: accountsMenuItems },
  {
    path: 'assets', title: 'Assets', icon: 'apps', children: [
      { path: 'assets/bonds', title: 'Bonds & Bond ETFs', svgIcon: 'certificate' },
      { path: 'assets/cash', title: 'Cash & Equivalents', icon: 'local_atm' },
      { path: 'assets/commodities', title: 'Commodities', svgIcon: 'commodity' },
      { path: 'assets/crypto', title: 'Cryptocurrencies', svgIcon: 'bitcoin' },
      { path: 'assets/debt', title: 'Debt', icon: 'credit_card' },
      { path: 'assets/p2p', title: 'P2P Loans', icon: 'group' },
      { path: 'assets/real-estate', title: 'Real Estate', icon: 'home' },
      { path: 'assets/stocks', title: 'Stocks', icon: 'trending_up' },
    ]
  },
  { path: 'transactions', title: 'Transactions', icon: 'swap_horiz', children: null },
  { path: 'recurring-transactions', title: 'Scheduled Transactions', icon: 'repeat', children: null },
  { path: 'capital-gains', title: 'Capital Gains', svgIcon: 'tax', children: null },
  { path: 'settings', title: 'Settings', icon: 'settings', children: null },
];

const ACCOUNTS_MENU_INDEX = 1;


/**
 * Main component of the portfolio module.
 * Displays the sidenav and router where all portfolio pages will be loaded
 */
@Component({
  selector: 'app-portfolio-root',
  templateUrl: './portfolio-root.component.html',
  styleUrls: ['./portfolio-root.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class PortfolioRootComponent implements OnInit, OnDestroy, AfterViewInit {



  canInstallApp = WebAPK.canInstallApp;
  loggedIn: boolean;
  @ViewChild('drawer', { static: true }) drawer: MatSidenav;

  readonly navItems = MENU_ROUTES;
  readonly isHandset$: Observable<boolean>;

  private componentDestroyed$ = new Subject();

  constructor(private breakpointObserver: BreakpointObserver, private router: Router, private eventsService: EventsService,
    private portfolioService: PortfolioService, private logger: LoggerService, private elementRef: ElementRef,
    private authService: AuthService, private storageService: StorageService, private cdr: ChangeDetectorRef) {
    this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
      .pipe(
        map(result => result.matches)
      );
  }

  ngAfterViewInit(): void {
    const hammer = new Hammer(this.elementRef.nativeElement, {});

    // toggle sidenav on swipe gestures
    hammer.on('panright', (ev) => {
      if (ev.pointerType !== 'mouse') {
        const startX = ev.changedPointers[0].screenX - ev.deltaX;
        // only open if swiped from edge of the screen
        if (startX < 16) {
          this.drawer.open();
          this.cdr.markForCheck();
        }
      }
    });
    hammer.on('swipeleft', (ev) => {
      if (ev.pointerType !== 'mouse') {
        this.drawer.close();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit() {
    this.loggedIn = this.storageService.isEncryptionEnabled();
    // close the sidenav when on handset device a link is clicked
    this.router.events
      .pipe(
        takeUntil(this.componentDestroyed$),
        withLatestFrom(this.isHandset$),
        filter(([a, b]) => b && a instanceof NavigationEnd)
      )
      .subscribe(_ => this.drawer.close());

    this.eventsService.events$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(
        event => {
          this.handleEvents(event);
        });

    // populate accounts menu items on start
    this.refreshAccountsList();
  }

  handleEvents(event: AppEvent) {
    switch (event.type) {
      case AppEventType.ACCOUNT_ADDED:
      case AppEventType.ACCOUNT_REMOVED:
      case AppEventType.ACCOUNT_UPDATED:
        this.onAccountsUpdated();
        break;
      case AppEventType.MENU_TOGGLE: this.drawer.toggle();
        break;
      case AppEventType.ENCRYPTION_TOGGLED: this.loggedIn = event.data;
    }
  }

  logout() {
    this.authService.storePassword('', true);
    window.location.reload();
  }

  /**
   * Displays a prompt asking the user if he wants to install the web page as an app
   * Currently only supported in Chrome
   */
  installApp() {
    // Show the "add to home screen" prompt
    WebAPK.installAppEvent.prompt();
    // Wait for the user to respond to the prompt
    WebAPK.installAppEvent.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.canInstallApp = false;
        } else {
        }
      });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.unsubscribe();
  }

  private async refreshAccountsList() {
    try {
      const accounts = await this.portfolioService.getAccounts();
      this.buildAccountMenuItems(accounts);
    } catch (err) {
      this.logger.error('Could not load accounts menu!', err);
    }
  }

  /**
   * (Re)Build the accounts menu items
   */
  private buildAccountMenuItems(accounts: PortfolioAccount[]) {
    accounts.sort((a, b) => a.description < b.description ? -1 : 1);
    accountsMenuItems.splice(0, accountsMenuItems.length);
    for (const acc of accounts) {
      accountsMenuItems.push({ path: 'accounts/' + acc.id, title: acc.description, icon: 'account_circle' });
    }
    accountsMenuItems.push({ path: 'accounts/new', title: 'Add new account...', icon: 'add_circle_outline' });

    this.eventsService.menuUpdated();
    this.cdr.markForCheck();
  }

  @debounce(100)
  private onAccountsUpdated() {
    this.refreshAccountsList();
  }
}
