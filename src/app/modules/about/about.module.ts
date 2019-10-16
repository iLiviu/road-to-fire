import { NgModule } from '@angular/core';
import { MatToolbarModule,  MatIconModule, MatButtonModule, MatTooltipModule } from '@angular/material';

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
