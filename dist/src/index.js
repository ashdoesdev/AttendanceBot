"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const raid_bot_1 = require("./raid-bot");
const appSettings = require("../app-settings.prod.json");
const raidBot = new raid_bot_1.RaidBot();
raidBot.start(appSettings);
