export function getDateAsISOString(date: any) {
  if (date) {
    if (typeof date === 'string') {
      return date;
    } else {
      return (<Date>date).toISOString();
    }
  } else {
    return '';
  }
}

export function binarySearch<T>(arr: T[], value: T, cmp: (p: T, q: T) => number, insertIndex?: boolean): number {
  let bot = 0;
  let top = arr.length;
  while (bot < top) { // If x is in arr, it's somewhere in arr[bot..top].
    const mid = (bot + top) >> 1;
    const c = cmp(arr[mid], value);
    if (c === 0) {
      return mid;
    }
    if (c < 0) {
      bot = mid + 1;
    } else if (0 < c) {
      top = mid;
    }
  }
  if (!insertIndex) {
    return -1;
  } else {
    return bot;
  }
}

export namespace FloatingMath {

  /**
   * Eliminate precision error caused by base 2 floating point arithmetic
   * @param num number to fix
   */
  export function fixRoundingError(num: number) {
    return precisionRound(num, 8);
  }

  /**
   * Checks if 2 numbers are equal by ignoring floating point precision error
   */
  export function equal(a: number, b: number) {
    return Math.abs(a - b) < Number.EPSILON;
  }

  /**
   * Checks if a number is positive, by ignoring floating point precision error.
   * @param num number to test
   */
  export function isPositive(num: number) {
    return num + Number.EPSILON >= 0;
  }

  /**
   * Round a number to 2nd decimal
   * @param num number to round
   */
  export function round2Decimals(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * Round a number to a given precision
   * @param num number to round
   * @param precision precision to round number to
   */
  export function precisionRound(number: number, precision: number) {
  const factor = Math.pow(10, precision);
  const n = precision < 0 ? number : 0.01 / factor + number;
  return Math.round( n * factor) / factor;
}
}

export namespace DateUtils {
  /**
   * Compare 2 date objects have the same date (ignore time)
   * @param a first date object
   * @param b 2nd date object
   */
  export function sameDate(a: Date, b: Date) {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  /**
   * Compare 2 date objects by their dates ( ignore time).
   * @param a first date object
   * @param b 2nd date object
   * @return  0 if dates are the same, negative value if a < b and positive if a > b
   */
  export function compareDates(a: Date, b: Date) {
    if (sameDate(a, b)) {
      return 0;
    } else {
      return a.getTime() - b.getTime();
    }
  }
}
