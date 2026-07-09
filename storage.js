const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DATA_FILE = path.join(__dirname, 'data', 'testimonials.json');
const MONGO_URI = process.env.MONGODB_URI;

let mongoCollection = null;

const SEED_DATA = [
  {
    id: 'seed-1', name: 'Surya Pratap Singh', city: 'Lucknow', rating: 5,
    message: "The technicians arrived on schedule and completed the installation in a single day. The system looks clean and works perfectly. Worth every penny.",
    status: 'approved', createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'seed-2', name: 'Sagar Sharma', city: 'Roorkee', rating: 5,
    message: "We've been using our solar system for over six months now, and it's performing exactly as promised. The after-sales support has been excellent.",
    status: 'approved', createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'seed-3', name: 'Abhishek Gupta', city: 'Ayodhya', rating: 4,
    message: "Very professional and knowledgeable staff. The installation was neat, and they handled all the paperwork smoothly. Great experience overall.",
    status: 'approved', createdAt: '2026-01-20T10:00:00.000Z'
  },
  {
    id: 'seed-4', name: 'Shivam Maurya', city: 'Lakhimpur Kheri', rating: 5,
    message: "Excellent service from consultation to installation. The team explained everything clearly, completed the work on time, and the solar system has significantly reduced our electricity bills. Highly recommended!",
    status: 'approved', createdAt: '2026-01-25T10:00:00.000Z'
  }
];

// ---------- init ----------
async function initStorage() {
  if (MONGO_URI) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('parvat_solar');
    mongoCollection = db.collection('testimonials');
    const count = await mongoCollection.countDocuments();
    if (count === 0) {
      await mongoCollection.insertMany(SEED_DATA);
    }
    console.log('Storage: connected to MongoDB Atlas (persistent).');
  } else {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2));
    }
    console.log('Storage: using local JSON file (data resets on host restart - fine for local testing only).');
  }
}

// ---------- local JSON helpers ----------
function readJSON() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}
function writeJSON(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// ---------- public API (used by server.js) ----------
async function getAll() {
  if (mongoCollection) {
    return mongoCollection.find({}).toArray();
  }
  return readJSON();
}

async function addTestimonial(entry) {
  if (mongoCollection) {
    await mongoCollection.insertOne(entry);
  } else {
    const list = readJSON();
    list.push(entry);
    writeJSON(list);
  }
}

async function setStatus(id, status) {
  if (mongoCollection) {
    const result = await mongoCollection.updateOne({ id }, { $set: { status } });
    return result.matchedCount > 0;
  }
  const list = readJSON();
  const entry = list.find(t => t.id === id);
  if (!entry) return false;
  entry.status = status;
  writeJSON(list);
  return true;
}

async function deleteTestimonial(id) {
  if (mongoCollection) {
    await mongoCollection.deleteOne({ id });
    return;
  }
  const list = readJSON().filter(t => t.id !== id);
  writeJSON(list);
}

module.exports = { initStorage, getAll, addTestimonial, setStatus, deleteTestimonial };
