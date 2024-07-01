import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/reset-password").post(resetPassword);

// Secured Routes
router.route("/user").get(verifyJwt, getCurrentUser);
router
  .route("/update-avatar")
  .post(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .post(verifyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/update-user-details").post(verifyJwt, updateAccountDetails);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
