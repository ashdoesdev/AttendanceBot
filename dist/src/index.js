"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loot_score_bot_1 = require("./loot-score-bot");
const auth = require("../auth.json");
const attendanceBot = new loot_score_bot_1.LootScoreBot();
attendanceBot.start(auth.token);
