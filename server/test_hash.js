const bcrypt = require('bcryptjs');
const hash = '$2b$10$gxlPJDHG25gcyOzhaDAuyuRZGd5stGQBlIuEvl0AUSkMK8ZszwhGe'; // old hash
const password = 'password';

bcrypt.compare(password, hash).then(match => {
  console.log('Password matches old hash:', match);
});