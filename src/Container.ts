import { Context } from '@loopback/context';

export let container: {
  current: Context | null;
} = {
  current: null,
};
