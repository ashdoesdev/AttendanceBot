"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MessagesHelper {
    getMessages(textChannel, entries, lastId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!entries) {
                entries = new Array();
            }
            if (lastId !== 0) {
                let messages = yield this.bundleMessages(textChannel, entries, lastId);
                if (messages[1]) {
                    yield this.getMessages(textChannel, entries, messages[1]);
                }
            }
            return entries;
        });
    }
    bundleMessages(textChannel, entries, previousLastId) {
        return __awaiter(this, void 0, void 0, function* () {
            let options;
            if (previousLastId) {
                options = { limit: 100, before: previousLastId };
            }
            else {
                options = { limit: 100 };
            }
            const messages = yield textChannel.fetchMessages(options);
            entries.push(...messages.array());
            let lastId;
            if (messages.last()) {
                lastId = messages.last().id || 0;
            }
            else {
                lastId = 0;
            }
            return [entries, lastId];
        });
    }
}
exports.MessagesHelper = MessagesHelper;
