// Adds sample listings so you can try the app. Run: npm run seed
import db from './db.js';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// [type, item, description, category, location, daysAgo, status]
const samples = [
  ['lost', 'Black Dell laptop charger', 'Black 65W charger with a small strip of blue tape near the plug.', 'Electronics', 'Library, 2nd floor study area', 1, 'open'],
  ['found', 'Blue steel water bottle', 'Dented blue bottle with a "Wanderer" sticker. Found on a bench.', 'Bottles & Lunch Boxes', 'Main quadrangle', 1, 'open'],
  ['lost', 'Hostel room keys', 'Three keys on a red ring with a tiny football keychain.', 'Keys', 'Cafeteria', 2, 'open'],
  ['found', 'Student ID card', 'ID card of a second-year student, found near the printer.', 'ID Cards', 'Computer lab 3', 2, 'open'],
  ['lost', 'Grey hoodie', 'Grey zip-up hoodie, size M, left on the back row after the evening lecture.', 'Clothing', 'Lecture Hall B', 4, 'open'],
  ['found', 'Casio scientific calculator', 'fx-991 calculator with initials scratched on the back.', 'Electronics', 'Exam hall corridor', 5, 'open'],
  ['lost', 'Brown leather wallet', 'Contains a bus pass and some cash. No ID.', 'Wallets & Cards', 'Bus stop near Gate 2', 8, 'open'],
  ['found', 'Black backpack', 'Backpack with notebooks inside. Kept with the security desk.', 'Bags', 'Sports complex', 12, 'closed'],
  ['lost', 'Prescription glasses', 'Round black frames in a green case.', 'Accessories', 'Auditorium', 20, 'closed'],
  ['found', 'Engineering Mathematics textbook', 'Has a name written on the first page.', 'Books & Stationery', 'Library reading room', 30, 'closed'],
];

const count = db.prepare('SELECT COUNT(*) AS n FROM listings').get().n;
if (count > 0 && !process.argv.includes('--force')) {
  console.log(`Database already has ${count} listings. Run with --force to add samples anyway.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO listings (type, item_name, description, category, location, date, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const [type, name, desc, cat, loc, ago, status] of samples) {
    const when = daysAgo(ago);
    insert.run(type, name, desc, cat, loc, when.toISOString().slice(0, 10), status, when.toISOString());
  }
})();

console.log(`Added ${samples.length} sample listings.`);
