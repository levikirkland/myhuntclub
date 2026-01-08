const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'data.db')
const db = new sqlite3.Database(dbPath)

function hasColumn(table, column) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return reject(err)
      const found = rows.some(r => r.name === column)
      resolve(found)
    })
  })
}

function hasTable(name) {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [name], (err, row) => {
      if (err) return reject(err)
      resolve(!!row)
    })
  })
}

async function run() {
  try {
    const cols = ['first_name', 'last_name', 'phone']
    for (const col of cols) {
      const exists = await hasColumn('users', col)
      if (!exists) {
        console.log(`Adding column ${col} to users`)
        await new Promise((resolve, reject) => {
          db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, (err) => {
            if (err) return reject(err)
            resolve()
          })
        })
      } else {
        console.log(`Column ${col} already exists`)
      }
    }

    // Ensure new tables exist for memberships, properties and assignments
    const tables = [
      `CREATE TABLE IF NOT EXISTS account_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS property_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const sql of tables) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }

    // Ensure hunt_clubs and club_memberships exist
    const extra = [
      `CREATE TABLE IF NOT EXISTS hunt_clubs (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS club_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hunt_club_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const sql of extra) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }

    // Add hunt_club_id column to properties if missing
    const propHasClub = await hasColumn('properties', 'hunt_club_id')
    if (!propHasClub) {
      console.log('Adding column hunt_club_id to properties')
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE properties ADD COLUMN hunt_club_id TEXT`, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    } else {
      console.log('Column hunt_club_id already exists on properties')
    }

    // Add address columns if missing
    const addCols = ['address','city','state','zip']
    for (const col of addCols) {
      const exists = await hasColumn('properties', col)
      if (!exists) {
        console.log(`Adding column ${col} to properties`)
        await new Promise((resolve, reject) => {
          db.run(`ALTER TABLE properties ADD COLUMN ${col} TEXT`, (err) => {
            if (err) return reject(err)
            resolve()
          })
        })
      } else {
        console.log(`Column ${col} already exists on properties`)
      }
    }

    // Ensure hunt_club_id is unique (one-to-one: a club has at most one property)
    await new Promise((resolve, reject) => {
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_hunt_club_unique ON properties(hunt_club_id)`, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    // Create stands, food_plots and their assignment tables
    const extraTables = [
      `CREATE TABLE IF NOT EXISTS stands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS food_plots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS stand_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stand_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS plot_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plot_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const sql of extraTables) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }
    console.log('Migration complete')
    db.close()
  } catch (err) {
    console.error('Migration error', err)
    db.close()
    process.exit(1)
  }
}

run()
