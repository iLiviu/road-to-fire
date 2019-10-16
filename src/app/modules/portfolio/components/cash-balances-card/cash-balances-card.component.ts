import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { CurrencyBalance } from '../../models/currency-balance';

/**
 * Component to display a card with balances of each currency and the total value
 * of balances, in base currency
 */
@Component({
  selector: 'app-cash-balances-card',
  templateUrl: './cash-balances-card.component.html',
  styleUrls: ['./cash-balances-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashBalancesCardComponent {

  @Input() title: string;
  @Input() balances: CurrencyBalance[];
  @Input() totalBalance: number;
  @Input() baseCurrency: string;
}
