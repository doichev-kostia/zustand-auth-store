import { describe, expect, it, type MockedFunction, vi } from 'vitest';
import CookieService from './cookie-service.ts';
import { z } from 'zod';
import Cookies from "js-cookie";

// from js-cookie
interface CookieAttributes {
  /**
   * Define when the cookie will be removed. Value can be a Number
   * which will be interpreted as days from time of creation or a
   * Date instance. If omitted, the cookie becomes a session cookie.
   */
  expires?: number | Date | undefined;

  /**
   * Define the path where the cookie is available. Defaults to '/'
   */
  path?: string | undefined;

  /**
   * Define the domain where the cookie is available. Defaults to
   * the domain of the page where the cookie was created.
   */
  domain?: string | undefined;

  /**
   * A Boolean indicating if the cookie transmission requires a
   * secure protocol (https). Defaults to false.
   */
  secure?: boolean | undefined;

  /**
   * Asserts that a cookie must not be sent with cross-origin requests,
   * providing some protection against cross-site request forgery
   * attacks (CSRF)
   */
  sameSite?: "strict" | "Strict" | "lax" | "Lax" | "none" | "None" | undefined;

  /**
   * An attribute which will be serialized, conformably to RFC 6265
   * section 5.2.
   */
  [property: string]: any;
}

vi.mock('js-cookie');

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof userSchema>;

const user: User = {
  id: 1,
  name: 'John',
};

const invalidUser = {
  id: '1',
  firstName: 'John',
};

const CookieStorage = {
  test: 'test',
  invalidJSON: '<invalidJSON>',
  user: JSON.stringify(user),
  invalidUser: JSON.stringify(invalidUser),
} as const;

type TCookieStorage = typeof CookieStorage;

type AllGetter = () => { [key: string]: string };
type Getter<T = string> = (name: string) => string | T | undefined;

// cast to any to avoid type error, because it fails to mock the overloaded method
const mockedGetter = Cookies.get as any as MockedFunction<Getter>;
const mockedSetter = Cookies.set as MockedFunction<typeof Cookies.set>;
const mockedRemove = Cookies.remove as MockedFunction<typeof Cookies.remove>;

mockedGetter.mockImplementation((key: string) => CookieStorage[key]);
mockedSetter.mockImplementation((key: string, value: string, _?: CookieAttributes) => {
  CookieStorage[key] = value;
  return value;
});
mockedRemove.mockImplementation((key: string | keyof TCookieStorage) => {
  if (key in CookieStorage) {
    delete CookieStorage[key];
    return CookieStorage;
  }

  return CookieStorage;
});

describe('CookieService', () => {
  describe('get', () => {
    it('Should return undefined if the cookie is not found', () => {
      const value = CookieService.get('notFound');
      expect(value).toBeUndefined();
    });

    it('Should return the cookie value if the cookie is found', () => {
      const key = 'test';
      const value = CookieService.get(key);
      expect(value).toBe(CookieStorage[key]);
    });

    it('Should return the initial value in case JSON.parse fails', () => {
      const key = 'invalidJSON';
      const value = CookieService.get(key, { parseJSON: true });
      expect(value).toBe(CookieStorage[key]);
    });

    it('Should continue the execution if JSON.parse fails', () => {
      const key = 'invalidJSON';
      const schema = z.string().min(2);
      const value = CookieService.get(key, { parseJSON: true, validationSchema: schema });
      expect(value).toBe(CookieStorage[key]);
    });

    it('Should return parsed JSON if the cookie is found and parseJSON is true', () => {
      const key = 'user';
      const value = CookieService.get(key, { parseJSON: true });
      expect(value).toEqual(user);
    });

    it('Should return parsed JSON if the cookie is found and parseJSON is true and validationSchema is provided', () => {
      const key = 'user';
      const value = CookieService.get(key, { parseJSON: true, validationSchema: userSchema });
      expect(value).toEqual(user);
    });

    it('Should return validated value in case only validationSchema is provided', () => {
      const key = 'test';
      const schema = z.string().min(2);
      const value = CookieService.get(key, { validationSchema: schema });
      expect(value).toBe(CookieStorage[key]);
    });

    it("Should throw an error in case the value doesn't match the validation schema", () => {
      const key = 'test';
      const schema = z.string().min(10);
      expect(() => CookieService.get(key, { validationSchema: schema })).toThrow();
    });

    it('Should throw an exception in case the cookie is not parsed by validation schema', () => {
      const key = 'invalidUser';
      expect(() => CookieService.get(key, { parseJSON: true, validationSchema: userSchema })).toThrow();
    });
  });

  describe('getAll', () => {
    it('Should return all cookies', () => {
      // cast to any to avoid type error, because it fails to mock the overloaded method
      const mockedGetterAll = Cookies.get as any as MockedFunction<AllGetter>;
      mockedGetterAll.mockImplementationOnce(() => CookieStorage);
      const value = CookieService.getAll();
      expect(value).toEqual(CookieStorage);
    });
  });

  describe('set', () => {
    it('Should set a cookie', () => {
      const key = 'testSet';
      const value = 'test';
      const options = { expires: 1 };
      CookieService.set(key, value, options);
      expect(Cookies.set).toHaveBeenCalledWith(key, value, options);
      expect(CookieStorage).toHaveProperty(key, value);
    });

    it("Should convert the value to JSON if it's not a string", () => {
      const key = 'testSet';
      const value = { test: 'test' };
      CookieService.set(key, value);
      expect(Cookies.set).toHaveBeenCalledWith(key, JSON.stringify(value), undefined);
      expect(CookieStorage).toHaveProperty(key, JSON.stringify(value));
    });
  });

  describe('remove', () => {
    it('Should remove a cookie', () => {
      const key = 'toBeRemoved';
      CookieStorage[key] = 'test';
      expect(CookieStorage).toHaveProperty(key);
      CookieService.remove(key);
      expect(Cookies.remove).toHaveBeenCalledWith(key, undefined);
      expect(CookieStorage).not.toHaveProperty(key);
    });

    it('Should not throw an error if the cookie is not found', () => {
      const key = 'notFound';
      expect(() => CookieService.remove(key)).not.toThrow();
    });
  });
});
