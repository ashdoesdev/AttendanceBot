import { LootScoreBot } from './loot-score-bot';
import * as appSettings from '../app-settings.dev.json';

const attendanceBot = new LootScoreBot();
attendanceBot.start(appSettings);
