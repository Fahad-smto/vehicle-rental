import { Request, Response } from "express";
import { bookingsService } from "./bookings.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingsService.createBooking({
      customer_id: req.user!.id,
      vehicle_id: req.body.vehicle_id,
      rent_start_date: req.body.rent_start_date,
      rent_end_date: req.body.rent_end_date,
    });

    return res.status(201).json({ success: true, message: "Booking created", data: booking });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingsService.getBookings(req.user);
    return res.status(200).json({ success: true, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const action = req.body.action; // "cancel" or "return"
    const booking = await bookingsService.updateBooking(Number(req.params.bookingId), action, req.user);
    return res.status(200).json({ success: true, message: `Booking ${action}ed`, data: booking });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const bookingsController = {
  createBooking,
  getBookings,
  updateBooking,
};