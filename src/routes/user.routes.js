import { Router } from "express";
import {
  addToWatchHistory,
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

router.route("/add-to-watch-history").patch(
  verifyJwt,
  upload.fields([
    {
      name: "url",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  addToWatchHistory
);
router.route("/update-user-details").patch(verifyJwt, updateAccountDetails);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
