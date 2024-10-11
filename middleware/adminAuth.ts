import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AdminInterface } from "../models/adminModal";

declare global {
  namespace Express {
    interface Request {
      user?: AdminInterface; // Custom user property
    }
  }
}

const isAdmin: (req: Request, res: Response, next: NextFunction) => void = (
  req,
  res,
  next
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    // Verify the token
    jwt.verify(token, `${process.env.SECRETKEY}`, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized" });
      } else {
        const user = decodedToken as AdminInterface; // Assuming the token payload contains user information
        if (user.role === "admin" || user.role === "superAdmin") {
          req.user = user; // Set the user property on the request object
          next();
        } else {
          // User is not an admin, send a 403 Forbidden response
          return res.status(403).json({ message: "Forbidden" });
        }
      }
    });
  } else {
    // Authorization header is missing or invalid, send a 401 Unauthorized response
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default isAdmin;
