import { describe, it } from 'vitest';

describe('RedemptionEngine', () => {
  describe('PIN verification', () => {
    it.todo('correct PIN redeems the coupon and sets status to redeemed');
    it.todo('wrong PIN returns a soft error without changing status');
  });

  describe('idempotency', () => {
    it.todo('redeeming an already-redeemed coupon returns success without error');
  });

  describe('Zod validation', () => {
    it.todo('rejects a payload missing required fields before touching the database');
  });
});
