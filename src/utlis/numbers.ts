/**
 * Get the precision of a number
 * https://stackoverflow.com/a/27865285
 * @param value
 */
export function precision(value: number): number {
  let e = 1;

  while (Math.round(value * e) / e !== value) {
    e *= 10;
  }

  return Math.log(e) / Math.LN10;
}

/**
 * Rounds a number to a given precision
 * https://stackoverflow.com/a/12830454
 *
 * @param num
 * @param scale
 */
export function roundNumber(num: number, scale: number): number {
  if ((`${num}`).includes('e')) {
    const arr = (`${num}`).split('e');
    let sig = '';

    if (+arr[1] + scale > 0) {
      sig = '+';
    }

    return +(`${Math.round(Number(`${+arr[0]}e${sig}${+arr[1] + scale}`))}e-${scale}`);
  }
  return +(`${Math.round(Number(`${num}e+${scale}`))}e-${scale}`);
}
