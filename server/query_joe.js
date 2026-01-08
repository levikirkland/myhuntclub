const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
function q(sql) { return new Promise((res,rej)=>db.all(sql,(e,r)=>e?rej(e):res(r))); }
(async()=>{ try{
 const users = await q("SELECT id as user_id,email,first_name,last_name,phone,created_at,account_id FROM users WHERE lower(email) LIKE '%joe%' OR lower(first_name) LIKE '%joe%' OR lower(last_name) LIKE '%joe%';");
 console.log('---USERS---'); console.log(JSON.stringify(users,null,2));
 const ids = users.map(u=>u.user_id);
 if (ids.length){
  const inList = ids.join(',');
  const mems = await q(`SELECT id,account_id,user_id,role,created_at FROM account_memberships WHERE user_id IN (${inList});`);
  console.log('---MEMBERSHIPS---'); console.log(JSON.stringify(mems,null,2));
  const assigns = await q(`SELECT pa.id, pa.property_id, pa.user_id, p.name as property_name FROM property_assignments pa JOIN properties p ON p.id=pa.property_id WHERE pa.user_id IN (${inList});`);
  console.log('---ASSIGNMENTS---'); console.log(JSON.stringify(assigns,null,2));
 } else {
  console.log('No matching users found.');
 }
 db.close();
} catch(err){ console.error(err); db.close(); process.exit(1);} })();
