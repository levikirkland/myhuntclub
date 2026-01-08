const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('data.db');

(async () => {
  try {
    const newPassword = 'password'; // Change this to desired password
    const hash = await bcrypt.hash(newPassword, 10);
    await new Promise((res, rej) => {
      db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'joe@test.com'], function(err) {
        if (err) rej(err);
        else res();
      });
    });
    console.log('Password reset for joe@test.com to "password"');
    db.close();
  } catch (err) {
    console.error('ERROR', err);
    db.close();
    process.exit(1);
  }
})();