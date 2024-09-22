import mongoose from "mongoose"

const dbConnect = async(url)=>{
    try {
        const connect = await mongoose.connect(url);
        console.log("Successfully Connected to MONGODB");
    } catch (error) {
        console.log("Failed connecting to DB , some error occured");
        console.log(error);
        
    }
}

export default dbConnect;