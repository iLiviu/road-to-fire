import { Pipe, PipeTransform } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/*
 * Return the symbol for a given currency given the ISO 4217 currency code as value
 * Takes  as an argument
 * Usage:
 *   code | currencySymbol
 * Example:
 *   {{ USD | currencySymbol }}
 *   formats to: $
*/
@Pipe({ name: 'currencySymbol' })
export class CurrencySymbolPipe implements PipeTransform {
  transform(value: string): string {
    const symbol = getCurrencySymbol(value, 'wide');
    return symbol;
  }
}
