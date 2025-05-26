declare global {
  var jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.MockedFunction<T>;
    mock: (moduleName: string, factory?: () => any, options?: any) => typeof jest;
    spyOn: <T extends {}, M extends keyof T>(object: T, method: M) => jest.SpyInstance<T[M] extends (...args: any[]) => any ? ReturnType<T[M]> : any, T[M] extends (...args: any[]) => any ? Parameters<T[M]> : any[]>;
    clearAllMocks: () => typeof jest;
    resetAllMocks: () => typeof jest;
    restoreAllMocks: () => typeof jest;
  };
  
  var expect: {
    <T = any>(actual: T): jest.Matchers<void, T>;
    extend(matchers: Record<string, any>): void;
  };
  
  var test: (name: string, fn: () => void | Promise<void>, timeout?: number) => void;
  var describe: (name: string, fn: () => void) => void;
  var beforeAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  var afterAll: (fn: () => void | Promise<void>, timeout?: number) => void;
  var beforeEach: (fn: () => void | Promise<void>, timeout?: number) => void;
  var afterEach: (fn: () => void | Promise<void>, timeout?: number) => void;

  namespace jest {
    interface Matchers<R, T = {}> {
      toBe(expected: T): R;
      toEqual(expected: T): R;
      toBeDefined(): R;
      toBeNull(): R;
      toBeInstanceOf(expected: any): R;
      toContain(expected: any): R;
      toBeLessThanOrEqual(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeValidEmail(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toHaveBeenLastCalledWith(...args: any[]): R;
      toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): R;
      toHaveReturned(): R;
      toHaveReturnedWith(expected: any): R;
      toHaveReturnedTimes(expected: number): R;
      toHaveLastReturnedWith(expected: any): R;
      toHaveNthReturnedWith(nthCall: number, expected: any): R;
    }

    interface MockedFunction<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>;
      mockReturnValue(value: ReturnType<T>): this;
      mockImplementation(fn: T): this;
      mockResolvedValue(value: ReturnType<T>): this;
      mockRejectedValue(value: any): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      getMockName(): string;
      mock: MockContext<T>;
    }

    interface MockContext<T extends (...args: any[]) => any> {
      calls: Parameters<T>[];
      instances: ReturnType<T>[];
      invocationCallOrder: number[];
      results: Array<MockResult<ReturnType<T>>>;
    }

    interface MockResult<T> {
      type: 'return' | 'throw' | 'incomplete';
      value: T;
    }

    interface SpyInstance<TReturnValue = any, TArgs extends any[] = any[]> {
      mockReturnValue(value: TReturnValue): this;
      mockImplementation(fn: (...args: TArgs) => TReturnValue): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      getMockName(): string;
      mock: MockContext<(...args: TArgs) => TReturnValue>;
    }
  }

  namespace NodeJS {
    interface Global {
      fetch: jest.MockedFunction<typeof fetch>;
      localStorage: Storage;
      window: Window & typeof globalThis;
    }
  }
}

export {};
