import { Telegraf , Markup } from 'telegraf';
import userModel from '../models/user.js';
import taskModel from '../models/tasks.js';
import gemini from '../utils/gemini.js';
import { INFO_TEXT } from '../utils/constants.js';
import dbConnect from '../config/dbConnect.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
dbConnect(process.env.MONGO_URL);  // Connect to the database

// Define bot commands and handlers
bot.start(async (ctx) => {
    const from = ctx.update.message.from;
    try {
        await userModel.findOneAndUpdate(
            { tgId: from.id },
            {
                $setOnInsert: {
                    firstName: from.first_name,
                    lastName: from.last_name,
                    isBot: from.is_bot,
                    username: from.username,
                },
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        await ctx.reply(`Sorry, an error occurred: ${error.message}`);
    }

    await ctx.reply(
        `Welcome! ${ctx.from.first_name}, Choose an option:`,
        Markup.inlineKeyboard([
            Markup.button.callback('Check Commands', 'do_commands'),
            Markup.button.callback('Text Abhi', 'text_abhi')
        ]).oneTime().resize()
    );

    await ctx.reply(
        'Welcome! Use the menu below:',
        Markup.keyboard([['🧑‍💻 Github Repo', 'ℹ Info']]).resize()
    );
});

bot.hears('🧑‍💻 Github Repo', (ctx) =>
    ctx.reply('Check The Repo at: https://github.com/nerdyabhi/Telegram-Bot-NodeJS')
);

bot.hears('ℹ Info', (ctx) => ctx.replyWithMarkdown(INFO_TEXT));


// Actions
bot.action('do_commands', async (ctx) => {
    try {
        await ctx.reply(INFO_TEXT, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('Generate Prompt', 'generate')],
                [Markup.button.callback('Save Task', 'save_task')],
                [Markup.button.callback('Get All Tasks', 'get_all_tasks')]
            ])
        });
    } catch (error) {
        console.error(error.message);
        await ctx.reply(`Error occurred: ${error.message}`);
    }
});

bot.action('text_abhi', async (ctx) => {
    await ctx.reply('@realCopyNinja talk to him.');
});


// Commands
bot.command('generate', async (ctx) => {
    try {
        const request = ctx.message.text.split(' ').slice(1).join(' ');
        const result = await gemini(request);

        if (!result || !result.response) {
            await ctx.reply('Failed to get info.');
            return;
        }

        console.log(result.response.text());
        await ctx.replyWithMarkdownV2(result.response.text());
    } catch (error) {
        console.error('Error in /generate command:', error);
        await ctx.reply('Error in formatting, trying again...');

        try {
            const request = ctx.message.text.split(' ').slice(1).join(' ');
            const result = await gemini(request);
            await ctx.reply(result.response.text());
        } catch (error) {
            await ctx.reply('Facing issues getting response, please try again...');
        }
    }
});

// Removed duplicate 'task' command definition

bot.command('getAlltasks', async (ctx) => {
    try {
        const allTasks = await taskModel.find({ createdBy: ctx.from.id });
        const data = allTasks
            .map((item, index) => `${item.createdAt.toLocaleString()}\n${index}. ${item.task}`)
            .join('\n\n');
        await ctx.reply(data);
    } catch (error) {
        console.error(error.message);
        await ctx.replyWithMarkdownV2(`Error occurred: ${error.message}`);
    }
});



bot.on('photo', async (ctx) => {
    try {
        const photo = ctx.message.photo;
        const caption = ctx.message.caption;
        const highestResPhoto = photo[photo.length - 1];
        const fileId = highestResPhoto.file_id;
        const fileUrl = await ctx.telegram.getFileLink(fileId);

        const result = await gemini(caption, fileUrl);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error(error.message);
        await ctx.reply(`Error processing: ${error.message}`);
    }
});




bot.command('task', async (ctx) => {
    try {
        const task = ctx.message.text.split(' ').slice(1).join(' ');
        await taskModel.create({ task, createdBy: ctx.from.id });
        await ctx.reply('Task added successfully!');
    } catch (error) {
        await ctx.reply('Failed to add task.');
    }
});



bot.on('sticker', (ctx) => {
    console.log(ctx.message.sticker);
    ctx.reply(`Sticker file_id: ${ctx.message.sticker.file_id}`);
});

bot.on('message', async (ctx) => {
    await ctx.reply('I don’t know how to respond to that, so here is a cute sticker.');
    await ctx.replyWithSticker('CAACAgQAAxkBAAIC3mcWSMT7EM8P1iuLoRf90gGatMJHAAJ3CwACVI8JUAhi7Vj3hd0nNgQ');
});


// Telegram webhook handler
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('Update handled');
        } catch (error) {
            console.error('Error handling update:', error);
            res.status(500).send('Error handling update');
        }
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
