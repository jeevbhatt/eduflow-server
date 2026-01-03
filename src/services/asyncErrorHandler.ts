import { Request, Response, NextFunction } from 'express';

//higher order function to handle async errors in express in parameters
// this function accepts a function as an argument and returns a new function that handles errors
//(fn:Function) callback function and entire asyncErrorHandler is a higher order function
//yo asyncHandler lai route ma use garna sakinchha
//example : app.get('/route', asyncErrorHandler(async (req, res, next)
const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncErrorHandler;
