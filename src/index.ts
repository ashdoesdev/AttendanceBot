import { RaidBot } from './raid-bot';
import * as appSettings from '../app-settings.dev2.json';

const raidBot = new RaidBot();
raidBot.start(appSettings);
