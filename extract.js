import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Użytkownik\\AppData\\Roaming\\Code\\User\\workspaceStorage\\54ecb6a07c81fe19f2f00ffb7e4a1115\\GitHub.copilot-chat\\chat-session-resources\\45b96467-42f9-4d02-93ae-7d062d864c35\\call_MHx6aXE3RUdid3lNY05nbnc2ZEg__vscode-1774479887895\\content.txt', 'utf8');
const match = content.match(/```tsx\s*([\s\S]*?)```/);
if (match && match[1]) {
  fs.writeFileSync('views/DashboardEmployee.tsx', match[1].trim());
  console.log('Extracted successfully!');
} else {
  console.log('Regexp failed to match codeblock');
}