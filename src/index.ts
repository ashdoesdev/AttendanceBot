import { LootScoreBot } from './loot-score-bot';
import * as appSettings from '../app-settings.json';

const attendanceBot = new LootScoreBot();
attendanceBot.start(appSettings);
