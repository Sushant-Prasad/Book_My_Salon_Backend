import express from "express";
import { getLastThreeMonthRevenue, getBarberRevenueByMonth } from "../controllers/Revenue.js";


const router = express.Router();

router.get("/quarterly",  getLastThreeMonthRevenue);
router.get("/barber-monthly", getBarberRevenueByMonth);


export default router;