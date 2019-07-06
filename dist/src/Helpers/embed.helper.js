"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EmbedHelper {
    getBar(percent) {
        switch (true) {
            case (percent === 100): {
                return '```diff\n!||||||||||||]```';
                break;
            }
            case (percent > 92):
                return '```diff\n!|||||||||||.]```';
                break;
            case (percent > 84):
                return '```diff\n!||||||||||..]```';
                break;
            case (percent > 76):
                return '```fix\n[||||||||||...]```';
                break;
            case (percent > 68):
                return '```fix\n[|||||||||....]```';
                break;
            case (percent > 60):
                return '```css\n[||||||||.....]```';
                break;
            case (percent > 52):
                return '```css\n[|||||||......]```';
                break;
            case (percent > 44):
                return '```css\n[||||||.......]```';
                break;
            case (percent > 36):
                return '```css\n[|||||........]```';
                break;
            case (percent > 28):
                return '```css\n[||||.........]```';
                break;
            case (percent > 20):
                return '```css\n[|||..........]```';
                break;
            case (percent > 12):
                return '```css\n[||...........]```';
                break;
            case (percent > 4):
                return '```css\n[|............]```';
                break;
            default:
                return '```css\n[.............]```';
                break;
        }
    }
}
exports.EmbedHelper = EmbedHelper;
