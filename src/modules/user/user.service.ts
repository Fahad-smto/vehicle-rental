import bcrypt from "bcryptjs";
import { pool } from "../../database/db";

const createUserIntoDB = async (payload: any) => {
  let { name, email, password, role, phone } = payload;

  if (!name || !email || !password || !phone || !role) {
    throw new Error("Name, Email, Password, Phone, and Role are required!");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters!");
  }

  if (!["admin", "customer"].includes(role)) {
    throw new Error("Role must be either admin or customer");
  }

  email = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
      INSERT INTO users(name, email, password, phone, role)
      VALUES($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `,
    [name, email, hashedPassword, phone, role]
  );

  return result;
};

const getAllUserIntoDB = async () => {
  const result = await pool.query(`
     SELECT id, name, email, phone, role FROM users
  `);
  return result;
};

const getSingleUserIntoDB = async (email: string) => {
  const result = await pool.query(
    `
      SELECT id, name, email, phone, role 
      FROM users 
      WHERE email=$1
    `,
    [email.toLowerCase()]
  );

  return result.rows[0];
};

export const userServices = {
  createUserIntoDB,
  getAllUserIntoDB,
  getSingleUserIntoDB,
};
