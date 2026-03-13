import { Pool } from "pg";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') })
export const pool = new Pool({
  connectionString:
    `${process.env.CONNECTION_STR}`
});


export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(250) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role VARCHAR(100) NOT NULL,
      age INT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )

  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      vehicle_name VARCHAR(150) NOT NULL,
      type VARCHAR(50) CHECK(type IN ('car','bike','van','SUV')) NOT NULL,
      registration_number VARCHAR(100) UNIQUE NOT NULL,
      daily_rent_price NUMERIC(10,2) NOT NULL CHECK(daily_rent_price > 0),
      availability_status VARCHAR(50) CHECK(availability_status IN ('available','booked')) DEFAULT 'available',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
     );
    `)

    await pool.query(`
       CREATE TABLE IF NOT EXISTS bookings (
     id SERIAL PRIMARY KEY,
     customer_id INT REFERENCES users(id),
     vehicle_id INT REFERENCES vehicles(id),
     rent_start_date DATE NOT NULL,
     rent_end_date DATE NOT NULL,
     total_price NUMERIC(10,2) NOT NULL CHECK(total_price > 0),
     status VARCHAR(50) CHECK(status IN ('active','cancelled','returned')) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
);
      `)

  console.log("Database Connected");
};
