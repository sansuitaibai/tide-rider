import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const read=p=>readFile(new URL(p.startsWith('node_modules/')?p:'src/'+p,import.meta.url),'utf8');
const [template,css,source,threeLicense,lucideLicense]=await Promise.all(['index.html','style.css','game.js','node_modules/three/LICENSE','node_modules/lucide-static/LICENSE'].map(read));
const names=new Set([...`${template} ${source}`.matchAll(/(?:['"])([a-z]+(?:-[a-z0-9]+)*)(?:['"])/g)].map(m=>m[1]));
const icons={};
await Promise.all([...names].map(async n=>{
 try{icons[n]=(await read(`node_modules/lucide-static/icons/${n}.svg`)).replace(/<!--[\s\S]*?-->/g,'').replace('<svg','<svg aria-hidden="true" focusable="false"').trim();}catch(e){if(e.code!=='ENOENT')throw e;}
}));
const bundle=await build({stdin:{contents:source.replace('/* ICONS */{}',JSON.stringify(icons)),resolveDir:fileURLToPath(new URL('src/',import.meta.url)),sourcefile:'game.js'},bundle:true,minify:true,write:false,target:'es2022',legalComments:'none',charset:'utf8'});
const js=bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=template.replace('/* STYLES */',()=>css).replace('/* SCRIPT */',()=>js)+`\n<!-- Third-party licenses\nThree.js\n${threeLicense}\nLucide\n${lucideLicense}\n-->\n`;
await writeFile(new URL('index.html',import.meta.url),html);
console.log(`Built ${html.length} characters and ${Object.keys(icons).length} icons.`);
