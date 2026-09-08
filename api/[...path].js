import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, connectDb } = require('../Backend/index.js');

export default async function handler(req, res) {
  try {
    await connectDb();
    return app(req, res);
  } catch (error) {
    console.error('Database connection failed', error);
    return res.status(500).json({ error: 'Unable to connect to the database' });
  }
}
