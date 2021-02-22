# env-enforcer

a tool to help validate the process env for express applications.

## use

to use the tool, create a middleware and add it to your health route:

```js
import express from 'express';
import { envMiddleware } from 'env-enforcer';

const app = express();

const middleware = envMiddleware({
  USERNAME: 'hammy',
});

app.get('/health', middleWare, (req, res) => {
  res.send('ok');
});

app.use((err, req, res, next) => {
  if (!res.headersSent) res.send(err.message);
  next();
});

app.listen(42069);
```

Which would return a 500 for `/health` if the `process.env.USERNAME` is not 'hammy'. There are a few types we can parse in the helper.

## EnvConfig Help

The env config exports it's types for use with TypeScript, but here they are:

```ts
export type PossibleValidator = string | number | number[] | string[] | RegExp | ((key: string) => boolean)

export interface EnvConfig {
  [envKey: string]: PossibleValidator
}
```

So a number/string or an array of them, a RegEx check, or a function that will be passed the key value and expects a boolean return; true if valid, false if invalid. The return function is async and allows the passing of promise based validation functions.

## Middleware Overrides

We also export the TypeScript types, but here they are:

```ts
export interface Overrides {
  infoLogger?: (msg: string) => void
  errorLogger?: (msg: string) => void
  shouldThrow?: boolean
  updateStatus?: boolean
}
```

We give you the ability to add info and error logs, override the default status setting of 500 or at all, and allow you to set it to 'throw' or pass an error to the `NextFunction` from express, triggering your final error catching middleware. Our implementation uses the `next` callback to process your validation. Make sure you're using next and middleware in the prescribed way.

## Examples

There is a live example you can see in the `lib/examples` folder.
