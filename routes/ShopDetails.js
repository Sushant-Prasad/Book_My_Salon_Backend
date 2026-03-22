import express from "express";
import {
    createOrUpdateShopDetails,
    getShopDetails,
    getMyShopDetails,
    toggleTodayOpen,
    addToSpamList,
    getSpamList,
    removeFromSpamList,
    getAllBarbers,
    searchShops
} from "../controllers/ShopDetails.js";
import protect from "../middleware/auth.js";
import isAuthenticated from "../middleware/auth.js";
import { singleAvatar } from "../middleware/multer.js";

const router = express.Router();


// Get all barbers (for customers)
router.get("/all-barbers", getAllBarbers);

// Search barbers by name or shop address (public)
router.get("/search", searchShops);

// Get shop details by barber ID (public)
router.get("/details/:barberId", getShopDetails);

// Protected routes (require authentication)
router.use(isAuthenticated);

// Create or update shop details (only barbers)
router.put("/create-update", singleAvatar, createOrUpdateShopDetails);

// Get barber's own shop details
router.get("/my-details", getMyShopDetails);

// Toggle today open status
router.put("/toggle-today-open", toggleTodayOpen);

// Spam list management
router.post("/spam-list/add", addToSpamList);
router.get("/spam-list", getSpamList);
router.delete("/spam-list/remove/:customer_id", removeFromSpamList);


export default router;