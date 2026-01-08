const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
function all(sql, params=[]) { return new Promise((res,rej)=>db.all(sql, params, (e,r)=>e?rej(e):res(r))); }
(async()=>{
  try{
    const tables = await all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    for(const t of tables){
      console.log('\n=== TABLE: ' + t.name + ' ===');
      const cols = await all(`PRAGMA table_info(${t.name})`);
      console.log('COLUMNS:', cols.map(c=>({name:c.name,type:c.type,pk:c.pk,notnull:c.notnull,default:c.dflt_value})));
      const rows = await all(`SELECT * FROM ${t.name} LIMIT 200`);
      console.log('ROWS_COUNT:', rows.length);
      if(rows.length) console.log(JSON.stringify(rows,null,2));
    }
    db.close();
  }catch(err){ console.error('ERROR', err); db.close(); process.exit(1);} 
})();
