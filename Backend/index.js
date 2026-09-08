require('dotenv').config();
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'kalpana-admin-token';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB || 'kalpana';
const collectionName = process.env.MONGODB_COLLECTION || 'products';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
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

async function connectDb() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  dbClient = client;
  const db = client.db(dbName);
  productsCollection = db.collection(collectionName);
  categoriesCollection = db.collection('categories');
  usersCollection = db.collection('users');
  ordersCollection = db.collection('orders');

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

// ---------- Orders ----------

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.address) {
      return res.status(400).json({ error: 'Full shipping address is required' });
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
      paymentMethod: ['COD', 'eSewa', 'Khalti'].includes(paymentMethod) ? paymentMethod : 'COD',
      status: 'Pending',
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
    const { status } = req.body;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
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

// The backend serves the storefront so the project only needs one server.
const frontendPath = path.join(__dirname, '..', 'frontend');
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
