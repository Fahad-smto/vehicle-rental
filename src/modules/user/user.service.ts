import { pool } from "../../database/db";

const getAllUsersFromDB = async () => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role FROM users ORDER BY id ASC`
  );
  return result.rows;
};

const updateUserInDB = async (userId: number, payload: any) => {
  // Build dynamic SET clause from only provided fields
  const allowedFields = ["name", "email", "phone", "role"];
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      // Lowercase email if provided
      const value = field === "email" ? payload[field].toLowerCase() : payload[field];
      fields.push(`${field} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) {
    throw new Error("No valid fields provided to update");
  }

  // Always update updated_at
  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING id, name, email, phone, role
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

const deleteUserFromDB = async (userId: number) => {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );
  return result.rows[0] || null;
};

const hasActiveBookings = async (userId: number): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active' LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0;
};

export const userServices = {
  getAllUsersFromDB,
  updateUserInDB,
  deleteUserFromDB,
  hasActiveBookings,
};