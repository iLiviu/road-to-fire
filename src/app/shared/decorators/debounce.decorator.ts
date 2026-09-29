import debounce from 'lodash-es/debounce';

export interface DebounceSettings {
  leading?: boolean;
  maxWait?: number;
  trailing?: boolean;
}

/**
 * Method decorator that debounces the decorated method using lodash-es debounce.
 * Ensures debouncing is scoped per class instance.
 *
 * @param wait Number of milliseconds to delay.
 * @param options Debounce options (leading, maxWait, trailing).
 */
export function Debounce(wait = 0, options?: DebounceSettings): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ): TypedPropertyDescriptor<any> {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new TypeError(`@Debounce can only decorate functions, received: ${typeof originalMethod}`);
    }

    return {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() {
        const boundFn = debounce(originalMethod.bind(this), wait, options);

        Object.defineProperty(this, propertyKey, {
          value: boundFn,
          configurable: true,
          writable: true,
          enumerable: descriptor.enumerable,
        });

        return boundFn;
      },
      set(value) {
        Object.defineProperty(this, propertyKey, {
          value,
          configurable: true,
          writable: true,
          enumerable: descriptor.enumerable,
        });
      },
    };
  };
}

export const debounceDecorator = Debounce;
// Also export debounce so consumers can import { debounce } from '...'
export { Debounce as debounce };
