import { Request, Response } from "express";
import { vehiclesService } from "./vehicles.service";

const createVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehiclesService.createVehicle(req.body);
    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await vehiclesService.getAllVehicles();
    return res.status(200).json({
      success: true,
      message: vehicles.length === 0 ? "No vehicles found" : "Vehicles retrieved successfully",
      data: vehicles,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehiclesService.getVehicleById(Number(req.params.vehicleId));
    return res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully",
      data: vehicle,
    });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehiclesService.updateVehicle(Number(req.params.vehicleId), req.body);
    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  try {
    await vehiclesService.deleteVehicle(Number(req.params.vehicleId));
    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const vehiclesController = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};