/* eslint-disable no-console */
import testApp from './helper';
import { envMiddleware } from '../index';

const middleware = envMiddleware({
  USERNAME: 'hammy',
});

const handler = (response) => {
  if (response.statusCode > 399) {
    console.error('oops, all wrong!');
    process.exit(1);
  } else {
    console.log('it worked!');
    process.exit(0);
  }
};

testApp(middleware, handler);
