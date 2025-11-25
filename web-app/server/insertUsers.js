import dotenv from "dotenv";
dotenv.config();

import appDB from "./db/subsyncDB.js";
import bcrypt from "bcrypt";

// Example user data
const users = [
  {
    username: "Athish",
    name: "Athish",
    password: "password",
    role: "Admin",
    email: "athish@ocsindia.net",
    is_active: true,
  },
  {
    username: "Krish",
    name: "Manager User",
    password: "krish7",
    role: "User",
    email: "krish7@gmail.com",
    is_active: true,
  },
  {
    username: "user1",
    name: "Normal User",
    password: "userpass",
    role: "User",
    email: "user1@example.com",
    is_active: true,
  },
];

async function insertUsers() {
  for (const user of users) {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert into the database
      const [roleRows] = await appDB.query(
        `SELECT id, name FROM roles WHERE role_key = ? OR name = ? LIMIT 1`,
        [user.role.toLowerCase(), user.role]
      );
      const role = roleRows[0];
      await appDB.query(
        `INSERT INTO users (username, name, password, role, role_id, email, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.name,
          hashedPassword,
          role?.name || user.role,
          role?.id || null,
          user.email,
          user.is_active,
        ]
      );
      console.log(`Inserted user: ${user.username}`);
    } catch (err) {
      console.error(`Error inserting user ${user.username}:`, err.message);
    }
  }
  process.exit(0);
}

insertUsers();