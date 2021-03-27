"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attendance_bot_1 = require("./attendance-bot");
const appSettings = require("../app-settings.prod.json");
const attendanceBot = new attendance_bot_1.AttendanceBot();
attendanceBot.start(appSettings);
