require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Vercel functions may only write temporarily under /tmp. Local development
// keeps using Backend/uploads as before.
const uploadsPath = process.env.VERCEL ? path.join('/tmp', 'muktinath-uploads') : path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsPath, { recursive: true });
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsPath),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
});
app.use('/uploads', express.static(uploadsPath));

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'kalpana-admin-token';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'kalpana';
const collectionName = process.env.MONGODB_COLLECTION || 'products';

const ORDER_STATUSES = ['Payment Verification', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_VERIFICATION_STATUSES = ['Awaiting review', 'Verified', 'Not verified', 'Not required'];
const SHIPPING_FEE = 100;
const FREE_SHIPPING_THRESHOLD = 3000;

const sampleProducts = [
  {
    name: 'Glow Radiance Cream',
    category: 'Face Care',
    price: 499,
    currency: 'NPR',
    short: 'Lightweight glow moisturizer for daily use.',
    description: 'This all-day moisturizer hydrates and adds subtle glow while keeping skin soft.',
    ingredients: ['Aloe Vera', 'Shea Butter', 'Vitamin E', 'Sunflower Oil'],
    stock: 20,
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80'
  },
  {
    name: 'Rose Lip Balm',
    category: 'Lips',
    price: 220,
    currency: 'NPR',
    short: 'Soft rose tinted lip balm keeps your lips smooth and hydrated.',
    description: 'A nourishing lip balm with natural rose extract and vitamin E.',
    ingredients: ['Coconut Oil', 'Beeswax', 'Rose Extract', 'Vitamin E'],
    stock: 35,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80'
  },
  {
    name: 'Herbal Facial Wash',
    category: 'Face Cleanser',
    price: 320,
    currency: 'NPR',
    short: 'Gentle cleanser with herbal extracts for glowing skin.',
    description: 'A gentle foaming facial wash with neem and tea tree.',
    ingredients: ['Neem', 'Tea Tree', 'Green Tea', 'Glycerin'],
    stock: 15,
    image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=700&q=80'
  },
  {
    name: 'Botanical Shampoo',
    category: 'Shampoo',
    price: 350,
    currency: 'NPR',
    short: 'Nourishing botanical shampoo for soft, shiny hair.',
    description: 'A mild shampoo formulated with herbal extracts for daily use.',
    ingredients: ['Aloe Vera', 'Coconut Oil', 'Keratin'],
    stock: 25,
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=700&q=80'
  },
  {
    name: 'Keratin Repair Serum',
    category: 'Keratin',
    price: 540,
    currency: 'NPR',
    short: 'Repair and strengthen hair with keratin serum.',
    description: 'Lightweight keratin formula to restore shine and reduce breakage.',
    ingredients: ['Keratin', 'Argan Oil', 'Silk Protein'],
    stock: 18,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80'
  },
  {
    name: 'Vitamin C Serum',
    category: 'Serum',
    price: 460,
    currency: 'NPR',
    short: 'Brightening serum for radiant skin.',
    description: 'Concentrated vitamin C serum for even skin tone and glow.',
    ingredients: ['Vitamin C', 'Hyaluronic Acid', 'Green Tea'],
    stock: 28,
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=700&q=80'
  }
];

let dbClient;
let productsCollection;
let categoriesCollection;
let usersCollection;
let ordersCollection;
let tiktokPostsCollection;
let dbConnectionPromise;

async function connectDb() {
  if (dbClient) return;
  if (dbConnectionPromise) return dbConnectionPromise;

  dbConnectionPromise = (async () => {
  const client = new MongoClient(mongoUri);
  await client.connect();
  dbClient = client;
  const db = client.db(dbName);
  productsCollection = db.collection(collectionName);
  categoriesCollection = db.collection('categories');
  usersCollection = db.collection('users');
  ordersCollection = db.collection('orders');
  tiktokPostsCollection = db.collection('tiktokPosts');

  // Clean duplicate category docs by name before creating unique index
  const categoryNames = await categoriesCollection.distinct('name');
  for (const name of categoryNames) {
    const docs = await categoriesCollection.find({ name }).project({ _id: 1 }).toArray();
    if (docs.length > 1) {
      const keep = docs[0]._id;
      const removeIds = docs.slice(1).map((d) => d._id);
      await categoriesCollection.deleteMany({ _id: { $in: removeIds } });
    }
  }
  await categoriesCollection.createIndex({ name: 1 }, { unique: true, background: true });
  await usersCollection.createIndex({ email: 1 }, { unique: true, background: true });
  await usersCollection.createIndex({ token: 1 }, { background: true });
  await ordersCollection.createIndex({ userId: 1 }, { background: true });
  await tiktokPostsCollection.createIndex({ createdAt: -1 }, { background: true });
  await tiktokPostsCollection.createIndex({ url: 1 }, { unique: true, background: true });

  const defaultCategories = Array.from(new Set(sampleProducts.map((p) => p.category).filter(Boolean)));
  for (const name of defaultCategories) {
    await categoriesCollection.updateOne({ name }, { $set: { name } }, { upsert: true });
  }
  console.log('Upserted sample categories into MongoDB.');

  const count = await productsCollection.countDocuments();
  if (count === 0) {
    await productsCollection.insertMany(sampleProducts);
    console.log('Inserted sample products into MongoDB.');
  }

  console.log(`Connected to MongoDB: ${mongoUri}, db: ${dbName}, products: ${collectionName}, categories: categories`);
  })().catch((error) => {
    dbConnectionPromise = null;
    throw error;
  });

  return dbConnectionPromise;
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone || '' };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: dbName });
});

// ---------- Admin auth ----------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: ADMIN_TOKEN, username: ADMIN_USER });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/admin/check', (req, res) => {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_TOKEN}`) {
    return res.json({ authorized: true });
  }
  return res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  try {
    const [products, categories, orders, pendingOrders] = await Promise.all([
      productsCollection.countDocuments(),
      categoriesCollection.countDocuments(),
      ordersCollection.countDocuments(),
      ordersCollection.countDocuments({ status: 'Pending' })
    ]);
    res.json({ products, categories, orders, pendingOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load dashboard' });
  }
});

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_TOKEN}`) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// ---------- Customer auth ----------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await usersCollection.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(24).toString('hex');
    const user = {
      name: name.trim(),
      email: normalizedEmail,
      phone: (phone || '').trim(),
      passwordHash,
      token,
      createdAt: new Date()
    };
    const result = await usersCollection.insertOne(user);
    user._id = result.insertedId;
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersCollection.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await usersCollection.updateOne({ _id: user._id }, { $set: { token } });
    user.token = token;
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to login' });
  }
});

app.post('/api/auth/demo-login', async (_req, res) => {
  try {
    const email = 'customer@muktinath.com';
    let user = await usersCollection.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash('customer123', 10);
      user = { name: 'Demo Customer', email, phone: '9800000000', passwordHash, token: crypto.randomBytes(24).toString('hex'), createdAt: new Date() };
      user._id = (await usersCollection.insertOne(user)).insertedId;
    } else {
      user.token = crypto.randomBytes(24).toString('hex');
      await usersCollection.updateOne({ _id: user._id }, { $set: { token: user.token } });
    }
    res.json({ token: user.token, user: publicUser(user) });
  } catch (error) { res.status(500).json({ error: 'Unable to start demo account' }); }
});

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Login required' });
    }
    const user = await usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Auth check failed' });
  }
}

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// ---------- TikTok videos ----------

function isTikTokHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'tiktok.com' || host.endsWith('.tiktok.com');
}

function getTikTokVideoId(value) {
  try {
    const parsed = new URL(value);
    if (!isTikTokHost(parsed.hostname)) return null;
    return parsed.pathname.match(/(?:video|v)\/(\d+)/)?.[1]
      || parsed.pathname.match(/\/(\d+)(?:\/)?$/)?.[1]
      || null;
  } catch (error) {
    return null;
  }
}

async function getTikTokEmbedUrl(value) {
  const sourceUrl = String(value || '').trim();
  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch (error) {
    return null;
  }

  if (!isTikTokHost(parsed.hostname)) return null;

  let videoId = getTikTokVideoId(sourceUrl);
  if (!videoId) {
    try {
      // TikTok's vt/vm links redirect to the full post URL. Only an approved
      // TikTok host can be requested, so a submitted URL cannot be used as a proxy.
      const response = await fetch(sourceUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      videoId = getTikTokVideoId(response.url);
    } catch (error) {
      return null;
    }
  }

  return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
}

function publicTikTokPost(post) {
  return {
    id: post._id,
    url: post.url,
    embedUrl: post.embedUrl || (getTikTokVideoId(post.url) ? `https://www.tiktok.com/embed/v2/${getTikTokVideoId(post.url)}` : null),
    createdAt: post.createdAt
  };
}

app.get('/api/tiktok-posts', async (_req, res) => {
  try {
    const posts = await tiktokPostsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(posts.map(publicTikTokPost));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch TikTok videos' });
  }
});

app.get('/api/admin/tiktok-posts', requireAdmin, async (_req, res) => {
  try {
    const posts = await tiktokPostsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(posts.map(publicTikTokPost));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch TikTok videos' });
  }
});

app.post('/api/admin/tiktok-posts', requireAdmin, async (req, res) => {
  try {
    const url = String(req.body.url || '').trim();
    const embedUrl = await getTikTokEmbedUrl(url);
    if (!embedUrl) return res.status(400).json({ error: 'Use a TikTok video link. Short vt.tiktok.com links are accepted, but the link must open to a public video.' });
    const post = { url, embedUrl, createdAt: new Date() };
    const result = await tiktokPostsCollection.insertOne(post);
    res.status(201).json({ id: result.insertedId, ...post });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'This TikTok video is already listed' });
    console.error(error);
    res.status(500).json({ error: 'Unable to add TikTok video' });
  }
});

app.delete('/api/admin/tiktok-posts/:id', requireAdmin, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid TikTok video id' });
    const result = await tiktokPostsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: 'TikTok video not found' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to remove TikTok video' });
  }
});

// ---------- Products ----------

app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    if (category && category.trim() && category.trim().toLowerCase() !== 'all beauty') {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    const products = await productsCollection.find(filter, { projection: { name: 1, category: 1, price: 1, currency: 1, short: 1, image: 1, stock: 1 } }).toArray();
    const summary = products.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      currency: p.currency,
      short: p.short,
      image: p.image,
      stock: p.stock
    }));
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      short: product.short,
      description: product.description,
      ingredients: product.ingredients,
      stock: product.stock,
      image: product.image
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch product' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await categoriesCollection.distinct('name');
    res.json(Array.from(new Set(categories)).sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch categories' });
  }
});

app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const categoryName = name.trim();
    const existing = await categoriesCollection.findOne({ name: categoryName });
    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    await categoriesCollection.insertOne({ name: categoryName });
    res.status(201).json({ name: categoryName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create category' });
  }
});

app.put('/api/categories/:name', requireAdmin, async (req, res) => {
  try {
    const currentName = decodeURIComponent(req.params.name).trim();
    const nextName = (req.body.name || '').trim();
    if (!currentName || !nextName) return res.status(400).json({ error: 'Category name is required' });
    if (currentName === nextName) return res.json({ name: nextName });
    if (await categoriesCollection.findOne({ name: nextName })) {
      return res.status(409).json({ error: 'A category with that name already exists' });
    }
    const result = await categoriesCollection.updateOne({ name: currentName }, { $set: { name: nextName } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Category not found' });
    await productsCollection.updateMany({ category: currentName }, { $set: { category: nextName } });
    res.json({ name: nextName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update category' });
  }
});

app.delete('/api/categories/:name', requireAdmin, async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    const productCount = await productsCollection.countDocuments({ category: name });
    if (productCount) return res.status(409).json({ error: 'Move or delete products in this category first' });
    const result = await categoriesCollection.deleteOne({ name });
    if (!result.deletedCount) return res.status(404).json({ error: 'Category not found' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete category' });
  }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, currency, short, description, ingredients, stock, image } = req.body;
    if (!name || !category || !price || !short || !description || !image) {
      return res.status(400).json({ error: 'Name, category, price, short, description and image are required' });
    }
    const categoryName = category.trim();
    const product = {
      name: name.trim(),
      category: categoryName,
      price: Number(price),
      currency: currency || 'NPR',
      short: short.trim(),
      description: description.trim(),
      ingredients: Array.isArray(ingredients) ? ingredients : typeof ingredients === 'string' ? ingredients.split(',').map((i) => i.trim()).filter(Boolean) : [],
      stock: Number(stock) || 0,
      image: image.trim()
    };
    await categoriesCollection.updateOne(
      { name: categoryName },
      { $setOnInsert: { name: categoryName } },
      { upsert: true }
    );
    const result = await productsCollection.insertOne(product);
    res.status(201).json({ id: result.insertedId, ...product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create product' });
  }
});

app.post('/api/uploads/product-image', requireAdmin, imageUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose a JPG, PNG, WEBP, or GIF image (maximum 5 MB)' });
  res.status(201).json({ image: `/uploads/${req.file.filename}` });
});

app.post('/api/uploads/payment-proof', requireAuth, imageUpload.single('proof'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose a JPG, PNG, WEBP, or GIF image (maximum 5 MB)' });
  res.status(201).json({ image: `/uploads/${req.file.filename}` });
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product id' });
    const { name, category, price, currency, short, description, ingredients, stock, image } = req.body;
    if (!name || !category || price === undefined || !short || !description || !image) {
      return res.status(400).json({ error: 'Name, category, price, short, description and image are required' });
    }
    const product = {
      name: name.trim(), category: category.trim(), price: Number(price), currency: currency || 'NPR',
      short: short.trim(), description: description.trim(),
      ingredients: Array.isArray(ingredients) ? ingredients : String(ingredients || '').split(',').map((i) => i.trim()).filter(Boolean),
      stock: Number(stock) || 0, image: image.trim()
    };
    await categoriesCollection.updateOne({ name: product.category }, { $setOnInsert: { name: product.category } }, { upsert: true });
    const result = await productsCollection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: product }, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json({ id: result._id, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid product id' });
    const result = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: 'Product not found' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
});

// ---------- Orders ----------

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentProof } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.address) {
      return res.status(400).json({ error: 'Full shipping address is required' });
    }
    const isOnlinePayment = ['eSewa', 'Bank'].includes(paymentMethod);
    if (isOnlinePayment && (!paymentProof || !String(paymentProof).startsWith('/uploads/'))) {
      return res.status(400).json({ error: 'A payment proof is required for eSewa and bank transfer orders' });
    }

    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      if (!item.id || !ObjectId.isValid(item.id)) {
        return res.status(400).json({ error: 'Invalid item in cart' });
      }
      const product = await productsCollection.findOne({ _id: new ObjectId(item.id) });
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item.id}` });
      }
      const qty = Math.max(1, Number(item.qty) || 1);
      const lineTotal = product.price * qty;
      subtotal += lineTotal;
      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        currency: product.currency,
        qty
      });
    }

    for (const item of orderItems) {
      await productsCollection.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
    }

    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shippingFee;

    const order = {
      userId: req.user._id,
      customerName: shippingAddress.fullName.trim(),
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      currency: orderItems[0].currency || 'NPR',
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        city: shippingAddress.city.trim(),
        address: shippingAddress.address.trim(),
        notes: (shippingAddress.notes || '').trim()
      },
      paymentMethod: ['COD', 'eSewa', 'Bank'].includes(paymentMethod) ? paymentMethod : 'COD',
      paymentProof: isOnlinePayment ? String(paymentProof) : null,
      paymentVerification: isOnlinePayment ? 'Awaiting review' : 'Not required',
      status: isOnlinePayment ? 'Payment Verification' : 'Pending',
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(order);
    res.status(201).json({ id: result.insertedId, ...order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to place order' });
  }
});

app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await ordersCollection.find({ userId: req.user._id }).sort({ createdAt: -1 }).toArray();
    res.json(orders.map((o) => ({ id: o._id, ...o })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch orders' });
  }
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    const order = await ordersCollection.findOne({ _id: new ObjectId(id), userId: req.user._id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ id: order._id, ...order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch order' });
  }
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(orders.map((o) => ({ id: o._id, ...o })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch orders' });
  }
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentVerification } = req.body;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    const updates = {};
    if (status !== undefined) {
      if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid order status' });
      updates.status = status;
    }
    if (paymentVerification !== undefined) {
      if (!PAYMENT_VERIFICATION_STATUSES.includes(paymentVerification)) return res.status(400).json({ error: 'Invalid payment status' });
      updates.paymentVerification = paymentVerification;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Choose an order or payment status to update' });
    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ id: result._id, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update order' });
  }
});

// Keep the traditional local server, but export the Express app for Vercel's
// /api function. Vercel invokes the function and must not call app.listen().
if (require.main === module) {
  const frontendPath = path.join(__dirname, '..', 'Frontend');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

  const port = process.env.PORT || 5000;
  connectDb()
    .then(() => {
      app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err);
      process.exit(1);
    });
}

module.exports = { app, connectDb };
