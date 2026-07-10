const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DATA_DIR = path.join(__dirname, 'data');
const MONGO_URI = process.env.MONGODB_URI;

let mongoDb = null;
const collections = {}; // cache of mongo collection handles, keyed by name

const TESTIMONIAL_SEED = [
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

const SEEDS = {
  testimonials: TESTIMONIAL_SEED,
  leads: []
};

function dataFile(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

// ---------- init ----------
async function initStorage() {
  if (MONGO_URI) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    mongoDb = client.db('parvat_solar');
    for (const name of Object.keys(SEEDS)) {
      const col = mongoDb.collection(name);
      collections[name] = col;
      const count = await col.countDocuments();
      if (count === 0 && SEEDS[name].length > 0) {
        await col.insertMany(SEEDS[name]);
      }
    }
    console.log('Storage: connected to MongoDB Atlas (persistent).');
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    for (const name of Object.keys(SEEDS)) {
      const file = dataFile(name);
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(SEEDS[name], null, 2));
      }
    }
    console.log('Storage: using local JSON files (data resets on host restart - fine for local testing only).');
  }
}

// ---------- local JSON helpers ----------
function readJSON(name) {
  try {
    return JSON.parse(fs.readFileSync(dataFile(name), 'utf-8'));
  } catch (err) {
    return [];
  }
}
function writeJSON(name, list) {
  fs.writeFileSync(dataFile(name), JSON.stringify(list, null, 2), 'utf-8');
}

// ---------- generic collection API (used by server.js) ----------
// `name` is the collection name, e.g. 'testimonials' or 'leads'
async function getAll(name) {
  if (mongoDb) {
    return collections[name].find({}).toArray();
  }
  return readJSON(name);
}

async function addItem(name, entry) {
  if (mongoDb) {
    await collections[name].insertOne(entry);
  } else {
    const list = readJSON(name);
    list.push(entry);
    writeJSON(name, list);
  }
}

async function setStatus(name, id, status) {
  if (mongoDb) {
    const result = await collections[name].updateOne({ id }, { $set: { status } });
    return result.matchedCount > 0;
  }
  const list = readJSON(name);
  const entry = list.find(t => t.id === id);
  if (!entry) return false;
  entry.status = status;
  writeJSON(name, list);
  return true;
}

async function deleteItem(name, id) {
  if (mongoDb) {
    await collections[name].deleteOne({ id });
    return;
  }
  const list = readJSON(name).filter(t => t.id !== id);
  writeJSON(name, list);
}

module.exports = { initStorage, getAll, addItem, setStatus, deleteItem };
