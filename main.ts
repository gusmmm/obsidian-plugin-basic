import { Plugin, PluginSettingTab, App, Setting, Editor, Menu, MenuItem, Notice, MarkdownView, requestUrl } from 'obsidian';

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

export default class JapaneseHelperPlugin extends Plugin {
    settings: JapaneseTranslatorSettings;

    async onload() {
        console.log('JapaneseHelperPlugin: Starting to load plugin');
        await this.loadSettings();
        console.log('JapaneseHelperPlugin: Settings loaded');

        this.addSettingTab(new JapaneseTranslatorSettingTab(this.app, this));
        console.log('JapaneseHelperPlugin: Setting tab added');

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
                const selection = editor.getSelection();
                if (selection) {
                    menu.addItem((item) => {
                        item
                            .setTitle("Japanese Helper")
                            .setIcon("language");
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle("Translate to English")
                            .setIcon("translate")
                            .setSection("japanese-helper")
                            .onClick(async () => {
                                console.log('JapaneseHelperPlugin: Translation requested');
                                const translation = await this.translateJapaneseToEnglish(selection);
                                editor.replaceSelection(selection + "\n\nTranslation:\n" + translation);
                                console.log('JapaneseHelperPlugin: Translation completed and inserted');
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle("Jisho Lookup")
                            .setIcon("search")
                            .setSection("japanese-helper")
                            .onClick(async () => {
                                console.log('JapaneseHelperPlugin: Jisho lookup requested');
                                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                                if (view) {
                                    await this.lookupJisho(selection, editor, view);
                                    console.log('JapaneseHelperPlugin: Jisho lookup completed');
                                } else {
                                    new Notice("Active view is not a markdown view");
                                }
                            });
                    });
                }
            })
        );
        console.log('JapaneseHelperPlugin: Editor menu event registered');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        console.log('JapaneseHelperPlugin: Settings loaded');
    }

    async saveSettings() {
        await this.saveData(this.settings);
        console.log('JapaneseHelperPlugin: Settings saved');
    }

    async translateJapaneseToEnglish(text: string): Promise<string> {
        console.log('JapaneseHelperPlugin: Starting translation');
        if (!this.settings.apiKey) {
            console.error('JapaneseHelperPlugin: API key is missing');
            new Notice("Please set your OpenRouter API key in the plugin settings.");
            return "";
        }

        console.log('JapaneseHelperPlugin: Sending API request');
        try {
            const response = await requestUrl({
                url: "https://openrouter.ai/api/v1/chat/completions",
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

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = response.json;
            console.log('JapaneseHelperPlugin: Translation successful');
            return result.choices[0].message.content.trim();
        } catch (error) {
            console.error('JapaneseHelperPlugin: Error during translation', error);
            new Notice("Error occurred during translation. Please try again.");
            return "";
        }
    }

    async lookupJisho(text: string, editor: Editor, view: MarkdownView) {
        console.log('JapaneseHelperPlugin: Starting Jisho lookup');
        const words = text.trim().split(/\s+/);
        if (words.length === 0) {
            new Notice("No text selected for Jisho lookup.");
            return;
        }

        const firstWord = words[0];
        try {
            const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(firstWord)}`;
            const response = await requestUrl({
                url: jishoUrl,
                method: "GET",
            });

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.json;
            if (data.data && data.data.length > 0) {
                const result = data.data[0];
                let jishoInfo = `### ${firstWord}\n\n`;

                // Add all readings
                jishoInfo += "**Readings:**\n";
                result.japanese.forEach((item: any, index: number) => {
                    jishoInfo += `${index + 1}. `;
                    if (item.word) jishoInfo += `${item.word} `;
                    if (item.reading) jishoInfo += `(${item.reading})`;
                    jishoInfo += "\n";
                });
                jishoInfo += "\n";

                // Add all meanings with additional info
                jishoInfo += "**Meanings:**\n";
                result.senses.forEach((sense: any, index: number) => {
                    jishoInfo += `${index + 1}. ${sense.english_definitions.join(', ')}\n`;
                    if (sense.parts_of_speech.length > 0) {
                        jishoInfo += `   _Part of speech:_ ${sense.parts_of_speech.join(', ')}\n`;
                    }
                    if (sense.tags.length > 0) {
                        jishoInfo += `   _Tags:_ ${sense.tags.join(', ')}\n`;
                    }
                    if (sense.info.length > 0) {
                        jishoInfo += `   _Info:_ ${sense.info.join(', ')}\n`;
                    }
                    jishoInfo += "\n";
                });

                // Add JLPT level if available
                if (result.jlpt.length > 0) {
                    jishoInfo += `**JLPT Level:** ${result.jlpt.join(', ')}\n\n`;
                }

                // Add example sentences if available
                if (result.senses[0].sentences) {
                    jishoInfo += "**Example Sentences:**\n";
                    result.senses[0].sentences.forEach((example: any, index: number) => {
                        jishoInfo += `${index + 1}. ${example.japanese}\n   ${example.english}\n\n`;
                    });
                }

                const currentContent = await view.editor.getValue();
                const newContent = currentContent + '\n\n' + jishoInfo;
                await view.editor.setValue(newContent);
                
                new Notice(`Jisho information for "${firstWord}" added to the note.`);
            } else {
                new Notice(`No Jisho information found for "${firstWord}".`);
            }
        } catch (error) {
            console.error('JapaneseHelperPlugin: Error during Jisho lookup', error);
            new Notice("Error occurred during Jisho lookup. Please try again.");
        }
    }
}

class JapaneseTranslatorSettingTab extends PluginSettingTab {
    plugin: JapaneseHelperPlugin;

    constructor(app: App, plugin: JapaneseHelperPlugin) {
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
                        console.log('JapaneseHelperPlugin: API key updated');
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
                    console.log('JapaneseHelperPlugin: LLM model updated');
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
                        console.log('JapaneseHelperPlugin: Custom prompt updated');
                    });
                text.inputEl.rows = 10;
                text.inputEl.cols = 50;
            });
    }
}