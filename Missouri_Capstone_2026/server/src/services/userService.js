import User from "../models/User.js";

export async function createUser({ email, displayName }) {
  return await User.create({ email, displayName });
}

export async function getUserById(userId) {
  return await User.findById(userId);
}