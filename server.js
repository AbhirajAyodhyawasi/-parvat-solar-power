const express = require('express');
const path = require('path');
const crypto = require('crypto');
const storage = require('./storage');
const mailer = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Set this via environment variable in production (Render > Environment).
// Falls back to a default only for local testing - CHANGE THIS before going live.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function checkAdminAuth(req, res, next) {
  const password = req.headers['x-admin-password'] || req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  next();
}

// =========================================================
// TESTIMONIALS
// =========================================================

// Get approved testimonials only (used by the main site)
app.get('/api/testimonials', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const list = await storage.getAll('testimonials');
    const approved = list
      .filter(t => t.status === 'approved')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(approved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load testimonials.' });
  }
});

// Submit a new testimonial (goes in as "pending")
app.post('/api/testimonials', async (req, res) => {
  const { name, city, rating, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required.' });
  }

  const newEntry = {
    id: crypto.randomUUID(),
    name: String(name).trim().slice(0, 100),
    city: city ? String(city).trim().slice(0, 100) : '',
    rating: Math.min(5, Math.max(0, parseInt(rating) || 0)),
    message: String(message).trim().slice(0, 1000),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await storage.addItem('testimonials', newEntry);
    res.json({ success: true, message: 'Testimonial submitted for approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit testimonial.' });
  }
});

app.get('/api/admin/testimonials', checkAdminAuth, async (req, res) => {
  const list = (await storage.getAll('testimonials')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.post('/api/admin/testimonials/:id/approve', checkAdminAuth, async (req, res) => {
  const ok = await storage.setStatus('testimonials', req.params.id, 'approved');
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.post('/api/admin/testimonials/:id/reject', checkAdminAuth, async (req, res) => {
  const ok = await storage.setStatus('testimonials', req.params.id, 'rejected');
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/admin/testimonials/:id', checkAdminAuth, async (req, res) => {
  await storage.deleteItem('testimonials', req.params.id);
  res.json({ success: true });
});

// =========================================================
// CONSULTATION LEADS (from the "Get a Free Solar Consultation" form)
// =========================================================

// Submit a new consultation request - saves it AND emails the admin
app.post('/api/leads', async (req, res) => {
  const { name, phone, email, city, service, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const newLead = {
    id: crypto.randomUUID(),
    name: String(name).trim().slice(0, 100),
    phone: String(phone).trim().slice(0, 30),
    email: email ? String(email).trim().slice(0, 150) : '',
    city: city ? String(city).trim().slice(0, 100) : '',
    service: service ? String(service).trim().slice(0, 150) : '',
    message: message ? String(message).trim().slice(0, 1000) : '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  try {
    await storage.addItem('leads', newLead);
    mailer.sendLeadNotification(newLead); // fire-and-forget, won't block the response
    res.json({ success: true, message: 'Consultation request received.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit request.' });
  }
});

app.get('/api/admin/leads', checkAdminAuth, async (req, res) => {
  const list = (await storage.getAll('leads')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// status: 'new' | 'contacted' | 'closed'
app.post('/api/admin/leads/:id/status', checkAdminAuth, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const ok = await storage.setStatus('leads', req.params.id, status);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/admin/leads/:id', checkAdminAuth, async (req, res) => {
  await storage.deleteItem('leads', req.params.id);
  res.json({ success: true });
});

storage.initStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Parvat Solar Power server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize storage:', err);
  process.exit(1);
});
