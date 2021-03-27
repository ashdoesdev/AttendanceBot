"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attendance_bot_1 = require("./attendance-bot");
const appSettings = require("../appSettings.dev.json");
const attendanceBot = new attendance_bot_1.AttendanceBot();
attendanceBot.start(appSettings);
