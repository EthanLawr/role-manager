const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const logger = require('../../../logger.js');
const path = require('path');
const fs = require('fs');

const MANAGED_FILE = path.join(__dirname, '..', '..', '..', 'managed.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('View a role checklist.'),
    async execute(interaction) {
        // Load managed data to get all assigned roles
        let managedData = {};
        try {
            if (fs.existsSync(MANAGED_FILE)) {
                const fileContents = fs.readFileSync(MANAGED_FILE, 'utf-8');
                managedData = JSON.parse(fileContents);
            }
        } catch (error) {
            logger.error('Error loading managed data:', error);
            return interaction.reply('An error occurred while loading the managed data.');
        }
        // Make sure command is used in a server
        if (!interaction.guild) {
            return interaction.reply('This command can only be used in a server.');
        }

        // compare user roles to managed roles
        const guildRoles = interaction.guild.roles.cache.filter(role => !role.managed).sort((a, b) => b.position - a.position);
        const userManagedRoles = guildRoles.filter(role => interaction.member.roles.cache.has(role.id) && managedData[interaction.guild.id] && managedData[interaction.guild.id][role.id]).size;
        const totalPotentialManagedRoles = guildRoles.filter(role => managedData[interaction.guild.id] && managedData[interaction.guild.id][role.id]).size;
        const percent = ((userManagedRoles / totalPotentialManagedRoles) * 100).toFixed(2);
        // prepare embed
        const style = {
            title: 'Style 3',
            color: '#33cc33',
            barChar: '■',
            spaceChar: '·',
        };

        const barLength = Math.round(percent / 100 * 20);
        const progressBar = `${style.barChar.repeat(barLength)}${style.spaceChar.repeat(20 - barLength)}`;

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Role Checklist');

        const description = `**Role Collection Progress:** ${percent}%\n\`${progressBar}\``;

        let rolesYouHaveDescription = '**Roles you have**:\n';
        let rolesYoureMissingDescription = '**Roles you\'re missing**:\n';

        for (const [roleId, role] of guildRoles) {
            if (managedData[interaction.guild.id] && managedData[interaction.guild.id][roleId]) {
                const hasRole = interaction.member.roles.cache.has(roleId);
                const roleMention = `<@&${roleId}>\n`;

                if (hasRole) {
                    rolesYouHaveDescription += roleMention;
                } else {
                    rolesYoureMissingDescription += roleMention;
                }
            }
        }

        embed.setDescription(`${description}\n\n${rolesYouHaveDescription}\n${rolesYoureMissingDescription}`);
        // send collection embed
        return interaction.reply({ embeds: [embed] });
    },
};