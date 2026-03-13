import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// Signup route
router.post('/signup', authController.signupUser);

// Login route
router.post('/login', authController.loginUser);

export const authRoute = router;
