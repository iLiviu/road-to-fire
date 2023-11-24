export namespace BondPricing {

  function ytmPoly(ni: number, nf: number, pf: number, i: number) {
    let f = (x: number) => {
      const xi = Math.pow(x, ni);
      const xf = nf == 1 ? x : Math.pow(x, nf);
      return (((i + 1) * x - 1) * xi - i) * xf - pf * (x - 1);
    };
    return f;
  }

  function dYtmPoly(ni: number, nf: number, pf: number, i: number) {
    let f = (x: number) => {
      const xi = Math.pow(x, ni);
      const xf = nf == 1 ? x : Math.pow(x, nf);
      const n = ni + nf;
      return (((i + 1) * (n + 1) - n / x) * xi - i * nf / x) * xf - pf;
    };
    return f;
  }

  function partPeriod(sDay: number, sMonth: number, sYear: number, mDay: number, prevPm: number, nextPm: number) {
    const py = prevPm > 0 ? sYear : sYear - 1;
    const pm = prevPm > 0 ? prevPm - 1 : prevPm + 12 - 1;
    const ny = nextPm < 12 ? sYear : sYear + 1;
    const nm = nextPm < 12 ? nextPm - 1 : nextPm - 12 - 1;
    const PDate = new Date(py, pm, mDay);
    const NDate = new Date(ny, nm, mDay);
    const SDate = new Date(sYear, sMonth - 1, sDay);
    return (NDate.getTime() - SDate.getTime()) / (NDate.getTime() - PDate.getTime());
  }

  function getPayPeriods(paymentsPerYear: number, sDay: number, sMonth: number, sYear: number, mDay: number, mMonth: number, mYear: number) {
    const mpp = 12 / paymentsPerYear;
    const n = (12 * (mYear - sYear) + mMonth - sMonth) / mpp;
    const ni = Math.floor(n);
    if (ni == n)
      if (sDay == mDay)
        return ni;
      else
        if (sDay < mDay)
          return ni + partPeriod(sDay, sMonth, sYear, mDay, sMonth - mpp, sMonth);
        else
          return ni + partPeriod(sDay, sMonth, sYear, mDay, sMonth, sMonth + mpp) - 1;
    else {
      const dm = (mMonth - sMonth) % mpp;
      const npm = dm > 0 ? sMonth + dm : sMonth + dm + mpp;
      return ni + partPeriod(sDay, sMonth, sYear, mDay, npm - mpp, npm);
    }
  }

  function newtRoot(x: number, f: (val: number) => number, fp: (val: number) => number, tol: number) {
    let x0: number;
    for (x0 = x; Math.abs(f(x0)) > tol; x0 -= f(x0) / fp(x0));
    return x0;
  }

  /**
   * Calculates the yield to maturity for the bond
   * @param settlementDate: date at which bond is bought
   * @param maturityDate: date at which the principal and final coupon and are paid.
   * @param paymentsPerYear: frequency of coupon payments in a year
   * @param currentPrice: current clean price of the bond
   * @param parPrice: nominal bond value (principal)
   * @param couponRate: the annual rate of the coupon
   * 
   * @returns bond's YTM
   */
  export function calculateYTM(settlementDate: Date, maturityDate: Date, paymentsPerYear: number, currentPrice: number, parPrice: number, couponRate: number) {
    const payPeriods = getPayPeriods(paymentsPerYear, settlementDate.getDay(), settlementDate.getMonth(), settlementDate.getFullYear(),
      maturityDate.getDay(), maturityDate.getMonth(), maturityDate.getFullYear());
    const accrued = (Math.ceil(payPeriods) - payPeriods) * couponRate * currentPrice / paymentsPerYear;
    const pf = (currentPrice + accrued) / parPrice;
    const i = couponRate / paymentsPerYear;
    const ni = Math.floor(payPeriods) == payPeriods ? payPeriods - 1 : Math.floor(payPeriods);
    const nf = payPeriods - ni;
    const x0 = 0.5;
    const x = newtRoot(x0, ytmPoly(ni, nf, pf, i), dYtmPoly(ni, nf, pf, i), 0.000001);

    return paymentsPerYear * (1 / x - 1);
  }
}
