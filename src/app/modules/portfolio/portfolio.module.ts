import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ChartsModule } from 'ng2-charts';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTreeModule } from '@angular/material/tree';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PortfolioRootComponent } from './components/portfolio-root/portfolio-root.component';
import { PortfolioService } from './services/portfolio.service';
import { MenuListItemComponent } from '../../shared/components/menu-list-item/menu-list-item.component';
import { PortfolioRoutingModule } from './portfolio.routing';
import { SettingsComponent } from './pages/settings/settings.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { StocksComponent } from './pages/stocks/stocks.component';
import { BondsComponent } from './pages/bonds/bonds.component';
import { CashComponent } from './pages/cash/cash.component';
import { CryptosComponent } from './pages/cryptos/cryptos.component';
import { RealEstateComponent } from './pages/realestate/realestate.component';
import { CommoditiesComponent } from './pages/commodities/commodities.component';
import { AccountComponent } from './pages/account/account.component';
import { TradeableAssetListComponent } from './components/tradeable-asset-list/tradeable-asset-list.component';
import { TradeableAssetSumCardComponent } from './components/tradeable-asset-sum-card/tradeable-asset-sum-card.component';
import { TransactionsListComponent } from './components/transactions-list/transactions-list.component';
import { CashAssetListComponent } from './components/cash-asset-list/cash-asset-list.component';
import { DepositListItemComponent } from './components/deposit-list-item/deposit-list-item.component';
import { CashListItemComponent } from './components/cash-list-item/cash-list-item.component';
import { WizardComponent } from './pages/wizard/wizard.component';
import { TopToolbarComponent } from './components/top-toolbar/top-toolbar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EcoFabSpeedDialModule } from '@ecodev/fab-speed-dial';
import { CashEditComponent } from './components/cash-edit/cash-edit.component';
import { EditDialogComponent } from './components/edit-dialog/edit-dialog.component';
import { DepositEditComponent } from './components/deposit-edit/deposit-edit.component';
import { CashExchangeComponent } from './components/cash-exchange/cash-exchange.component';
import { AssetManagementService } from './services/asset-management.service';
import { AssetsQuoteService } from './services/assets-quote.service';
import { AssetTransferComponent } from './components/asset-transfer/asset-transfer.component';
import { CashFundComponent } from './components/cash-fund/cash-fund.component';
import { DepositLiquidateComponent } from './components/deposit-liquidate/deposit-liquidate.component';
import { AssetTradeComponent } from './components/asset-trade/asset-trade.component';
import { AboutModule } from 'src/app/modules/about/about.module';
import { SwipeTabsDirective } from 'src/app/shared/directives/swipe-tabs.directive';
import { TradeableAssetViewComponent } from './components/tradeable-asset-view/tradeable-asset-view.component';
import { TradeableAssetListItemComponent } from './components/tradeable-asset-list-item/tradeable-asset-list-item.component';
import { CashBalancesCardComponent } from './components/cash-balances-card/cash-balances-card.component';
import { ManualQuoteComponent } from './components/manual-quote/manual-quote.component';
import { CdkVirtualScrollViewportPatchDirective } from 'src/app/shared/directives/cdk-virtual-scroll-viewport-patch.directive';
import { CapitalGainsComponent } from './pages/capital-gains/capital-gains.component';
import { PeriodicChecksService } from './services/periodic-checks.service';
import { TransactionViewComponent } from './components/transaction-view/transaction-view.component';
import { NotificationsButtonComponent } from './components/notifications-button/notifications-button.component';
import { RefreshQuotesButtonComponent } from './components/refresh-quotes-button/refresh-quotes-button.component';
import { TransactionApproveComponent } from './components/transaction-approve/transaction-approve.component';
import { TransactionsListItemComponent } from './components/transactions-list-item/transactions-list-item.component';
import { CurrencySymbolPipe } from 'src/app/shared/pipes/currency-symbol.pipe';
import { CashAssetViewComponent } from './components/cash-asset-view/cash-asset-view.component';
import { RecurringTransactionInputComponent } from './components/recurring-transaction-input/recurring-transaction-input.component';
import { RecurringTransactionsComponent } from './pages/recurring-transactions/recurring-transactions.component';
import { RecurringTransactionsListComponent } from './components/recurring-transactions-list/recurring-transactions-list.component';
import {
  RecurringTransactionsListItemComponent
} from './components/recurring-transactions-list-item/recurring-transactions-list-item.component';
import { RecurringTransactionViewComponent } from './components/recurring-transaction-view/recurring-transaction-view.component';
import { RecurringTransactionEditComponent } from './components/recurring-transaction-edit/recurring-transaction-edit.component';
import { DividendTransactionEditComponent } from './components/dividend-transaction-edit/dividend-transaction-edit.component';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { PaymentDateAddComponent } from './components/payment-date-add/payment-date-add.component';
import { ResponsiveColsDirective } from 'src/app/shared/directives/responsive-cols.directive';
import { DashboardGridTileEditorComponent } from './components/dashboard-grid-tile-editor/dashboard-grid-tile-editor.component';
import { InterestTransactionEditComponent } from './components/interest-transaction-edit/interest-transaction-edit.component';
import { PortfolioHistoryAddComponent } from './components/portfolio-history-add/portfolio-history-add.component';
import { CostTransactionEditComponent } from './components/cost-transaction-edit/cost-transaction-edit.component';
import { PortfolioStorageService } from './services/portfolio-storage.service';
import { RSPortfolioStorageService } from './services/rs-portfolio-storage.service';
import { DialogsService } from '../dialogs/dialogs.service';
import { DebtComponent } from './pages/debt/debt.component';
import { AbsoluteValuePipe } from 'src/app/shared/pipes/absolute-value.pipe';
import { PrincipalTransactionEditComponent } from './components/principal-transaction-edit/principal-transaction-edit.component';
import { P2PComponent } from './pages/p2p/p2p.component';
import { TransactionsFilterEditComponent } from './components/transactions-filter-edit/transactions-filter-edit.component';

@NgModule({
    declarations: [
        DashboardComponent,
        PortfolioRootComponent,
        SettingsComponent,
        MenuListItemComponent,
        TransactionsComponent,
        StocksComponent,
        BondsComponent,
        CashComponent,
        CryptosComponent,
        RealEstateComponent,
        CommoditiesComponent,
        AccountComponent,
        TradeableAssetListComponent,
        TradeableAssetSumCardComponent,
        TransactionsListComponent,
        CashAssetListComponent,
        DepositListItemComponent,
        CashListItemComponent,
        WizardComponent,
        CashBalancesCardComponent,
        TopToolbarComponent,
        CashEditComponent,
        EditDialogComponent,
        DepositEditComponent,
        CashExchangeComponent,
        AssetTransferComponent,
        CashFundComponent,
        DepositLiquidateComponent,
        AssetTradeComponent,
        SwipeTabsDirective,
        CdkVirtualScrollViewportPatchDirective,
        TradeableAssetViewComponent,
        TradeableAssetListItemComponent,
        ManualQuoteComponent,
        CapitalGainsComponent,
        TransactionViewComponent,
        NotificationsButtonComponent,
        RefreshQuotesButtonComponent,
        TransactionApproveComponent,
        TransactionsListItemComponent,
        CurrencySymbolPipe,
        FormatDatePipe,
        CashAssetViewComponent,
        RecurringTransactionInputComponent,
        RecurringTransactionsComponent,
        RecurringTransactionsListComponent,
        RecurringTransactionsListItemComponent,
        RecurringTransactionViewComponent,
        RecurringTransactionEditComponent,
        DividendTransactionEditComponent,
        PaymentDateAddComponent,
        ResponsiveColsDirective,
        DashboardGridTileEditorComponent,
        InterestTransactionEditComponent,
        PortfolioHistoryAddComponent,
        CostTransactionEditComponent,
        DebtComponent,
        AbsoluteValuePipe,
        PrincipalTransactionEditComponent,
        P2PComponent,
        TransactionsFilterEditComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        MatButtonModule,
        MatCardModule,
        MatBadgeModule,
        MatCheckboxModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatSelectModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatToolbarModule,
        MatProgressSpinnerModule,
        MatSortModule,
        MatTooltipModule,
        MatAutocompleteModule,
        MatStepperModule,
        MatTableModule,
        MatExpansionModule,
        FlexLayoutModule,
        ChartsModule,
        EcoFabSpeedDialModule,
        PortfolioRoutingModule,
        AboutModule,
        MatGridListModule,
        MatTreeModule,
    ],
    exports: [],
    providers: [
        PortfolioService,
        AssetManagementService,
        AssetsQuoteService,
        PeriodicChecksService,
        DialogsService,
        { provide: PortfolioStorageService, useClass: RSPortfolioStorageService },
    ]
})
export class PortfolioModule {

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, protected periodicChecksService: PeriodicChecksService,
    protected portfolioStorageService: PortfolioStorageService) {

    // register custom icons that we will use in the app
    iconRegistry.addSvgIcon('certificate',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/certificate.svg'));
    iconRegistry.addSvgIcon('commodity',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/commodity.svg'));
    iconRegistry.addSvgIcon('bitcoin',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/bitcoin.svg'));
    iconRegistry.addSvgIcon('tax',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/tax.svg'));
    iconRegistry.addSvgIcon('forex',
      sanitizer.bypassSecurityTrustResourceUrl('assets/img/forex.svg'));
  }
}
