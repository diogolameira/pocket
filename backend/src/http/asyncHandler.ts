import type { NextFunction, Request, Response } from 'express'

/** Wrap an async route handler so rejected promises reach the error middleware. */
export function wrap(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next)
  }
}
