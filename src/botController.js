const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const crypto = require('crypto');

const minCooldown = 1000;
const maxCooldown = 2000;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomUsername() {
    return 'Bot' + crypto.randomBytes(3).toString('hex');
}

async function createBot(config, logCallback, username) {
    const bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: username,
        password: config.loginRequired ? 'iloverts' : undefined
    });

    bot.loadPlugin(pathfinder);

    function log(message) {
        logCallback(`${username}: ${message}`);
    }

    function randomCooldown() {
        return Math.random() * (maxCooldown - minCooldown) + minCooldown;
    }

    async function performTask(task) {
        await task();
        await delay(randomCooldown());
    }

    async function startActions() {
        if (config.loginRequired) {
            await performTask(() => bot.chat('/reg iloverts iloverts'));
            await performTask(() => bot.chat('/login iloverts'));
        }

        while (true) {
            for (const msg of config.messages) {
                await performTask(() => bot.chat(msg.trim()));
                if (bot.end) return; // Check if the bot has been stopped
            }
        }
    }

    bot.on('login', () => {
        log(`new bot logged in`);
        startActions().catch(err => log(`Error in actions: ${err.message}`));
    });

    bot.on('resourcePack', (url) => {
        log(`Resource pack request: ${url}`);
        bot.acceptResourcePack();
    });

    bot.on('kicked', (reason) => {
        log(`was kicked: ${reason}`);
        delay(2000).then(() => {
            if (bot.end) return; // Don't recreate if bot has been stopped
            createBot(config, logCallback, generateRandomUsername());
        });
    });

    bot.on('end', () => {
        if (bot.end) return; // Prevent rejoining if the bot has been stopped
        log(`${username} logged out, rejoining`);
        delay(2000).then(() => createBot(config, logCallback, generateRandomUsername()));
    });

    bot.on('error', (err) => {
        log(`Error: ${err}`);
        if (err.code === 'ECONNRESET') {
            log(`${username} got timed-out, rejoining`);
            bot.quit && bot.quit();
            delay(2000).then(() => {
                if (bot.end) return; // Don't recreate if bot has been stopped
                createBot(config, logCallback, generateRandomUsername());
            });
        }
    });

    bot.on('chat', (un, message) => {
        if (message.includes('banned')) {
            log(`${un} got banned, rejoining`);
            bot.quit && bot.quit();
            delay(2000).then(() => {
                if (bot.end) return; // Don't recreate if bot has been stopped
                createBot(config, logCallback, generateRandomUsername());
            });
        }
    });

    return bot;
}

let bots = [];

function startBots(config, logCallback) {
    const numBots = 20;
    for (let i = 0; i < numBots; i++) {
        const username = generateRandomUsername();
        const bot = createBot(config, logCallback, username);
        bots.push(bot);
    }
}

function stopBots() {
    bots.forEach(bot => {
        bot.end = true; // Mark the bot as should be stopped
        bot.quit && bot.quit();
    });
    bots = [];
}

module.exports = { startBots, stopBots };