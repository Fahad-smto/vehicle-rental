import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { secret } from "../modules/auth/auth.service";

const auth =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized! Token missing",
        });
      }

      const decoded = jwt.verify(token, secret);
      req.user = decoded as any;

      if (roles.length && !roles.includes(req?.user?.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You do not have access",
        });
      }

      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };

export default auth;
