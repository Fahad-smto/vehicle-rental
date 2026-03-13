import { pool } from "../../database/db";

interface VehiclePayload {
  vehicle_name: string;
  type: "car" | "bike" | "van" | "SUV";
  registration_number: string;
  daily_rent_price: number;
  availability_status?: "available" | "booked";
}

const createVehicle = async (payload: VehiclePayload) => {
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status = "available" } = payload;

  if (!vehicle_name || !type || !registration_number || !daily_rent_price) {
    throw new Error("All fields are required!");
  }

  if (!["car", "bike", "van", "SUV"].includes(type)) {
    throw new Error("Invalid vehicle type!");
  }

  if (daily_rent_price <= 0) {
    throw new Error("Daily rent price must be positive!");
  }

  const existing = await pool.query(`SELECT * FROM vehicles WHERE registration_number=$1`, [registration_number]);
  if (existing.rows.length > 0) {
    throw new Error("Vehicle with this registration number already exists!");
  }

  const result = await pool.query(
    `INSERT INTO vehicles(vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status]
  );

  return result.rows[0];
};

const getAllVehicles = async () => {
  const result = await pool.query(`SELECT * FROM vehicles`);
  return result.rows;
};

const getVehicleById = async (vehicleId: number) => {
  const result = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicleId]);
  if (result.rows.length === 0) {
    throw new Error("Vehicle not found");
  }
  return result.rows[0];
};

const updateVehicle = async (vehicleId: number, payload: Partial<VehiclePayload>) => {
  const vehicle = await getVehicleById(vehicleId);

  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = {
    ...vehicle,
    ...payload,
  };

  const result = await pool.query(
    `UPDATE vehicles 
     SET vehicle_name=$1, type=$2, registration_number=$3, daily_rent_price=$4, availability_status=$5, updated_at=NOW()
     WHERE id=$6
     RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status, vehicleId]
  );

  return result.rows[0];
};

const deleteVehicle = async (vehicleId: number) => {
  // check active bookings
  const activeBooking = await pool.query(
    `SELECT * FROM bookings WHERE vehicle_id=$1 AND status='active'`,
    [vehicleId]
  );
  if (activeBooking.rows.length > 0) {
    throw new Error("Cannot delete vehicle with active bookings!");
  }

  await pool.query(`DELETE FROM vehicles WHERE id=$1`, [vehicleId]);
  return { message: "Vehicle deleted successfully" };
};

export const vehiclesService = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
