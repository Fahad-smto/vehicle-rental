import { Request, Response } from "express";
import { bookingsService } from "./bookings.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookingsService.createBooking({
      customer_id: req.body.customer_id,   // from request body per API spec
      vehicle_id: req.body.vehicle_id,
      rent_start_date: req.body.rent_start_date,
      rent_end_date: req.body.rent_end_date,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const { bookings, message } = await bookingsService.getBookings(req.user);
    return res.status(200).json({
      success: true,
      message,
      data: bookings,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // "cancelled" or "returned" per API spec

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const { booking, message } = await bookingsService.updateBooking(
      Number(req.params.bookingId),
      status,
      req.user
    );

    return res.status(200).json({
      success: true,
      message,
      data: booking,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const bookingsController = {
  createBooking,
  getBookings,
  updateBooking,
};