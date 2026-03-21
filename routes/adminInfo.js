import express from "express";
import { getAdminInfo, setAdminInfo } from "../controllers/AdminInfo.js";
import isAuthenticated, { isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/info", getAdminInfo);

router.put("/set-info", isAuthenticated, isAdmin, setAdminInfo);



export default router;