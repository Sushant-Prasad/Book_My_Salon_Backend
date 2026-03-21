import express from "express";
import { getMyProfile, login, logout, newUser, removeBarber, getUserActivity, getAllUsersActivity } from "../controllers/User.js";
import isAuthenticated, { isAdmin } from "../middleware/auth.js";

const router = express.Router();
router.post("/signup", newUser);
router.post("/login", login);
router.get("/logout", isAuthenticated,  logout);
router.get("/me", isAuthenticated, getMyProfile);
router.delete("/remove/:barberId", isAuthenticated, isAdmin, removeBarber);

// User activity routes
router.get("/activity/:userId", isAuthenticated, isAdmin, getUserActivity);
router.get("/activity", isAuthenticated, isAdmin, getAllUsersActivity);


export default router;