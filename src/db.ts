import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { hashSync } from 'bcryptjs';
import 'dotenv/config';

let db: Database;

export async function openDb() {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || './db.sqlite';

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await migrate();
  await seed();

  console.log('Database connected and initialized.');
  return db;
}

async function migrate() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      passwordHash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS FeedbackForm (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isActive BOOLEAN NOT NULL,
      fields TEXT NOT NULL, -- Stored as JSON string
      FOREIGN KEY (createdBy) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS Feedback (
      id TEXT PRIMARY KEY,
      formId TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      rating INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      responses TEXT NOT NULL, -- Stored as JSON string
      FOREIGN KEY (formId) REFERENCES FeedbackForm(id)
    );
  `);
}

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@feedback.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password';

  const admin = await db.get('SELECT * FROM User WHERE email = ?', adminEmail);

  if (!admin) {
    console.log('Seeding admin user...');
    await db.run(
      `INSERT INTO User (id, email, name, role, passwordHash)
       VALUES (?, ?, ?, ?, ?)`,
      'admin-1',
      adminEmail,
      'Admin User',
      'admin',
      hashSync(adminPassword, 10)
    );
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  }
}
