import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { AssetType } from '../../models/asset';
import { GlobalAssetsComponent } from '../../components/global-assets/global-assets.component';
import { PortfolioService } from '../../services/portfolio.service';
import { LoggerService } from 'src/app/core/services/logger.service';
import { EventsService } from 'src/app/core/services/events.service';
import { DialogsService } from 'src/app/modules/dialogs/dialogs.service';
import { StorageService } from 'src/app/core/services/storage.service';


/**
 * Component to display a UI with a summary of all P2P assets and a list of them
 */
@Component({
  selector: 'app-p2p',
  templateUrl: '../../components/global-assets/global-assets.component.html',
  styleUrls: ['../../components/global-assets/global-assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class P2PComponent extends GlobalAssetsComponent implements OnInit {

  constructor(protected portfolioService: PortfolioService, protected eventsService: EventsService,
    protected logger: LoggerService, protected dialogService: DialogsService, protected router: Router,
    protected storageService: StorageService, protected cdr: ChangeDetectorRef) {
    super(portfolioService, eventsService, logger, dialogService, router, storageService, cdr);
  }

  ngOnInit() {
    this.pageTitle = 'P2P Loans';
    this.assetTypes = AssetType.P2P;
    super.ngOnInit();
  }
}
