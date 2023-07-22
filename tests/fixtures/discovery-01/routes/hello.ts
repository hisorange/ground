import { useRequest } from '../../../../src/index.js';

export const GET = () => {
  const request = useRequest();

  return 'hello.' + request.id;
};
