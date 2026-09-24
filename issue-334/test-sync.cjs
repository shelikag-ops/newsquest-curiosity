const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const code=html.slice(html.indexOf('let flushing = false;'),html.indexOf('/* shrink photos'));
const a={id:'a',reporter:'Alice'},b={id:'b',reporter:'Bob'};
const ctx={CONFIG:{endpoint:'https://example.invalid'},store:{queue:[a,b]},storageFailed:false,persist(){},setSync(){},setTimeout(){},setInterval(){},window:{addEventListener(){}},AbortSignal,Set,JSON};
vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
 ctx.fetch=async()=>{throw Error('offline')};await ctx.flush();assert.equal(ctx.store.queue.length,2);
 ctx.fetch=async()=>({json:async()=>({ok:true,saved:['a']})});await ctx.flush();assert.deepEqual(ctx.store.queue,[b]);
 ctx.fetch=async()=>({json:async()=>({ok:false,saved:['b']})});await ctx.flush();assert.equal(ctx.store.queue.length,1);
 ctx.fetch=async()=>({json:async()=>({ok:true,saved:['b']})});await ctx.flush();assert.equal(ctx.store.queue.length,0);
 console.log('Sync checks passed: offline retention, explicit acknowledgments, partial batches and server errors.');
})().catch(e=>{console.error(e);process.exit(1)});
