import { describe, it } from 'vitest';

describe('AgeGate', () => {
  describe('trigger', () => {
    it.todo('modal appears when selecting a template with is_age_restricted true');
    it.todo('modal does not appear for non-restricted templates');
  });

  describe('"Go Back" path', () => {
    it.todo('dismisses the modal without selecting the template when user clicks "Go Back"');
  });

  describe('"I\'m 18+, Continue →" path', () => {
    it.todo('selects the template and closes the modal after age confirmation');
  });
});
