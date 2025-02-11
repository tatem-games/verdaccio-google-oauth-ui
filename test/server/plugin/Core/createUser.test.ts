import { AuthCore } from 'src/server/plugin/AuthCore';
import { createTestAuthCore, testRequiredGroup, testUsername } from 'test/utils';

describe('AuthCore', () => {
  describe('createUser', () => {
    let core: AuthCore;

    beforeEach(() => {
      core = createTestAuthCore();
    });

    it('user contains configured username', () => {
      const user = core.createUser(testUsername);
      expect(user.name).toBe(testUsername);
    });

    it('user groups includes the google org', () => {
      const user = core.createUser(testUsername);
      expect(user.groups).toContain('google');
      expect(user.real_groups).toContain('google');
    });
  });
});
