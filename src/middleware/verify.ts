import { NextFunction, Request, Response } from "express";

const verify = (req: Request, res: Response, next: NextFunction) => {
  const ID = true;
  if (!ID) {
    throw new Error("Not Allowed");
  }
  next();
};

export default verify;
