import { Telegraf } from 'telegraf';
import userModel from "./models/user.js";
import dotenv from 'dotenv';
import dbConnect from './config/dbConnect.js'
import gemini  from './utils/gemini.js'
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




bot.on('message', async(ctx)=>{
    await ctx.replyWithMarkdown('This is a `Hemlo` text.');

    // await ctx.sendSticker("CAACAgQAAxkBAAEM2hNm7z3KZHLPE3xNv5e9uM1FaSCXBQACCBQAAvmouVC-50EltWTgXjYE");
})



bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))