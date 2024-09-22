import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const gemini = async (prompt, image = null) => {
  try {
    let requestPayload = prompt;
    if(image) requestPayload = [prompt , image];
    const response = await model.generateContent(requestPayload);
    return response;
  } catch (error) {
    console.log("Error occurred", error);
  }
  
};



export default gemini;
