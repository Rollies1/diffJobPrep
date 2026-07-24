const fs = require('fs');
let f = 'frontend/src/screens/SearchExploreScreen.tsx';
let t = fs.readFileSync(f, 'utf8');
t = t.replace(/\.filter\(\(d\) =>/g, '.filter((d: any) =>');
t = t.replace(/\.map\(\(d, i\) =>/g, '.map((d: any, i: any) =>');
t = t.replace(/matchedDecks\.map\(\(d\) =>/g, 'matchedDecks.map((d: any) =>');
fs.writeFileSync(f, t);
