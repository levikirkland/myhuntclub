const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'data.db')
const db = new sqlite3.Database(dbPath)

async function addColumns() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.error('Error getting table info:', err)
        reject(err)
        return
      }

      const columnNames = rows.map(row => row.name)
      const columnsToAdd = [
        { name: 'address', type: 'TEXT' },
        { name: 'city', type: 'TEXT' },
        { name: 'state', type: 'TEXT' },
        { name: 'zip', type: 'TEXT' },
        { name: 'age', type: 'INTEGER' },
        { name: 'hunter_safety_completed', type: 'BOOLEAN DEFAULT 0' },
        { name: 'hunt_club_bylaws_signed', type: 'BOOLEAN DEFAULT 0' }
      ]

      let completed = 0
      const total = columnsToAdd.filter(col => !columnNames.includes(col.name)).length

      columnsToAdd.forEach(col => {
        if (!columnNames.includes(col.name)) {
          db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) {
              console.error(`Error adding ${col.name} column:`, err.message)
            } else {
              console.log(`Added ${col.name} column`)
            }
            completed++
            if (completed === total) {
              resolve()
            }
          })
        }
      })

      if (total === 0) {
        console.log('All columns already exist')
        resolve()
      }
    })
  })
}

addColumns().then(() => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err)
    else console.log('Migration complete')
  })
}).catch(err => {
  console.error('Migration failed:', err)
  db.close()
})
