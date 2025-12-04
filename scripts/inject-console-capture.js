import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');

function injectScript(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('dashboard-console-capture.js')) {
    return;
  }
  
  const scriptTag = '<script src="/dashboard-console-capture.js"></script>';
  const headCloseTag = '</head>';
  
  if (content.includes(headCloseTag)) {
    const updatedContent = content.replace(
      headCloseTag,
      `  ${scriptTag}\n${headCloseTag}`
    );
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Injected console capture script into ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.html')) {
      injectScript(filePath);
    }
  });
}

if (fs.existsSync(distDir)) {
  console.log('Injecting console capture script into HTML files...');
  processDirectory(distDir);
  console.log('Done!');
} else {
  console.log('dist directory not found. Run build first.');
}