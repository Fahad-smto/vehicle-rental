import { pool } from "../../database/db";

interface BookingPayload {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
}

const createBooking = async (payload: BookingPayload) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    throw new Error("All fields are required!");
  }

  const start = new Date(rent_start_date);
  const end = new Date(rent_end_date);
  if (end <= start) throw new Error("End date must be after start date");

  // check vehicle availability
  const vehicleRes = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicle_id]);
  if (vehicleRes.rows.length === 0) throw new Error("Vehicle not found");
  const vehicle = vehicleRes.rows[0];

  if (vehicle.availability_status !== "available") throw new Error("Vehicle is not available");

  // calculate total price
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 1;
  const total_price = Number(vehicle.daily_rent_price) * days;

  const booking = await pool.query(
    `INSERT INTO bookings(customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES($1,$2,$3,$4,$5,'active') RETURNING *`,
    [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
  );

  // update vehicle status
  await pool.query(`UPDATE vehicles SET availability_status='booked' WHERE id=$1`, [vehicle_id]);

  return booking.rows[0];
};

const getBookings = async (user: any) => {
  if (user.role === "admin") {
    const all = await pool.query(`SELECT * FROM bookings`);
    return all.rows;
  } else {
    const userBookings = await pool.query(`SELECT * FROM bookings WHERE customer_id=$1`, [user.id]);
    return userBookings.rows;
  }
};

const updateBooking = async (bookingId: number, action: "cancel" | "return", user: any) => {
  const bookingRes = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
  if (bookingRes.rows.length === 0) throw new Error("Booking not found");
  const booking = bookingRes.rows[0];

  if (action === "cancel") {
    if (new Date() >= new Date(booking.rent_start_date)) throw new Error("Cannot cancel after start date");
    if (user.role !== "customer") throw new Error("Only customer can cancel");
    await pool.query(`UPDATE bookings SET status='cancelled' WHERE id=$1`, [bookingId]);
    await pool.query(`UPDATE vehicles SET availability_status='available' WHERE id=$1`, [booking.vehicle_id]);
  } else if (action === "return") {
    if (user.role !== "admin") throw new Error("Only admin can mark as returned");
    await pool.query(`UPDATE bookings SET status='returned' WHERE id=$1`, [bookingId]);
    await pool.query(`UPDATE vehicles SET availability_status='available' WHERE id=$1`, [booking.vehicle_id]);
  }

  const updated = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
  return updated.rows[0];
};

export const bookingsService = {
  createBooking,
  getBookings,
  updateBooking,
};
