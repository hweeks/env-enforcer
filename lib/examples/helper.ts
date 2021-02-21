/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import express, {
  NextFunction, Request, Response, Express,
} from 'express';
import http from 'http';
import { EnvMiddleware } from '../index';

export type ResHandle = (res: http.IncomingMessage) => void

export default (middleWare: EnvMiddleware, responseHandler: ResHandle) : Express => {
  const app = express();

  app.get('/health', middleWare, (req, res) => {
    res.send('ok');
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (!res.headersSent) res.send(err.message);
    next();
  });

  app.listen(42069, () => {
    http.get('http://localhost:42069/health', responseHandler);
  });

  return app;
};
