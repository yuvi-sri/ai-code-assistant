import * as vscode from 'vscode';
import * as path from 'path';
import fetch from 'node-fetch';

const OPENAI_API_KEY = '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'; // ← Replace this

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-code-assistant.startChat', () => {
      const panel = vscode.window.createWebviewPanel(
        'aiChat',
        'AI Code Assistant',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
        }
      );

      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'bundle.js')
      );

      panel.webview.html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8" /><title>AI Chat</title></head>
          <body>
            <div id="root"></div>
            <script>const vscode = acquireVsCodeApi();</script>
            <script src="${scriptUri}"></script>
          </body>
        </html>
      `;

      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.type === 'chat') {
          const userMessage = message.content;
          const aiReply = await getOpenAIResponse(userMessage);
          panel.webview.postMessage({ type: 'ai-reply', content: aiReply });
        }
      });
    })
  );
}

async function getOpenAIResponse(prompt: string): Promise<string> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const json = await res.json();

    console.log('✅ API response:', JSON.stringify(json, null, 2));

    if (json.choices && json.choices.length > 0) {
      return json.choices[0].message.content.trim();
    } else if (json.error) {
      console.error('❌ OpenAI Error:', json.error.message);
      return `OpenAI Error: ${json.error.message}`;
    } else {
      return '⚠️ Unexpected response format from OpenAI.';
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err);
    return '⚠️ Failed to reach OpenAI API.';
  }
}


export function deactivate() {}
