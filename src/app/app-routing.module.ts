import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';


import { PageNotFoundComponent } from './core/pages/page-not-found/page-not-found.component';
import { LoginComponent } from './core/pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AboutComponent } from './modules/about/pages/about/about.component';
import { PrivacyComponent } from './modules/about/pages/privacy/privacy.component';

const routes: Routes = [
  // Fallback when no prior routes is matched
  { path: '', redirectTo: 'portfolio', pathMatch: 'full' },
  {
    path: 'portfolio', loadChildren: () =>
      import('./modules/portfolio/portfolio.module').then(m => m.PortfolioModule),
    canLoad: [AuthGuard],
  },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
