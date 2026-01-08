const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const crypto = require('crypto')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// Register: create an account (club) and a user within that account
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone, clubName } = req.body
  if (!email || !password || !clubName) {
    return res.status(400).json({ message: 'email, password and clubName required' })
  }

  try {
    // create account id
    const accountId = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex')

    // Insert account
    const accStmt = db.prepare('INSERT INTO accounts (id, name) VALUES (?, ?)')
    accStmt.run(accountId, clubName, function (accErr) {
      if (accErr) {
        console.error('Account create error', accErr)
        return res.status(500).json({ message: 'Could not create account' })
      }

      // Hash password and create user
      bcrypt.hash(password, 10).then((hash) => {
        const userStmt = db.prepare('INSERT INTO users (email, password_hash, account_id, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)')
        userStmt.run(email, hash, accountId, firstName || null, lastName || null, phone || null, function (userErr) {
          if (userErr) {
            console.error('User create error', userErr)
            return res.status(400).json({ message: 'Could not create user (email may already exist)' })
          }
          // Add membership record so users can belong to multiple accounts
          const createdUserId = this.lastID
          const membershipStmt = db.prepare('INSERT INTO account_memberships (account_id, user_id, role) VALUES (?, ?, ?)')
          membershipStmt.run(accountId, createdUserId, 'owner', function (mErr) {
            if (mErr) console.error('Membership insert error', mErr)

            const token = jwt.sign({ userId: createdUserId, accountId }, JWT_SECRET, { expiresIn: '8h' })
            return res.json({ id: createdUserId, token })
          })
        })
      }).catch((hashErr) => {
        console.error(hashErr)
        res.status(500).json({ message: 'Server error' })
      })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  // login attempt received (temporary debug removed)
  if (!email || !password) return res.status(400).json({ message: 'email and password required' })

  db.get('SELECT id, email, password_hash, account_id FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Server error' })
    }
    if (!row) return res.status(401).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ userId: row.id, accountId: row.account_id }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token })
  })
})

// middleware to protect routes
function authenticate(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth) return res.status(401).json({ message: 'Missing Authorization header' })
  const parts = auth.split(' ')
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : auth
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Protected endpoint: returns account info and members for the account
router.get('/me', authenticate, (req, res) => {
  const { userId, accountId } = req.auth
  if (!userId || !accountId) return res.status(400).json({ message: 'Invalid token payload' })

  db.get('SELECT id, email, first_name, last_name, phone, account_id FROM users WHERE id = ?', [userId], (uErr, userRow) => {
    if (uErr) {
      console.error(uErr)
      return res.status(500).json({ message: 'Server error' })
    }
    if (!userRow) return res.status(404).json({ message: 'User not found' })

    db.get('SELECT id, name, created_at FROM accounts WHERE id = ?', [accountId], (aErr, accRow) => {
      if (aErr) {
        console.error(aErr)
        return res.status(500).json({ message: 'Server error' })
      }
      if (!accRow) return res.status(404).json({ message: 'Account not found' })

      // Members come from account_memberships so users can belong to multiple accounts
      db.all(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address, u.city, u.state, u.zip, u.age, u.hunter_safety_completed, u.hunt_club_bylaws_signed, m.role, m.created_at as joined_at
         FROM account_memberships m JOIN users u ON u.id = m.user_id
         WHERE m.account_id = ?`,
        [accountId],
        (mErr, members) => {
          if (mErr) {
            console.error(mErr)
            return res.status(500).json({ message: 'Server error' })
          }

            // Load properties for this account
          db.all('SELECT id, name, type, description, hunt_club_id, address, city, state, zip FROM properties WHERE account_id = ?', [accountId], (pErr, properties) => {
            if (pErr) {
              console.error(pErr)
              return res.status(500).json({ message: 'Server error' })
            }

            // Load assignments of users to properties
            db.all(
              `SELECT pa.id, pa.property_id, pa.user_id, u.email, u.first_name, u.last_name
               FROM property_assignments pa
               JOIN properties p ON p.id = pa.property_id
               JOIN users u ON u.id = pa.user_id
               WHERE p.account_id = ?`,
              [accountId],
              (a2Err, assignments) => {
                if (a2Err) {
                  console.error(a2Err)
                  return res.status(500).json({ message: 'Server error' })
                }

                // Load hunt clubs for the account
                db.all('SELECT id, name, description FROM hunt_clubs WHERE account_id = ?', [accountId], (hcErr, huntClubs) => {
                  if (hcErr) { console.error(hcErr); return res.status(500).json({ message: 'Server error' }) }
                  return res.json({ user: userRow, account: accRow, members, properties, assignments, hunt_clubs: huntClubs })
                })
              }
            )
          })
        }
      )
    })
  })
})

module.exports = router

