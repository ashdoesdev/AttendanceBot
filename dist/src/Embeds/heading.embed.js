"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class HeadingEmbed extends discord_js_1.RichEmbed {
    constructor(field1, field2, field3) {
        super();
        this.setColor('#60b5bc');
        this.addField(field1, '------------------------------', true);
        this.addField(field2, '------------------------------', true);
        this.addField(field3, '------------------------------', true);
    }
}
exports.HeadingEmbed = HeadingEmbed;
