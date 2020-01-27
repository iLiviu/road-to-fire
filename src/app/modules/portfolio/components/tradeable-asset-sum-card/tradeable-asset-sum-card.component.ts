import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';

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
export class TradeableAssetSumCardComponent implements OnInit, OnChanges {

  @Input() baseCurrency: string;
  @Input() overview: AssetOverview;
  @Input() title: string;
  grossPortfolioValue: number;
  currentDebtRatio: number;

  constructor() { }

  ngOnInit() {
    this.updateValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.overview) {
      this.updateValues();
    }
  }

  updateValues() {
    this.grossPortfolioValue = this.overview.currentValue - this.overview.debtValue;
    if (this.grossPortfolioValue) {
      this.currentDebtRatio = Math.abs(this.overview.debtValue) / this.grossPortfolioValue;
    }

  }

}
