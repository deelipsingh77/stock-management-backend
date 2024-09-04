import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/all-users").get(verifyJWT, getAllUsers);

// Dynamic routes for specific user operations
router
  .route("/:userId")
  .get(verifyJWT, getUserById) // Get a specific user by ID
  .patch(verifyJWT, updateUserById) // Update a specific user by ID
  .delete(verifyJWT, deleteUserById); // Delete a specific user by ID

export default router;
