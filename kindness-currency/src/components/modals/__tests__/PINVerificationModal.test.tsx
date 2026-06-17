import { describe, it } from 'vitest';

describe('PINVerificationModal', () => {
  describe('rendering', () => {
    it.todo('modal mounts when the user clicks "Redeem This ♥"');
  });

  describe('wrong PIN', () => {
    it.todo('shows the soft error message referencing sender name on wrong PIN');
    it.todo('does not fire the success callback on wrong PIN');
  });

  describe('correct PIN', () => {
    it.todo('fires the onVerify success callback when the correct PIN is entered');
    it.todo('does not show an error message on correct PIN');
  });
});
