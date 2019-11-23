import { RaidBot } from './raid-bot';
import * as appSettings from '../app-settings.prod.json';

const raidBot = new RaidBot();
raidBot.start(appSettings);
