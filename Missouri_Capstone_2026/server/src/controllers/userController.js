import * as userService from "../services/userService.js";

export async function createUser(req, res) {
  try {
    const { email, displayName } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ ok: false, error: "email and displayName are required" });
    }

    const user = await userService.createUser({ email, displayName });
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}