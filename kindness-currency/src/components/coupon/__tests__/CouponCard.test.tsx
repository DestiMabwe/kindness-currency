import { describe, it } from 'vitest';

describe('CouponCard', () => {
  describe('locked visual elements', () => {
    it.todo('renders the scalloped clip-path shape class regardless of props');
    it.todo('renders the barcode graphic regardless of props');
    it.todo('renders the Kindness Red border regardless of props');
    it.todo('renders the "Good for a ___" framing label regardless of props');
    it.todo('renders the template decorative motif regardless of props');
  });

  describe('redeemed state', () => {
    it.todo('shows the "Redeemed ♥" stamp overlay when status is redeemed');
    it.todo('does not show the stamp overlay when status is sent or viewed');
  });
});
