import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuthUser from "../models/AuthUser.js";

function makeToken(authUser) {
  return jwt.sign(
    {
      authUserId: authUser._id,
      appUserId: authUser.appUserId,
      username: authUser.username,
      email: authUser.email,
      role: authUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function sendToken(res, authUser) {
  const token = makeToken(authUser);

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // set true later in production with HTTPS
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

async function getNextAppUserId() {
  const lastUser = await User.findOne().sort({ ID: -1 }).lean();
  return lastUser?.ID ? lastUser.ID + 1 : 1;
}

export async function register(req, res) {
  try {
    const { email, username, displayName, password } = req.body;

    if (!email || !username || !displayName || !password) {
      return res.status(400).json({
        ok: false,
        error: "email, username, displayName, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        ok: false,
        error: "password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();

    const existingAuthUser = await AuthUser.findOne({
      $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
    }).lean();

    if (existingAuthUser) {
      return res.status(400).json({
        ok: false,
        error: "email or username already exists",
      });
    }

    const nextId = await getNextAppUserId();

    const appUser = await User.create({
      ID: nextId,
      USERNAME: trimmedUsername,
      EMAIL: normalizedEmail,
      DISPLAY_NAME: trimmedDisplayName,
      CREATED_DATE: new Date(),
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const authUser = await AuthUser.create({
      appUserId: nextId,
      email: normalizedEmail,
      username: trimmedUsername,
      passwordHash,
      role: "user",
      isActive: true,
    });

    sendToken(res, authUser);

    return res.status(201).json({
      ok: true,
      user: {
        appUserId: appUser.ID,
        username: appUser.USERNAME,
        email: appUser.EMAIL,
        displayName: appUser.DISPLAY_NAME,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        ok: false,
        error: "emailOrUsername and password are required",
      });
    }

    const value = emailOrUsername.trim();

    const authUser = await AuthUser.findOne({
      $or: [
        { email: value.toLowerCase() },
        { username: value },
      ],
    });

    if (!authUser) {
      return res.status(401).json({
        ok: false,
        error: "invalid credentials",
      });
    }

    if (!authUser.isActive) {
      return res.status(403).json({
        ok: false,
        error: "account is inactive",
      });
    }

    const match = await bcrypt.compare(password, authUser.passwordHash);

    if (!match) {
      return res.status(401).json({
        ok: false,
        error: "invalid credentials",
      });
    }

    authUser.lastLoginAt = new Date();
    await authUser.save();

    sendToken(res, authUser);

    return res.json({
      ok: true,
      user: {
        appUserId: authUser.appUserId,
        username: authUser.username,
        email: authUser.email,
        role: authUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}

export async function logout(req, res) {
  res.clearCookie("token");
  return res.json({
    ok: true,
    message: "logged out",
  });
}

export async function me(req, res) {
  return res.json({
    ok: true,
    user: req.user,
  });
}