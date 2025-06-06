const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = 'admin@1122'; // Change this to your actual password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed Password:', hashedPassword);
}

hashPassword();
