import { AttendanceBot } from './attendance-bot';
import * as appSettings from '../appSettings.dev.json';

const attendanceBot = new AttendanceBot();
attendanceBot.start(appSettings);
