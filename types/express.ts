import * as express from "express";
// import { IUser } from "./models/userModel-type";

declare global {
  namespace Express {
    interface Request {
      requestTime?: string,
    }
  }
}
