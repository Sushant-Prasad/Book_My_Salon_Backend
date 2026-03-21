import mongoose from "mongoose";


const connectDatabase = () => {
    console.log(process.env.MONGODB_URI);
    
    // Transaction support settings - only for production/MongoDB Atlas with replica sets
    const options = {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        appName: 'BookMySalon-TransactionEnabled'
    };
    
    // Add transaction support only if using MongoDB Atlas or replica set
    if (process.env.MONGODB_URI.includes('mongodb+srv') || process.env.NODE_ENV === 'production') {
        options.retryWrites = true;
        options.w = 'majority';
        options.readConcern = { level: 'majority' };
        console.log('🔐 Transaction support enabled (production mode)');
    } else {
        console.log('📝 Local MongoDB detected - transaction support disabled (requires replica set)');
    }
    
    mongoose.connect(process.env.MONGODB_URI, options).then((data) => {
        console.log(`✅ MongoDB connected with server: ${data.connection.host}`);
        console.log(`📊 Transaction support enabled`);
        console.log(`🔒 Write concern: majority`);
    }).catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    });
}


export default connectDatabase;