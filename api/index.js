import express from 'express';
// import bodyParser from "body-parser";
import connectDatabase from '../config/database.js';
import { errorMiddleware } from '../middleware/error.js';
import { config } from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
// import '../utils/cronJobs.js'; // Initialize cron jobs

const port = process.env.PORT || 3000;

config({
  path: './.env',
});
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express();
app.use(cors(
  {
    origin: [ process.env.CLIENT_URL || "http://default-url.com", "http://localhost:5173"],
    credentials: true,
}
));

app.use(express.json());



connectDatabase();

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Importing Routes
import user from '../routes/User.js';
import booking from '../routes/Booking.js';
import shopDetails from '../routes/ShopDetails.js';
import RevenueRoutes from '../routes/Revenue.js';
import adminInfo from '../routes/adminInfo.js';
import Review from '../routes/Review.js';

app.use('/api/v1/user', user);
app.use('/api/v1/booking', booking);
app.use('/api/v1/shop', shopDetails);
app.use('/api/v1/revenue', RevenueRoutes);
app.use('/api/v1/admin', adminInfo);
app.use('/api/v1/review', Review);

// Error-handling middleware must be defined last
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
export default app;