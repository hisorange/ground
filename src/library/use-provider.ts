import { BindingAddress, Constructor } from '@loopback/context';
import { container } from '../container.js';

export const useProvider = <T = unknown>(
  key: BindingAddress<T> | Constructor<object>,
): Promise<T> | T => {
  if (!container.current) {
    throw new Error('Context is not created');
  }

  // Binding key can be a class and we use the class's name to resolve it.
  if (typeof key === 'function') {
    if (key?.name) {
      key = key.name;
    }
  }

  return container.current!.get<T>(key as BindingAddress);
};
