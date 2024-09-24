import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const gemini = async (newPrompt  ,conversationHistory, imageUrl =null) => {
  try {
    let prompt = newPrompt;
    if(conversationHistory)
     prompt = `Based on the following conversation history:\n${conversationHistory.join('\n')}\n\nPlease process the following message:\n${newPrompt}\n\nGenerate a comprehensive and informative response.`;
    // Create the request payload

    if(!imageUrl){
      const response = await model.generateContent(prompt);
      return response;
    }

    // Fetch data from the url.
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    // Convert the image data to base64
    const imageBase64 = Buffer.from(imageData.data, 'binary').toString('base64');


    const image = {
      inlineData:{
        data:imageBase64,
        mimeType:"image/png"
      }
    }

    const response = await model.generateContent([prompt , image]);
    return response;
  } catch (error) {
    console.log("Error occurred", error);
    throw error;
  }
};




export default gemini;
