import { Role } from './role.enum';
import { Action, can, canAny, allowedActions } from './permissions';

describe('permissions', () => {
  describe('can()', () => {
    it('Admin can do everything', () => {
      for (const action of Object.values(Action)) {
        expect(can(Role.Admin, action)).toBe(true);
      }
    });

    it('Accountant can do everything', () => {
      for (const action of Object.values(Action)) {
        expect(can(Role.Accountant, action)).toBe(true);
      }
    });

    it('Dispatcher can preview salary but not generate', () => {
      expect(can(Role.Dispatcher, Action.SalaryPreview)).toBe(true);
      expect(can(Role.Dispatcher, Action.SalaryGenerate)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryFreeze)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryUnfreeze)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryRecalculate)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryAdjust)).toBe(false);
    });

    it('Dispatcher can read/preview/generate statements', () => {
      expect(can(Role.Dispatcher, Action.StatementsRead)).toBe(true);
      expect(can(Role.Dispatcher, Action.StatementsPreview)).toBe(true);
      expect(can(Role.Dispatcher, Action.StatementsGenerate)).toBe(true);
    });

    it('Dispatcher cannot access salary rules', () => {
      expect(can(Role.Dispatcher, Action.SalaryRulesRead)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryRulesCreate)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryRulesEdit)).toBe(false);
      expect(can(Role.Dispatcher, Action.SalaryRulesActivate)).toBe(false);
    });

    it('Dispatcher can manage loads but not archive', () => {
      expect(can(Role.Dispatcher, Action.LoadsRead)).toBe(true);
      expect(can(Role.Dispatcher, Action.LoadsCreate)).toBe(true);
      expect(can(Role.Dispatcher, Action.LoadsEdit)).toBe(true);
      expect(can(Role.Dispatcher, Action.LoadsExport)).toBe(true);
      expect(can(Role.Dispatcher, Action.LoadsArchive)).toBe(false);
    });

    it('Assistant can only manage loads (no export, no archive)', () => {
      expect(can(Role.Assistant, Action.LoadsRead)).toBe(true);
      expect(can(Role.Assistant, Action.LoadsCreate)).toBe(true);
      expect(can(Role.Assistant, Action.LoadsEdit)).toBe(true);
      expect(can(Role.Assistant, Action.LoadsExport)).toBe(false);
      expect(can(Role.Assistant, Action.LoadsArchive)).toBe(false);
    });

    it('Assistant cannot access salary, statements, or settings', () => {
      expect(can(Role.Assistant, Action.SalaryPreview)).toBe(false);
      expect(can(Role.Assistant, Action.SalaryGenerate)).toBe(false);
      expect(can(Role.Assistant, Action.StatementsRead)).toBe(false);
      expect(can(Role.Assistant, Action.SalaryRulesRead)).toBe(false);
    });
  });

  describe('canAny()', () => {
    it('returns true if at least one action is allowed', () => {
      expect(canAny(Role.Dispatcher, [Action.SalaryGenerate, Action.SalaryPreview])).toBe(true);
    });

    it('returns false if no actions are allowed', () => {
      expect(canAny(Role.Assistant, [Action.SalaryGenerate, Action.SalaryPreview])).toBe(false);
    });
  });

  describe('allowedActions()', () => {
    it('Admin has all actions', () => {
      const actions = allowedActions(Role.Admin);
      expect(actions.length).toBe(Object.values(Action).length);
    });

    it('Assistant has only load CRUD actions', () => {
      const actions = allowedActions(Role.Assistant);
      expect(actions).toContain(Action.LoadsRead);
      expect(actions).toContain(Action.LoadsCreate);
      expect(actions).toContain(Action.LoadsEdit);
      expect(actions).not.toContain(Action.LoadsExport);
      expect(actions).not.toContain(Action.LoadsArchive);
      expect(actions.length).toBe(3);
    });
  });
});
