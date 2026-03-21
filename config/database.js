import mongoose from "mongoose";


const connectDatabase = () => {
    mongoose.connect(process.env.MONGODB_URI).then((data) => {
        console.log(`Mongodb conncted with server: ${data.connection.host}`);
    })
}


export default connectDatabase;