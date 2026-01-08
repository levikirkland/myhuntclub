const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const authRoutes = require('./routes/auth')
const accountRoutes = require('./routes/account')
const path = require('path')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/api', authRoutes)
app.use('/api', accountRoutes)

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
