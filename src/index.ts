import { LootScoreBot } from './loot-score-bot';
import * as auth from '../auth.json';

const attendanceBot = new LootScoreBot();
attendanceBot.start(auth.token);
