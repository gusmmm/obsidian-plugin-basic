import { Plugin } from 'obsidian';

export default class BasicPlugin extends Plugin {
    async onload() {
        console.log('Basic plugin has been loaded');
    }

    onunload() {
        console.log('Basic plugin has been unloaded');
    }
}