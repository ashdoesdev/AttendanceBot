"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EmbedHelper {
    getBar(percent) {
        switch (true) {
            case (percent === 100): {
                return '```diff\n!|||||||||||]```';
                break;
            }
            case (percent > 91):
                return '```diff\n!||||||||||.]```';
                break;
            case (percent > 82):
                return '```diff\n!|||||||||..]```';
                break;
            case (percent > 73):
                return '```fix\n[|||||||||...]```';
                break;
            case (percent > 64):
                return '```fix\n[||||||||....]```';
                break;
            case (percent > 55):
                return '```css\n[|||||||.....]```';
                break;
            case (percent > 46):
                return '```css\n[||||||......]```';
                break;
            case (percent > 37):
                return '```css\n[|||||.......]```';
                break;
            case (percent > 28):
                return '```css\n[||||........]```';
                break;
            case (percent > 19):
                return '```css\n[|||.........]```';
                break;
            case (percent > 10):
                return '```css\n[||..........]```';
                break;
            case (percent > 1):
                return '```css\n[|...........]```';
                break;
            default:
                return '```css\n[............]```';
                break;
        }
    }
}
exports.EmbedHelper = EmbedHelper;
