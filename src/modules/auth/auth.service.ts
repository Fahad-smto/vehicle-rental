import bcrypt from "bcryptjs";
import { pool } from "../../database/db";
import jwt from "jsonwebtoken";

export const secret = process.env.JWT_SECRET || "default-secret-key";

const signupUserIntoDB = async (payload: any) => {
  const { name, email, password, phone, role } = payload;


  if (!name || !email || !password || !phone || !role) {
    throw new Error("All fields are required!");
  }

  if (!["admin", "customer"].includes(role)) {
    throw new Error("Invalid role! Use 'admin' or 'customer'.");
  }


  const lowerEmail = email.toLowerCase();

  const exists = await pool.query(
    `SELECT id FROM users WHERE email=$1`,
    [lowerEmail]
  );

  if (exists.rows.length > 0) {
    throw new Error("Email already exists!");
  }


  const hashedPassword = await bcrypt.hash(password, 12);


  const result = await pool.query(
    `
      INSERT INTO users(name, email, password, phone, role)
      VALUES($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role
    `,
    [name, lowerEmail, hashedPassword, phone, role]
  );

  return result.rows[0];
};

const loginUserIntoDB = async (email: string, password: string) => {
  const lowerEmail = email.toLowerCase();

  // Find user
  const user = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [lowerEmail]
  );

  if (user.rows.length === 0) {
    throw new Error("User not found!");
  }

  const matched = await bcrypt.compare(password, user.rows[0].password);

  if (!matched) {
    throw new Error("Invalid password!");
  }

  const jwtPayload = {
    id: user.rows[0].id,
    email: user.rows[0].email,
    role: user.rows[0].role,
  };

  const token = jwt.sign(jwtPayload, secret, { expiresIn: "7d" });

  return {
    token: `Bearer ${token}`,
    user: user.rows[0],
  };
};

export const authServices = {
  signupUserIntoDB,
  loginUserIntoDB,
};
