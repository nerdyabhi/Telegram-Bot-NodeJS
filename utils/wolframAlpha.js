const { Telegraf } = require('telegraf');
const axios = require('axios');
const xml2js = require('xml2js');

// Replace with your Wolfram Alpha API key
const WOLFRAM_ALPHA_APP_ID = 'YOUR_WOLFRAM_ALPHA_APP_ID';
const bot = new Telegraf('YOUR_BOT_TOKEN_HERE');

// Function to make a request to the Wolfram Alpha API
async function queryWolframAlpha(query) {
    const url = `https://api.wolframalpha.com/v2/query?appid=KU67A4-TAUQW6P694&input=solve+3x-7%3D11`;
    try {
        const response = await axios.get(url);
        return response.data; // Return the XML response
    } catch (error) {
        throw new Error('Failed to fetch data from Wolfram Alpha');
    }
}

// Function to parse XML response
async function parseXML(xml) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

// Handle messages from users
bot.on('text', async (ctx) => {
    const userQuery = ctx.message.text;

    try {
        const xmlResponse = await queryWolframAlpha(userQuery);
        const parsedResponse = await parseXML(xmlResponse);

        // Check for errors in the response
        if (parsedResponse.queryresult.error) {
            ctx.reply('Sorry, I could not process your request. Please try a different question.');
            return;
        }

        // Extract the relevant information from the parsed response
        const pods = parsedResponse.queryresult.pod;
        let resultMessage = `*Results for:* ${userQuery}\n\n`;

        pods.forEach((pod) => {
            const title = pod.title;
            const subpod = pod.subpod.plaintext || pod.subpod.img || '';
            resultMessage += `*${title}*: ${subpod}\n\n`;
        });

        // Send the formatted message
        await ctx.replyWithMarkdown(resultMessage.trim());
    } catch (error) {
        console.error('Error:', error);
        ctx.reply('An error occurred while processing your request.');
    }
});

// Start the bot
bot.launch();
console.log('Bot is running...');
