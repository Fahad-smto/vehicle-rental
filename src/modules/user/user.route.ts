import { Router } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";
import { Roles } from "../auth/auth.constant";

const router = Router();

router.get("/", auth(Roles.admin), userController.getAllUsers);
router.put("/:userId", auth(Roles.admin, Roles.customer), userController.updateUser);
router.delete("/:userId", auth(Roles.admin), userController.deleteUser);

export const userRoute = router;