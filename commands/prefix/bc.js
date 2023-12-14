const config = require('../../config.json');
const logger = require('../../logger');
const { PermissionsBitField } = require('discord.js');

// Clears bot messages and prefix messages
module.exports = {
    name: 'bc',
    description: 'Clears messages based on the given scope.',
    execute: async (message, args) => {
        logger.debug('bc command start', message.client, 'text', { commandName: 'bc', args, context: message });

        if (!message.guild) {
            logger.debug('Command used outside of a guild', message.client, 'text', { commandName: 'bc', args, context: message });
            return message.reply('This command can only be used in a guild.');
        }

        if (!message.member) {
            logger.debug('message.member is undefined', message.client, 'text', { commandName: 'bc', args, context: message });
            return message.reply('Unable to determine member permissions.');
        }

        const hasManageMessages = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        const isBotOwner = message.author.id === config.ownerId;

        if (!hasManageMessages && !isBotOwner) {
            return;
        }

        const scope = args[0] || 'all';
        logger.debug(`Scope determined: ${scope}`, message.client, 'text', { commandName: 'bc', args, context: message });

        try {
            const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
            logger.debug(`Fetched ${fetchedMessages.size} messages`, message.client, 'text', { commandName: 'bc', args, context: message });

            let deletableMessages;
            if (scope === 'self') {
                deletableMessages = fetchedMessages.filter(msg => msg.author.id === message.client.user.id);
            } else {
                const prefixes = 
                    [
                        '$', ',', '-', 't!', 't@', '!', '+', '_', ';', '.', '?', 's?', 'p!', 'r.', 'do.',0, '-', '$$', '&&', 'a!', 'b!', 'c!', 'd!', 'e!', 'f!', 'g!', 'h!', 'i!', 'j!', 'k!', 'l!', 'm!', 'n!', 'o!', 'p!', 'q!', 'r!', 's!', 't!', 'u!', 'v!', 'w!', 'x!', 'y!', 'z!', '/', '//', '\\', '=', '>', '->', '`', ', ', '|', '[', ']', 'ay!', 'r-', 'r+'
                    ];
                deletableMessages = fetchedMessages.filter(m => 
                    m.author.bot || prefixes.some(prefix => m.content.startsWith(prefix))
                );
            }

            logger.debug(`Deletable messages filtered: ${deletableMessages.size}`, message.client, 'text', { commandName: 'bc', args, context: message });

            const messagesToDelete = deletableMessages.filter(msg => msg.createdTimestamp > (Date.now() - 180000));
            logger.debug(`Messages to delete: ${messagesToDelete.size}`, message.client, 'text', { commandName: 'bc', args, context: message });
            
            await message.channel.bulkDelete(messagesToDelete, true);
            logger.debug(`Bulk deleted messages`, message.client, 'text', { commandName: 'bc', args, context: message });

            const confirmationMessage = await message.channel.send(`Cleared ${messagesToDelete.size} messages.`);
            setTimeout(() => {
                confirmationMessage.delete().catch(e => logger.error(`Error deleting confirmation message: ${e.message}`, message.client, 'text', { commandName: 'bc', args, context: message }));
            }, 3000);
        } catch (error) {
            logger.error(`Error executing bc command: ${error.message}`, message.client, 'text', { commandName: 'bc', args, context: message });
            await message.reply('An error occurred while deleting messages.');
        }
    }
};

