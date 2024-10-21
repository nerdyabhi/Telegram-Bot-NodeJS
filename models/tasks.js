import mongoose from "mongoose";

const taskSchema = mongoose.Schema({
    task: {
        type: String,
        required: true,
    },
    createdBy:{
        type:String,
        ref:"User",
    },

}, { timestamps: true });

export default mongoose.model("tasks", taskSchema);
