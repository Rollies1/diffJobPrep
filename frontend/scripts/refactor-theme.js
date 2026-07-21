const fs = require('fs');
const path = require('path');

const directories = ['src', 'app'];

const replacements = [
  // Hook destructuring changes
  { regex: /const\s*{\s*colors(?:,\s*isDark)?\s*}\s*=\s*useTheme\(\);/g, replace: 'const theme = useTheme();' },
  { regex: /const\s*{\s*isDark(?:,\s*colors)?\s*}\s*=\s*useTheme\(\);/g, replace: 'const theme = useTheme();' },

  // Backgrounds
  { regex: /colors\.background\.main/g, replace: 'theme.background' },
  { regex: /colors\.background\.start/g, replace: 'theme.background' },
  { regex: /colors\.background\.end/g, replace: 'theme.surface' },
  { regex: /colors\.background\.accent/g, replace: 'theme.surfaceElevated' },
  { regex: /colors\.background\.deep/g, replace: 'theme.background' },
  
  // Surfaces
  { regex: /colors\.surface\.main/g, replace: 'theme.surface' },
  { regex: /colors\.surface\.glassBorder/g, replace: 'theme.border' },
  { regex: /colors\.surface\.glass/g, replace: 'theme.surfaceOverlay' },
  
  // Text
  { regex: /colors\.text\.primary/g, replace: 'theme.text.primary' },
  { regex: /colors\.text\.secondary/g, replace: 'theme.text.secondary' },
  { regex: /colors\.text\.muted/g, replace: 'theme.text.muted' },
  { regex: /colors\.text\.inverse/g, replace: 'theme.text.inverse' },
  
  // Glow / Semantic
  { regex: /colors\.glow\.success/g, replace: 'theme.semantic.success' },
  { regex: /colors\.glow\.danger/g, replace: 'theme.semantic.error' },
  { regex: /colors\.glow\.warning/g, replace: 'theme.semantic.warning' },
  { regex: /colors\.glow\.primary/g, replace: 'theme.semantic.info' },
  { regex: /colors\.glow\.secondary/g, replace: 'theme.premium.purple' },
  { regex: /colors\.error/g, replace: 'theme.semantic.error' },
  { regex: /colors\.success/g, replace: 'theme.semantic.success' },
  { regex: /colors\.progress\?\.track/g, replace: 'theme.border' },
  { regex: /colors\.progress\.track/g, replace: 'theme.border' },
  
  // Premium
  { regex: /colors\.premium\.gold/g, replace: 'theme.premium.gold' },
  { regex: /colors\.premium\.purple/g, replace: 'theme.premium.purple' },
  { regex: /colors\.premium\.gradientStart/g, replace: 'theme.premium.gradient[0]' },
  { regex: /colors\.premium\.gradientEnd/g, replace: 'theme.premium.gradient[2]' },
  
  // isDark
  { regex: /(?<!\w)isDark(?!\w)/g, replace: 'theme.isDark' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      // Special fix: If we replaced `isDark` to `theme.theme.isDark`, fix it
      content = content.replace(/theme\.theme\.isDark/g, 'theme.isDark');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Refactored: ${fullPath}`);
      }
    }
  }
}

for (const dir of directories) {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
}

console.log('Refactoring complete!');
