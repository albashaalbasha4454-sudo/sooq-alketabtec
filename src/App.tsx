import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  LogOut,
  Package,
  CreditCard,
  Wallet,
  Calendar,
  Search,
  Plus,
  Trash2,
  Printer,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Sparkles,
  Bookmark,
  Landmark,
  ArrowRightLeft,
  Moon,
  Sun,
  Bell,
  Truck,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { User, Book, Customer, Order, Expense, Stats } from './types';

type Tab = 'dashboard' | 'pos' | 'orders' | 'books' | 'tech' | 'reports' | 'settings' | 'customers' | 'suppliers' | 'purchases' | 'treasury' | 'requested' | 'shipments' | 'expenses';

interface Account {
  id: number;
  name: string;
  balance: number;
  created_at: string;
}

interface Transaction {
  id: number;
  account_id: number;
  to_account_id?: number;
  type: 'sale' | 'expense' | 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  reference_id?: number;
  created_at: string;
  account_name?: string;
  to_account_name?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  balance: number;
}

interface Purchase {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

// --- Components ---

const Invoice = React.forwardRef<HTMLDivElement, { order: Order | null }>(({ order }, ref) => {
  if (!order) return null;
  return (
    <div ref={ref} className="p-10 bg-white text-slate-900 font-sans" dir="rtl">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-navy mb-2">فاتورة ضريبية</h1>
          <p className="text-slate-500 font-bold">رقم الفاتورة: #{order.id}</p>
          <p className="text-slate-500 font-bold">التاريخ: {new Date(order.created_at).toLocaleString('ar-SA')}</p>
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-black text-brand-gold">سوق الكتاب</h2>
          <p className="text-sm text-slate-500">الرياض، المملكة العربية السعودية</p>
          <p className="text-sm text-slate-500">هاتف: 0500000000</p>
          <p className="text-sm text-slate-500">الرقم الضريبي: 300000000000003</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">العميل</h3>
          <p className="text-lg font-black">{order.display_customer_name || 'عميل نقدي'}</p>
          <p className="text-slate-500 font-bold">{order.display_customer_phone}</p>
          {order.shipping_address && <p className="text-slate-500 text-sm mt-1">{order.shipping_address}</p>}
        </div>
        <div className="text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">تفاصيل الطلب</h3>
          <p className="text-sm font-black">
            النوع: {order.order_type === 'shipment' ? 'شحن وتوصيل' : 
                   order.order_type === 'booking' ? 'حجز مسبق' : 'بيع مباشر'}
          </p>
          <p className="text-sm font-black">
            الدفع: {order.payment_status === 'paid' ? 'مدفوع' : order.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
          </p>
          <p className="text-sm font-black">
            الموظف: {order.cashier_name} ({order.cashier_role === 'admin' ? 'مدير' : 'كاشير'})
          </p>
          <p className="text-slate-500 font-bold mt-2">طريقة الدفع: {order.payment_method === 'cash' ? 'نقدي' : 'شبكة'}</p>
        </div>
      </div>

      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-4 text-right font-black">المنتج</th>
            <th className="py-4 text-center font-black">الكمية</th>
            <th className="py-4 text-center font-black">سعر الوحدة</th>
            <th className="py-4 text-left font-black">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {/* Note: In a real app, we'd fetch order items. For now, we show a summary or placeholder */}
          <tr>
            <td className="py-4 font-bold">إجمالي المنتجات المباعة</td>
            <td className="py-4 text-center">-</td>
            <td className="py-4 text-center">-</td>
            <td className="py-4 text-left font-bold">{order.total_amount - (order.shipping_cost || 0)} ر.س</td>
          </tr>
          {order.shipping_cost > 0 && (
            <tr>
              <td className="py-4 font-bold">رسوم الشحن</td>
              <td className="py-4 text-center">1</td>
              <td className="py-4 text-center">{order.shipping_cost}</td>
              <td className="py-4 text-left font-bold">{order.shipping_cost} ر.س</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-slate-500 font-bold">
            <span>المجموع الفرعي:</span>
            <span>{(order.total_amount / 1.15).toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-slate-500 font-bold">
            <span>ضريبة القيمة المضافة (15%):</span>
            <span>{(order.total_amount - (order.total_amount / 1.15)).toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-2xl font-black border-t-2 border-slate-900 pt-3">
            <span>الإجمالي:</span>
            <span className="text-brand-gold">{order.total_amount} ر.س</span>
          </div>
        </div>
      </div>

      <div className="mt-24 pt-8 border-t border-slate-100 text-center">
        <p className="text-sm font-bold text-slate-400">شكراً لتعاملكم معنا! نتمنى لكم قراءة ممتعة.</p>
        <p className="text-[10px] text-slate-300 mt-2">هذه الفاتورة تم إنشاؤها آلياً بواسطة نظام سوق الكتاب</p>
      </div>
    </div>
  );
});

const Logo = () => (
  <div className="flex items-center gap-3 px-2 mb-8">
    <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center shadow-lg shadow-brand-gold/30">
      <BookOpen size={28} className="text-white" />
    </div>
    <div>
      <h1 className="text-xl font-black text-brand-navy leading-none">سوق الكتاب</h1>
      <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-1">Book Market</p>
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 select-none touch-manipulation ${
      active 
        ? 'bg-brand-gold text-white shadow-lg shadow-brand-gold/20' 
        : 'text-slate-500 hover:bg-slate-100 active:bg-slate-200'
    }`}
  >
    <Icon size={20} />
    <span className="font-bold text-sm">{label}</span>
  </motion.button>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </motion.div>
);

const FinancialReportPrint = React.forwardRef(({ data, dateRange }: { data: any, dateRange: any }, ref: any) => (
  <div ref={ref} className="p-12 bg-white text-slate-900" dir="rtl">
    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-8 mb-8">
      <div>
        <h1 className="text-4xl font-black mb-2">سوق الكتاب</h1>
        <p className="text-slate-500">ملخص مالي - قائمة الأرباح والخسائر</p>
      </div>
      <div className="text-left">
        <p className="font-bold">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
        <p className="text-sm text-slate-500">الفترة: {dateRange.startDate} إلى {dateRange.endDate}</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-4">1. الإيرادات والمبيعات</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>إجمالي الإيرادات من المبيعات</span>
            <span className="font-bold">{data?.totalSales.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>إجمالي المرتجعات (-)</span>
            <span className="font-bold">{data?.totalReturns.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-black">
            <span>صافي المبيعات</span>
            <span>{(data?.totalSales - data?.totalReturns).toLocaleString()} ر.س</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-4">2. تكلفة البضاعة والأرباح</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>تكلفة المنتجات المباعة (COGS)</span>
            <span className="font-bold">{data?.totalCapital.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between font-black text-emerald-600 border-t pt-2">
            <span>إجمالي الربح (Gross Profit)</span>
            <span>{data?.grossProfit.toLocaleString()} ر.س</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-4">3. المصاريف وصافي الربح</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-rose-600">
            <span>إجمالي المصروفات التشغيلية (-)</span>
            <span className="font-bold">{data?.totalExpenses.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between font-black text-blue-600 border-t pt-2 text-xl">
            <span>صافي الربح (Net Profit)</span>
            <span>{data?.netProfit.toLocaleString()} ر.س</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-4">4. رأس المال وحقوق الملكية</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>إيداعات رأس المال (+)</span>
            <span className="font-bold text-emerald-600">{data?.capitalDeposits.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between">
            <span>مسحوبات الأرباح (-)</span>
            <span className="font-bold text-rose-600">{data?.profitWithdrawals.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between font-black border-t pt-2">
            <span>حقوق الملكية (Equity)</span>
            <span>{data?.equity.toLocaleString()} ر.س</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold border-b-2 border-slate-100 pb-2 mb-4">5. الأرصدة والالتزامات</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>إجمالي النقدية في الخزائن</span>
            <span className="font-bold">{data?.totalCashInSafes.toLocaleString()} ر.س</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>المبالغ المستحقة للموردين</span>
            <span className="font-bold">{data?.supplierDebt.toLocaleString()} ر.س</span>
          </div>
        </div>
      </section>
    </div>

    <div className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
      <p>تم استخراج هذا التقرير آلياً من نظام سوق الكتاب</p>
    </div>
  </div>
));

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  // Data State
  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState<{ show: boolean, orderId?: number }>({ show: false });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // POS State
  const [cart, setCart] = useState<(Book & { quantity: number })[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterType, setOrderFilterType] = useState<string>('all');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderFilterPayment, setOrderFilterPayment] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'direct' | 'shipment' | 'booking'>('direct');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [showFinancialModal, setShowFinancialModal] = useState<{ show: boolean, type: 'expense' | 'deposit' | 'withdrawal' | 'transfer' }>({ show: false, type: 'expense' });
  const [financialForm, setFinancialForm] = useState({
    amount: 0,
    description: '',
    category: 'عام',
    account_id: 0,
    to_account_id: 0
  });
  const [shipmentDetails, setShipmentDetails] = useState({
    address: '',
    cost: 0,
    source: 'whatsapp',
    clientName: '',
    clientPhone: ''
  });
  const reportPrintRef = useRef(null);
  const invoiceRef = useRef(null);

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
  });

  const handlePrintReport = useReactToPrint({
    contentRef: reportPrintRef,
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      fetchData();
      
      const socket = io();
      socket.on('data_update', (msg) => {
        console.log('Real-time update:', msg.type);
        fetchData();
        toast.info(`تحديث جديد: ${msg.type}`, {
          description: 'تم تحديث البيانات بشكل مباشر من جهاز آخر'
        });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState<{ show: boolean, mode: 'add' | 'edit', type: 'book' | 'tech', bookId?: number }>({ show: false, mode: 'add', type: 'book' });
  const [productForm, setProductForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: 0,
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    type: 'book' as 'book' | 'tech'
  });
  const [bulkPriceForm, setBulkPriceForm] = useState({ factor: 1, operation: 'multiply' as 'multiply' | 'divide' });

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = showProductModal.mode === 'add' ? '/api/books' : `/api/books/${showProductModal.bookId}`;
    const method = showProductModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, type: showProductModal.type })
      });
      if (res.ok) {
        setShowProductModal({ ...showProductModal, show: false });
        setProductForm({
          title: '',
          author: '',
          isbn: '',
          category_id: 0,
          purchase_price: 0,
          selling_price: 0,
          stock_quantity: 0,
          min_stock_level: 5,
          type: 'book'
        });
        fetchData();
        toast.success(showProductModal.mode === 'add' ? 'تمت الإضافة بنجاح' : 'تم التعديل بنجاح');
      }
    } catch (err) {
      toast.error('فشلت العملية');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        toast.success('تم الحذف بنجاح');
      }
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  const handleBulkPriceUpdate = async () => {
    try {
      const res = await fetch('/api/books/bulk-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPriceForm)
      });
      if (res.ok) {
        setShowBulkPriceModal(false);
        fetchData();
        toast.success('تم تحديث الأسعار بنجاح');
      }
    } catch (err) {
      toast.error('فشل تحديث الأسعار');
    }
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = showFinancialModal.type;
    const endpoint = type === 'transfer' ? '/api/transfers' : 
                     type === 'expense' ? '/api/expenses' : '/api/capital-movements';
    
    const payload = {
      ...financialForm,
      type: type,
      from_account_id: financialForm.account_id // Map account_id to from_account_id for server
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowFinancialModal({ show: false, type: 'expense' });
        setFinancialForm({ amount: 0, description: '', category: 'عام', account_id: 0, to_account_id: 0 });
        fetchData();
        alert('تمت العملية بنجاح');
      } else {
        const data = await res.json();
        alert(`خطأ: ${data.error || data.message || 'فشلت العملية'}`);
      }
    } catch (err) {
      alert('حدث خطأ أثناء تنفيذ العملية');
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, booksRes, customersRes, ordersRes, expensesRes, suppliersRes, purchasesRes, categoriesRes, accountsRes, transactionsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/books'),
        fetch('/api/customers'),
        fetch('/api/orders'),
        fetch('/api/expenses'),
        fetch('/api/suppliers'),
        fetch('/api/purchases'),
        fetch('/api/categories'),
        fetch('/api/accounts'),
        fetch('/api/transactions')
      ]);
      
      setStats(await statsRes.json());
      setBooks(await booksRes.json());
      setCustomers(await customersRes.json());
      setOrders(await ordersRes.json());
      setExpenses(await expensesRes.json());
      setSuppliers(await suppliersRes.json());
      setPurchases(await purchasesRes.json());
      setCategories(await categoriesRes.json());
      setAccounts(await accountsRes.json());
      setTransactions(await transactionsRes.json());
      fetchReports();
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [dateRange, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (data.user.role === 'cashier') setActiveTab('pos');
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const addToCart = (book: Book) => {
    if (book.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax + (orderType === 'shipment' ? Number(shipmentDetails.cost) : 0);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer,
          user_id: user?.id,
          items: cart,
          total_amount: total,
          tax_amount: tax,
          discount_amount: 0,
          payment_method: orderType === 'direct' ? 'cash' : 'debt',
          order_type: orderType,
          payment_status: paymentStatus,
          shipping_address: (orderType === 'shipment' || orderType === 'booking') ? shipmentDetails.address : null,
          shipping_cost: (orderType === 'shipment' || orderType === 'booking') ? Number(shipmentDetails.cost) : 0,
          source: (orderType === 'shipment' || orderType === 'booking') ? shipmentDetails.source : null,
          shipment_status: (orderType === 'shipment' || orderType === 'booking') ? 'to_be_processed' : null,
          customer_name: (orderType === 'shipment' || orderType === 'booking') ? shipmentDetails.clientName : null,
          customer_phone: (orderType === 'shipment' || orderType === 'booking') ? shipmentDetails.clientPhone : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setCart([]);
        setSelectedCustomer(null);
        setOrderType('direct');
        setPaymentStatus('paid');
        setShipmentDetails({
          address: '',
          cost: 0,
          source: 'whatsapp',
          clientName: '',
          clientPhone: ''
        });
        fetchData();
        setShowCheckoutSuccess({ show: true, orderId: data.orderId });
      }
    } catch (err) {
      alert('حدث خطأ أثناء إتمام الطلب');
    }
  };

  const updateShipmentStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/shipment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('حدث خطأ أثناء تحديث حالة الشحن');
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center shadow-xl shadow-brand-gold/30 mb-6">
              <BookOpen size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-brand-navy">سوق الكتاب</h1>
            <p className="text-slate-400 font-medium mt-2">نظام إدارة المكتبات المتكامل</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">اسم المستخدم</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all bg-slate-50 touch-manipulation"
                placeholder="أدخل اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">كلمة المرور</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all bg-slate-50 touch-manipulation"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-brand-navy text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-brand-navy/20 select-none touch-manipulation"
            >
              تسجيل الدخول
            </motion.button>
          </form>
          
          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold">جميع الحقوق محفوظة © {new Date().getFullYear()} سوق الكتاب</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 sticky top-0 h-screen shadow-xl z-20 transition-colors duration-300">
        <Logo />

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={ShoppingCart} label="نقطة البيع (POS)" active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} />
          
          {user.role === 'admin' && (
            <>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">المخزون والمبيعات</div>
              <SidebarItem icon={FileText} label="الفواتير" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              <SidebarItem icon={Package} label="مخزون الكتب" active={activeTab === 'books'} onClick={() => setActiveTab('books')} />
              <SidebarItem icon={Sparkles} label="مخزون التكنولوجيا" active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} />
              <SidebarItem icon={ListTodo} label="الطلبات المحجوزة" active={activeTab === 'requested'} onClick={() => setActiveTab('requested')} />
              
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">المشتريات والموردين</div>
              <SidebarItem icon={Briefcase} label="المشتريات" active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} />
              <SidebarItem icon={Users} label="الموردون" active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} />
              
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">العملاء والمالية</div>
              <SidebarItem icon={Users} label="العملاء" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
              <SidebarItem icon={Landmark} label="الخزينة والحسابات" active={activeTab === 'treasury'} onClick={() => setActiveTab('treasury')} />
              <SidebarItem icon={Wallet} label="المصروفات" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
              <SidebarItem icon={Truck} label="تتبع الشحنات" active={activeTab === 'shipments'} onClick={() => setActiveTab('shipments')} />
              <SidebarItem icon={TrendingUp} label="التقارير المالية" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
              <SidebarItem icon={Settings} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </>
          )}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={18} className="text-brand-gold" /> : <Moon size={18} />}
              <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-brand-gold' : 'bg-slate-300'}`}>
              <motion.div 
                animate={{ x: isDarkMode ? 20 : 2 }}
                className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </div>
          </motion.button>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center text-brand-gold font-black text-xl shadow-lg">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-brand-navy">{user.username}</p>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">{user.role === 'admin' ? 'مدير النظام' : 'كاشير'}</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all font-bold text-sm select-none touch-manipulation"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto transition-colors duration-300">
        <Toaster position="top-center" richColors />
        
        {/* Hidden Invoice for Printing */}
        <div className="hidden">
          <Invoice ref={invoiceRef} order={selectedOrder} />
        </div>

        {/* Bulk Price Update Modal */}
        <AnimatePresence>
          {showBulkPriceModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-brand-navy mb-6">تعديل الأسعار بالجملة</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">العملية</label>
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                      <button 
                        onClick={() => setBulkPriceForm({ ...bulkPriceForm, operation: 'multiply' })}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${bulkPriceForm.operation === 'multiply' ? 'bg-white text-brand-navy shadow-md' : 'text-slate-500'}`}
                      >
                        ضرب (×)
                      </button>
                      <button 
                        onClick={() => setBulkPriceForm({ ...bulkPriceForm, operation: 'divide' })}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${bulkPriceForm.operation === 'divide' ? 'bg-white text-brand-navy shadow-md' : 'text-slate-500'}`}
                      >
                        قسمة (÷)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المعامل</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all bg-slate-50 font-bold"
                      value={bulkPriceForm.factor}
                      onChange={e => setBulkPriceForm({ ...bulkPriceForm, factor: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-bold">سيتم {bulkPriceForm.operation === 'multiply' ? 'ضرب' : 'قسمة'} جميع أسعار البيع في هذا الرقم.</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkPriceUpdate}
                      className="flex-1 bg-brand-navy text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-navy/20"
                    >
                      تحديث الأسعار
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBulkPriceModal(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black"
                    >
                      إلغاء
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Checkout Success Modal */}
        <AnimatePresence>
          {showCheckoutSuccess.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-brand-navy mb-2">تمت العملية بنجاح!</h2>
                <p className="text-slate-500 mb-8">رقم الطلب: #{showCheckoutSuccess.orderId}</p>
                
                <div className="space-y-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const order = orders.find(o => o.id === showCheckoutSuccess.orderId);
                      if (order) {
                        setSelectedOrder(order);
                        setTimeout(() => handlePrintInvoice(), 100);
                      }
                    }}
                    className="w-full bg-brand-navy text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-navy/20"
                  >
                    <Printer size={20} />
                    طباعة الفاتورة
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCheckoutSuccess({ show: false })}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    إغلاق
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">مرحباً بك، {user.username}</h1>
                  <p className="text-slate-500">إليك ملخص أداء المكتبة اليوم</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-600">
                    <Calendar size={18} />
                    <span className="font-semibold">{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي المبيعات" value={`${stats?.totalSales.toLocaleString()} ر.س`} icon={DollarSign} color="bg-brand-navy" trend="+12%" />
                <StatCard title="صافي أرباح اليوم" value={`${stats?.todayNetProfit.toLocaleString()} ر.س`} icon={TrendingUp} color="bg-brand-gold" />
                <StatCard title="عدد الكتب" value={stats?.totalBooks || 0} icon={BookOpen} color="bg-indigo-600" />
                <StatCard title="نقص المخزون" value={stats?.lowStock || 0} icon={AlertCircle} color="bg-rose-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-brand-navy">إحصائيات المبيعات</h3>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500">
                          <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                          المبيعات
                        </div>
                      </div>
                    </div>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'السبت', sales: 4000 },
                          { name: 'الأحد', sales: 3000 },
                          { name: 'الاثنين', sales: 2000 },
                          { name: 'الثلاثاء', sales: 2780 },
                          { name: 'الأربعاء', sales: 1890 },
                          { name: 'الخميس', sales: 2390 },
                          { name: 'الجمعة', sales: 3490 },
                        ]}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                          />
                          <Area type="monotone" dataKey="sales" stroke="#d97706" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                    <h3 className="text-xl font-black text-brand-navy mb-8">إجراءات سريعة</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('pos')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                      >
                        <ShoppingCart size={24} />
                        <span className="text-xs font-bold">بيع جديد</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('books')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-brand-gold text-white shadow-xl shadow-brand-gold/20"
                      >
                        <Plus size={24} />
                        <span className="text-xs font-bold">إضافة كتاب</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('purchases')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                      >
                        <Briefcase size={24} />
                        <span className="text-xs font-bold">مشتريات</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('reports')}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                      >
                        <Printer size={24} />
                        <span className="text-xs font-bold">تقارير</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setActiveTab('orders');
                          // Filter for bookings logic could go here if needed
                        }}
                        className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-purple-600 text-white shadow-xl shadow-purple-600/20"
                      >
                        <Bookmark size={24} />
                        <span className="text-xs font-bold">الحجوزات</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-brand-navy to-slate-800 p-8 rounded-3xl text-white card-shadow relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                        <Sparkles className="text-brand-gold" />
                        المساعد الشخصي الذكي
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-xs font-black text-brand-gold uppercase tracking-widest">تنبيهات النظام</p>
                          <ul className="space-y-2 text-sm text-slate-300">
                            {stats?.lowStock > 0 && (
                              <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                <AlertCircle size={16} className="text-rose-500" />
                                <span>لديك {stats.lowStock} كتب قاربت على النفاد.</span>
                              </li>
                            )}
                            <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                              <Bell size={16} className="text-brand-gold" />
                              <span>هناك {orders.filter(o => o.order_type === 'booking' && o.status === 'pending').length} حجوزات بانتظار الاستلام.</span>
                            </li>
                            <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                              <Truck size={16} className="text-brand-blue" />
                              <span>هناك {orders.filter(o => o.order_type === 'shipment' && o.shipment_status === 'to_be_processed').length} شحنات بانتظار التجهيز.</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-black text-brand-gold uppercase tracking-widest">إحصائيات سريعة</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                              <p className="text-[10px] text-slate-400">صافي ربح اليوم</p>
                              <p className="text-lg font-black text-emerald-400">{stats?.todayNetProfit.toLocaleString()} ر.س</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                              <p className="text-[10px] text-slate-400">طلبات معلقة</p>
                              <p className="text-lg font-black text-brand-gold">{orders.filter(o => o.status === 'pending').length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl" />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">آخر الطلبات</h3>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-brand-gold hover:underline"
                    >
                      عرض الكل
                    </motion.button>
                  </div>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                            <ShoppingCart size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">طلب #{order.id}</p>
                            <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString('ar-SA')}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-brand-blue">{order.total_amount} ر.س</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="w-full mt-6 py-2 text-sm font-bold text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    عرض الكل
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requested' && (
            <motion.div 
              key="requested"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-brand-navy">الطلبات المحجوزة</h1>
                  <p className="text-slate-500">إدارة الكتب المطلوبة والتي لم تتوفر بعد أو بانتظار الاستلام</p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 card-shadow overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">العميل</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">المبلغ</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.filter(o => o.order_type === 'booking').map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-brand-navy">{order.display_customer_name || 'عميل غير معروف'}</span>
                            <span className="text-xs text-slate-500">{order.display_customer_phone}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="px-8 py-5 text-sm font-black text-brand-navy">{order.total_amount} ر.س</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {order.status === 'completed' ? 'تم الاستلام' : 'قيد الانتظار'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-left">
                          {order.status !== 'completed' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="text-xs font-black text-brand-gold hover:underline"
                            >
                              تأكيد الاستلام
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'shipments' && (
            <motion.div 
              key="shipments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-brand-navy">تتبع الشحنات</h1>
                  <p className="text-slate-500">متابعة حالة توصيل الطلبات للعملاء</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="بانتظار التجهيز" value={orders.filter(o => o.shipment_status === 'to_be_processed').length} icon={Package} color="bg-amber-500" />
                <StatCard title="تم التوصيل" value={orders.filter(o => o.shipment_status === 'delivered').length} icon={CheckCircle2} color="bg-emerald-600" />
                <StatCard title="مرتجع" value={orders.filter(o => o.shipment_status === 'returned').length} icon={AlertCircle} color="bg-rose-600" />
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 card-shadow overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">رقم الطلب</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">العميل</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">العنوان</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-left">تحديث الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.filter(o => o.order_type === 'shipment').map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-sm font-black text-brand-navy">#{order.id}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-brand-navy">{order.display_customer_name || 'عميل غير معروف'}</span>
                            <span className="text-xs text-slate-500">{order.display_customer_phone}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-500 font-bold">{order.shipping_address}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.shipment_status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                            order.shipment_status === 'returned' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {order.shipment_status === 'delivered' ? 'تم التوصيل' :
                             order.shipment_status === 'returned' ? 'مرتجع' : 'بانتظار التجهيز'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-left">
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg p-1 outline-none"
                            value={order.shipment_status || 'to_be_processed'}
                            onChange={(e) => updateShipmentStatus(order.id, e.target.value)}
                          >
                            <option value="to_be_processed">بانتظار التجهيز</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="returned">مرتجع</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'pos' && (
            <motion.div 
              key="pos"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex gap-8"
            >
              {/* Products Grid */}
              <div className="flex-1 space-y-6">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن كتاب بالعنوان أو ISBN..." 
                    className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all card-shadow touch-manipulation"
                    value={posSearch}
                    onChange={e => setPosSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {books
                    .filter(b => b.title.includes(posSearch) || b.isbn.includes(posSearch))
                    .map(book => (
                      <motion.button 
                        key={book.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(book)}
                        disabled={book.stock_quantity <= 0}
                        className={`bg-white p-5 rounded-2xl border border-slate-100 card-shadow text-right transition-all group select-none touch-manipulation ${book.stock_quantity <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'active:bg-slate-50'}`}
                      >
                        <div className="aspect-[3/4] bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-300 group-hover:text-brand-blue transition-colors">
                          <BookOpen size={48} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 line-clamp-1">{book.title}</h4>
                        <p className="text-xs text-slate-500 mb-3">{book.author}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-brand-blue">{book.selling_price} ر.س</span>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${book.stock_quantity > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            المخزون: {book.stock_quantity}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="w-96 bg-white rounded-3xl border border-slate-200 flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">سلة المشتريات</h3>
                  
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button 
                      onClick={() => setOrderType('direct')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'direct' ? 'bg-white text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      بيع مباشر
                    </button>
                    <button 
                      onClick={() => setOrderType('shipment')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'shipment' ? 'bg-white text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      شحن
                    </button>
                    <button 
                      onClick={() => setOrderType('booking')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'booking' ? 'bg-white text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      حجز
                    </button>
                  </div>

                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all bg-slate-50 touch-manipulation"
                    value={selectedCustomer || ''}
                    onChange={e => setSelectedCustomer(Number(e.target.value))}
                  >
                    <option value="">عميل نقدي (افتراضي)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">حالة الدفع</label>
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                      <button 
                        onClick={() => setPaymentStatus('paid')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paymentStatus === 'paid' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}
                      >
                        مدفوع
                      </button>
                      <button 
                        onClick={() => setPaymentStatus('partial')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paymentStatus === 'partial' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-500'}`}
                      >
                        جزئي
                      </button>
                      <button 
                        onClick={() => setPaymentStatus('unpaid')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paymentStatus === 'unpaid' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500'}`}
                      >
                        غير مدفوع
                      </button>
                    </div>
                  </div>

                  {(orderType === 'shipment' || orderType === 'booking') && (
                    <div className={`space-y-3 p-5 rounded-[2rem] border transition-all ${orderType === 'shipment' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${orderType === 'shipment' ? 'text-indigo-600' : 'text-brand-gold'}`}>
                        {orderType === 'shipment' ? 'تفاصيل الشحن والتوصيل' : 'تفاصيل حجز الكتاب'}
                      </p>
                      <input 
                        type="text" 
                        placeholder="اسم العميل..." 
                        className="w-full p-3 text-xs rounded-xl border border-white/50 bg-white/80 outline-none focus:ring-2 focus:ring-brand-gold/30 font-bold"
                        value={shipmentDetails.clientName}
                        onChange={e => setShipmentDetails({...shipmentDetails, clientName: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="رقم الهاتف..." 
                        className="w-full p-3 text-xs rounded-xl border border-white/50 bg-white/80 outline-none focus:ring-2 focus:ring-brand-gold/30 font-bold"
                        value={shipmentDetails.clientPhone}
                        onChange={e => setShipmentDetails({...shipmentDetails, clientPhone: e.target.value})}
                      />
                      {orderType === 'shipment' && (
                        <input 
                          type="text" 
                          placeholder="عنوان الشحن بالتفصيل..." 
                          className="w-full p-3 text-xs rounded-xl border border-white/50 bg-white/80 outline-none focus:ring-2 focus:ring-indigo-300 font-bold"
                          value={shipmentDetails.address}
                          onChange={e => setShipmentDetails({...shipmentDetails, address: e.target.value})}
                        />
                      )}
                      <div className="flex gap-2">
                        {orderType === 'shipment' && (
                          <input 
                            type="number" 
                            placeholder="تكلفة الشحن" 
                            className="flex-1 p-3 text-xs rounded-xl border border-white/50 bg-white/80 outline-none focus:ring-2 focus:ring-indigo-300 font-bold"
                            value={shipmentDetails.cost || ''}
                            onChange={e => setShipmentDetails({...shipmentDetails, cost: Number(e.target.value)})}
                          />
                        )}
                        <select 
                          className="flex-1 p-3 text-xs rounded-xl border border-white/50 bg-white/80 outline-none focus:ring-2 focus:ring-brand-gold/30 font-bold"
                          value={shipmentDetails.source}
                          onChange={e => setShipmentDetails({...shipmentDetails, source: e.target.value})}
                        >
                          <option value="whatsapp">واتساب</option>
                          <option value="facebook">فيسبوك</option>
                          <option value="instagram">انستقرام</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <ShoppingCart size={48} strokeWidth={1} />
                      <p className="font-medium">السلة فارغة</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.selling_price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                          <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors active:bg-white shadow-sm"
                          >-</motion.button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(item.stock_quantity, i.quantity + 1) } : i))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors active:bg-white shadow-sm"
                          >+</motion.button>
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors active:bg-rose-100"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>المجموع الفرعي</span>
                      <span>{cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0).toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>الضريبة (15%)</span>
                      <span>{(cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0) * 0.15).toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>الإجمالي</span>
                      <span>{(cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0) * 1.15).toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors select-none touch-manipulation"
                    >
                      <CreditCard size={18} />
                      بطاقة
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-lg shadow-emerald-600/20 select-none touch-manipulation"
                    >
                      <DollarSign size={18} />
                      نقداً
                    </motion.button>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-4 rounded-2xl bg-brand-blue text-white font-bold text-lg hover:bg-blue-900 active:bg-blue-950 transition-all shadow-xl shadow-brand-blue/20 disabled:opacity-50 disabled:grayscale select-none touch-manipulation"
                  >
                    إتمام الدفع وطباعة
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'books' && (
            <motion.div 
              key="books"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">إدارة مخزون الكتب</h1>
                  <p className="text-slate-500 text-sm">إدارة قائمة الكتب وتتبع مستويات المخزون</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBulkPriceModal(true)}
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all select-none touch-manipulation"
                  >
                    <ArrowRightLeft size={20} />
                    تعديل الأسعار بالجملة
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setProductForm({
                        title: '',
                        author: '',
                        isbn: '',
                        category_id: 0,
                        purchase_price: 0,
                        selling_price: 0,
                        stock_quantity: 0,
                        min_stock_level: 5,
                        type: 'book'
                      });
                      setShowProductModal({ show: true, mode: 'add', type: 'book' });
                    }}
                    className="flex items-center gap-2 bg-brand-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-gold-light transition-all shadow-lg shadow-brand-gold/20 select-none touch-manipulation"
                  >
                    <Plus size={20} />
                    إضافة كتاب جديد
                  </motion.button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم الكتاب</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">المؤلف</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">ISBN / كود</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">سعر الشراء</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">سعر البيع</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الكمية</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.filter(b => b.type === 'book').map(book => (
                      <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{book.title}</td>
                        <td className="px-6 py-4 text-slate-600">{book.author}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{book.isbn}</td>
                        <td className="px-6 py-4 text-slate-600">{book.purchase_price} ر.س</td>
                        <td className="px-6 py-4 font-bold text-brand-gold">{book.selling_price} ر.س</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${book.stock_quantity > book.min_stock_level ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {book.stock_quantity} في المخزن
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setProductForm({
                                  title: book.title,
                                  author: book.author,
                                  isbn: book.isbn || '',
                                  category_id: book.category_id || 0,
                                  purchase_price: book.purchase_price,
                                  selling_price: book.selling_price,
                                  stock_quantity: book.stock_quantity,
                                  min_stock_level: book.min_stock_level,
                                  type: 'book'
                                });
                                setShowProductModal({ show: true, mode: 'edit', type: 'book', bookId: book.id });
                              }}
                              className="p-2 text-slate-400 hover:text-brand-gold hover:bg-amber-50 rounded-lg transition-colors select-none touch-manipulation"
                            >
                              <Settings size={18} />
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteProduct(book.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors select-none touch-manipulation"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'tech' && (
            <motion.div 
              key="tech"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">إدارة مخزون التكنولوجيا</h1>
                  <p className="text-slate-500 text-sm">إدارة الجوالات والإكسسوارات والمنتجات التقنية</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBulkPriceModal(true)}
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all select-none touch-manipulation"
                  >
                    <ArrowRightLeft size={20} />
                    تعديل الأسعار بالجملة
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setProductForm({
                        title: '',
                        author: '',
                        isbn: '',
                        category_id: 0,
                        purchase_price: 0,
                        selling_price: 0,
                        stock_quantity: 0,
                        min_stock_level: 5,
                        type: 'tech'
                      });
                      setShowProductModal({ show: true, mode: 'add', type: 'tech' });
                    }}
                    className="flex items-center gap-2 bg-brand-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-gold-light transition-all shadow-lg shadow-brand-gold/20 select-none touch-manipulation"
                  >
                    <Plus size={20} />
                    إضافة منتج تقني
                  </motion.button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">المنتج / الموديل</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الشركة / الماركة</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">IMEI / S.N</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">سعر الشراء</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">سعر البيع</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الكمية</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.filter(b => b.type === 'tech').map(product => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{product.title}</td>
                        <td className="px-6 py-4 text-slate-600">{product.author}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{product.isbn}</td>
                        <td className="px-6 py-4 text-slate-600">{product.purchase_price} ر.س</td>
                        <td className="px-6 py-4 font-bold text-brand-gold">{product.selling_price} ر.س</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${product.stock_quantity > product.min_stock_level ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {product.stock_quantity} في المخزن
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setProductForm({
                                  title: product.title,
                                  author: product.author,
                                  isbn: product.isbn || '',
                                  category_id: product.category_id || 0,
                                  purchase_price: product.purchase_price,
                                  selling_price: product.selling_price,
                                  stock_quantity: product.stock_quantity,
                                  min_stock_level: product.min_stock_level,
                                  type: 'tech'
                                });
                                setShowProductModal({ show: true, mode: 'edit', type: 'tech', bookId: product.id });
                              }}
                              className="p-2 text-slate-400 hover:text-brand-gold hover:bg-amber-50 rounded-lg transition-colors select-none touch-manipulation"
                            >
                              <Settings size={18} />
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors select-none touch-manipulation"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">سجل الفواتير والطلبات</h1>
                  <p className="text-slate-500 text-sm">تتبع كافة العمليات المالية وحالات الشحن</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="بحث برقم الطلب أو اسم العميل..." 
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-gold/30"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold outline-none"
                  value={orderFilterType}
                  onChange={e => setOrderFilterType(e.target.value)}
                >
                  <option value="all">كل الأنواع</option>
                  <option value="direct">بيع مباشر</option>
                  <option value="shipment">شحن</option>
                  <option value="booking">حجز</option>
                </select>
                <select 
                  className="p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold outline-none"
                  value={orderFilterStatus}
                  onChange={e => setOrderFilterStatus(e.target.value)}
                >
                  <option value="all">كل الحالات</option>
                  <option value="completed">مكتمل</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <select 
                  className="p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold outline-none"
                  value={orderFilterPayment}
                  onChange={e => setOrderFilterPayment(e.target.value)}
                >
                  <option value="all">كل حالات الدفع</option>
                  <option value="paid">مدفوع</option>
                  <option value="unpaid">غير مدفوع</option>
                  <option value="partial">جزئي</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الفاتورة</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">النوع</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">العميل</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الموظف</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الدفع</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(o => {
                        const matchesSearch = o.id.toString().includes(orderSearch) || (o.display_customer_name || '').includes(orderSearch);
                        const matchesType = orderFilterType === 'all' || o.order_type === orderFilterType;
                        const matchesStatus = orderFilterStatus === 'all' || o.status === orderFilterStatus;
                        const matchesPayment = orderFilterPayment === 'all' || o.payment_status === orderFilterPayment;
                        return matchesSearch && matchesType && matchesStatus && matchesPayment;
                      })
                      .map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">#{order.id}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                            order.order_type === 'direct' ? 'bg-slate-100 text-slate-600' :
                            order.order_type === 'shipment' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {order.order_type === 'direct' ? 'مباشر' : order.order_type === 'shipment' ? 'شحن' : 'حجز'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-[10px]">
                          {new Date(order.created_at).toLocaleString('ar-SA')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-brand-navy">{order.display_customer_name || 'عميل نقدي'}</p>
                          {order.display_customer_phone && (
                            <p className="text-[10px] text-slate-500 font-bold">{order.display_customer_phone}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-brand-navy">{order.cashier_name}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${order.cashier_role === 'admin' ? 'text-brand-gold' : 'text-slate-400'}`}>
                              {order.cashier_role === 'admin' ? 'مدير' : 'كاشير'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-blue text-sm">{order.total_amount} ر.س</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                            order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                            order.payment_status === 'partial' ? 'bg-amber-100 text-amber-600' :
                            'bg-rose-100 text-rose-600'
                          }`}>
                            {order.payment_status === 'paid' ? 'مدفوع' : order.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none outline-none cursor-pointer transition-colors touch-manipulation ${
                              order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                              order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                              'bg-rose-100 text-rose-600'
                            }`}
                          >
                            <option value="completed">مكتمل</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                setTimeout(() => handlePrintInvoice(), 100);
                              }}
                              className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Printer size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                const amount = prompt('أدخل مبلغ المرتجع:');
                                const reason = prompt('سبب المرتجع:');
                                if (amount && !isNaN(Number(amount))) {
                                  fetch('/api/returns', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ order_id: order.id, amount: Number(amount), reason })
                                  }).then(() => fetchData());
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <ArrowRightLeft size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">التقارير المالية</h1>
                  <p className="text-slate-500 text-sm">تحليل شامل للأداء المالي للمكتبة</p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePrintReport()}
                    className="flex items-center gap-2 bg-brand-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-brand-navy/20 select-none touch-manipulation"
                  >
                    <Printer size={20} />
                    طباعة التقرير
                  </motion.button>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 card-shadow">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">من تاريخ</label>
                      <input 
                        type="date" 
                        className="px-3 py-1 text-sm outline-none border-none font-bold text-slate-700"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                      />
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">إلى تاريخ</label>
                      <input 
                        type="date" 
                        className="px-3 py-1 text-sm outline-none border-none font-bold text-slate-700"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي المبيعات" value={`${reportData?.totalSales.toLocaleString()} ر.س`} icon={DollarSign} color="bg-brand-navy" />
                <StatCard title="صافي الربح" value={`${reportData?.netProfit.toLocaleString()} ر.س`} icon={TrendingUp} color="bg-brand-gold" />
                <StatCard title="حقوق الملكية" value={`${reportData?.equity.toLocaleString()} ر.س`} icon={Briefcase} color="bg-slate-800" />
                <StatCard title="إجمالي النقدية" value={`${reportData?.totalCashInSafes.toLocaleString()} ر.س`} icon={Wallet} color="bg-indigo-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">ملخص قائمة الأرباح والخسائر</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="text-slate-600">إجمالي الإيرادات</span>
                      <span className="text-lg font-bold">{reportData?.totalSales.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl text-rose-700">
                      <span className="">إجمالي المرتجعات (-)</span>
                      <span className="text-lg font-bold">{reportData?.totalReturns.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="text-slate-600">تكلفة المنتجات المباعة (COGS)</span>
                      <span className="text-lg font-bold">{reportData?.totalCapital.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl text-emerald-700">
                      <span className="font-bold">إجمالي الربح (Gross Profit)</span>
                      <span className="text-xl font-black">{reportData?.grossProfit.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl text-rose-700">
                      <span className="">إجمالي المصروفات (-)</span>
                      <span className="text-lg font-bold">{reportData?.totalExpenses.toLocaleString()} ر.s</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-brand-blue rounded-2xl text-white shadow-lg">
                      <span className="text-lg font-bold">صافي الربح النهائي</span>
                      <span className="text-2xl font-black">{reportData?.netProfit.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">الخزائن والالتزامات</h3>
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-100 rounded-2xl">
                        <p className="text-sm text-slate-500 mb-2">النقدية في الخزائن المفتوحة</p>
                        <div className="space-y-2">
                          {reportData?.cashInSafes.map((safe: any) => (
                            <div key={safe.username} className="flex justify-between text-sm">
                              <span>خزينة {safe.username}</span>
                              <span className="font-bold">{safe.current_cash.toLocaleString()} ر.س</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-brand-blue">
                            <span>الإجمالي</span>
                            <span>{reportData?.totalCashInSafes.toLocaleString()} ر.س</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-2xl flex justify-between items-center text-rose-700">
                        <span className="font-bold">مستحقات الموردين</span>
                        <span className="text-xl font-black">{reportData?.supplierDebt.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">إدارة رأس المال</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-700">
                        <p className="text-xs mb-1">إيداعات رأس المال</p>
                        <p className="text-xl font-black">{reportData?.capitalDeposits.toLocaleString()} ر.س</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-2xl text-rose-700">
                        <p className="text-xs mb-1">مسحوبات الأرباح</p>
                        <p className="text-xl font-black">{reportData?.profitWithdrawals.toLocaleString()} ر.س</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            const amount = prompt('أدخل مبلغ الإيداع:');
                            const desc = prompt('الوصف:');
                            if (amount && !isNaN(Number(amount))) {
                              fetch('/api/capital-movements', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'deposit', amount: Number(amount), description: desc })
                              }).then(() => fetchReports());
                            }
                          }}
                          className="py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                        >
                          تسجيل إيداع
                        </button>
                        <button 
                          onClick={() => {
                            const amount = prompt('أدخل مبلغ المسحوبات:');
                            const desc = prompt('الوصف:');
                            if (amount && !isNaN(Number(amount))) {
                              fetch('/api/capital-movements', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'withdrawal', amount: Number(amount), description: desc })
                              }).then(() => fetchReports());
                            }
                          }}
                          className="py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors"
                        >
                          تسجيل مسحوبات
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                      <span className="font-bold">حقوق الملكية</span>
                      <span className="text-xl font-black">{reportData?.equity.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden">
                <FinancialReportPrint ref={reportPrintRef} data={reportData} dateRange={dateRange} />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-8">تحليل المبيعات اليومي</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData?.dailySales || []}>
                      <defs>
                        <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#d97706" strokeWidth={4} fillOpacity={1} fill="url(#reportGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">إدارة العملاء</h1>
                  <p className="text-slate-500 text-sm">تتبع حسابات العملاء ومشترياتهم</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-brand-gold text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-gold/20"
                >
                  <Plus size={20} />
                  إضافة عميل جديد
                </motion.button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الاسم</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الهاتف</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">البريد الإلكتروني</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الرصيد</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map(customer => (
                      <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{customer.name}</td>
                        <td className="px-6 py-4 text-slate-600">{customer.phone}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{customer.email || '-'}</td>
                        <td className={`px-6 py-4 font-bold ${customer.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {customer.balance} ر.س
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-brand-blue hover:underline font-bold text-sm">تعديل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'suppliers' && (
            <motion.div 
              key="suppliers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">إدارة الموردين</h1>
                  <p className="text-slate-500 text-sm">تتبع الموردين وحساباتهم الآجلة</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-brand-navy text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-navy/20"
                >
                  <Plus size={20} />
                  إضافة مورد جديد
                </motion.button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم المورد</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">المسؤول</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الهاتف</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الرصيد المستحق</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{supplier.name}</td>
                        <td className="px-6 py-4 text-slate-600">{supplier.contact_person}</td>
                        <td className="px-6 py-4 text-slate-500">{supplier.phone}</td>
                        <td className="px-6 py-4 font-bold text-rose-600">{supplier.balance} ر.س</td>
                        <td className="px-6 py-4">
                          <button className="text-brand-blue hover:underline font-bold text-sm">تعديل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'purchases' && (
            <motion.div 
              key="purchases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-brand-navy">فواتير المشتريات</h1>
                  <p className="text-slate-500 text-sm">إدارة عمليات الشراء وتحديث المخزون</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                >
                  <Plus size={20} />
                  تسجيل فاتورة شراء
                </motion.button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الفاتورة</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">المورد</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجمالي</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">#{purchase.id}</td>
                        <td className="px-6 py-4 text-slate-600">{purchase.supplier_name}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(purchase.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="px-6 py-4 font-bold text-brand-navy">{purchase.total_amount} ر.س</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                            {purchase.status === 'received' ? 'تم الاستلام' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl space-y-8"
            >
              <h1 className="text-2xl font-black text-brand-navy">إعدادات النظام</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen size={20} className="text-brand-gold" />
                    إعدادات المتجر
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم المكتبة</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" defaultValue="سوق الكتاب" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">العملة</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" defaultValue="ر.س" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users size={20} className="text-brand-gold" />
                    إدارة المستخدمين
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">admin</p>
                        <p className="text-xs text-slate-500">مدير النظام</p>
                      </div>
                      <button className="text-brand-blue font-bold text-xs">تغيير كلمة المرور</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">cashier</p>
                        <p className="text-xs text-slate-500">كاشير</p>
                      </div>
                      <button className="text-brand-blue font-bold text-xs">تغيير كلمة المرور</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'treasury' && (
            <motion.div 
              key="treasury"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-brand-navy">الخزينة والحسابات المالية</h1>
                  <p className="text-slate-500">إدارة الأرصدة، التحويلات، والحركات المالية الدقيقة</p>
                </div>
                <div className="flex gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const name = prompt('اسم الحساب الجديد:');
                      if (name) {
                        fetch('/api/accounts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name })
                        }).then(() => fetchData());
                      }
                    }}
                    className="flex items-center gap-2 bg-brand-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-brand-navy/20"
                  >
                    <Plus size={20} />
                    إضافة حساب/مخصص
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFinancialModal({ show: true, type: 'transfer' })}
                    className="flex items-center gap-2 bg-brand-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-gold-light transition-all shadow-lg shadow-brand-gold/20"
                  >
                    <ArrowRightLeft size={20} />
                    تحويل بين الحسابات
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFinancialModal({ show: true, type: 'deposit' })}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <DollarSign size={20} />
                    إيداع رأس مال
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFinancialModal({ show: true, type: 'withdrawal' })}
                    className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                  >
                    <Wallet size={20} />
                    سحب أرباح
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accounts.map(account => (
                  <motion.div 
                    key={account.id}
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 card-shadow relative overflow-hidden group"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all">
                          <Landmark size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{account.id}</span>
                      </div>
                      <h3 className="text-lg font-black text-brand-navy mb-1">{account.name}</h3>
                      <p className="text-3xl font-black text-brand-gold">{account.balance.toLocaleString()} <span className="text-sm">ر.س</span></p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-brand-gold/5 transition-all" />
                  </motion.div>
                ))}
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 card-shadow overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-brand-navy">آخر الحركات المالية</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full">إيداعات</span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full">سحوبات</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الحساب</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">النوع</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الوصف</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-left">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(t.created_at).toLocaleString('ar-SA')}</td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-brand-navy">{t.account_name}</span>
                              {t.type === 'transfer' && <span className="text-[10px] text-slate-400">إلى: {t.to_account_name}</span>}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              t.type === 'sale' || t.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' :
                              t.type === 'expense' || t.type === 'withdrawal' ? 'bg-rose-100 text-rose-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {t.type === 'sale' ? 'بيع' : t.type === 'expense' ? 'مصروف' : t.type === 'deposit' ? 'إيداع' : t.type === 'withdrawal' ? 'سحب' : 'تحويل'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{t.description}</td>
                          <td className={`px-8 py-5 text-lg font-black text-left ${
                            t.type === 'sale' || t.type === 'deposit' ? 'text-emerald-600' :
                            t.type === 'expense' || t.type === 'withdrawal' ? 'text-rose-600' :
                            'text-blue-600'
                          }`}>
                            {t.type === 'expense' || t.type === 'withdrawal' ? '-' : '+'}{t.amount.toLocaleString()} <span className="text-xs">ر.س</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div 
              key="expenses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-brand-navy">قائمة المصروفات</h1>
                  <p className="text-slate-500">تتبع جميع المصاريف التشغيلية والإدارية</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFinancialModal({ show: true, type: 'expense' })}
                  className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-600/20"
                >
                  <Plus size={20} />
                  إضافة مصروف جديد
                </motion.button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 card-shadow overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الفئة</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الوصف</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(expense.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{expense.description}</td>
                        <td className="px-8 py-5 text-lg font-black text-rose-600 text-left">{expense.amount.toLocaleString()} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Add/Edit Modal */}
        <AnimatePresence>
          {showProductModal.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-brand-navy">
                    {showProductModal.mode === 'add' ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
                    <span className="text-sm font-bold text-brand-gold mr-2">
                      ({showProductModal.type === 'book' ? 'كتاب' : 'تكنولوجيا'})
                    </span>
                  </h2>
                  <button onClick={() => setShowProductModal({ ...showProductModal, show: false })} className="text-slate-400 hover:text-slate-600">
                    <Trash2 size={24} />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {showProductModal.type === 'book' ? 'عنوان الكتاب' : 'اسم المنتج / الموديل'}
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.title}
                      onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {showProductModal.type === 'book' ? 'المؤلف' : 'الشركة / الماركة'}
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.author}
                      onChange={e => setProductForm({ ...productForm, author: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {showProductModal.type === 'book' ? 'ISBN' : 'IMEI / S.N'}
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.isbn}
                      onChange={e => setProductForm({ ...productForm, isbn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">سعر الشراء</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.purchase_price}
                      onChange={e => setProductForm({ ...productForm, purchase_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">سعر البيع</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.selling_price}
                      onChange={e => setProductForm({ ...productForm, selling_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الكمية الحالية</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.stock_quantity}
                      onChange={e => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">تنبيه نقص المخزون</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={productForm.min_stock_level}
                      onChange={e => setProductForm({ ...productForm, min_stock_level: Number(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4 mt-4">
                    <button 
                      type="submit"
                      className="flex-1 bg-brand-gold text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-gold/20"
                    >
                      {showProductModal.mode === 'add' ? 'إضافة المنتج' : 'حفظ التعديلات'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowProductModal({ ...showProductModal, show: false })}
                      className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Financial Modal */}
        <AnimatePresence>
          {showFinancialModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFinancialModal({ show: false, type: 'expense' })}
                className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className={`p-8 text-white ${
                  showFinancialModal.type === 'expense' ? 'bg-rose-600' :
                  showFinancialModal.type === 'transfer' ? 'bg-brand-gold' :
                  showFinancialModal.type === 'deposit' ? 'bg-emerald-600' : 'bg-brand-navy'
                }`}>
                  <h3 className="text-2xl font-black">
                    {showFinancialModal.type === 'expense' ? 'تسجيل مصروف جديد' :
                     showFinancialModal.type === 'transfer' ? 'تحويل بين الحسابات' :
                     showFinancialModal.type === 'deposit' ? 'إيداع رأس مال' : 'سحب أرباح'}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">أدخل تفاصيل الحركة المالية بدقة</p>
                </div>

                <form onSubmit={handleFinancialSubmit} className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">المبلغ (ر.س)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-gold/50 outline-none font-black text-xl"
                        value={financialForm.amount || ''}
                        onChange={e => setFinancialForm({ ...financialForm, amount: Number(e.target.value) })}
                      />
                    </div>
                    
                    {showFinancialModal.type === 'expense' && (
                      <div className="col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الفئة</label>
                        <select 
                          className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold"
                          value={financialForm.category}
                          onChange={e => setFinancialForm({ ...financialForm, category: e.target.value })}
                        >
                          <option value="عام">عام</option>
                          <option value="إيجار">إيجار</option>
                          <option value="رواتب">رواتب</option>
                          <option value="فواتير">فواتير</option>
                          <option value="مشتريات">مشتريات</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        {showFinancialModal.type === 'transfer' ? 'من حساب' : 'الحساب المتأثر'}
                      </label>
                      <select 
                        required
                        className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold"
                        value={financialForm.account_id || ''}
                        onChange={e => setFinancialForm({ ...financialForm, account_id: Number(e.target.value) })}
                      >
                        <option value="">اختر الحساب...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>

                    {showFinancialModal.type === 'transfer' && (
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">إلى حساب</label>
                        <select 
                          required
                          className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold"
                          value={financialForm.to_account_id || ''}
                          onChange={e => setFinancialForm({ ...financialForm, to_account_id: Number(e.target.value) })}
                        >
                          <option value="">اختر الحساب...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الوصف / البيان</label>
                      <textarea 
                        className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold min-h-[100px]"
                        placeholder="اكتب تفاصيل الحركة هنا..."
                        value={financialForm.description}
                        onChange={e => setFinancialForm({ ...financialForm, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className={`flex-1 py-4 rounded-2xl text-white font-black shadow-xl transition-all ${
                        showFinancialModal.type === 'expense' ? 'bg-rose-600 shadow-rose-600/20' :
                        showFinancialModal.type === 'transfer' ? 'bg-brand-gold shadow-brand-gold/20' :
                        showFinancialModal.type === 'deposit' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-brand-navy shadow-brand-navy/20'
                      }`}
                    >
                      تأكيد العملية
                    </motion.button>
                    <button 
                      type="button"
                      onClick={() => setShowFinancialModal({ show: false, type: 'expense' })}
                      className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
