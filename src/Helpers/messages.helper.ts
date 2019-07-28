import { TextChannel, Message } from "discord.js";

export class MessagesHelper {
    public async getMessages(textChannel: TextChannel, entries?: Message[], lastId?: number): Promise<Message[]> {
        if (!entries) {
            entries = new Array<Message>();
        }

        if (lastId !== 0) {
            let messages = await this.bundleMessages(textChannel, entries, lastId);

            if (messages[1]) {
                await this.getMessages(textChannel, entries, messages[1]);
            }
        }

        return entries;
    }

    private async bundleMessages(textChannel: TextChannel, entries: Message[], previousLastId?: number): Promise<[Message[], number]> {
        let options;
        if (previousLastId) {
            options = { limit: 100, before: previousLastId };
        } else {
            options = { limit: 100 };
        }
        const messages = await textChannel.fetchMessages(options);
        entries.push(...messages.array());
        let lastId;

        if (messages.last()) {
            lastId = messages.last().id || 0;
        } else {
            lastId = 0;
        }

        return [entries, lastId];
    }
}