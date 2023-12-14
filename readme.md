
# Role Manager

This bot allows users to manage assigned roles within Discord communities, particularly useful for servers offering custom roles to their members.

## Features

### For Server Owners
- **Server Admins**: Assign a 'Server Manager' role. Members with this role can manage all roles and add/remove role managers.
- **Multiple Assignments**: Assign multiple users to each role.

### For Users
- **Role Assignment**: Users can add their role to others or remove it.
- **Role Customization**: Customize their roles' name and color.
- **Preview Changes**: Preview how the role will look in chat in both dark and light mode before finalizing the change.
- **Collection Command**: Use the 'Collection' command to see what percentage of the available roles you have!
<br>
<br>

## Prerequisites

Before starting, ensure you have:
- Node.js installed.

## Setup

### Step 1: Download the bot

1. Click on the 'Code' button and select 'Download ZIP'.
2. Unzip the downloaded file.
3. Open a terminal and navigate to the unzipped folder.

### Step 2: Install Dependencies

```bash
npm install
```

## Configuration

### Step 3: Setting Up `config.json`

```json
{
  "token": "Your bot token here",
  "clientId": "Your bot's client id here",
  "guildId": "Home server id here",
  "ownerId": "Your Discord ID here",
  "prefix": "Preferred command prefix"
}
```

#### Obtaining the Bot Token and Client ID

1. Visit the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application and go to 'Bot'.
3. Click 'Add Bot', then copy the bot token.
4. Find your Client ID under the 'OAuth2' tab.

#### Finding Your Discord ID

1. Enable 'Developer Mode' in Discord under 'User Settings' > 'Advanced'.
2. Right-click on your username and select 'Copy ID'.

#### Setting up a Home Server ID

1. Required for developer slash commands.
2. Right-click on the server in Discord and select 'Copy ID'.

### Step 4: Run the Bot

```bash
node bot.js
```
<br>
<br>

# Command usage
All commands currentlyy only have a slash variation
## `/manager` Command Guide

The `/manager` command is used to add or remove role managers, list all role managers, or assign/remove a server manager role.

### Adding a Role Manager
- **Description**: Add a user as a role manager for a specific role.

- **Usage**: `/manager add [user] [role]`

- **Parameters**:
  - `user`: The user you want to add as a role manager. (Required)
  - `role`: The role that the user will manage. (Required)

### Removing a Role Manager
- **Description**: Remove a user from being a role manager for a specific role.

- **Usage**: `/manager remove --user [user] --role [role]`

- **Parameters**:
  - `user`: The user you want to remove as a role manager. (Required)
  - `role`: The role that the user is currently managing. (Required)

### Listing Role Managers
- **Description**: List all users who are currently role managers.

- **Usage**: `/manager list`

### Managing Server Manager Role
- **Description**: Assign or remove a server manager role.

- **Usage**: `/manager admin --role [role]`

- **Parameters**:
  - `role`: The server manager role to assign or remove. (Required)
<br>
<br>
## `/collection` Command Guide

The `/collection` command is designed to view a role checklist, allowing users to see the percentage of roles they have collected.

### Viewing Role Checklist
- **Description**: View a checklist of roles, providing an overview of available roles compared to roles the user has.
- **Usage**: `/collection`
<br>
<br>
## `/role` Command Guide

The `/role` command is designed for managing assigned roles. It allows users to assign roles, remove roles, and customize roles.

### Assigning a Role
- **Description**: Assign your managed role to a user.
- **Usage**: `/role add [user] [role]`
- **Parameters**:
  - `user`: The user to whom you want to assign the role. (Required)
  - `role`: The role you want to assign to the user. (Required)

### Removing a Role
- **Description**: Remove your managed role from a user.
- **Usage**: `/role remove --user [user] --role [role]`
- **Parameters**:
  - `user`: The user from whom you want to remove the role. (Required)
  - `role`: The role you want to remove from the user. (Required)

### Customizing a Role
- **Description**: Customize a managed role's name and color.
- **Usage**: `/role customize [role: [role selection]] [color: [hex color code]] [name: [new role name]]`
- **Parameters**:
  - `role`: The role you want to customize. (Required)
  - `color`: Hex color code for the new color of the role. (Optional)
  - `name`: New name for the role. (Optional)
#