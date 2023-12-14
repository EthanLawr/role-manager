const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { ownerId } = require('../../../config.json');
const logger = require('../../../logger.js');
const path = require('path');
const fs = require('fs');

const MANAGED_FILE = path.join(__dirname, '..', '..', '..', 'managed.json');

// Load managed data from the file
let managedData = {};
try {
    if (fs.existsSync(MANAGED_FILE)) {
        logger.info('Loading managed data from file.');
        const fileContents = fs.readFileSync(MANAGED_FILE, 'utf-8');
        managedData = JSON.parse(fileContents);
        logger.info('Managed data loaded successfully.');
    } else {
        logger.info('Managed data file does not exist. Creating a new one.');
    }
} catch (error) {
    logger.error('Error loading managed data:', error);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manager')
        .setDescription('Add or remove role managers')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role manager')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select the role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role manager')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select the role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all role managers')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin')
                .setDescription('Assign or remove a server manager role')
                .addRoleOption(option => option.setName('role').setDescription('Select the admin role').setRequired(true))
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id;

        // Create server data in managed file if it doesnt exist
        if (!managedData[guildId]) {
            managedData[guildId] = {};
        }

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');       

        const hasAdministratorPermission = interaction.member.permissions.has('Administrator');

        if (subcommand === 'add' || subcommand === 'remove') {
            const serverManagerRoleId = managedData[guildId]['server_manager'];
            const userIsServerManager = serverManagerRoleId && interaction.member.roles.cache.has(serverManagerRoleId);
            if (
                interaction.user.id === interaction.guild.ownerId || 
                userIsServerManager || hasAdministratorPermission
            ) {
                if (subcommand === 'add') {
                    const serverManagerRoleId = managedData[guildId]['server_manager'];
                    const userIsServerManager = serverManagerRoleId && interaction.member.roles.cache.has(serverManagerRoleId);
                
                    if (
                        interaction.user.id === interaction.guild.ownerId || 
                        userIsServerManager || 
                        interaction.user.id === ownerId
                    ) {
                        if (!managedData[guildId][role.id]) {
                            managedData[guildId][role.id] = [];
                        }
                        if (!managedData[guildId][role.id].includes(user.id)) {
                            managedData[guildId][role.id].push(user.id);
                            interaction.reply(`${user} has been added as a role manager for ${role}`);
                        } else {
                            interaction.reply(`${user} is already a manager for ${role}`);
                        }
                    } else {
                        interaction.reply('Only the server owner, server managers or users with Administrator permission can add role managers.');
                    }        
                } else if (subcommand === 'remove') {
                    const serverManagerRoleId = managedData[guildId]['server_manager'];
                    const userIsServerManager = serverManagerRoleId && interaction.member.roles.cache.has(serverManagerRoleId);
                
                    if (
                        interaction.user.id === interaction.guild.ownerId ||
                        userIsServerManager ||
                        interaction.user.id === ownerId
                    ) {
                        const roleManagerRoleId = role.id;
                        
                        if (managedData[guildId][roleManagerRoleId]) {
                            if (managedData[guildId][roleManagerRoleId].includes(user.id)) {
                                managedData[guildId][roleManagerRoleId] = managedData[guildId][roleManagerRoleId].filter(id => id !== user.id);
                                if (managedData[guildId][roleManagerRoleId].length === 0) {
                                    delete managedData[guildId][roleManagerRoleId];
                                }
                                interaction.reply(`${user} has been removed as a role manager for ${role}`);
                            } else {
                                interaction.reply(`${user} is not a manager for ${role}`);
                            }
                        } else {
                            interaction.reply(`${role} is not a role manager.`);
                        }
                    } else {
                        interaction.reply('Only the server owner, server managers or users with Administrator permission can remove role managers.');
                    }
                }
            } else {
                interaction.reply('Only the server owner, server managers, or users with Administrator permission can add/remove role managers.');
            }
        } else if (subcommand === 'list') {
            await interaction.deferReply({ ephemeral: false });
          
            const embed = new EmbedBuilder()
              .setColor('#0099ff')
              .setTitle('Role Managers')
              .setDescription('List of roles and their managers');
          
            const roleManagerInfoArray = [];
          
            const serverManagerRoleId = managedData[guildId]['server_manager'];
            const serverManagerRole = interaction.guild.roles.cache.get(serverManagerRoleId);
          
            if (serverManagerRole) {
              roleManagerInfoArray.push(`**Server Managers**: ${serverManagerRole.toString()}`);
            }
          
            // Sort roles in hierarchy order
            const guildRoles = interaction.guild.roles.cache.filter(role => !role.managed).sort((a, b) => b.position - a.position);
          
            for (const role of guildRoles.values()) {
              const roleManagers = managedData[guildId][role.id];
          
              if (roleManagers && roleManagers.length > 0) {
                const managerUsernames = [];
          
                for (const managerId of roleManagers) {
                  try {
                    const manager = await interaction.guild.members.fetch(managerId);
                    if (manager) {
                      const discriminator = manager.user.discriminator === '0' ? '' : `#${manager.user.discriminator}`;
                      managerUsernames.push(`__**•**__  ${manager.user.username}${discriminator}`);
                    } else {
                      managerUsernames.push(`__**•**__  User Not Found (${managerId})`);
                    }
                  } catch (error) {
                    logger.error(`Error fetching user with ID ${managerId}: ${error.message}`);
                    managerUsernames.push(`__**•**__  User Not Found (${managerId})`);
                  }
                }
          
                roleManagerInfoArray.push(`**Role**: ${role.toString()}\n${managerUsernames.join('\n')}`);
              }
            }
          
            if (roleManagerInfoArray.length > 0) {
              embed.setDescription(roleManagerInfoArray.join('\n\n'));
            } else {
              embed.setDescription('No role managers have been added.');
            }
          
            await interaction.editReply({ embeds: [embed] }).catch(error => {
              logger.error(`Error sending reply: ${error.message}`);
            });
            logger.info('List subcommand executed successfully.');
        } else if (subcommand === 'admin') {
            if (
                interaction.user.id === interaction.guild.ownerId || hasAdministratorPermission
            ) {
                if (subcommand === 'admin') {
                    const adminRole = interaction.options.getRole('role');

                    if (!adminRole) {
                        interaction.reply('Please specify an admin role to assign.');
                        return;
                    }

                    managedData[guildId]['server_manager'] = adminRole.id;
                    interaction.reply(`Server manager role set to ${adminRole}.`);
                }
            } else {
                interaction.reply('Only the server owner or users with Administrator can assign server managers.');
            }
        }

        try { logger.info(`Executing: Manager | ${subcommand}`);
        
        // Save managed data to the file
        try {
            fs.writeFileSync(MANAGED_FILE, JSON.stringify(managedData, null, 2));
            logger.info('Managed data saved successfully.');
        } catch (error) {
            logger.error('Error writing to managed.json:', error);
        }
    } catch (error) {
        logger.error(`Error executing manager command: ${error}`);
        interaction.reply('An error occurred while executing the command.');
    }
}};