export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category_id?: number;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  type: 'book' | 'tech';
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
}

export interface Order {
  id: number;
  customer_id?: number;
  user_id: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  status: string;
  order_type: 'direct' | 'shipment' | 'booking';
  shipping_address?: string;
  shipping_cost?: number;
  source?: string;
  shipment_status?: 'to_be_processed' | 'delivered' | 'returned';
  payment_status: 'paid' | 'unpaid' | 'partial';
  customer_name?: string;
  customer_phone?: string;
  display_customer_name?: string;
  display_customer_phone?: string;
  created_at: string;
  cashier_name?: string;
  cashier_role?: 'admin' | 'cashier';
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface Stats {
  totalSales: number;
  totalOrders: number;
  totalBooks: number;
  lowStock: number;
  todaySales: number;
  todayNetProfit: number;
}
