/**
 * Delivery dates — pure functions, the one place this rule lives (the product page's delivery line,
 * the delivery estimate section). Business days skip Saturday and Sunday; an order placed before
 * the cut-off hour on a business day ships the same day, otherwise on the next business day.
 *
 *   deliveryDates({ min: 2, max: 4, cutoff: 14 }) →
 *     { shipsToday, ship, from, to, minutesLeft } (Dates; minutesLeft until the cut-off, or 0)
 *   formatLeft(143, "%h h %m min", "%m min") → "2 h 23 min"
 */
const isBusinessDay = (date) => date.getDay() !== 0 && date.getDay() !== 6;

function addBusinessDays(start, days) {
  const date = new Date(start);
  while (days > 0) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) days -= 1;
  }
  return date;
}

export function deliveryDates({ min, max, cutoff, now = new Date() }) {
  const shipsToday = isBusinessDay(now) && now.getHours() < Number(cutoff);
  const ship = shipsToday ? new Date(now) : addBusinessDays(now, 1);
  const deadline = new Date(now);
  deadline.setHours(Number(cutoff), 0, 0, 0);
  return {
    shipsToday,
    ship,
    from: addBusinessDays(ship, Number(min)),
    to: addBusinessDays(ship, Number(max)),
    minutesLeft: shipsToday ? Math.round((deadline - now) / 60000) : 0,
  };
}

// The words come from the theme's translations: "%h h %m min" / "%m min"
export const formatLeft = (minutes, long = '%h h %m min', short = '%m min') =>
  minutes >= 60 ? long.replace('%h', Math.floor(minutes / 60)).replace('%m', minutes % 60) : short.replace('%m', minutes);
