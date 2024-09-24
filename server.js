import { Telegraf } from 'telegraf';
import userModel from "./models/user.js";
import dotenv from 'dotenv';
import dbConnect from './config/dbConnect.js'
import gemini  from './utils/gemini.js'
import xml2js from 'xml2js';
dotenv.config();

 
dbConnect(process.env.MONGO_URL);


const bot = new Telegraf(process.env.TELEGRAM_BOT_API);


bot.start(async (ctx)=>{
   await ctx.reply("Hello world User");
  
   const from = ctx.update.message.from;
   try {
        await userModel.findOneAndUpdate({tgId:from.id}, {
        $setOnInsert:{
            firstName:from.first_name,
            lastName:from.last_name,
            isBot:from.is_bot,
            username:from.username,
        }

    } , {upsert:true , new:true})

    await ctx.reply(`Hey ! , ${from.first_name} Kemon Achis`)

   } catch (error) {
        await ctx.reply("Sorry Some error occurred" , error);
   }
   
    
})

bot.on('sticker', (ctx) => {
    console.log(ctx.message.sticker); // Log sticker details
    ctx.reply(`Sticker file_id: ${ctx.message.sticker.file_id}`);
});

bot.command('generate', async (ctx) => { 
    try {
        const request = ctx.payload + "\n Give answer in telegraf `reply with markdown` format.";
        const result = await gemini(request);
        
        if (!result || !result.response) {
            await ctx.reply("Failed to get info..");
            return;
        }

        await ctx.replyWithMarkdown(result.response.text());
        
    } catch (error) {

        console.error("Error in /generate command:", error);
        await ctx.reply("Error in formatting Trying again....");
         try {
            const request =ctx.payload;
            const result = await gemini(request);
            await ctx.reply(result.response.text());
         } catch (error) {
            await ctx.reply("Facing issues getting response please try again...")
         }
    }
});

bot.command('expense' , (ctx)=>{
    ctx.reply("Where Did You spend the money?");
    bot.on('message', async(ctx) => {
        await ctx.reply('Choose an option:', {
          reply_markup: {
            keyboard: [
              [{ text: 'Option 1' }, { text: 'Option 2' }],
              [{ text: 'Option 3' }]
            ],
            resize_keyboard: true, // Automatically resize the buttons
            one_time_keyboard: true // Keyboard disappears after one use
          }
        });
      });
      

})







bot.on('photo', async(ctx) => {
    const photo = ctx.message.photo; // Array of photo sizes (different resolutions)
    const caption = ctx.message.caption; // Text sent along with the photo
  
    // You can choose the highest resolution image using the last element
    const highestResPhoto = photo[photo.length - 1];
    const fileId = highestResPhoto.file_id;
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    

    const result = await gemini(caption , fileUrl);
    await ctx.reply( result.response.text());
    
  });
  




bot.on('message', async(ctx)=>{
    await ctx.replyWithPhoto('https://res.cloudinary.com/dvanwo7dv/image/upload/v1726854329/tbs3fzqyjsgpr8ym499i.jpg')
})


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))