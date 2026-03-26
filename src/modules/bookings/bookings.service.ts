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

  // Check vehicle exists and is available
  const vehicleRes = await pool.query(
    `SELECT id, vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id=$1`,
    [vehicle_id]
  );
  if (vehicleRes.rows.length === 0) throw new Error("Vehicle not found");
  const vehicle = vehicleRes.rows[0];
  if (vehicle.availability_status !== "available") throw new Error("Vehicle is not available");

  // Check customer exists
  const customerRes = await pool.query(`SELECT id FROM users WHERE id=$1`, [customer_id]);
  if (customerRes.rows.length === 0) throw new Error("Customer not found");

  // Calculate total price
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  const total_price = Number(vehicle.daily_rent_price) * days;

  // Create booking
  const bookingRes = await pool.query(
    `INSERT INTO bookings(customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES($1,$2,$3,$4,$5,'active')
     RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
    [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
  );

  // Update vehicle status to booked
  await pool.query(`UPDATE vehicles SET availability_status='booked' WHERE id=$1`, [vehicle_id]);

  // Return booking with vehicle info as per API spec
  return {
    ...bookingRes.rows[0],
    vehicle: {
      vehicle_name: vehicle.vehicle_name,
      daily_rent_price: vehicle.daily_rent_price,
    },
  };
};

const getBookings = async (user: any) => {
  if (user.role === "admin") {
    // Admin sees all bookings with customer + vehicle info
    const result = await pool.query(`
      SELECT 
        b.id, b.customer_id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
        u.name AS customer_name, u.email AS customer_email,
        v.vehicle_name, v.registration_number
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id ASC
    `);

    const bookings = result.rows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      rent_start_date: row.rent_start_date,
      rent_end_date: row.rent_end_date,
      total_price: row.total_price,
      status: row.status,
      customer: {
        name: row.customer_name,
        email: row.customer_email,
      },
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
      },
    }));

    return { bookings, message: "Bookings retrieved successfully" };
  } else {
    // Customer sees only their own bookings with vehicle info
    const result = await pool.query(`
      SELECT 
        b.id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
        v.vehicle_name, v.registration_number, v.type
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.customer_id = $1
      ORDER BY b.id ASC
    `, [user.id]);

    const bookings = result.rows.map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      rent_start_date: row.rent_start_date,
      rent_end_date: row.rent_end_date,
      total_price: row.total_price,
      status: row.status,
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
        type: row.type,
      },
    }));

    return { bookings, message: "Your bookings retrieved successfully" };
  }
};

const updateBooking = async (bookingId: number, status: string, user: any) => {
  // Check booking exists
  const bookingRes = await pool.query(
    `SELECT * FROM bookings WHERE id=$1`,
    [bookingId]
  );
  if (bookingRes.rows.length === 0) throw new Error("Booking not found");
  const booking = bookingRes.rows[0];

  if (status === "cancelled") {
    // Only customer can cancel, and only before start date
    if (user.role !== "customer") throw new Error("Only customers can cancel bookings");
    if (booking.status !== "active") throw new Error("Only active bookings can be cancelled");
    if (new Date() >= new Date(booking.rent_start_date)) {
      throw new Error("Cannot cancel booking after start date");
    }

    await pool.query(`UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE id=$1`, [bookingId]);
    await pool.query(`UPDATE vehicles SET availability_status='available' WHERE id=$1`, [booking.vehicle_id]);

    const updated = await pool.query(
      `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id=$1`,
      [bookingId]
    );

    return { booking: updated.rows[0], message: "Booking cancelled successfully" };

  } else if (status === "returned") {
    // Only admin can mark as returned
    if (user.role !== "admin") throw new Error("Only admins can mark bookings as returned");
    if (booking.status !== "active") throw new Error("Only active bookings can be marked as returned");

    await pool.query(`UPDATE bookings SET status='returned', updated_at=NOW() WHERE id=$1`, [bookingId]);
    await pool.query(`UPDATE vehicles SET availability_status='available' WHERE id=$1`, [booking.vehicle_id]);

    const updated = await pool.query(
      `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id=$1`,
      [bookingId]
    );

    return {
      booking: {
        ...updated.rows[0],
        vehicle: { availability_status: "available" },
      },
      message: "Booking marked as returned. Vehicle is now available",
    };

  } else {
    throw new Error("Invalid status. Must be 'cancelled' or 'returned'");
  }
};

export const bookingsService = {
  createBooking,
  getBookings,
  updateBooking,
};