# Ground

Experimental ALS based kernel, utilises the context isolation provided by Node's ALS.
In theory we can create fully isolated context for each request / job / task, without dependency injection or bulky controllers.

Main goal of this experiment to create routes and tasks in a more functional way, where the task asks for it's
dependencies to be resolved for each request, thus we can inject / replace providers dynamically without the need of classes to execute the dependency injection from metadata.

### Example HTTP route handler

Mind the level of isolation, no need to share dozens of class level injections.

```typescript
export const GET = () => {
  const request = useRequest();
  return 'hello.' + request.id;
};
```

### Example CRON job handler

```typescript
export default async () => {
  const id = useJobID();
  const data = useJobData();

  // Do smth useful...

  return id + 1;
};
```
