import { Pipe, PipeTransform } from '@angular/core';

/*
 * Return the absolute value of a number
 * Usage:
 *   number | absoluteValue
*/
@Pipe({
  name: 'absoluteValue',
})
export class AbsoluteValuePipe implements PipeTransform {
  transform(input: number): number {
    return Math.abs(input);
  }
}
