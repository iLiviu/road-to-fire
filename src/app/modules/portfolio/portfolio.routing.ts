import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PortfolioRootComponent } from './components/portfolio-root/portfolio-root.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { StocksComponent } from './pages/stocks/stocks.component';
import { BondsComponent } from './pages/bonds/bonds.component';
import { CashComponent } from './pages/cash/cash.component';
import { CryptosComponent } from './pages/cryptos/cryptos.component';
import { RealEstateComponent } from './pages/realestate/realestate.component';
import { CommoditiesComponent } from './pages/commodities/commodities.component';
import { AccountComponent } from './pages/account/account.component';
import { WizardComponent } from './pages/wizard/wizard.component';
import { SettingsGuard } from './pages/settings/settings.guard';
import { AboutComponent } from 'src/app/modules/about/pages/about/about.component';
import { CapitalGainsComponent } from './pages/capital-gains/capital-gains.component';
import { RecurringTransactionsComponent } from './pages/recurring-transactions/recurring-transactions.component';
import { PrivacyComponent } from '../about/pages/privacy/privacy.component';

export const portfolioRoutes: Routes = [

  {
    path: '',
    component: PortfolioRootComponent,
    children: [
      { path: '', redirectTo: 'home' },
      { path: 'home', component: DashboardComponent },
      { path: 'assets/stocks', component: StocksComponent },
      { path: 'assets/bonds', component: BondsComponent },
      { path: 'assets/cash', component: CashComponent },
      { path: 'assets/commodities', component: CommoditiesComponent },
      { path: 'assets/crypto', component: CryptosComponent },
      { path: 'assets/real-estate', component: RealEstateComponent },
      { path: 'accounts/:accountId', component: AccountComponent, pathMatch: 'full' },
      { path: 'capital-gains', component: CapitalGainsComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'recurring-transactions', component: RecurringTransactionsComponent },
      { path: 'privacy', component: PrivacyComponent },
      { path: 'about', component: AboutComponent },
      { path: 'settings', component: SettingsComponent, canDeactivate: [SettingsGuard] },
    ]
  },
  {
    path: 'wizard',
    component: WizardComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(portfolioRoutes)],
  exports: [RouterModule]
})
export class PortfolioRoutingModule { }
