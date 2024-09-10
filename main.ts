import { Plugin, PluginSettingTab, App, Setting, Editor, Menu, Notice } from 'obsidian';

interface JapaneseTranslatorSettings {
    apiKey: string;
    model: string;
    customPrompt: string;
}

const DEFAULT_SETTINGS: JapaneseTranslatorSettings = {
    apiKey: '',
    model: 'openai/gpt-3.5-turbo',
    customPrompt: 'You are a translator. Translate the following Japanese text to English.',
}

export default class JapaneseTranslatorPlugin extends Plugin {
    settings: JapaneseTranslatorSettings;

    async onload() {
        console.log('JapaneseTranslatorPlugin: Starting to load plugin');
        await this.loadSettings();
        console.log('JapaneseTranslatorPlugin: Settings loaded');

        this.addSettingTab(new JapaneseTranslatorSettingTab(this.app, this));
        console.log('JapaneseTranslatorPlugin: Setting tab added');

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
                const selection = editor.getSelection();
                if (selection) {
                    menu.addItem((item) => {
                        item
                            .setTitle("Translate to English")
                            .setIcon("language")
                            .onClick(async () => {
                                console.log('JapaneseTranslatorPlugin: Translation requested');
                                const translation = await this.translateJapaneseToEnglish(selection);
                                editor.replaceSelection(selection + "\n\nTranslation:\n" + translation);
                                console.log('JapaneseTranslatorPlugin: Translation completed and inserted');
                            });
                    });
                }
            })
        );
        console.log('JapaneseTranslatorPlugin: Editor menu event registered');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        console.log('JapaneseTranslatorPlugin: Settings loaded');
    }

    async saveSettings() {
        await this.saveData(this.settings);
        console.log('JapaneseTranslatorPlugin: Settings saved');
    }

    async translateJapaneseToEnglish(text: string): Promise<string> {
        console.log('JapaneseTranslatorPlugin: Starting translation');
        if (!this.settings.apiKey) {
            console.error('JapaneseTranslatorPlugin: API key is missing');
            new Notice("Please set your OpenRouter API key in the plugin settings.");
            return "";
        }

        console.log('JapaneseTranslatorPlugin: Sending API request');
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.settings.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    messages: [
                        { role: "system", content: this.settings.customPrompt },
                        { role: "user", content: text }
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('JapaneseTranslatorPlugin: Translation successful');
            return result.choices[0].message.content.trim();
        } catch (error) {
            console.error('JapaneseTranslatorPlugin: Error during translation', error);
            throw error;
        }
    }
}

class JapaneseTranslatorSettingTab extends PluginSettingTab {
    plugin: JapaneseTranslatorPlugin;

    constructor(app: App, plugin: JapaneseTranslatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("OpenRouter API Key")
            .setDesc("Enter your OpenRouter API key. Warning: Keep this key secret and never share it.")
            .addText(text => {
                text.inputEl.type = "password";
                text.setPlaceholder("Enter your API key")
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                        console.log('JapaneseTranslatorPlugin: API key updated');
                    });
            });

        new Setting(containerEl)
            .setName("LLM Model")
            .setDesc("Select the LLM model to use for translation")
            .addDropdown(dropdown => dropdown
                .addOption("openai/gpt-3.5-turbo", "GPT-3.5 Turbo")
                .addOption("openai/gpt-4", "GPT-4")
                .addOption("anthropic/claude-2", "Claude 2")
                .addOption("meta-llama/llama-3.1-8b-instruct:free", "Llama 3.1-8b")
                .addOption("qwen/qwen-2-7b-instruct:free", "Qwen-2-7b")
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                    console.log('JapaneseTranslatorPlugin: LLM model updated');
                }));

        new Setting(containerEl)
            .setName("Custom Prompt")
            .setDesc("Enter a custom prompt to guide the translation")
            .addTextArea(text => {
                text.setPlaceholder("Enter your custom prompt")
                    .setValue(this.plugin.settings.customPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.customPrompt = value;
                        await this.plugin.saveSettings();
                        console.log('JapaneseTranslatorPlugin: Custom prompt updated');
                    });
                text.inputEl.rows = 10;
                text.inputEl.cols = 50;
            });
    }
}