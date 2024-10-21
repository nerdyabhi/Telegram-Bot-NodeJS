import { Telegraf , Markup } from 'telegraf';
import userModel from "./models/user.js";
import dotenv from 'dotenv';
import dbConnect from './config/dbConnect.js'
import gemini  from './utils/gemini.js'
import taskModel from './models/tasks.js'
import { INFO_TEXT } from './utils/constants.js';
dotenv.config();
import express from 'express'

 
dbConnect(process.env.MONGO_URL);


const bot = new Telegraf(process.env.TELEGRAM_BOT_API);




bot.start(async (ctx)=>{
  
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

  } catch (error) {
    await ctx.reply("Sorry Some error occurred" , error.message);
  }
  
   await ctx.reply(
    `Welcome! ${ctx.from.first_name} Choose an option:`,
    Markup.inlineKeyboard([
        Markup.button.callback('Check Commands', 'do_commands'),
        Markup.button.callback('Text Abhi', 'text_abhi')
    ]).oneTime().resize()
);

await ctx.reply(
  'Welcome! Use the menu below:',
  Markup.keyboard([['🧑‍💻 Github Repo', 'ℹ Info']])
    .resize() // Adjusts the size for better mobile display
);
   
})

bot.hears('🧑‍💻 Github Repo', (ctx) => ctx.reply('Check The Repo at : https://github.com/nerdyabhi/Telegram-Bot-NodeJS'));
bot.hears('ℹ Info', (ctx) => ctx.replyWithMarkdown(INFO_TEXT));


bot.action('do_commands', async(ctx) => {
  await ctx.reply( INFO_TEXT,
    {
        parse_mode: 'Markdown', // Enables Markdown formatting
        ...Markup.inlineKeyboard([
            [Markup.button.callback('Generate Prompt', 'generate')],
            [Markup.button.callback('Save Task', 'save_task')],
            [Markup.button.callback('Get All Tasks', 'get_all_tasks')]
        ])
    }
);
});



bot.action('text_abhi', async(ctx) => {
  await ctx.reply('@realCopyNinja talk to him.');
});


bot.on('sticker', (ctx) => {
    console.log(ctx.message.sticker); // Log sticker details
    ctx.reply(`Sticker file_id: ${ctx.message.sticker.file_id}`);
});

bot.command('generate', async (ctx) => { 
  try {
      const request = ctx.message.text.split(" ").slice(1).join(" "); // Extracting arguments
      const result = await gemini(request);
      
      if (!result || !result.response) {
          await ctx.reply("Failed to get info.");
          return;
      }

      // Logging the result for debugging
      console.log(result.response.text());

      // Use replyWithMarkdown or replyWithMarkdownV2 as per your choice
      await ctx.replyWithMarkdownV2(result.response.text());
      
  } catch (error) {
      console.error("Error in /generate command:", error);
      await ctx.reply("Error in formatting, trying again....");
      // Attempting to handle the error gracefully
      try {
          const request = ctx.message.text.split(" ").slice(1).join(" "); // Extracting again if necessary
          const result = await gemini(request);
          await ctx.reply(result.response.text());
      } catch (error) {
          await ctx.reply("Facing issues getting response, please try again...");
      }
  }
});


bot.command('task' , async(ctx)=>{
    try{

      const task = ctx.payload;
      const data =await taskModel.create({task:task , createdBy:ctx.from.id});
      await ctx.reply("Successfully added to database " , task);
    }
    catch(error){
      await ctx.reply("Sorry but shit went real !");
      console.log(error.message);
      
    }
})


bot.command('getAlltasks' , async(ctx)=>{
    try{
      const Alltasks = await taskModel.find({createdBy:ctx.from.id});
      const data = Alltasks.map((item , index) => `${item.createdAt.toLocaleString()}\n ${index}. ${item.task}`).join('\n\n');
      await ctx.reply(data)
    } catch(error){
      await ctx.replyWithMarkdownV2("Error occured  , " , error.message);
    }
})


bot.on('photo', async(ctx) =>  {
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
    await ctx.reply('Idk How to respond to that , so here is a cute sticker');
    await ctx.replyWithSticker("CAACAgQAAxkBAAIC3mcWSMT7EM8P1iuLoRf90gGatMJHAAJ3CwACVI8JUAhi7Vj3hd0nNgQ");
  })



bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))