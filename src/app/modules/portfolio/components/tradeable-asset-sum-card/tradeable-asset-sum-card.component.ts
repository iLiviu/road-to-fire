import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { AssetOverview } from '../../models/asset-overview';

/**
 * Component that displays a card with an asset group's value and unrealized P/L
 */
@Component({
  selector: 'app-tradeable-asset-sum-card',
  templateUrl: './tradeable-asset-sum-card.component.html',
  styleUrls: ['./tradeable-asset-sum-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeableAssetSumCardComponent implements OnInit {

  @Input() baseCurrency: string;
  @Input() overview: AssetOverview;
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
