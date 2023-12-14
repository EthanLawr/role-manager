const { EmbedBuilder } = require('discord.js');
const { ownerId } = require('./config.json');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'bot.log');
const levels = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
};

function logMessage(level, message, client, commandType = 'unknown', commandInfo = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    // Output to file and console 
    console.log(logEntry);
    fs.appendFileSync(logFile, logEntry);

    // switch handler depending on the command type
    switch (commandType) {
        case 'prefix':
            handlePrefixCommand(level, message, client, commandInfo);
            break;
        case 'slash':
            handleSlashCommand(level, message, client, commandInfo);
            break;
    }
}

// Debug level logging function
function debug(message, client, commandType = 'unknown', commandInfo = {}) {
    logMessage(levels.DEBUG, message, client, commandType, commandInfo);
}

// Prefix command logging
function handlePrefixCommand(level, message, client, { commandName, args, context }) {
    // collect and log details for prefix commands
    if (level === levels.INFO || level === levels.WARN) {
        const additionalLog = `Prefix Command: ${commandName}, Args: ${args.join(' ')}, User: ${context.author.id}, Channel: ${context.channel.id}\n`;
        console.log(additionalLog);
        fs.appendFileSync(logFile, additionalLog);
    }

    if (level === levels.ERROR) {
        // Handles errors in prefix commands
        const errorLog = `Error in prefix command: ${commandName}, User: ${context.author.id}, Channel: ${context.channel.id}, Error: ${message}\n`;
        console.error(errorLog);
        fs.appendFileSync(logFile, errorLog);
        // Creates embed for reporting errors
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Error in prefix command: ${commandName}`)
            .addFields(
                { name: 'User', value: `${context.author.username} <@${context.author.id}>` },
                { name: 'Channel', value: `<#${context.channel.id}> (ID: ${context.channel.id})` },
                { name: 'Error', value: `${message}` }
            );
        // Sends error report to owner
        client.users.fetch(ownerId).then(owner => {
            owner.send({ embeds: [errorEmbed] });
        }).catch(err => {
            console.error(`Failed to send DM to owner: ${err}`);
        });
    }
}

// Slash command logging
function handleSlashCommand(level, message, client, { interaction }) {
    // Creates embed for reporting errors
    if (level === levels.ERROR) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`Error in slash command: ${interaction?.commandName}`)
            .addFields(
                { name: 'User', value: interaction?.user ? `${interaction.user.username} <@${interaction.user.id}>` : 'N/A' },
                { name: 'Channel', value: interaction?.channelId ? `<#${interaction.channelId}> (ID: ${interaction.channelId})` : 'N/A' },
                { name: 'Server', value: interaction?.guild ? `${interaction.guild.name} | ${interaction.guild.id}` : 'N/A' },
                { name: 'Error', value: `${message}` }
            );
        // Sends error report to owner
        client.users.fetch(ownerId).then(owner => {
            owner.send({ embeds: [errorEmbed] });
        }).catch(err => {
            console.error(`Failed to send DM to owner: ${err}`);
        });
    }
}

module.exports = {
    info: (message, client, commandType, commandInfo) => logMessage(levels.INFO, message, client, commandType, commandInfo),
    warn: (message, client, commandType, commandInfo) => logMessage(levels.WARN, message, client, commandType, commandInfo),
    error: (message, client, commandType, commandInfo) => logMessage(levels.ERROR, message, client, commandType, commandInfo),
    debug: (message, client, commandType, commandInfo) => debug(message, client, commandType, commandInfo),
};
