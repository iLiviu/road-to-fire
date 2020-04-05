import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AboutComponent } from './pages/about/about.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';

@NgModule({
    declarations: [
        AboutComponent,
        PrivacyComponent,
    ],
    imports: [
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatTooltipModule,
    ],
    exports: [AboutComponent]
})
export class AboutModule {
}
