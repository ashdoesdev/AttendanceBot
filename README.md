# AttendanceBot

AttendanceBot is a Discord bot for guilds and other online communities to manage attendance.

## Setup

I recommend hosting the bot on a free-tier EC2 instance.

### Part 1. Set up the application and validate it runs locally.
1. Set up application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Add a bot user to the application. Copy the token. Don't share or commit it. Adjust .gitignore if needed.
3. Invite bot to server. [Recommended permissions](https://discordapi.com/permissions.html#1342516344)
4. Download files and test the bot locally. 
```
npm install
tsc
node dist/src/index.js
```

### Part 2. Run the application on an EC2 instance.

5. Launch instance and save the key pair provided.
6. [Convert .ppk to .pem with PuTTYgen](https://aws.amazon.com/premiumsupport/knowledge-center/convert-pem-file-into-ppk/). 
7. [Connect to EC2 server with WinSCP](https://winscp.net/eng/docs/guide_amazon_ec2) (or any FTP client).
8. Upload files.
9. Install node & package dependencies.

```
$ sudo apt-get update
$ sudo apt-get install nodejs
$ sudo apt-get install npm
$ npm install
```

10. Install [forever](https://www.npmjs.com/package/forever) module `$ sudo npm install forever -g`. I highly suggest reading the logging options and also specifying logging files.

11. Run application `$ forever start index.js`

### EC2 Tips
- *Never have more than one running instance (especially for a long period of time)*
- *Set up billing notifications*
- *Free instances last 1 year before they are not free (on that account)*

## Usage

To customize the bot for your community, a few edits will be needed. 

1. Create your appSettings. Start by copying the appSettings to a new file. Customize the data accordingly. I usually set up appSettings.dev.json and appSettings.prod.json (one with keys for a dev Discord server, another with the "main" server).

2. Create the channels and roles as described in appSettings.

3. In index.ts, point the app to the appSettings you wish to use. e.g. `import * as appSettings from '../appSettings.prod.json';`

Recompile `tsc`.

## Commands 

### Public

`/start`, `/s`

Starts attendance.

`/end`, `/e`

Ends attendance.

`/end --nolog`, `/e --nolog`

### Admin

`/refreshpublic` 

Refresh public attendance chart.

`/refreshinternal`

Refresh bot data (refetches messages and composes new maps of data).

`/refreshmembers`

Refresh member list (done automatically in most cases).

`/totalraids`

Responds with total raids logged.

`/edit --attendance`, `/edit --seniority`

Edit blocks of attendance/seniority.

```
/edit --attendance {"value":[["200099393041465345",100]
```

First, enter snippet of data you want to edit. Must return a single entry to be valid. I find it easiest to just paste the whole object.

```
```{obj}```
```

Then enter full object you want to replace it with surrounded by code block tags.

`/clear --attendance`

Clear attendance/seniority for member. 

```
/clear --attendance "Member Name"
```

Clearing attendance is only needed in very specific cases. Useful if a member leaves then rejoins at a later date and you want to only count the new attendance. Not required in general for members who leave.

`/import --attendance`, `/import --seniority`

Import existing data.

```
/import --attendance attendance-1-1-2021.json
```

Attendance/seniority backups are saved automatically to /backups. Files may need to be moved before they can be successfully restored (or adjust path accordingly).

`/test` (to bot in DMs)

Will respond 'Bot running.' if running.
