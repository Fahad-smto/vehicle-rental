import express from "express";
import dotenv from 'dotenv';
import path from 'path';
import { initDB } from "./database/db";
import { userRoute } from "./modules/user/user.route";
import { authRoute } from "./modules/auth/auth.route";
import { vehiclesRoute } from "./modules/vehicles/vehicles.route";
import { bookingsRoute } from "./modules/bookings/bookings.route";



dotenv.config({ path: path.join(process.cwd(), ".env") });
const app = express();
app.use(express.json());

initDB();

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/vehicles", vehiclesRoute);
app.use("/api/v1/bookings", bookingsRoute);

app.get("/", (req, res) => res.send("Vehicle Rental API Running"));

app.listen(5000, () => console.log("Server running on port 5000"));