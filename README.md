# Japanese to English Translator Plugin for Obsidian

This plugin helps you learn Japanese by translating selected Japanese text to English using an AI LLM model from OpenRouter.

## Features

- Translate selected Japanese text to English
- Customizable LLM model selection
- Easy-to-use context menu integration
- Custom prompt for tailored translations

## Installation

1. Download the plugin files and place them in your Obsidian plugins folder.
2. Enable the plugin in Obsidian settings under "Community Plugins".

## Configuration

1. Go to Settings > Community Plugins > Japanese to English Translator > Settings
2. Enter your OpenRouter API key
3. Select your preferred LLM model for translation
4. (Optional) Customize the translation prompt

### Custom Prompt

You can customize the prompt given to the AI model to guide the translation process. This allows you to tailor the translation to your specific needs. For example:

- "Translate the following Japanese text to English, providing explanations for idioms."
- "Translate the following Japanese text to English, focusing on formal language."
- "Translate the following Japanese text to English, and include the literal translation for any figurative expressions."

## Usage

1. Select the Japanese text you want to translate in your note
2. Right-click on the selected text
3. Choose "Translate to English" from the context menu
4. The English translation will be appended after the selected text

## API Key Security

IMPORTANT: Keep your API key confidential and secure. Follow these guidelines:

1. Never share your API key publicly or include it in your code repositories.
2. If you suspect your API key has been compromised, regenerate it immediately from your OpenRouter account.
3. Use environment variables or secure credential management systems in development environments.
4. Regularly rotate your API keys as a security best practice.

The plugin stores your API key locally and securely within Obsidian's settings. However, always exercise caution when handling API keys.

## Note

Make sure you have a valid OpenRouter API key and sufficient credits for the selected model. The plugin will not work without a valid API key.

## Support

If you encounter any issues or have suggestions for improvement, please open an issue on the plugin's GitHub repository.

Enjoy learning Japanese with this translator plugin!