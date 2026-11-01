import { money } from '../utils/money';

test('formats prices with a dollar sign and two decimals', () => {
  expect(money(50)).toBe('$50.00');
  expect(money(80.5)).toBe('$80.50');
  expect(money(166.5)).toBe('$166.50');
});

test('treats a missing price as zero', () => {
  expect(money(undefined)).toBe('$0.00');
  expect(money(null)).toBe('$0.00');
});
