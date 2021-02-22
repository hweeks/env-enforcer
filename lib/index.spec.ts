/* eslint-disable no-empty-pattern */
import { envMiddleware, verifyEnv } from './index';

describe('env enforcer tests', () => {
  const envBackup = { ...process.env };
  const possibleValidations = [
    [
      {
        TEST_KEY: 'test',
      },
      {
        TEST_KEY: 'test',
      },
      [
        {
          message: 'The value failed a direct check',
          isValid: true,
        },
      ],
    ],
    [
      {
        TEST_KEY: 'test',
      },
      {
        TEST_KEY: 'tester',
      },
      [
        {
          message: 'The value failed a direct check',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: 'test',
      },
      {
        TEST_KEY: ['test'],
      },
      [
        {
          message: 'The key was not included in the array you passed to match against.',
          isValid: true,
        },
      ],
    ],
    [
      {
        TEST_KEY: 'test',
      },
      {
        TEST_KEY: ['tester'],
      },
      [
        {
          message: 'The key was not included in the array you passed to match against.',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY: [1],
      },
      [
        {
          message: 'The key was not included in the array you passed to match against.',
          isValid: true,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY: [2],
      },
      [
        {
          message: 'The key was not included in the array you passed to match against.',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY: (value: string) => value === '1',
      },
      [
        {
          message: 'The key failed a custom matcher function.',
          isValid: true,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY: (value: string) => value === '2',
      },
      [
        {
          message: 'The key failed a custom matcher function.',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: 'test',
      },
      {
        TEST_KEY: /test/gi,
      },
      [
        {
          message: 'The key failed a RegExp match.',
          isValid: true,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY: /case/gi,
      },
      [
        {
          message: 'The key failed a RegExp match.',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
        TEST_KEY_NONE: 1,
      },
      [
        {
          message: 'The key or validator did not exist.',
          isValid: false,
        },
      ],
    ],
    [
      {
        TEST_KEY: '1',
      },
      {
      },
      [
        {
          message: 'No validation passed to helper.',
          isValid: false,
        },
      ],
    ],
  ];
  afterEach(() => {
    process.env = envBackup;
  });
  describe('verifyEnv', () => {
    test.each(possibleValidations)(
      'check if %o validates %o correctly to %j',
      async (envOverride, envChecker, partialMessage) => {
        process.env = envOverride;
        const builtResponse = await verifyEnv(envChecker);
        builtResponse.forEach((value, indexOfValue) => {
          expect(value.message).toBe(partialMessage[indexOfValue].message);
          expect(value.isValid).toBe(partialMessage[indexOfValue].isValid);
        });
      },
    );
  });
  describe('envMiddleware', () => {
    const reqMock = jest.fn();
    const nextMock = jest.fn();
    const resMock = {
      status: jest.fn(),
    };
    beforeEach(() => {
      reqMock.mockClear();
      nextMock.mockClear();
      resMock.status.mockClear();
    });
    const validAndInvalid = [
      [
        {
          TEST_KEY: 'test',
        },
        {
          TEST_KEY: 'test',
        },
        [
          {
            message: 'The value failed a direct check',
            isValid: true,
          },
        ],
      ],
      [
        {
          TEST_KEY: 'test',
        },
        {
          TEST_KEY: 'tester',
        },
        [
          {
            message: 'The value failed a direct check',
            isValid: false,
          },
        ],
      ],
    ];
    test('should call info if infoLogger is set w/ valid conf', async () => {
      const overRider = {
        infoLogger: jest.fn(),
      };
      const [[validEnv, validConf], []] = validAndInvalid;
      process.env = validEnv;
      await envMiddleware(validConf, overRider)(reqMock, resMock, nextMock);
      expect(overRider.infoLogger).toBeCalledTimes(2);
    });
    test('should call info if infoLogger is set w/o valid conf', async () => {
      const overRider = {
        infoLogger: jest.fn(),
      };
      const [[], [invalidEnv, invalidConf]] = validAndInvalid;
      process.env = invalidEnv;
      await envMiddleware(invalidConf, overRider)(reqMock, resMock, nextMock);
      expect(overRider.infoLogger).toBeCalledTimes(1);
      expect(resMock.status).toHaveBeenLastCalledWith(500);
    });
    test('should not call error if errorLogger is set w/ valid conf', async () => {
      const overRider = {
        errorLogger: jest.fn(),
      };
      const [[validEnv, validConf], []] = validAndInvalid;
      process.env = validEnv;
      await envMiddleware(validConf, overRider)(reqMock, resMock, nextMock);
      expect(overRider.errorLogger).toBeCalledTimes(0);
    });
    test('should call error if errorLogger is set w/o valid conf', async () => {
      const overRider = {
        errorLogger: jest.fn(),
      };
      const [[], [invalidEnv, invalidConf]] = validAndInvalid;
      process.env = invalidEnv;
      await envMiddleware(invalidConf, overRider)(reqMock, resMock, nextMock);
      expect(overRider.errorLogger).toHaveBeenLastCalledWith(`The value failed a direct check
 validator: tester
 value: test`);
      expect(resMock.status).toHaveBeenLastCalledWith(500);
    });
    test('should not set status if shouldUpdateStatus is set w/ valid conf', async () => {
      const overRider = {
        shouldUpdateStatus: false,
      };
      const [[validEnv, validConf], []] = validAndInvalid;
      process.env = validEnv;
      await envMiddleware(validConf, overRider)(reqMock, resMock, nextMock);
      expect(resMock.status).toBeCalledTimes(0);
    });
    test('should set status if shouldUpdateStatus is set w/o valid conf', async () => {
      const overRider = {
        shouldUpdateStatus: true,
      };
      const [[], [invalidEnv, invalidConf]] = validAndInvalid;
      process.env = invalidEnv;
      await envMiddleware(invalidConf, overRider)(reqMock, resMock, nextMock);
      expect(resMock.status).toHaveBeenLastCalledWith(500);
    });
    test('pass error to next if shouldThrow is set', async () => {
      const overRider = {
        shouldThrow: true,
      };
      const [[], [invalidEnv, invalidConf]] = validAndInvalid;
      process.env = invalidEnv;
      await envMiddleware(invalidConf, overRider)(reqMock, resMock, nextMock);
      expect(resMock.status).toHaveBeenLastCalledWith(500);
      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });
});
