import jwt from "jsonwebtoken";
import AuthUser from "../models/AuthUser.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const authUser = await AuthUser.findById(decoded.authUserId).lean();

    if (!authUser || !authUser.isActive) {
      return res.status(401).json({
        ok: false,
        error: "user not authorized",
      });
    }

    req.user = {
      authUserId: authUser._id,
      appUserId: authUser.appUserId,
      email: authUser.email,
      username: authUser.username,
      role: authUser.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "invalid or expired token",
    });
  }
}