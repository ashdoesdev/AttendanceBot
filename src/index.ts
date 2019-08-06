import { RaidBot } from './raid-bot';
import * as appSettings from '../app-settings.dev.json';

const raidBot = new RaidBot();
raidBot.start(appSettings);
