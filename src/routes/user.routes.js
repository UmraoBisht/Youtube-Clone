import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
const router = Router();

router.route("/register").get(registerUser);
// router.route("/login").get(login);

export default router;
