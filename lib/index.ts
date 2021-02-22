/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';

export type PossibleValidator = string | number |
 number[] | string[] | RegExp | ((key: string) => boolean)

export interface EnvConfig {
  [envKey: string]: PossibleValidator
}

export interface Overrides {
  infoLogger?: (msg: string) => void
  errorLogger?: (msg: string) => void
  shouldThrow?: boolean
  updateStatus?: boolean
}

export interface ValidationResponse {
  isValid: boolean
  message: string
  validator?: PossibleValidator
  keyToCheck?: string
}

export type EnvMiddleware = (request: Request, response: Response, next: NextFunction) => void

/**
 * The raw helper function. Returns an array of ValidationResponses
 *
 * @param envConfig the built matcher for your env
 */
export const verifyEnv = async (envConfig : EnvConfig) : Promise<ValidationResponse[]> => {
  const { env } = process;
  if (Object.keys(envConfig).length === 0) {
    return [{
      isValid: false,
      message: 'No validation passed to helper.',
    }];
  }
  const processingArray = Object.entries(envConfig).map(
    async ([key, value]) : Promise<ValidationResponse> => {
      const keyToCheck = env[key];
      if (keyToCheck === undefined) {
        return {
          isValid: false,
          message: 'The key or validator did not exist.',
        };
      }
      if (value instanceof RegExp) {
        return {
          isValid: keyToCheck.match(value) !== null,
          message: 'The key failed a RegExp match.',
          validator: value,
          keyToCheck,
        };
      }
      if (typeof value === 'function') {
        return {
          isValid: await value(keyToCheck),
          message: 'The key failed a custom matcher function.',
          validator: value.toString(),
          keyToCheck,
        };
      }
      if (Array.isArray(value)) {
        return {
        // eslint-disable-next-line eqeqeq
          isValid: value.some((possibleMatch : string | number) => keyToCheck == possibleMatch),
          message: 'The key was not included in the array you passed to match against.',
          validator: value,
          keyToCheck,
        };
      }
      return {
        isValid: value === keyToCheck,
        message: 'The value failed a direct check',
        validator: value,
        keyToCheck,
      };
    },
  );
  const processedResults = await Promise.all(processingArray);
  return processedResults;
};

/**
 * A helper that returns an express middleware for parsing the env on the host
 * @param envConfig the built matcher for your env
 * @param overrides our supported possible overrides
 */
export const envMiddleware = (envConfig : EnvConfig, overrides?: Overrides) => {
  if (overrides?.infoLogger) overrides.infoLogger('Validating env via env-enforcer middleware');
  return async (request: Request, response: Response, next: NextFunction) : void => {
    const validatedEnv = await verifyEnv(envConfig);
    const envIsValid = validatedEnv.every(({ isValid }) => isValid);
    if (!envIsValid) {
      const errorMessages = validatedEnv.map(
        ({
          isValid, message, keyToCheck, validator,
        }) => !isValid && `${
          message}\n validator: ${validator}\n value: ${keyToCheck}`,
      ).filter(Boolean);
      const shouldUpdateStatus = overrides?.updateStatus ?? true;
      if (shouldUpdateStatus) response.status(500);
      if (overrides?.errorLogger) overrides.errorLogger(errorMessages.join('\n\n'));
      if (overrides?.shouldThrow) {
        return next(new Error(errorMessages.join('\n\n')));
      }
    } else if (overrides?.infoLogger) {
      overrides.infoLogger('Env is valid, proceeding');
    }
    return next();
  };
};
