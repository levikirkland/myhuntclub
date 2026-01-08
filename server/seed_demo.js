const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('data.db');
(async()=>{
  try{
    const email = 'joe@test.com';
    const newPass = 'temppass123';
    const hash = await bcrypt.hash(newPass, 10);

    // Update Joe's password
    await new Promise((res,rej)=> db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email], function(err){ if(err) return rej(err); res(this.changes); }));
    console.log('Password for', email, 'updated. New password:', newPass);

    // Find user and account
    const row = await new Promise((res,rej)=> db.get('SELECT id, account_id FROM users WHERE email = ?', [email], (e,r)=> e?rej(e):res(r)));
    if(!row) throw new Error('User not found');
    const userId = row.id; const accountId = row.account_id;

    // Create demo hunt club
    const clubId = 'demo_club_1';
    await new Promise((res,rej)=> db.run('INSERT OR IGNORE INTO hunt_clubs (id, account_id, name, description) VALUES (?, ?, ?, ?)', [clubId, accountId, 'Demo Club', 'Auto-created demo club'], function(e){ if(e) return rej(e); res(this.lastID); }));
    console.log('Created hunt_club', clubId);

    // Add club membership
    await new Promise((res,rej)=> db.run('INSERT OR IGNORE INTO club_memberships (hunt_club_id, user_id, role) VALUES (?, ?, ?)', [clubId, userId, 'member'], function(e){ if(e) return rej(e); res(this.lastID); }));
    console.log('Added club_membership for user', userId);

    // Create a property under this club
    await new Promise((res,rej)=> db.run('INSERT INTO properties (account_id, hunt_club_id, name, type, description) VALUES (?, ?, ?, ?, ?)', [accountId, clubId, 'Demo Stand 1', 'stand', 'Demo stand for testing'], function(e){ if(e) return rej(e); console.log('Created property id', this.lastID); res(this.lastID); }));

    // Find the property id
    const prop = await new Promise((res,rej)=> db.get('SELECT id FROM properties WHERE account_id = ? AND hunt_club_id = ? AND name = ?', [accountId, clubId, 'Demo Stand 1'], (e,r)=> e?rej(e):res(r)));
    if(prop) {
      await new Promise((res,rej)=> db.run('INSERT INTO property_assignments (property_id, user_id) VALUES (?, ?)', [prop.id, userId], function(e){ if(e) return rej(e); res(this.lastID); }));
      console.log('Assigned user', userId, 'to property', prop.id);
    }

    db.close();
    console.log('Seed complete. You can log in as joe@test.com / temppass123')
  }catch(err){ console.error('Seed error', err); db.close(); process.exit(1);} 
})();
