// One-time migration helper: wraps presentation strings only, never editor values.
import ts from 'typescript';
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
const files = ['src/App.tsx', ...readdirSync('src/components').filter(x=>x.endsWith('.tsx')&&!x.includes('.test.')&&x!=='SettingsDialog.tsx').map(x=>'src/components/'+x)];
const keys = new Set();
const clean = s=>s.replace(/\s+/g,' ').trim();
for(const file of files) {
 let source=readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[];
 const edit=(a,b,s)=>edits.push([a,b,s]);
 function scan(n) {
  if(ts.isJsxText(n)) {
   const text=clean(n.text);
   if(/[A-Za-z]/.test(text)&&text!=='Lumerix'&&text!=='STUDIO') {keys.add(text); edit(n.pos,n.end,`{t(${JSON.stringify(text)})}`);}
  } else if(ts.isJsxAttribute(n)&&['title','aria-label','placeholder','alt'].includes(n.name.getText(ast))&&n.initializer) {
   const v=n.initializer;
   if(ts.isStringLiteral(v)&&v.text) {keys.add(v.text); edit(v.getStart(ast),v.end,`{t(${JSON.stringify(v.text)})}`);return;}
   if(ts.isJsxExpression(v)&&v.expression) {const s=v.expression.getText(ast); if(!s.includes('photo.name'))edit(v.expression.getStart(ast),v.expression.end,`t(${s})`); return;}
  } else if(ts.isJsxExpression(n)&&n.expression&&(ts.isJsxElement(n.parent)||ts.isJsxFragment(n.parent))) {
   const x=n.expression;
   if(ts.isIdentifier(x)||ts.isPropertyAccessExpression(x)||ts.isElementAccessExpression(x)||ts.isTemplateExpression(x)||ts.isConditionalExpression(x)||ts.isBinaryExpression(x)) {
    const s=x.getText(ast);
    if(!s.includes('<')&&!/^(photo|target|m|selected|p)\??\.name$/.test(s)) {edit(x.getStart(ast),x.end,`t(${s})`);return;}
   }
  }
  ts.forEachChild(n,scan);
 }
 scan(ast);
 for(const [a,b,s] of edits.sort((a,b)=>b[0]-a[0])) source=source.slice(0,a)+s+source.slice(b);
 source=`import { t } from "${file==='src/App.tsx'?'./i18n':'../i18n'}";\n`+source;
 writeFileSync(file,source);
}
writeFileSync('scripts/ui-strings.json',JSON.stringify([...keys],null,2));
