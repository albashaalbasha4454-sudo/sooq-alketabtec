import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('sooq_al_ketab.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT -- 'admin' or 'cashier'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT, -- Can be Author or Brand/Manufacturer
    isbn TEXT UNIQUE,
    category_id INTEGER,
    purchase_price REAL,
    selling_price REAL,
    stock_quantity INTEGER,
    min_stock_level INTEGER DEFAULT 5,
    type TEXT DEFAULT 'book', -- 'book' or 'tech'
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact_person TEXT,
    phone TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    user_id INTEGER,
    total_amount REAL,
    tax_amount REAL,
    discount_amount REAL,
    payment_method TEXT, -- 'cash', 'card', 'debt'
    status TEXT, -- 'completed', 'pending', 'cancelled'
    order_type TEXT DEFAULT 'direct', -- 'direct', 'shipment', 'booking'
    shipping_address TEXT,
    shipping_cost REAL DEFAULT 0,
    source TEXT, -- 'whatsapp', 'facebook', 'instagram', 'other'
    shipment_status TEXT, -- 'to_be_processed', 'delivered', 'returned'
    customer_name TEXT,
    customer_phone TEXT,
    payment_status TEXT DEFAULT 'paid', -- 'paid', 'unpaid', 'partial'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    book_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    total_price REAL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    total_amount REAL,
    status TEXT, -- 'received', 'pending'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    book_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    amount REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cash_drawer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    opening_balance REAL,
    closing_balance REAL,
    actual_cash REAL,
    status TEXT, -- 'open', 'closed'
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    amount REAL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    to_account_id INTEGER, -- For transfers
    type TEXT, -- 'sale', 'expense', 'deposit', 'withdrawal', 'transfer'
    amount REAL,
    description TEXT,
    reference_id INTEGER, -- e.g., order_id or expense_id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS capital_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'deposit', 'withdrawal'
    amount REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial admin and cashier if not exists
const seedUsers = () => {
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'albasha.123', 'admin');
  }
  const cashier = db.prepare('SELECT * FROM users WHERE username = ?').get('cashier');
  if (!cashier) {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('cashier', '123', 'cashier');
  }
};

seedUsers();

const seedAccounts = () => {
  const mainTreasury = db.prepare('SELECT * FROM accounts WHERE name = ?').get('الخزينة الرئيسية');
  if (!mainTreasury) {
    db.prepare('INSERT INTO accounts (name, balance) VALUES (?, ?)').run('الخزينة الرئيسية', 0);
  }
  const bankAccount = db.prepare('SELECT * FROM accounts WHERE name = ?').get('الحساب البنكي');
  if (!bankAccount) {
    db.prepare('INSERT INTO accounts (name, balance) VALUES (?, ?)').run('الحساب البنكي', 0);
  }
};

seedAccounts();

// Migration for new columns in orders table
try {
  const columns = db.prepare("PRAGMA table_info(orders)").all() as any[];
  const columnNames = columns.map(c => c.name);
  
  if (!columnNames.includes('order_type')) {
    db.exec("ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'direct'");
  }
  if (!columnNames.includes('shipping_address')) {
    db.exec("ALTER TABLE orders ADD COLUMN shipping_address TEXT");
  }
  if (!columnNames.includes('shipping_cost')) {
    db.exec("ALTER TABLE orders ADD COLUMN shipping_cost REAL DEFAULT 0");
  }
  if (!columnNames.includes('source')) {
    db.exec("ALTER TABLE orders ADD COLUMN source TEXT");
  }
  if (!columnNames.includes('shipment_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN shipment_status TEXT");
  }
  if (!columnNames.includes('customer_name')) {
    db.exec("ALTER TABLE orders ADD COLUMN customer_name TEXT");
  }
  if (!columnNames.includes('customer_phone')) {
    db.exec("ALTER TABLE orders ADD COLUMN customer_phone TEXT");
  }
  if (!columnNames.includes('payment_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'paid'");
  }
  
  const bookColumns = db.prepare("PRAGMA table_info(books)").all() as any[];
  const bookColumnNames = bookColumns.map(c => c.name);
  if (!bookColumnNames.includes('type')) {
    db.exec("ALTER TABLE books ADD COLUMN type TEXT DEFAULT 'book'");
  }
} catch (e) {
  console.error("Migration error:", e);
}

export default db;
