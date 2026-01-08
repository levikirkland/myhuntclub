const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const jwt = require('jsonwebtoken')

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

// List properties for an account
router.get('/accounts/:accountId/properties', authenticate, (req, res) => {
  const { accountId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  db.all('SELECT id, name, type, description, created_at FROM properties WHERE account_id = ?', [accountId], (err, rows) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Server error' })
    }
    res.json({ properties: rows })
  })
})

// Update a member's user details for an account
router.put('/accounts/:accountId/members/:memberId', authenticate, (req, res) => {
  const { accountId, memberId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  const { first_name, last_name, phone, address, city, state, zip, age, hunter_safety_completed, hunt_club_bylaws_signed, email } = req.body

  // ensure user is a member of this account
  db.get('SELECT id FROM account_memberships WHERE account_id = ? AND user_id = ?', [accountId, memberId], (mErr, mRow) => {
    if (mErr) { console.error(mErr); return res.status(500).json({ message: 'Server error' }) }
    if (!mRow) return res.status(404).json({ message: 'Member not found for this account' })

    // Use COALESCE to preserve existing values when fields are not provided
    const stmt = db.prepare('UPDATE users SET email = COALESCE(?, email), first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), zip = COALESCE(?, zip), age = COALESCE(?, age), hunter_safety_completed = COALESCE(?, hunter_safety_completed), hunt_club_bylaws_signed = COALESCE(?, hunt_club_bylaws_signed) WHERE id = ?')
    stmt.run(
      (typeof email !== 'undefined' ? email : null),
      (typeof first_name !== 'undefined' ? first_name : null),
      (typeof last_name !== 'undefined' ? last_name : null),
      (typeof phone !== 'undefined' ? phone : null),
      (typeof address !== 'undefined' ? address : null),
      (typeof city !== 'undefined' ? city : null),
      (typeof state !== 'undefined' ? state : null),
      (typeof zip !== 'undefined' ? zip : null),
      (typeof age !== 'undefined' ? age : null),
      (typeof hunter_safety_completed !== 'undefined' ? (hunter_safety_completed ? 1 : 0) : null),
      (typeof hunt_club_bylaws_signed !== 'undefined' ? (hunt_club_bylaws_signed ? 1 : 0) : null),
      memberId,
      function (err) {
      if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
      return res.json({ id: Number(memberId) })
    })
  })
})

// List hunt clubs for an account
router.get('/accounts/:accountId/huntclubs', authenticate, (req, res) => {
  const { accountId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  db.all('SELECT id, name, description, created_at FROM hunt_clubs WHERE account_id = ?', [accountId], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
    res.json({ hunt_clubs: rows })
  })
})

// Create a hunt club under an account
router.post('/accounts/:accountId/huntclubs', authenticate, (req, res) => {
  const { accountId } = req.params
  const { id, name, description } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name) return res.status(400).json({ message: 'name required' })

  const clubId = id || ("hc_" + Math.random().toString(36).slice(2,10))
  const stmt = db.prepare('INSERT INTO hunt_clubs (id, account_id, name, description) VALUES (?, ?, ?, ?)')
  stmt.run(clubId, accountId, name, description || null, function (err) {
    if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
    res.json({ id: clubId })
  })
})

// Update a hunt club (name/description)
router.put('/accounts/:accountId/huntclubs/:clubId', authenticate, (req, res) => {
  const { accountId, clubId } = req.params
  const { name, description } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name) return res.status(400).json({ message: 'name required' })

  // ensure club exists and belongs to account
  db.get('SELECT id FROM hunt_clubs WHERE id = ? AND account_id = ?', [clubId, accountId], (cErr, cRow) => {
    if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
    if (!cRow) return res.status(404).json({ message: 'Hunt club not found' })

    const stmt = db.prepare('UPDATE hunt_clubs SET name = ?, description = ? WHERE id = ?')
    stmt.run(name, description || null, clubId, function (err) {
      if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
      return res.json({ id: clubId })
    })
  })
})

// Create a property under a hunt club (preferred)
router.post('/accounts/:accountId/huntclubs/:clubId/properties', authenticate, (req, res) => {
  const { accountId, clubId } = req.params
  const { name, type, description, address, city, state, zip } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name || !type) return res.status(400).json({ message: 'name and type required' })

  // ensure club exists and belongs to account
  db.get('SELECT id FROM hunt_clubs WHERE id = ? AND account_id = ?', [clubId, accountId], (cErr, cRow) => {
    if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
    if (!cRow) return res.status(404).json({ message: 'Hunt club not found' })

    // enforce one-to-one: ensure club does not already have a property
    db.get('SELECT id FROM properties WHERE hunt_club_id = ?', [clubId], (pErr, pRow) => {
      if (pErr) { console.error(pErr); return res.status(500).json({ message: 'Server error' }) }
      if (pRow) return res.status(409).json({ message: 'This hunt club already has a property' })

      const stmt = db.prepare('INSERT INTO properties (account_id, hunt_club_id, name, type, description, address, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      stmt.run(accountId, clubId, name, type, description || null, address || null, city || null, state || null, zip || null, function (err) {
        if (err) {
          console.error(err)
          return res.status(500).json({ message: 'Server error' })
        }
        res.json({ id: this.lastID })
      })
    })
  })
})

// Backwards-compatible property creation (account-level) kept for older clients
router.post('/accounts/:accountId/properties', authenticate, (req, res) => {
  const { accountId } = req.params
  const { name, type, description, address, city, state, zip } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name || !type) return res.status(400).json({ message: 'name and type required' })
  // Enforce creation via hunt clubs to maintain 1:1 mapping and data consistency.
  return res.status(400).json({ message: 'Properties must be created under a Hunt Club. Create or select a Hunt Club and use /accounts/:accountId/huntclubs/:clubId/properties' })
})

// Update a property
router.put('/accounts/:accountId/properties/:propertyId', authenticate, (req, res) => {
  const { accountId, propertyId } = req.params
  const { name, type, description, address, city, state, zip, hunt_club_id } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name || !type) return res.status(400).json({ message: 'name and type required' })

  db.get('SELECT id FROM properties WHERE id = ? AND account_id = ?', [propertyId, accountId], (pErr, pRow) => {
    if (pErr) { console.error(pErr); return res.status(500).json({ message: 'Server error' }) }
    if (!pRow) return res.status(404).json({ message: 'Property not found' })

    // If a hunt_club_id is provided, ensure it belongs to the account and isn't already linked to another property
    function doUpdate() {
      // Only update hunt_club_id if it was explicitly provided (prevents accidental clearing)
      if (Object.prototype.hasOwnProperty.call(req.body, 'hunt_club_id')) {
        const stmt = db.prepare('UPDATE properties SET name = ?, type = ?, description = ?, address = ?, city = ?, state = ?, zip = ?, hunt_club_id = ? WHERE id = ?')
        stmt.run(name, type, description || null, address || null, city || null, state || null, zip || null, hunt_club_id || null, propertyId, function (err) {
          if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
          return res.json({ id: propertyId })
        })
      } else {
        const stmt = db.prepare('UPDATE properties SET name = ?, type = ?, description = ?, address = ?, city = ?, state = ?, zip = ? WHERE id = ?')
        stmt.run(name, type, description || null, address || null, city || null, state || null, zip || null, propertyId, function (err) {
          if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
          return res.json({ id: propertyId })
        })
      }
    }

    // Do not allow clearing a property of its hunt_club_id — properties must remain linked to a hunt club
    if (hunt_club_id === null || hunt_club_id === '') {
      return res.status(400).json({ message: 'Property must be associated with a Hunt Club (cannot be cleared).' })
    }

    if (hunt_club_id) {
      // verify club exists and belongs to this account
      db.get('SELECT id FROM hunt_clubs WHERE id = ? AND account_id = ?', [hunt_club_id, accountId], (cErr, cRow) => {
        if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
        if (!cRow) return res.status(404).json({ message: 'Hunt club not found' })

        // ensure no other property already claims this club
        db.get('SELECT id FROM properties WHERE hunt_club_id = ? AND id != ?', [hunt_club_id, propertyId], (dupErr, dupRow) => {
          if (dupErr) { console.error(dupErr); return res.status(500).json({ message: 'Server error' }) }
          if (dupRow) return res.status(409).json({ message: 'This hunt club is already associated with another property' })
          doUpdate()
        })
      })
    } else {
      // clearing the club association or leaving it null
      doUpdate()
    }
  })
})

// List members for account
router.get('/accounts/:accountId/members', authenticate, (req, res) => {
  const { accountId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  db.all(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
            u.address, u.city, u.state, u.zip, u.age,
            u.hunter_safety_completed, u.hunt_club_bylaws_signed,
            m.role, m.created_at as joined_at
     FROM account_memberships m JOIN users u ON u.id = m.user_id
     WHERE m.account_id = ?`,
    [accountId],
    (err, rows) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: 'Server error' })
      }
      res.json({ members: rows })
    }
  )
})

// Add member to account (creates user if necessary)
router.post('/accounts/:accountId/members', authenticate, async (req, res) => {
  const { accountId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  const { email, first_name, last_name, phone, password,
    address, city, state, zip, age, hunter_safety_completed, hunt_club_bylaws_signed } = req.body
  if (!email) return res.status(400).json({ message: 'email required' })

  db.get('SELECT id FROM users WHERE email = ?', [email], async (uErr, userRow) => {
    if (uErr) {
      console.error(uErr)
      return res.status(500).json({ message: 'Server error' })
    }

    let userId = userRow && userRow.id
    if (!userId) {
      // create a user with a password (or random one)
      const pass = password || Math.random().toString(36).slice(-8)
      const hash = await bcrypt.hash(pass, 10)
      const createStmt = db.prepare('INSERT INTO users (email, password_hash, account_id, first_name, last_name, phone, address, city, state, zip, age, hunter_safety_completed, hunt_club_bylaws_signed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      createStmt.run(email, hash, accountId, first_name || null, last_name || null, phone || null, address || null, city || null, state || null, zip || null, age || null, hunter_safety_completed ? 1 : 0, hunt_club_bylaws_signed ? 1 : 0, function (cErr) {
        if (cErr) {
          console.error(cErr)
          return res.status(500).json({ message: 'Server error' })
        }
        userId = this.lastID
        const memStmt = db.prepare('INSERT INTO account_memberships (account_id, user_id, role) VALUES (?, ?, ?)')
        memStmt.run(accountId, userId, 'member', function (mErr) {
          if (mErr) console.error(mErr)
          return res.json({ id: userId })
        })
      })
    } else {
      // user exists — update optional fields and add membership if not exists
      db.run('UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, age = ?, hunter_safety_completed = ?, hunt_club_bylaws_signed = ? WHERE id = ?',
        [first_name || null, last_name || null, phone || null, address || null, city || null, state || null, zip || null, age || null, hunter_safety_completed ? 1 : 0, hunt_club_bylaws_signed ? 1 : 0, userId], (uUpErr) => {
          if (uUpErr) console.error(uUpErr)
          // proceed to membership logic regardless of update error
          db.get('SELECT id FROM account_memberships WHERE account_id = ? AND user_id = ?', [accountId, userId], (mErr, mRow) => {
            if (mErr) {
              console.error(mErr)
              return res.status(500).json({ message: 'Server error' })
            }
            if (mRow) return res.status(200).json({ id: userId })
            const memStmt = db.prepare('INSERT INTO account_memberships (account_id, user_id, role) VALUES (?, ?, ?)')
            memStmt.run(accountId, userId, 'member', function (inErr) {
              if (inErr) {
                console.error(inErr)
                return res.status(500).json({ message: 'Server error' })
              }
              return res.json({ id: userId })
            })
          })
        })
    }
  })
})

// Add member to a specific hunt club (creates user if necessary)
router.post('/accounts/:accountId/huntclubs/:clubId/members', authenticate, async (req, res) => {
  const { accountId, clubId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  const { email, firstName, lastName, phone, password,
    address, city, state, zip, age, hunter_safety_completed, hunt_club_bylaws_signed } = req.body
  if (!email) return res.status(400).json({ message: 'email required' })

  // ensure club exists
  db.get('SELECT id FROM hunt_clubs WHERE id = ? AND account_id = ?', [clubId, accountId], (cErr, cRow) => {
    if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
    if (!cRow) return res.status(404).json({ message: 'Hunt club not found' })

    db.get('SELECT id FROM users WHERE email = ?', [email], async (uErr, userRow) => {
      if (uErr) { console.error(uErr); return res.status(500).json({ message: 'Server error' }) }
      let userId = userRow && userRow.id
      if (!userId) {
        const pass = password || Math.random().toString(36).slice(-8)
        const hash = await bcrypt.hash(pass, 10)
        const createStmt = db.prepare('INSERT INTO users (email, password_hash, account_id, first_name, last_name, phone, address, city, state, zip, age, hunter_safety_completed, hunt_club_bylaws_signed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        createStmt.run(email, hash, accountId, firstName || null, lastName || null, phone || null, address || null, city || null, state || null, zip || null, age || null, hunter_safety_completed ? 1 : 0, hunt_club_bylaws_signed ? 1 : 0, function (cErr) {
          if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
          userId = this.lastID
          const memStmt = db.prepare('INSERT INTO club_memberships (hunt_club_id, user_id, role) VALUES (?, ?, ?)')
          memStmt.run(clubId, userId, 'member', function (mErr) {
            if (mErr) console.error(mErr)
            return res.json({ id: userId })
          })
        })
      } else {
        // update optional fields for existing user
        db.run('UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, age = ?, hunter_safety_completed = ?, hunt_club_bylaws_signed = ? WHERE id = ?',
          [firstName || null, lastName || null, phone || null, address || null, city || null, state || null, zip || null, age || null, hunter_safety_completed ? 1 : 0, hunt_club_bylaws_signed ? 1 : 0, userId], (uUpErr) => {
            if (uUpErr) console.error(uUpErr)
            db.get('SELECT id FROM club_memberships WHERE hunt_club_id = ? AND user_id = ?', [clubId, userId], (mErr, mRow) => {
              if (mErr) { console.error(mErr); return res.status(500).json({ message: 'Server error' }) }
              if (mRow) return res.status(200).json({ id: userId })
              const memStmt = db.prepare('INSERT INTO club_memberships (hunt_club_id, user_id, role) VALUES (?, ?, ?)')
              memStmt.run(clubId, userId, 'member', function (inErr) {
                if (inErr) { console.error(inErr); return res.status(500).json({ message: 'Server error' }) }
                return res.json({ id: userId })
              })
            })
          })
      }
    })
  })
})

// List members for a specific hunt club
router.get('/accounts/:accountId/huntclubs/:clubId/members', authenticate, (req, res) => {
  const { accountId, clubId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  // ensure club belongs to account
  db.get('SELECT id FROM hunt_clubs WHERE id = ? AND account_id = ?', [clubId, accountId], (cErr, cRow) => {
    if (cErr) { console.error(cErr); return res.status(500).json({ message: 'Server error' }) }
    if (!cRow) return res.status(404).json({ message: 'Hunt club not found' })

    db.all(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              u.address, u.city, u.state, u.zip, u.age,
              u.hunter_safety_completed, u.hunt_club_bylaws_signed
       FROM club_memberships cm JOIN users u ON u.id = cm.user_id
       WHERE cm.hunt_club_id = ?`,
      [clubId],
      (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
        res.json({ members: rows })
      }
    )
  })
})

// Assign a member to a property
// Assign a member to a property (ensure member belongs to same hunt club)
router.post('/accounts/:accountId/properties/:propertyId/assign', authenticate, (req, res) => {
  const { accountId, propertyId } = req.params
  const { userId } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!userId) return res.status(400).json({ message: 'userId required' })

  // verify property belongs to account and find its hunt_club_id
  db.get('SELECT id, hunt_club_id FROM properties WHERE id = ? AND account_id = ?', [propertyId, accountId], (pErr, pRow) => {
    if (pErr) {
      console.error(pErr)
      return res.status(500).json({ message: 'Server error' })
    }
    if (!pRow) return res.status(404).json({ message: 'Property not found' })

    const huntClubId = pRow.hunt_club_id

    if (huntClubId) {
      // ensure user is a member of that hunt club
      db.get('SELECT id FROM club_memberships WHERE hunt_club_id = ? AND user_id = ?', [huntClubId, userId], (cmErr, cmRow) => {
        if (cmErr) { console.error(cmErr); return res.status(500).json({ message: 'Server error' }) }
        if (!cmRow) return res.status(403).json({ message: 'User is not a member of the hunt club for this property' })

        const stmt = db.prepare('INSERT INTO property_assignments (property_id, user_id) VALUES (?, ?)')
        stmt.run(propertyId, userId, function (err) {
          if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Server error' })
          }
          res.json({ id: this.lastID })
        })
      })
    } else {
      // property not associated with hunt club — legacy account-level property: allow assignment if user is account member
      db.get('SELECT id FROM account_memberships WHERE account_id = ? AND user_id = ?', [accountId, userId], (amErr, amRow) => {
        if (amErr) { console.error(amErr); return res.status(500).json({ message: 'Server error' }) }
        if (!amRow) return res.status(403).json({ message: 'User is not a member of the account' })
        const stmt = db.prepare('INSERT INTO property_assignments (property_id, user_id) VALUES (?, ?)')
        stmt.run(propertyId, userId, function (err) {
          if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Server error' })
          }
          res.json({ id: this.lastID })
        })
      })
    }
  })
})

// Property detail: info + stands + plots + members + assignments
router.get('/accounts/:accountId/properties/:propertyId', authenticate, (req, res) => {
  const { accountId, propertyId } = req.params
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })

  db.get('SELECT * FROM properties WHERE id = ? AND account_id = ?', [propertyId, accountId], (pErr, property) => {
    if (pErr) { console.error(pErr); return res.status(500).json({ message: 'Server error' }) }
    if (!property) return res.status(404).json({ message: 'Property not found' })

    // get stands
    db.all('SELECT id, name, description, created_at FROM stands WHERE property_id = ?', [propertyId], (sErr, stands) => {
      if (sErr) { console.error(sErr); return res.status(500).json({ message: 'Server error' }) }

      // get plots
      db.all('SELECT id, name, description, created_at FROM food_plots WHERE property_id = ?', [propertyId], (fErr, plots) => {
        if (fErr) { console.error(fErr); return res.status(500).json({ message: 'Server error' }) }

        // get account members
        db.all(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
                  u.address, u.city, u.state, u.zip, u.age,
                  u.hunter_safety_completed, u.hunt_club_bylaws_signed
           FROM account_memberships m JOIN users u ON u.id = m.user_id
           WHERE m.account_id = ?`,
          [accountId],
          (mErr, accountMembers) => {
            if (mErr) { console.error(mErr); return res.status(500).json({ message: 'Server error' }) }

            // if property has hunt_club_id, include club members too
            if (property.hunt_club_id) {
              db.all(
                `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
                        u.address, u.city, u.state, u.zip, u.age,
                        u.hunter_safety_completed, u.hunt_club_bylaws_signed
                 FROM club_memberships cm JOIN users u ON u.id = cm.user_id
                 WHERE cm.hunt_club_id = ?`,
                [property.hunt_club_id],
                (cmErr, clubMembers) => {
                  if (cmErr) { console.error(cmErr); return res.status(500).json({ message: 'Server error' }) }
                  // merge members (by id)
                  const membersMap = {}
                  ;(accountMembers || []).forEach(x => membersMap[x.id] = x)
                  ;(clubMembers || []).forEach(x => membersMap[x.id] = x)
                  const members = Object.values(membersMap)

                  // get assignments for stands, plots, and property-level assignments
                  db.all('SELECT * FROM stand_assignments WHERE stand_id IN (SELECT id FROM stands WHERE property_id = ?)', [propertyId], (saErr, standAssignments) => {
                    if (saErr) { console.error(saErr); return res.status(500).json({ message: 'Server error' }) }
                    db.all('SELECT * FROM plot_assignments WHERE plot_id IN (SELECT id FROM food_plots WHERE property_id = ?)', [propertyId], (paErr, plotAssignments) => {
                      if (paErr) { console.error(paErr); return res.status(500).json({ message: 'Server error' }) }
                      db.all('SELECT * FROM property_assignments WHERE property_id = ?', [propertyId], (pErr2, propertyAssignments) => {
                        if (pErr2) { console.error(pErr2); return res.status(500).json({ message: 'Server error' }) }
                        res.json({ property, stands, plots, members, stand_assignments: standAssignments, plot_assignments: plotAssignments, property_assignments: propertyAssignments })
                      })
                    })
                  })
                }
              )
            } else {
              const members = accountMembers || []
              db.all('SELECT * FROM stand_assignments WHERE stand_id IN (SELECT id FROM stands WHERE property_id = ?)', [propertyId], (saErr, standAssignments) => {
                if (saErr) { console.error(saErr); return res.status(500).json({ message: 'Server error' }) }
                db.all('SELECT * FROM plot_assignments WHERE plot_id IN (SELECT id FROM food_plots WHERE property_id = ?)', [propertyId], (paErr, plotAssignments) => {
                  if (paErr) { console.error(paErr); return res.status(500).json({ message: 'Server error' }) }
                  db.all('SELECT * FROM property_assignments WHERE property_id = ?', [propertyId], (pErr2, propertyAssignments) => {
                    if (pErr2) { console.error(pErr2); return res.status(500).json({ message: 'Server error' }) }
                    res.json({ property, stands, plots, members, stand_assignments: standAssignments, plot_assignments: plotAssignments, property_assignments: propertyAssignments })
                  })
                })
              })
            }
          }
        )
      })
    })
  })
})

// Create a stand under a property
router.post('/accounts/:accountId/properties/:propertyId/stands', authenticate, (req, res) => {
  const { accountId, propertyId } = req.params
  const { name, description } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name) return res.status(400).json({ message: 'name required' })

  db.get('SELECT id FROM properties WHERE id = ? AND account_id = ?', [propertyId, accountId], (pErr, pRow) => {
    if (pErr) { console.error(pErr); return res.status(500).json({ message: 'Server error' }) }
    if (!pRow) return res.status(404).json({ message: 'Property not found' })

    const stmt = db.prepare('INSERT INTO stands (property_id, name, description) VALUES (?, ?, ?)')
    stmt.run(propertyId, name, description || null, function (err) {
      if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
      res.json({ id: this.lastID })
    })
  })
})

// Create a food plot under a property
router.post('/accounts/:accountId/properties/:propertyId/foodplots', authenticate, (req, res) => {
  const { accountId, propertyId } = req.params
  const { name, description } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!name) return res.status(400).json({ message: 'name required' })

  db.get('SELECT id FROM properties WHERE id = ? AND account_id = ?', [propertyId, accountId], (pErr, pRow) => {
    if (pErr) { console.error(pErr); return res.status(500).json({ message: 'Server error' }) }
    if (!pRow) return res.status(404).json({ message: 'Property not found' })

    const stmt = db.prepare('INSERT INTO food_plots (property_id, name, description) VALUES (?, ?, ?)')
    stmt.run(propertyId, name, description || null, function (err) {
      if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
      res.json({ id: this.lastID })
    })
  })
})

// Assign a member to a stand
router.post('/accounts/:accountId/stands/:standId/assign', authenticate, (req, res) => {
  const { accountId, standId } = req.params
  const { userId } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!userId) return res.status(400).json({ message: 'userId required' })

  // verify stand belongs to a property for this account
  db.get('SELECT s.id, p.hunt_club_id FROM stands s JOIN properties p ON p.id = s.property_id WHERE s.id = ? AND p.account_id = ?', [standId, accountId], (err, row) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
    if (!row) return res.status(404).json({ message: 'Stand not found' })

    const huntClubId = row.hunt_club_id
    if (huntClubId) {
      db.get('SELECT id FROM club_memberships WHERE hunt_club_id = ? AND user_id = ?', [huntClubId, userId], (cmErr, cmRow) => {
        if (cmErr) { console.error(cmErr); return res.status(500).json({ message: 'Server error' }) }
        if (!cmRow) return res.status(403).json({ message: 'User is not a member of the hunt club for this stand' })
        const stmt = db.prepare('INSERT INTO stand_assignments (stand_id, user_id) VALUES (?, ?)')
        stmt.run(standId, userId, function (inErr) {
          if (inErr) { console.error(inErr); return res.status(500).json({ message: 'Server error' }) }
          res.json({ id: this.lastID })
        })
      })
    } else {
      db.get('SELECT id FROM account_memberships WHERE account_id = ? AND user_id = ?', [accountId, userId], (amErr, amRow) => {
        if (amErr) { console.error(amErr); return res.status(500).json({ message: 'Server error' }) }
        if (!amRow) return res.status(403).json({ message: 'User is not a member of the account' })
        const stmt = db.prepare('INSERT INTO stand_assignments (stand_id, user_id) VALUES (?, ?)')
        stmt.run(standId, userId, function (inErr) {
          if (inErr) { console.error(inErr); return res.status(500).json({ message: 'Server error' }) }
          res.json({ id: this.lastID })
        })
      })
    }
  })
})

// Assign a member to a food plot
router.post('/accounts/:accountId/foodplots/:plotId/assign', authenticate, (req, res) => {
  const { accountId, plotId } = req.params
  const { userId } = req.body
  if (req.auth.accountId !== accountId) return res.status(403).json({ message: 'Forbidden' })
  if (!userId) return res.status(400).json({ message: 'userId required' })

  db.get('SELECT fp.id, p.hunt_club_id FROM food_plots fp JOIN properties p ON p.id = fp.property_id WHERE fp.id = ? AND p.account_id = ?', [plotId, accountId], (err, row) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Server error' }) }
    if (!row) return res.status(404).json({ message: 'Food plot not found' })

    const huntClubId = row.hunt_club_id
    if (huntClubId) {
      db.get('SELECT id FROM club_memberships WHERE hunt_club_id = ? AND user_id = ?', [huntClubId, userId], (cmErr, cmRow) => {
        if (cmErr) { console.error(cmErr); return res.status(500).json({ message: 'Server error' }) }
        if (!cmRow) return res.status(403).json({ message: 'User is not a member of the hunt club for this plot' })
        const stmt = db.prepare('INSERT INTO plot_assignments (plot_id, user_id) VALUES (?, ?)')
        stmt.run(plotId, userId, function (inErr) {
          if (inErr) { console.error(inErr); return res.status(500).json({ message: 'Server error' }) }
          res.json({ id: this.lastID })
        })
      })
    } else {
      db.get('SELECT id FROM account_memberships WHERE account_id = ? AND user_id = ?', [accountId, userId], (amErr, amRow) => {
        if (amErr) { console.error(amErr); return res.status(500).json({ message: 'Server error' }) }
        if (!amRow) return res.status(403).json({ message: 'User is not a member of the account' })
        const stmt = db.prepare('INSERT INTO plot_assignments (plot_id, user_id) VALUES (?, ?)')
        stmt.run(plotId, userId, function (inErr) {
          if (inErr) { console.error(inErr); return res.status(500).json({ message: 'Server error' }) }
          res.json({ id: this.lastID })
        })
      })
    }
  })
})

module.exports = router

