import { BindingAddress, Constructor } from '@loopback/context';
import { container } from '../container.js';

export const useProvider = <T = unknown>(
  address: BindingAddress<T> | Constructor<object>,
): Promise<T> | T => {
  if (!container.current) {
    throw new Error('Context is not created');
  }

  // Binding key can be a class and we use the class's name to resolve it.
  if (typeof address === 'function') {
    if (address?.name) {
      address = address.name;
    } else {
      throw new Error('Binding key is a class without a name');
    }
  }

  return container.current!.get<T>(address);
};
