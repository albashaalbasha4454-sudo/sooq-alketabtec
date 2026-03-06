import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './src/db.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Helper to notify all clients
  const notifyClients = (type: string, data?: any) => {
    io.emit('data_update', { type, data });
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'Transport:', socket.conn.transport.name);
    
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error for client', socket.id, ':', error);
    });
  });

  // --- API Routes ---

  // Auth
  app.post('/api/auth/login', (req, res) => {
    console.log('Login attempt for:', req.body.username);
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password) as any;
      if (user) {
        console.log('Login successful for:', username);
        res.json({ success: true, user });
      } else {
        console.log('Login failed for:', username);
        res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'حدث خطأ في النظام' });
    }
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    try {
      const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'").get() as any;
      const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
      const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get() as any;
      const lowStock = db.prepare('SELECT COUNT(*) as count FROM books WHERE stock_quantity <= min_stock_level').get() as any;
      const todaySales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE date(created_at) = date('now') AND status = 'completed'").get() as any;
      const overduePayments = db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_status IN ('unpaid', 'partial')").get() as any;
      
      // Calculate today's profit
      const todayProfitData = db.prepare(`
        SELECT SUM(oi.quantity * (b.selling_price - b.purchase_price)) as profit
        FROM order_items oi
        JOIN books b ON oi.book_id = b.id
        JOIN orders o ON oi.order_id = o.id
        WHERE date(o.created_at) = date('now') AND o.status = 'completed'
      `).get() as any;

      const todayExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date(created_at) = date('now')").get() as any;
      
      const todayNetProfit = (todayProfitData?.profit || 0) - (todayExpenses?.total || 0);

      res.json({
        totalSales: totalSales?.total || 0,
        totalOrders: totalOrders?.count || 0,
        totalBooks: totalBooks?.count || 0,
        lowStock: lowStock?.count || 0,
        todaySales: todaySales?.total || 0,
        todayNetProfit: todayNetProfit,
        overduePayments: overduePayments?.count || 0
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Books
  app.get('/api/books', (req, res) => {
    const books = db.prepare('SELECT * FROM books').all();
    res.json(books);
  });

  app.post('/api/books', (req, res) => {
    const { title, author, isbn, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, type } = req.body;
    const info = db.prepare(`
      INSERT INTO books (title, author, isbn, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, author, isbn, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, type || 'book');
    notifyClients('books');
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, type } = req.body;
    db.prepare(`
      UPDATE books SET title = ?, author = ?, isbn = ?, category_id = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?, min_stock_level = ?, type = ?
      WHERE id = ?
    `).run(title, author, isbn, category_id, purchase_price, selling_price, stock_quantity, min_stock_level, type || 'book', id);
    notifyClients('books');
    res.json({ success: true });
  });

  app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    notifyClients('books');
    res.json({ success: true });
  });

  // Bulk Price Update
  app.post('/api/books/bulk-price-update', (req, res) => {
    const { factor, operation } = req.body; // operation: 'multiply' or 'divide'
    if (!factor || factor <= 0) return res.status(400).json({ success: false, message: 'Invalid factor' });

    try {
      if (operation === 'multiply') {
        db.prepare('UPDATE books SET selling_price = selling_price * ?').run(factor);
      } else if (operation === 'divide') {
        db.prepare('UPDATE books SET selling_price = selling_price / ?').run(factor);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid operation' });
      }
      notifyClients('books');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update prices' });
    }
  });

  // Orders / POS
  app.post('/api/orders', (req, res) => {
    const { 
      customer_id, 
      user_id, 
      items, 
      total_amount, 
      tax_amount, 
      discount_amount, 
      payment_method,
      order_type,
      shipping_address,
      shipping_cost,
      source,
      shipment_status,
      customer_name,
      customer_phone,
      payment_status,
      paid_amount
    } = req.body;
    
    const transaction = db.transaction(() => {
      const orderInfo = db.prepare(`
        INSERT INTO orders (
          customer_id, 
          user_id, 
          total_amount, 
          tax_amount, 
          discount_amount, 
          payment_method, 
          status,
          order_type,
          shipping_address,
          shipping_cost,
          source,
          shipment_status,
          customer_name,
          customer_phone,
          payment_status,
          paid_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customer_id, 
        user_id, 
        total_amount, 
        tax_amount, 
        discount_amount, 
        payment_method,
        order_type === 'booking' ? 'pending' : 'completed',
        order_type || 'direct',
        shipping_address,
        shipping_cost || 0,
        source,
        shipment_status,
        customer_name,
        customer_phone,
        payment_status || 'paid',
        paid_amount || 0
      );
      
      const orderId = orderInfo.lastInsertRowid;
      
      // Update customer balance if debt exists
      if (customer_id && (payment_status === 'unpaid' || payment_status === 'partial')) {
        const debtAmount = total_amount - (paid_amount || 0);
        db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(debtAmount, customer_id);
      }
      
      // Record transaction in treasury (Main Treasury by default for now)
      const mainAccount = db.prepare('SELECT id FROM accounts WHERE name = ?').get('الخزينة الرئيسية') as any;
      if (mainAccount && ['cash', 'alharam', 'sham_cash', 'syriatel_cash'].includes(payment_method) && payment_status !== 'unpaid') {
        const amountToRecord = paid_amount || total_amount;
        db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
          .run(mainAccount.id, 'sale', amountToRecord, `بيع فاتورة #${orderId} (${payment_method})`, orderId);
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amountToRecord, mainAccount.id);
      }
      
      for (const item of items) {
        db.prepare(`
          INSERT INTO order_items (order_id, book_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `).run(orderId, item.id, item.quantity, item.selling_price, item.quantity * item.selling_price);
        
        db.prepare('UPDATE books SET stock_quantity = stock_quantity - ? WHERE id = ?').run(item.quantity, item.id);
      }
      
      return orderId;
    });
    
    try {
      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.patch('/api/orders/:id/shipment-status', (req, res) => {
    const { id } = req.params;
    const { shipment_status } = req.body;
    try {
      db.prepare('UPDATE orders SET shipment_status = ? WHERE id = ?').run(shipment_status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update shipment status' });
    }
  });

  app.get('/api/orders', (req, res) => {
    const orders = db.prepare(`
      SELECT 
        o.*, 
        u.username as cashier_name, 
        u.role as cashier_role,
        COALESCE(c.name, o.customer_name) as display_customer_name,
        COALESCE(c.phone, o.customer_phone) as display_customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    try {
      const order = db.prepare(`
        SELECT 
          o.*, 
          u.username as cashier_name, 
          u.role as cashier_role,
          COALESCE(c.name, o.customer_name) as display_customer_name,
          COALESCE(c.phone, o.customer_phone) as display_customer_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(id) as any;

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const items = db.prepare(`
        SELECT oi.*, b.title, b.isbn, b.type
        FROM order_items oi
        JOIN books b ON oi.book_id = b.id
        WHERE oi.order_id = ?
      `).all(id);

      order.items = items;
      res.json(order);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update status' });
    }
  });

  // Suppliers
  app.get('/api/suppliers', (req, res) => {
    res.json(db.prepare('SELECT * FROM suppliers').all());
  });

  app.post('/api/suppliers', (req, res) => {
    const { name, contact_person, phone } = req.body;
    const info = db.prepare('INSERT INTO suppliers (name, contact_person, phone) VALUES (?, ?, ?)').run(name, contact_person, phone);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const { name, contact_person, phone } = req.body;
    db.prepare('UPDATE suppliers SET name = ?, contact_person = ?, phone = ? WHERE id = ?').run(name, contact_person, phone, id);
    res.json({ success: true });
  });

  app.post('/api/suppliers/:id/pay', (req, res) => {
    const { id } = req.params;
    const { amount, account_id, description } = req.body;
    
    const transaction = db.transaction(() => {
      // Update supplier balance
      db.prepare('UPDATE suppliers SET balance = balance - ? WHERE id = ?').run(amount, id);
      
      // Record in treasury
      if (account_id) {
        db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
          .run(account_id, 'expense', amount, `تسديد مورد #${id}: ${description || ''}`, id);
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account_id);
      }
    });

    try {
      transaction();
      notifyClients('suppliers');
      notifyClients('accounts');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Purchases
  app.get('/api/purchases', (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(purchases);
  });

  app.post('/api/purchases', (req, res) => {
    const { supplier_id, total_amount, items } = req.body;
    const transaction = db.transaction(() => {
      const purchaseInfo = db.prepare('INSERT INTO purchases (supplier_id, total_amount, status) VALUES (?, ?, ?)').run(supplier_id, total_amount, 'received');
      const purchaseId = purchaseInfo.lastInsertRowid;

      for (const item of items) {
        db.prepare('INSERT INTO purchase_items (purchase_id, book_id, quantity, unit_price) VALUES (?, ?, ?, ?)').run(purchaseId, item.book_id, item.quantity, item.unit_price);
        
        // Update book stock and purchase price
        db.prepare('UPDATE books SET stock_quantity = stock_quantity + ?, purchase_price = ? WHERE id = ?').run(item.quantity, item.unit_price, item.book_id);
      }
      
      // Update supplier balance (debt)
      db.prepare('UPDATE suppliers SET balance = balance + ? WHERE id = ?').run(total_amount, supplier_id);

      return purchaseId;
    });

    try {
      const purchaseId = transaction();
      res.json({ success: true, purchaseId });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    res.json(db.prepare('SELECT * FROM categories').all());
  });

  app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    try {
      const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Category already exists' });
    }
  });

  // Customers
  app.get('/api/customers', (req, res) => {
    res.json(db.prepare('SELECT * FROM customers').all());
  });

  app.post('/api/customers', (req, res) => {
    const { name, phone, email } = req.body;
    const info = db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)').run(name, phone, email);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    db.prepare('UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?').run(name, phone, email, id);
    notifyClients('customers');
    res.json({ success: true });
  });

  app.post('/api/customers/:id/pay', (req, res) => {
    const { id } = req.params;
    const { amount, account_id, description } = req.body;
    
    const transaction = db.transaction(() => {
      // Update customer balance
      db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(amount, id);
      
      // Record in treasury
      if (account_id) {
        db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
          .run(account_id, 'sale', amount, `تسديد دين عميل #${id}: ${description || ''}`, id);
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, account_id);
      }
    });

    try {
      transaction();
      notifyClients('customers');
      notifyClients('accounts');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Users / Password
  app.patch('/api/users/password', (req, res) => {
    const { username, newPassword } = req.body;
    try {
      db.prepare('UPDATE users SET password = ? WHERE username = ?').run(newPassword, username);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  });

  // Expenses
  app.get('/api/expenses', (req, res) => {
    res.json(db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all());
  });

  app.post('/api/expenses', (req, res) => {
    const { category, amount, description, account_id } = req.body;
    const transaction = db.transaction(() => {
      const info = db.prepare('INSERT INTO expenses (category, amount, description) VALUES (?, ?, ?)').run(category, amount, description);
      const expenseId = info.lastInsertRowid;
      
      if (account_id) {
        db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
          .run(account_id, 'expense', amount, `مصروف: ${category} - ${description}`, expenseId);
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account_id);
      }
      return expenseId;
    });
    
    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Returns
  app.get('/api/returns', (req, res) => {
    res.json(db.prepare('SELECT * FROM returns ORDER BY created_at DESC').all());
  });

  app.post('/api/returns', (req, res) => {
    const { order_id, amount, reason } = req.body;
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO returns (order_id, amount, reason) VALUES (?, ?, ?)').run(order_id, amount, reason);
      
      // Record in treasury
      const mainAccount = db.prepare('SELECT id FROM accounts WHERE name = ?').get('الخزينة الرئيسية') as any;
      if (mainAccount) {
        db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
          .run(mainAccount.id, 'expense', amount, `مرتجع فاتورة #${order_id}: ${reason}`, order_id);
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, mainAccount.id);
      }

      // Restore stock (optional: could be damaged, but let's assume restock for now)
      const items = db.prepare('SELECT book_id, quantity FROM order_items WHERE order_id = ?').all(order_id) as any[];
      for (const item of items) {
        db.prepare('UPDATE books SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.book_id);
      }
      
      // Update order status to 'returned'
      db.prepare('UPDATE orders SET status = "returned" WHERE id = ?').run(order_id);
    });

    try {
      transaction();
      notifyClients('orders');
      notifyClients('books');
      notifyClients('accounts');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
      if (!order) throw new Error('Order not found');

      // Restore stock
      const items = db.prepare('SELECT book_id, quantity FROM order_items WHERE order_id = ?').all(id) as any[];
      for (const item of items) {
        db.prepare('UPDATE books SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.book_id);
      }

      // Reverse treasury if it was completed
      if (order.status === 'completed') {
        const mainAccount = db.prepare('SELECT id FROM accounts WHERE name = ?').get('الخزينة الرئيسية') as any;
        if (mainAccount) {
          db.prepare('INSERT INTO transactions (account_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)')
            .run(mainAccount.id, 'expense', order.total_amount, `إلغاء فاتورة #${id}`, id);
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(order.total_amount, mainAccount.id);
        }
      }

      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    });

    try {
      transaction();
      notifyClients('orders');
      notifyClients('books');
      notifyClients('accounts');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Capital Movements
  app.get('/api/capital-movements', (req, res) => {
    res.json(db.prepare('SELECT * FROM capital_movements ORDER BY created_at DESC').all());
  });

  app.post('/api/capital-movements', (req, res) => {
    const { type, amount, description, account_id } = req.body;
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO capital_movements (type, amount, description) VALUES (?, ?, ?)').run(type, amount, description);
      
      if (account_id) {
        db.prepare('INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(account_id, type, amount, description, null);
        
        if (type === 'deposit') {
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, account_id);
        } else {
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account_id);
        }
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Suppliers Balance
  app.get('/api/suppliers-balance', (req, res) => {
    const suppliers = db.prepare('SELECT id, name, balance FROM suppliers').all();
    res.json(suppliers);
  });

  // Treasury / Accounts
  app.get('/api/accounts', (req, res) => {
    res.json(db.prepare('SELECT * FROM accounts').all());
  });

  app.post('/api/accounts', (req, res) => {
    const { name, balance } = req.body;
    try {
      const info = db.prepare('INSERT INTO accounts (name, balance) VALUES (?, ?)').run(name, balance || 0);
      notifyClients('accounts');
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Account already exists' });
    }
  });

  app.get('/api/transactions', (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, a.name as account_name, ta.name as to_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `).all();
    res.json(transactions);
  });

  app.post('/api/transfers', (req, res) => {
    const { from_account_id, to_account_id, amount, description } = req.body;
    const transaction = db.transaction(() => {
      // Record transfer
      db.prepare('INSERT INTO transactions (account_id, to_account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(from_account_id, to_account_id, 'transfer', amount, description || 'تحويل بين الحسابات');
      
      // Update balances
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, from_account_id);
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, to_account_id);
    });

    try {
      transaction();
      notifyClients('accounts');
      notifyClients('transactions');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Reports API
  app.get('/api/reports', (req, res) => {
    const { startDate, endDate } = req.query;
    let queryParams: any[] = [];
    let dateFilter = "";
    let orderDateFilter = "";

    if (startDate && endDate) {
      dateFilter = " AND date(created_at) BETWEEN date(?) AND date(?)";
      orderDateFilter = " AND date(o.created_at) BETWEEN date(?) AND date(?)";
      queryParams = [startDate, endDate];
    }

    try {
      const sales = db.prepare(`SELECT SUM(total_amount) as total, COUNT(*) as count FROM orders WHERE status = 'completed'${dateFilter}`).get(...queryParams) as any;
      const expenses = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE 1=1${dateFilter}`).get(...queryParams) as any;
      const returns = db.prepare(`SELECT SUM(amount) as total FROM returns WHERE 1=1${dateFilter}`).get(...queryParams) as any;
      const deposits = db.prepare(`SELECT SUM(amount) as total FROM capital_movements WHERE type = 'deposit'${dateFilter}`).get(...queryParams) as any;
      const withdrawals = db.prepare(`SELECT SUM(amount) as total FROM capital_movements WHERE type = 'withdrawal'${dateFilter}`).get(...queryParams) as any;
      
      // Calculate Capital and Gross Profit
      const profitData = db.prepare(`
        SELECT 
          SUM(oi.quantity * b.purchase_price) as totalCapital,
          SUM(oi.quantity * b.selling_price) as totalRevenuePreTax,
          SUM(oi.quantity * (b.selling_price - b.purchase_price)) as grossProfit
        FROM order_items oi
        JOIN books b ON oi.book_id = b.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed'${orderDateFilter}
      `).get(...queryParams) as any;

      // Cash in Safes (using active drawers)
      const cashInSafes = db.prepare(`
        SELECT u.username, cd.opening_balance + 
          COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id = u.id AND status = 'completed' AND created_at >= cd.opened_at), 0) -
          COALESCE((SELECT SUM(amount) FROM expenses WHERE created_at >= cd.opened_at), 0) as current_cash
        FROM cash_drawer cd
        JOIN users u ON cd.user_id = u.id
        WHERE cd.status = 'open'
      `).all();

      const totalCashInSafes = cashInSafes.reduce((sum: number, safe: any) => sum + safe.current_cash, 0);

      // Supplier total debt
      const supplierDebt = db.prepare('SELECT SUM(balance) as total FROM suppliers').get() as any;

      const grossProfit = (profitData?.grossProfit || 0) - (returns?.total || 0);
      const netProfit = grossProfit - (expenses?.total || 0);
      const equity = (deposits?.total || 0) + netProfit - (withdrawals?.total || 0);

      // Daily sales for chart
      const dailySales = db.prepare(`
        SELECT date(created_at) as date, SUM(total_amount) as amount 
        FROM orders 
        WHERE status = 'completed'${dateFilter}
        GROUP BY date(created_at)
        ORDER BY date(created_at) ASC
      `).all(...queryParams);

      res.json({
        totalSales: sales?.total || 0,
        totalReturns: returns?.total || 0,
        totalRevenuePreTax: profitData?.totalRevenuePreTax || 0,
        totalCapital: profitData?.totalCapital || 0,
        grossProfit: grossProfit,
        orderCount: sales?.count || 0,
        totalExpenses: expenses?.total || 0,
        capitalDeposits: deposits?.total || 0,
        profitWithdrawals: withdrawals?.total || 0,
        netProfit: netProfit,
        equity: equity,
        cashInSafes,
        totalCashInSafes,
        supplierDebt: supplierDebt?.total || 0,
        dailySales
      });
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error:', err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
