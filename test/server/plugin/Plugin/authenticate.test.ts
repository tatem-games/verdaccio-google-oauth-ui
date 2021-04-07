import { GoogleAuthProvider } from 'src/server/google/AuthProvider';
import { Plugin } from 'src/server/plugin/Plugin';
import { createTestPlugin, testOAuthToken, testUsername } from 'test/utils';

jest.mock('src/server/google/AuthProvider');

// tslint:disable-next-line: variable-name
const AuthProvider: GoogleAuthProvider & jest.MockInstance<any, any> = GoogleAuthProvider as any;

describe('Plugin', () => {
  describe('authenticate', () => {
    let plugin: Plugin;

    beforeEach(() => {
      AuthProvider.mockImplementation(() => {
        return {
          async getId() {
            return 'test';
          },
          async getUsername(token: string) {
            return token === testOAuthToken ? testUsername : '';
          },
          async getGroups(token: string) {
            return token === testOAuthToken ? ['google'] : [];
          },
        };
      });
      plugin = createTestPlugin();
    });

    it('user with invalid token cannot authenticate', done => {
      plugin.authenticate(testUsername, 'invalid token', (err, groups) => {
        expect(err).toBeNull();
        expect(groups).toEqual(false);
        done();
      });
    });

    it('user with valid token can authenticate', done => {
      plugin.authenticate(testUsername, testOAuthToken, (err, groups) => {
        expect(err).toBeNull();
        expect(groups).toEqual([testRequiredGroup]);
        done();
      });
    });
  });
});
