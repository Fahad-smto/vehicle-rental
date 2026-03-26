import { Request, Response } from "express";
import { userServices } from "./user.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getAllUsersFromDB();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const requestingUser = req.user!;

    // Customers can only update their own profile
    if (requestingUser.role === "customer" && requestingUser.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden! You can only update your own profile",
      });
    }

    // Only admins can change roles
    if (requestingUser.role === "customer" && req.body.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden! Customers cannot change roles",
      });
    }

    const updated = await userServices.updateUserInDB(userId, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    // Check if user has active bookings
    const hasActiveBookings = await userServices.hasActiveBookings(userId);
    if (hasActiveBookings) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active bookings",
      });
    }

    const deleted = await userServices.deleteUserFromDB(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const userController = {
  getAllUsers,
  updateUser,
  deleteUser,
};