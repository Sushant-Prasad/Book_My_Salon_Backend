import express from "express";

const router = express.Router();

import { createReview, getBarberReviews, getYourReview, getAllReviews, deleteReview, EveryBarberRating } from "../controllers/Review.js";
import isAuthenticated from "../middleware/auth.js";    

// Create a review (protected route)
router.post("/create", isAuthenticated, createReview);

// Get all barbers with their ratings (public route) - MUST be before /barber/:barberId
router.get("/barber/ratings", EveryBarberRating);

// Get reviews for a specific barber (public route)
router.get("/barber/:barberId", getBarberReviews);

// Get all reviews with optional filters (public route)
router.get("/reviews", getAllReviews);

// Get all reviews by the logged-in user (protected route)
router.get("/my-review", isAuthenticated, getYourReview);

// Delete a review (protected route)
router.delete("/delete/:reviewId", isAuthenticated, deleteReview);

export default router;