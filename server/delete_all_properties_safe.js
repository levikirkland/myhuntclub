const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname);
const DB_FILE = path.join(DB_DIR, 'data.db');

if (!fs.existsSync(DB_FILE)) {
  console.error('Database not found at', DB_FILE);
  process.exit(1);
}

const BACKUP_TS = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = path.join(DB_DIR, `data.db.bak.${BACKUP_TS}`);

function backupDb() {
  fs.copyFileSync(DB_FILE, BACKUP_FILE);
  console.log('Backup created:', BACKUP_FILE);
}

const args = process.argv.slice(2);
const CONFIRMED = args.includes('--yes') || args.includes('-y');
const ONLY_PROPS = args.includes('--only-properties');

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE);

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getCount(table) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as c FROM ${table}`, (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.c : 0);
    });
  });
}

async function printCounts() {
  const tables = [
    'properties',
    'property_assignments',
    'stands',
    'stand_assignments',
    'food_plots',
    'plot_assignments'
  ];
  console.log('\nPre-delete counts:');
  for (const t of tables) {
    try {
      const c = await getCount(t);
      console.log(`${t}: ${c}`);
    } catch (e) {
      // Table may not exist, skip gracefully
    }
  }
}

(async () => {
  try {
    await printCounts();

    if (!CONFIRMED) {
      console.log('\nDry run: no changes made. To delete, re-run with --yes or -y');
      db.close();
      process.exit(0);
    }

    backupDb();

    console.log('\nDeleting rows...');
    await runSql('BEGIN TRANSACTION');

    if (ONLY_PROPS) {
      await runSql('DELETE FROM properties');
    } else {
      await runSql('DELETE FROM property_assignments');
      await runSql('DELETE FROM stand_assignments');
      await runSql('DELETE FROM plot_assignments');
      await runSql('DELETE FROM stands');
      await runSql('DELETE FROM food_plots');
      await runSql('DELETE FROM properties');
    }

    await runSql('COMMIT');

    console.log('\nDeletion complete. Post-delete counts:');
    await printCounts();
    console.log('\nBackup kept at:', BACKUP_FILE);
    db.close();
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { await runSql('ROLLBACK'); } catch (e) {}
    db.close();
    process.exit(1);
  }
})();
