const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Sheet {
 constructor(){this.rows=[];}
 getLastRow(){return this.rows.length;}
 getRange(row,col,n=1,m=1){const sh=this;return {
 setValues(v){v.forEach((r,i)=>r.forEach((x,j)=>{sh.rows[row+i-1] ||= [];sh.rows[row+i-1][col+j-1]=x}));return this},
 getValues(){return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>sh.rows[row+i-1]?.[col+j-1]??''))},
 setFontWeight(){return this},insertCheckboxes(){return this}
 };}
 appendRow(r){this.rows.push(r)} setFrozenRows(){}
 getDataRange(){return this.getRange(1,1,this.rows.length,this.rows[0].length)}
}
const sheets={}; const ss={getId:()=> 'test-sheet',getSheetByName:n=>sheets[n],insertSheet:n=>sheets[n]=new Sheet()};
const props={};let locked=false;
const ctx={console,Set,Date,JSON,Math,Number,String,Array,Object,Error,
 SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>ss,flush(){}},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},
 LockService:{getScriptLock:()=>({waitLock:()=>locked=true,hasLock:()=>locked,releaseLock:()=>locked=false})},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/newsquest-apps-script.gs','utf8'),ctx);
ctx.setup();
const ev={id:'event_123',reporter:'Test Reporter',mission:'wonder',item:'Wonder Wall question',answer:'=1+1',issue:'334',t:'2026-09-24T12:00:00Z',session:'test',scores:{wonder:3,total:3}};
const post=events=>ctx.doPost({postData:{contents:JSON.stringify({events})}});
assert(post([ev]).ok);assert(post([ev]).ok);
assert.equal(sheets.Responses.rows.length,2);assert.equal(sheets.Wall.rows.length,2);
assert.equal(sheets.Responses.rows[1][4],"'=1+1");
assert.equal(sheets.Responses.rows[1][10],'334');
assert.equal(sheets.Scores.rows[1][1],3);
assert(post([{...ev,id:'event_124',scores:{wonder:0,total:0}}]).ok);
assert.equal(sheets.Scores.rows[1][1],3);
assert(!post([{...ev,id:'=bad'}]).ok);assert(!locked);
assert.equal(ctx.doGet({parameter:{action:'wall'}}).enabled,false);
props.ENABLE_PUBLIC_WALL='true';assert.equal(ctx.doGet({parameter:{action:'wall'}}).posts.length,2);
assert(!ctx.doPost({postData:{contents:'invalid'}}).ok);assert(!locked);
console.log('Backend checks passed: retry deduplication, formula escaping, metadata, score preservation, validation, private wall, lock release.');
