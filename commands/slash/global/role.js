const { SlashCommandBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { ownerId } = require('../../../config.json');
const logger = require('../../../logger');
const Canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MANAGED_FILE = path.join(__dirname, '..', '..', '..', 'managed.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles')
        .addSubcommand(subcommand => subcommand
                .setName('add')
                .setDescription('Assign your managed role to a user')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select the role to assign').setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
                .setName('remove')
                .setDescription('Remove your managed role from a user')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('Select the role to remove').setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
                .setName('customize')
                .setDescription('Customize a managed role')
                .addRoleOption(option => option.setName('role').setDescription('Select the role to customize').setRequired(true))
                .addStringOption(option => option.setName('color').setDescription('Hex color code to change the role color'))
                .addStringOption(option => option.setName('name').setDescription('New name for the role')),
        ),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const role = interaction.options.getRole('role');
            const guildId = interaction.guild.id;
            const authorId = interaction.user.id;

            // Load manager data from managed.json
            let managedData = {};
            try {
                if (fs.existsSync(MANAGED_FILE)) {
                    const fileContents = fs.readFileSync(MANAGED_FILE, 'utf-8');
                    managedData = JSON.parse(fileContents);
                }
            } catch (error) {
                logger.error('Error loading managed data:', error);
            }

            // Check if the command was used in a server
            if (!interaction.guild) {
                return interaction.reply('This command can only be used in a server.');
            }

            // Check if the user is a manager for the given role
            const userIsRoleManager = managedData[guildId] && managedData[guildId][role.id] && managedData[guildId][role.id].includes(authorId);

            // Check if the user is the server owner, a server manager, or an admin
            const serverManagerRoleId = managedData[guildId]['server_manager'];
            const IsServerManager = serverManagerRoleId && interaction.member.roles.cache.has(serverManagerRoleId);
            const isServerOwner = interaction.user.id === interaction.guild.ownerId;
            const isAdmin = interaction.member.permissions.has('Administrator');

            if (userIsRoleManager || IsServerManager || isServerOwner || isAdmin) {
                // Add sub-command logic
                if (subcommand === 'add') {
                    const user = interaction.options.getUser('user');
                    const member = await interaction.guild.members.fetch(user);

                    if (member && !member.roles.cache.has(role.id)) {
                        // Check if the target user is a bot
                        if (!member.user.bot) {
                            await member.roles.add(role);
                            return interaction.reply(`${role} has been given to ${user}`);
                        } else {
                            return interaction.reply('You cannot add roles to bots.');
                        }
                    } else if (!member) {
                        return interaction.reply('The specified user is not a member of this guild.');
                    } else {
                        return interaction.reply(`${member.user.username} already has the ${role} role or you do not have permission to manage this role.`);
                    }
                }
                // Remove sub-command logic
                if (subcommand === 'remove') {
                    const user = interaction.options.getUser('user');
                    const member = await interaction.guild.members.fetch(user);

                    if (member && member.roles.cache.has(role.id)) {
                        // Check if the target user is a bot
                        if (!member.user.bot) {
                            await member.roles.remove(role);
                            return interaction.reply(`Removed ${role} from ${user}`);
                        } else {
                            return interaction.reply('You cannot remove roles from bots.');
                        }
                    } else if (!member) {
                        return interaction.reply('The specified user is not a member of this guild.');
                    } else {
                        return interaction.reply(`${member.user.username} does not have the ${role} role or you do not have permission to manage this role.`);
                    }
                }
                // Customize sub-command logic
                else if (subcommand === 'customize') {
                    const roleName = interaction.options.getString('name');
                    let roleColor = interaction.options.getString('color');
                    const role = interaction.options.getRole('role');
                
                    logger.debug(`Customize command invoked with roleName: ${roleName}, roleColor: ${roleColor}, role: ${role ? role.name : 'not found'}`);
                
                    // Checks if # was included in the color option, if it was not included add it
                    if (roleColor && !roleColor.startsWith('#')) {
                        roleColor = '#' + roleColor;
                    }
                
                    // Validate color input
                    if (roleColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(roleColor)) {
                        return interaction.reply('Invalid color format. Please provide a valid hexadecimal color code.');
                    }
                
                    // Check if the role is being collected from the 'role' option correctly 
                    if (!role) {
                        logger.error('Role object not found or not provided.');
                        return interaction.reply('Error: The specified role was not found.');
                    }
                
                    // Role name change logic (independent from color change)
                    if (roleName && !roleColor) {
                        try {
                            logger.debug(`Attempting to change role name for role: ${role.name} to ${roleName}`);
                            const updatedRole = await role.edit({ name: roleName });
                            logger.debug(`Role name changed successfully to: ${updatedRole.name}`);
                            await interaction.reply(`Role name changed to ${updatedRole.name}.`);
                        } catch (error) {
                            logger.error(`Error in changing role name for role ${role.name}: ${error.message}`);
                            await interaction.reply({ content: `An error occurred while changing the role name: ${error.message}`, ephemeral: true });
                            return;
                        }
                    }
                
                    // Generate color previews if changing the role's color
                    if (roleColor) {
                        try {
                            // Fetch server-specific user's profile picture
                            const member = await interaction.guild.members.fetch(interaction.user.id);
                            const userAvatarUrl = member.displayAvatarURL({ format: 'png', size: 128 });
                
                            // Make sure the previews directory exists, if not, create it
                            const previewsDir = path.join(__dirname, '../../../previews/');
                            if (!fs.existsSync(previewsDir)) {
                                fs.mkdirSync(previewsDir);
                            }
                
                            // temp save dark and light mode previews
                            const darkPreviewPath = await savePreviewCanvas('#36393F', 'rolecolor-dark-preview.png', userAvatarUrl, roleColor, member.displayName);
                            const lightPreviewPath = await savePreviewCanvas('#FFFFFF', 'rolecolor-light-preview.png', userAvatarUrl, roleColor, member.displayName);
                
                            // Create 'Confirm' 'Cancel' and 'Switch theme' buttons under the preview 
                            const confirmButton = new ButtonBuilder()
                                .setCustomId('confirm')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success);
                            const cancelButton = new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger);
                            const switchButton = new ButtonBuilder()
                                .setCustomId('switch')
                                .setLabel('Switch Theme')
                                .setStyle(ButtonStyle.Secondary);
                
                            // Send the preview with buttons (dark theme default)
                            let currentPreviewPath = darkPreviewPath;
                            const previewMessage = await interaction.reply({ 
                                content: 'Preview of the new color (Dark mode):', 
                                files: [{ attachment: currentPreviewPath }],
                                components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton, switchButton)],
                                fetchReply: true 
                            });
                
                            // Button interaction handling
                            const filter = (i) => ['confirm', 'cancel', 'switch'].includes(i.customId);
                            const collector = previewMessage.createMessageComponentCollector({ filter, time: 15000 });
                
                            collector.on('collect', async (i) => {
                                if (i.customId === 'confirm' || i.customId === 'cancel') {
                                    // Delete preview files after command if completed
                                    fs.unlinkSync(darkPreviewPath);
                                    fs.unlinkSync(lightPreviewPath);
                
                                    if (i.customId === 'confirm') {
                                        // Apply the color change if confirm button is selected
                                        const updatedRole = await role.edit({
                                            color: parseInt(roleColor.replace('#', ''), 16),
                                            name: roleName || role.name,
                                        });
                                        await i.update({ content: `Successfully customized role ${updatedRole.name}.`, components: [] });
                                    } else {
                                        // Stop doing anything if cancel button is selected
                                        await i.update({ content: 'Color customization cancelled.', components: [] });
                                    }
                                } else if (i.customId === 'switch') {
                                    // Switch between dark and light mode previews when switch button is selected
                                    currentPreviewPath = currentPreviewPath === darkPreviewPath ? lightPreviewPath : darkPreviewPath;
                                    const previewLabel = currentPreviewPath.includes('dark') ? 'Dark mode' : 'Light mode';
                                    await i.update({ 
                                        content: `Preview of the new color (${previewLabel}):`, 
                                        files: [{ attachment: currentPreviewPath }],
                                        components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton, switchButton)],
                                    });
                                }
                            });
                        } catch (error) {
                            logger.error(`Error in generating color preview: ${error.message}`);
                            await interaction.reply({ content: 'There was an error while generating the color preview.', ephemeral: true });
                            return;
                        }
                    }
                
                    if (!roleName && !roleColor) {
                        logger.debug('No customization option provided.');
                        return interaction.reply('Please provide at least one customization option (name or color).');
                    }
                } else {
                    return interaction.reply('Invalid subcommand.');
                }                                                                                
            } else {
                return interaction.reply('You do not have permission to manage this role.');
            }
        } catch (error) {
            logger.error('Error executing command:', error);
            return interaction.reply('An error occurred while executing the command.');
        }
    },
};

// Make preview
async function createPreviewCanvas(backgroundColor, userAvatarUrl, roleColor, displayName) {
    const canvas = Canvas.createCanvas(1600, 250);
    const context = canvas.getContext('2d');

    // Draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw server specific profile picture
    context.save();
    context.beginPath();
    context.arc(120, 120, 80, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    const avatarBuffer = await fetchUserImage(userAvatarUrl);
    const userImage = await Canvas.loadImage(avatarBuffer);
    context.drawImage(userImage, 40, 40, 160, 160);
    context.restore();

    // Draw text
    context.font = '80px Arial';
    context.fillStyle = roleColor;
    context.fillText(displayName, 240, 110);
    context.fillStyle = backgroundColor === '#FFFFFF' ? 'black' : 'white';
    context.font = '60px Arial';
    context.fillText('This is how the new color will look', 240, 200);

    return canvas.toBuffer();
}

// Get server profile picture
async function fetchUserImage(url) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return sharp(Buffer.from(arrayBuffer))
        .png()
        .toBuffer();
}

// temp save preview images until the command is completed or times out
async function savePreviewCanvas(backgroundColor, fileName, userAvatarUrl, roleColor, displayName) {
    const buffer = await createPreviewCanvas(backgroundColor, userAvatarUrl, roleColor, displayName);
    const filePath = path.join(__dirname, '../../../previews/', fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}
