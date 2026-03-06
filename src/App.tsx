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
  Clock,
  Briefcase,
  Sparkles,
  Bookmark,
  Landmark,
  ArrowRightLeft,
  Moon,
  Sun,
  Bell,
  Truck,
  ListTodo,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  Menu,
  X
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
  if (!order) return <div ref={ref} className="hidden" />;
  
  const subtotal = order.total_amount - (order.tax_amount || 0) - (order.shipping_cost || 0);
  const tax = order.tax_amount || 0;

  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 font-sans printable-content" dir="rtl" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-brand-navy pb-8 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center shadow-xl shadow-brand-gold/20">
            <BookOpen size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-brand-navy tracking-tight">سوق الكتاب</h1>
            <p className="text-brand-gold font-bold tracking-[0.2em] uppercase text-xs mt-1">Book Market Store</p>
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-3xl font-black text-brand-navy mb-1">فاتورة ضريبية</h2>
          <p className="text-slate-400 font-mono text-sm">TAX INVOICE</p>
          <div className="mt-4 space-y-1 text-sm text-slate-500 font-bold">
            <p>الرقم الضريبي: 300000000000003</p>
            <p>الرياض، المملكة العربية السعودية</p>
            <p>هاتف: 0500000000</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-8 mb-12 bg-slate-50 p-8 rounded-3xl border border-slate-100">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">معلومات الفاتورة</h3>
          <p className="text-sm font-black text-brand-navy">رقم الفاتورة: <span className="font-mono">#{order.id}</span></p>
          <p className="text-sm font-bold text-slate-600 mt-1">التاريخ: {new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
          <p className="text-sm font-bold text-slate-600">الوقت: {new Date(order.created_at).toLocaleTimeString('ar-SA')}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">العميل</h3>
          <p className="text-sm font-black text-brand-navy">{order.display_customer_name || 'عميل نقدي'}</p>
          <p className="text-sm font-bold text-slate-600 mt-1">{order.display_customer_phone || '-'}</p>
          {order.shipping_address && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{order.shipping_address}</p>}
        </div>
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تفاصيل الدفع</h3>
          <p className="text-sm font-black text-brand-navy">
            طريقة الدفع: {
              order.payment_method === 'cash' ? 'نقدي' : 
              order.payment_method === 'alharam' ? 'حوالة الهرم' :
              order.payment_method === 'sham_cash' ? 'شام كاش' :
              order.payment_method === 'syriatel_cash' ? 'سيرياتيل كاش' : 'آجل'
            }
          </p>
          <p className="text-sm font-bold text-slate-600 mt-1">
            الحالة: <span className={order.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}>
              {order.payment_status === 'paid' ? 'مدفوع بالكامل' : order.payment_status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">الموظف: {order.cashier_name}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-brand-navy text-brand-navy">
              <th className="py-4 text-right font-black text-sm">المنتج / الوصف</th>
              <th className="py-4 text-center font-black text-sm">الكمية</th>
              <th className="py-4 text-center font-black text-sm">سعر الوحدة</th>
              <th className="py-4 text-left font-black text-sm">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <tr key={item.id} className="group">
                  <td className="py-5">
                    <div className="font-black text-brand-navy">{item.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ISBN: {item.isbn || 'N/A'}</div>
                  </td>
                  <td className="py-5 text-center font-bold text-slate-600">{item.quantity}</td>
                  <td className="py-5 text-center font-bold text-slate-600">{item.unit_price.toLocaleString()} ر.س</td>
                  <td className="py-5 text-left font-black text-brand-navy">{item.total_price.toLocaleString()} ر.س</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-5 font-black text-brand-navy">مبيعات متنوعة</td>
                <td className="py-5 text-center font-bold text-slate-600">1</td>
                <td className="py-5 text-center font-bold text-slate-600">{(order.total_amount - (order.shipping_cost || 0)).toLocaleString()} ر.س</td>
                <td className="py-5 text-left font-black text-brand-navy">{(order.total_amount - (order.shipping_cost || 0)).toLocaleString()} ر.س</td>
              </tr>
            )}
            {order.shipping_cost > 0 && (
              <tr className="bg-slate-50/50">
                <td className="py-5 font-black text-brand-navy">رسوم الشحن والتوصيل</td>
                <td className="py-5 text-center font-bold text-slate-600">1</td>
                <td className="py-5 text-center font-bold text-slate-600">{order.shipping_cost.toLocaleString()} ر.س</td>
                <td className="py-5 text-left font-black text-brand-navy">{order.shipping_cost.toLocaleString()} ر.س</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between items-end">
        <div className="text-slate-400 text-[10px] max-w-xs leading-relaxed">
          <p className="font-bold mb-1">سياسة الاسترجاع والاستبدال:</p>
          <p>يتم الاستبدال خلال 3 أيام من تاريخ الشراء بشرط سلامة الكتاب ووجود الفاتورة الأصلية. الكتب المفتوحة أو المتضررة لا تسترد ولا تستبدل.</p>
        </div>
        <div className="w-80 space-y-3 bg-brand-navy p-8 rounded-3xl text-white shadow-2xl shadow-brand-navy/20">
          <div className="flex justify-between text-sm opacity-70">
            <span>المجموع الفرعي (بدون ضريبة):</span>
            <span className="font-mono">{subtotal.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-sm opacity-70">
            <span>ضريبة القيمة المضافة (15%):</span>
            <span className="font-mono">{tax.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/10 mt-2">
            <span>الإجمالي:</span>
            <span className="text-brand-gold font-mono">{order.total_amount.toLocaleString()} ر.س</span>
          </div>
          {order.payment_status !== 'paid' && (
            <div className="space-y-2 pt-4 border-t border-white/10 mt-2">
              <div className="flex justify-between text-sm opacity-70">
                <span>المبلغ المدفوع:</span>
                <span className="font-mono">{(order.paid_amount || 0).toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-sm font-black text-brand-gold">
                <span>المبلغ المتبقي:</span>
                <span className="font-mono">{(order.total_amount - (order.paid_amount || 0)).toLocaleString()} ر.س</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center">
        <div className="text-right">
          <p className="text-sm font-black text-brand-navy">شكراً لزيارتكم سوق الكتاب!</p>
          <p className="text-xs text-slate-400 mt-1">نتمنى لكم رحلة معرفية ممتعة</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 border-2 border-slate-100 rounded-2xl flex items-center justify-center p-2">
            {/* Simulated QR Code */}
            <div className="w-full h-full bg-slate-50 grid grid-cols-4 grid-rows-4 gap-1 p-1 opacity-20">
              {[...Array(16)].map((_, i) => (
                <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>
              ))}
            </div>
          </div>
          <p className="text-[8px] text-slate-300 uppercase tracking-tighter">Verified Digital Invoice</p>
        </div>
      </div>
    </div>
  );
});

const DailySalesReportPrint = React.forwardRef(({ orders, date }: { orders: Order[], date: string }, ref: any) => {
  if (!orders) return <div ref={ref} className="hidden" />;
  
  const dailyOrders = orders.filter(o => o.created_at.startsWith(date));
  const totalSales = dailyOrders.reduce((sum, o) => sum + o.total_amount, 0);
  
  const byMethod = {
    cash: dailyOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount, 0),
    alharam: dailyOrders.filter(o => o.payment_method === 'alharam').reduce((sum, o) => sum + o.total_amount, 0),
    sham_cash: dailyOrders.filter(o => o.payment_method === 'sham_cash').reduce((sum, o) => sum + o.total_amount, 0),
    syriatel_cash: dailyOrders.filter(o => o.payment_method === 'syriatel_cash').reduce((sum, o) => sum + o.total_amount, 0),
    debt: dailyOrders.filter(o => o.payment_method === 'debt').reduce((sum, o) => sum + o.total_amount, 0),
  };

  const byType = {
    direct: dailyOrders.filter(o => o.order_type === 'direct').length,
    shipment: dailyOrders.filter(o => o.order_type === 'shipment').length,
    booking: dailyOrders.filter(o => o.order_type === 'booking').length,
  };

  const shippingRevenue = dailyOrders.reduce((sum, o) => sum + (o.shipping_cost || 0), 0);

  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 printable-content" dir="rtl">
      <div className="flex justify-between items-center border-b-4 border-brand-navy pb-8 mb-10">
        <div>
          <h1 className="text-3xl font-black text-brand-navy mb-2">تقرير المبيعات اليومي</h1>
          <p className="text-slate-500 font-bold">التاريخ: {new Date(date).toLocaleDateString('ar-SA')}</p>
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-black text-brand-gold">سوق الكتاب</h2>
          <p className="text-sm text-slate-400">ملخص العمليات اليومية</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase mb-2">إجمالي المبيعات</p>
          <p className="text-2xl font-black text-brand-navy">{totalSales.toLocaleString()} ر.س</p>
          <p className="text-[10px] text-slate-400 mt-1">عدد العمليات: {dailyOrders.length}</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase mb-2">إيرادات الشحن</p>
          <p className="text-2xl font-black text-indigo-600">{shippingRevenue.toLocaleString()} ر.س</p>
          <p className="text-[10px] text-slate-400 mt-1">طلبات الشحن: {byType.shipment}</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase mb-2">الحجوزات الجديدة</p>
          <p className="text-2xl font-black text-amber-600">{byType.booking}</p>
          <p className="text-[10px] text-slate-400 mt-1">بانتظار الاستلام</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-black text-brand-navy border-b-2 border-slate-100 pb-2 mb-4">تفصيل طرق الدفع</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-bold text-slate-600">نقدي</span>
              <span className="font-black">{byMethod.cash.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-bold text-slate-600">حوالة الهرم</span>
              <span className="font-black">{byMethod.alharam.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-bold text-slate-600">شام كاش</span>
              <span className="font-black">{byMethod.sham_cash.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-bold text-slate-600">سيرياتيل كاش</span>
              <span className="font-black">{byMethod.syriatel_cash.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="font-bold text-slate-600">آجل / ديون</span>
              <span className="font-black text-rose-600">{byMethod.debt.toLocaleString()} ر.س</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-brand-navy border-b-2 border-slate-100 pb-2 mb-4">سجل العمليات التفصيلي</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-slate-400 border-b border-slate-100">
                <th className="py-3 font-black">رقم الطلب</th>
                <th className="py-3 font-black">العميل</th>
                <th className="py-3 font-black">النوع</th>
                <th className="py-3 font-black text-center">طريقة الدفع</th>
                <th className="py-3 font-black text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dailyOrders.map(order => (
                <tr key={order.id}>
                  <td className="py-3 font-mono">#{order.id}</td>
                  <td className="py-3 font-bold">{order.display_customer_name || 'عميل نقدي'}</td>
                  <td className="py-3 text-xs">
                    {order.order_type === 'shipment' ? 'شحن' : order.order_type === 'booking' ? 'حجز' : 'مباشر'}
                  </td>
                  <td className="py-3 text-center text-xs">
                    {order.payment_method === 'cash' ? 'نقدي' : order.payment_method === 'alharam' ? 'هرم' : 'إلكتروني'}
                  </td>
                  <td className="py-3 text-left font-black">{order.total_amount.toLocaleString()} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px]">
        <p>تم استخراج هذا التقرير آلياً من نظام سوق الكتاب بتاريخ {new Date().toLocaleString('ar-SA')}</p>
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
    className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow transition-colors"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
  </motion.div>
);

const FinancialReportPrint = React.forwardRef(({ data, dateRange }: { data: any, dateRange: any }, ref: any) => {
  if (!data) return <div ref={ref} className="hidden" />;
  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 printable-content" dir="rtl">
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
  );
});

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sooq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [promptDialog, setPromptDialog] = useState<{ show: boolean, title: string, label: string, value: string, onConfirm: (val: string) => void }>({ show: false, title: '', label: '', value: '', onConfirm: () => {} });

  useEffect(() => {
    if (user) {
      localStorage.setItem('sooq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sooq_user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sooq_user');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const promptAction = (title: string, label: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setPromptDialog({ show: true, title, label, value: defaultValue, onConfirm });
  };
  
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'alharam' | 'sham_cash' | 'syriatel_cash' | 'debt'>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [showFinancialModal, setShowFinancialModal] = useState<{ show: boolean, type: 'expense' | 'deposit' | 'withdrawal' | 'transfer' }>({ show: false, type: 'expense' });
  const [showSupplierModal, setShowSupplierModal] = useState<{ show: boolean, mode: 'add' | 'edit', supplierId?: number }>({ show: false, mode: 'add' });
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState<{ show: boolean, supplierId?: number, supplierName?: string }>({ show: false });
  const [showCustomerModal, setShowCustomerModal] = useState<{ show: boolean, mode: 'add' | 'edit', customerId?: number }>({ show: false, mode: 'add' });
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] = useState<{ show: boolean, customerId?: number, customerName?: string }>({ show: false });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [customerPaymentForm, setCustomerPaymentForm] = useState({ amount: 0, account_id: 0, description: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplier_id: 0, items: [] as { book_id: number, quantity: number, unit_price: number }[] });
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
  const dailyReportRef = useRef(null);

  const handlePrintDailyReport = useReactToPrint({
    contentRef: dailyReportRef,
    onBeforePrint: () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    },
    onAfterPrint: () => {
      toast.success('تم طباعة التقرير اليومي بنجاح');
    },
    onPrintError: (error) => {
      console.error('Printing failed:', error);
      toast.error('فشلت عملية الطباعة');
    }
  });

  const reportPrintRef = useRef(null);
  const invoiceRef = useRef(null);

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    onBeforePrint: () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    },
    onAfterPrint: () => {
      console.log('Invoice printed successfully');
    },
    onPrintError: (error) => {
      console.error('Printing failed:', error);
      toast.error('فشلت عملية الطباعة، يرجى المحاولة مرة أخرى');
    }
  });

  const handlePrintReport = useReactToPrint({
    contentRef: reportPrintRef,
    onBeforePrint: () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    },
    onAfterPrint: () => {
      console.log('Report printed successfully');
    },
    onPrintError: (error) => {
      console.error('Printing failed:', error);
      toast.error('فشلت عملية الطباعة، يرجى المحاولة مرة أخرى');
    }
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
    // Global unhandled rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('WebSocket') || event.reason?.message?.includes('websocket')) {
        event.preventDefault(); // Suppress noisy WebSocket errors
        return;
      }
      console.error('Unhandled Rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleRejection);
    
    // Check server health
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (err) {
        setServerStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      
      const socket = io(window.location.origin, {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 10,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        path: '/socket.io/'
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('connect_error', (err) => {
        // Only log if it's not a common/expected error in this environment
        if (err.message !== 'websocket error' && err.message !== 'xhr poll error') {
          console.error('Socket connection error:', err.message);
        }
        
        if (err.message === 'xhr poll error' || err.message === 'websocket error') {
          // Silent fallback is handled by socket.io transports array
        }
      });

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
    
    let finalCategoryId = productForm.category_id;
    if (finalCategoryId === 0 && categories.length > 0) {
      const generalCat = categories.find(c => c.name === 'عام');
      if (generalCat) finalCategoryId = generalCat.id;
      else finalCategoryId = categories[0].id;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, category_id: finalCategoryId, type: showProductModal.type })
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

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = showSupplierModal.mode === 'add' ? '/api/suppliers' : `/api/suppliers/${showSupplierModal.supplierId}`;
    const method = showSupplierModal.mode === 'add' ? 'POST' : 'PUT';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      if (res.ok) {
        setShowSupplierModal({ ...showSupplierModal, show: false });
        setSupplierForm({ name: '', contact_person: '', phone: '' });
        fetchData();
        toast.success('تم حفظ بيانات المورد');
      }
    } catch (err) {
      toast.error('فشلت العملية');
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = showCustomerModal.mode === 'add' ? '/api/customers' : `/api/customers/${showCustomerModal.customerId}`;
    const method = showCustomerModal.mode === 'add' ? 'POST' : 'PUT';
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      if (res.ok) {
        setShowCustomerModal({ ...showCustomerModal, show: false });
        setCustomerForm({ name: '', phone: '', email: '' });
        fetchData();
        toast.success('تم حفظ بيانات العميل');
      }
    } catch (err) {
      toast.error('فشلت العملية');
    }
  };

  const handleCustomerPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCustomerPaymentModal.customerId) return;
    try {
      const res = await fetch(`/api/customers/${showCustomerPaymentModal.customerId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerPaymentForm)
      });
      if (res.ok) {
        setShowCustomerPaymentModal({ show: false });
        setCustomerPaymentForm({ amount: 0, account_id: 0, description: '' });
        fetchData();
        toast.success('تم تسجيل الدفعة بنجاح');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseForm.supplier_id === 0 || purchaseForm.items.length === 0) {
      toast.error('يرجى اختيار مورد وإضافة منتجات');
      return;
    }
    const total_amount = purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...purchaseForm, total_amount })
      });
      if (res.ok) {
        setShowPurchaseModal(false);
        setPurchaseForm({ supplier_id: 0, items: [] });
        fetchData();
        toast.success('تم تسجيل فاتورة الشراء بنجاح');
      }
    } catch (err) {
      toast.error('فشلت العملية');
    }
  };

  const deleteProduct = async (id: number) => {
    confirmAction('حذف المنتج', 'هل أنت متأكد من حذف هذا المنتج؟', async () => {
      try {
        const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
          toast.success('تم الحذف بنجاح');
        }
      } catch (err) {
        toast.error('فشل الحذف');
      }
    });
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
        toast.success('تمت العملية بنجاح');
      } else {
        const data = await res.json();
        toast.error(`خطأ: ${data.error || data.message || 'فشلت العملية'}`);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تنفيذ العملية');
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, []);

  const fetchData = async (retryCount = 0) => {
    try {
      const endpoints = [
        '/api/stats',
        '/api/books',
        '/api/customers',
        '/api/orders',
        '/api/expenses',
        '/api/suppliers',
        '/api/purchases',
        '/api/categories',
        '/api/accounts',
        '/api/transactions'
      ];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      
      // Check if all responses are OK
      for (const res of responses) {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status} on ${res.url}`);
      }

      const [statsData, booksData, customersData, ordersData, expensesData, suppliersData, purchasesData, categoriesData, accountsData, transactionsData] = await Promise.all(responses.map(res => res.json()));
      
      setStats(statsData);
      setBooks(booksData);
      setCustomers(customersData);
      setOrders(ordersData);
      setExpenses(expensesData);
      setSuppliers(suppliersData);
      setPurchases(purchasesData);
      setCategories(categoriesData);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      fetchReports();
      setServerStatus('online');
    } catch (err) {
      console.error('Error fetching data:', err);
      setServerStatus('offline');
      
      // Retry logic
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch in ${delay}ms... (Attempt ${retryCount + 1})`);
        setTimeout(() => fetchData(retryCount + 1), delay);
      } else {
        toast.error('فشل الاتصال بالخادم، يرجى التأكد من تشغيل النظام');
      }
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
    setIsLoading(true);
    try {
      // Use a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else {
          setError('حدث خطأ في الخادم، يرجى المحاولة لاحقاً');
        }
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        fetchData();
        toast.success(`أهلاً بك ${data.user.username}`);
        if (data.user.role === 'cashier') setActiveTab('pos');
      } else {
        setError(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('تعذر الاتصال بالخادم، تأكد من اتصالك بالإنترنت');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (book: Book) => {
    if (book.stock_quantity <= 0) {
      toast('هذا الكتاب غير متوفر حالياً', {
        description: 'هل تود تسجيل طلب حجز لهذا الكتاب؟',
        action: {
          label: 'تسجيل طلب حجز',
          onClick: () => {
            setOrderType('booking');
            setCart(prev => {
              const existing = prev.find(item => item.id === book.id);
              if (existing) {
                return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
              }
              return [...prev, { ...book, quantity: 1 }];
            });
            toast.success('تمت إضافة الكتاب كطلب حجز');
          }
        }
      });
      return;
    }
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
    const total = subtotal + tax + ((orderType === 'shipment' || orderType === 'booking') ? Number(shipmentDetails.cost) : 0);

    let finalPaidAmount = 0;
    if (paymentStatus === 'paid') finalPaidAmount = total;
    else if (paymentStatus === 'partial') finalPaidAmount = paidAmount;

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
          payment_method: paymentMethod,
          order_type: orderType,
          payment_status: paymentStatus,
          paid_amount: finalPaidAmount,
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
        setPaymentMethod('cash');
        setPaidAmount(0);
        setShipmentDetails({
          address: '',
          cost: 0,
          source: 'whatsapp',
          clientName: '',
          clientPhone: ''
        });
        fetchData();
        setShowCheckoutSuccess({ show: true, orderId: data.orderId });
        toast.success('تم إتمام الطلب بنجاح');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء إتمام الطلب');
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
        toast.success('تم تحديث حالة الشحن');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث حالة الشحن');
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
        toast.success('تم تحديث الحالة بنجاح');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const printOrderById = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const fullOrder = await res.json();
      setSelectedOrder(fullOrder);
      // Wait for state to update and component to render
      setTimeout(() => {
        handlePrintInvoice();
      }, 1000);
    } catch (err) {
      console.error('Error fetching order for print:', err);
      toast.error('فشل تحميل بيانات الفاتورة للطباعة');
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
          
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' : serverStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {serverStatus === 'online' ? 'الخادم متصل' : serverStatus === 'offline' ? 'الخادم غير متصل' : 'جاري التحقق من الخادم...'}
              </span>
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
            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">كلمة المرور</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all bg-slate-50 touch-manipulation pr-5 pl-12"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 bottom-4 text-slate-400 hover:text-brand-gold transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
              disabled={isLoading}
              className="w-full bg-brand-navy text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-brand-navy/20 select-none touch-manipulation disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  جاري التحقق...
                </>
              ) : 'تسجيل الدخول'}
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
    <div className="min-h-screen flex bg-brand-bg relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 
        transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shadow-xl
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between lg:block">
          <Logo />
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={ShoppingCart} label="نقطة البيع (POS)" active={activeTab === 'pos'} onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }} />
          
          {user.role === 'admin' && (
            <>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">المخزون والمبيعات</div>
              <SidebarItem icon={FileText} label="الفواتير" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Package} label="مخزون الكتب" active={activeTab === 'books'} onClick={() => { setActiveTab('books'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Sparkles} label="مخزون التكنولوجيا" active={activeTab === 'tech'} onClick={() => { setActiveTab('tech'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={ListTodo} label="الطلبات المحجوزة" active={activeTab === 'requested'} onClick={() => { setActiveTab('requested'); setIsSidebarOpen(false); }} />
              
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">المشتريات والموردين</div>
              <SidebarItem icon={Briefcase} label="المشتريات" active={activeTab === 'purchases'} onClick={() => { setActiveTab('purchases'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Users} label="الموردون" active={activeTab === 'suppliers'} onClick={() => { setActiveTab('suppliers'); setIsSidebarOpen(false); }} />
              
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 px-4">العملاء والمالية</div>
              <SidebarItem icon={Users} label="العملاء" active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Landmark} label="الخزينة والحسابات" active={activeTab === 'treasury'} onClick={() => { setActiveTab('treasury'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Wallet} label="المصروفات" active={activeTab === 'expenses'} onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Truck} label="تتبع الشحنات" active={activeTab === 'shipments'} onClick={() => { setActiveTab('shipments'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={TrendingUp} label="التقارير المالية" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Settings} label="الإعدادات" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all font-bold text-sm select-none touch-manipulation"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto transition-colors duration-300">
        <Toaster position="top-center" richColors />
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-100 card-shadow">
          <Logo />
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-brand-navy hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
        
        {/* Hidden Invoice for Printing */}
        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
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
                      if (showCheckoutSuccess.orderId) {
                        printOrderById(showCheckoutSuccess.orderId);
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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchData}
                    className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="تحديث البيانات"
                  >
                    <RefreshCw size={20} />
                  </motion.button>
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-600">
                    <Calendar size={18} />
                    <span className="font-semibold">{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard title="مبيعات اليوم" value={`${stats?.todaySales.toLocaleString()} ر.س`} icon={DollarSign} color="bg-emerald-600" />
                <StatCard title="صافي أرباح اليوم" value={`${stats?.todayNetProfit.toLocaleString()} ر.س`} icon={TrendingUp} color="bg-brand-gold" />
                <StatCard title="إجمالي المبيعات" value={`${stats?.totalSales.toLocaleString()} ر.س`} icon={CreditCard} color="bg-blue-600" />
                <StatCard title="نقص المخزون" value={stats?.lowStock || 0} icon={AlertCircle} color="bg-rose-600" />
                <StatCard title="دفعات متأخرة" value={stats?.overduePayments || 0} icon={Clock} color="bg-amber-600" />
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
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%" debounce={100}>
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-zinc-800" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }} className="text-slate-400 dark:text-slate-500" />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }} className="text-slate-400 dark:text-slate-500" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', direction: 'rtl', backgroundColor: 'var(--tw-bg-opacity, #fff)' }}
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
                            {stats?.overduePayments > 0 && (
                              <li className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                <Clock size={16} className="text-amber-500" />
                                <span>لديك {stats.overduePayments} فواتير دفع جزئي أو غير مدفوعة.</span>
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
                        className={`bg-white p-5 rounded-2xl border border-slate-100 card-shadow text-right transition-all group select-none touch-manipulation ${book.stock_quantity <= 0 ? 'opacity-70 grayscale-0 border-rose-200' : 'active:bg-slate-50'}`}
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">سلة المشتريات</h3>
                    {cart.length > 0 && (
                      <button 
                        onClick={() => setCart([])}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        تفريغ السلة
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl">
                    <button 
                      onClick={() => setOrderType('direct')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'direct' ? 'bg-white dark:bg-zinc-700 text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                      بيع مباشر
                    </button>
                    <button 
                      onClick={() => setOrderType('shipment')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'shipment' ? 'bg-white dark:bg-zinc-700 text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                      شحن
                    </button>
                    <button 
                      onClick={() => setOrderType('booking')}
                      className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${orderType === 'booking' ? 'bg-white dark:bg-zinc-700 text-brand-navy shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
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
                    {paymentStatus === 'partial' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                      >
                        <input 
                          type="number" 
                          placeholder="المبلغ المدفوع حالياً..." 
                          className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-300 font-bold"
                          value={paidAmount || ''}
                          onChange={e => setPaidAmount(Number(e.target.value))}
                        />
                      </motion.div>
                    )}
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
                        {(orderType === 'shipment' || orderType === 'booking') && (
                          <input 
                            type="number" 
                            placeholder={orderType === 'shipment' ? "تكلفة الشحن" : "رسوم إضافية/شحن"} 
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
                      <span>{(cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0) * 1.15 + ((orderType === 'shipment' || orderType === 'booking') ? Number(shipmentDetails.cost || 0) : 0)).toLocaleString()} ر.س</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 grid grid-cols-2 gap-3">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors select-none touch-manipulation ${
                          paymentMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <DollarSign size={18} />
                        نقداً
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('alharam')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors select-none touch-manipulation ${
                          paymentMethod === 'alharam' ? 'bg-brand-gold text-white border-brand-gold shadow-lg shadow-brand-gold/20' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <ArrowRightLeft size={18} />
                        حوالة الهرم
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('sham_cash')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors select-none touch-manipulation ${
                          paymentMethod === 'sham_cash' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <Wallet size={18} />
                        شام كاش
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('syriatel_cash')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors select-none touch-manipulation ${
                          paymentMethod === 'syriatel_cash' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <Smartphone size={18} />
                        سيرياتيل كاش
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setPaymentMethod('debt');
                          setPaymentStatus('unpaid');
                        }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors select-none touch-manipulation ${
                          paymentMethod === 'debt' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
                        }`}
                      >
                        <Clock size={18} />
                        آجل / ديون
                      </motion.button>
                    </div>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePrintDailyReport()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-gold/20"
                  >
                    <Printer size={18} />
                    تقرير المبيعات اليومي
                  </motion.button>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="بحث في الكتب..." 
                      className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-gold/50 font-bold"
                      value={posSearch}
                      onChange={e => setPosSearch(e.target.value)}
                    />
                  </div>
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
                    {books.filter(b => b.type === 'book' && (b.title.includes(posSearch) || b.author.includes(posSearch) || b.isbn?.includes(posSearch))).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Package size={48} className="opacity-20" />
                            <p className="font-bold">لا توجد كتب مطابقة للبحث</p>
                          </div>
                        </td>
                      </tr>
                    ) : books.filter(b => b.type === 'book' && (b.title.includes(posSearch) || b.author.includes(posSearch) || b.isbn?.includes(posSearch))).map(book => (
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
                    onClick={fetchData}
                    className="p-3 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="تحديث البيانات"
                  >
                    <RefreshCw size={20} />
                  </motion.button>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="بحث في المنتجات..." 
                      className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-gold/50 font-bold"
                      value={posSearch}
                      onChange={e => setPosSearch(e.target.value)}
                    />
                  </div>
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
                    {books.filter(b => b.type === 'tech' && (b.title.includes(posSearch) || b.author.includes(posSearch) || b.isbn?.includes(posSearch))).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles size={48} className="opacity-20" />
                            <p className="font-bold">لا توجد منتجات تقنية مطابقة للبحث</p>
                          </div>
                        </td>
                      </tr>
                    ) : books.filter(b => b.type === 'tech' && (b.title.includes(posSearch) || b.author.includes(posSearch) || b.isbn?.includes(posSearch))).map(product => (
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="p-3 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  title="تحديث البيانات"
                >
                  <RefreshCw size={20} />
                </motion.button>
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
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <FileText size={48} className="opacity-20" />
                              <p className="font-bold">لا توجد فواتير مطابقة للبحث</p>
                            </div>
                          </td>
                        </tr>
                      ) : orders
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
                              onClick={() => printOrderById(order.id)}
                              className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Printer size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                promptAction('تسجيل مرتجع', 'أدخل مبلغ المرتجع:', '', (amount) => {
                                  if (amount && !isNaN(Number(amount))) {
                                    promptAction('سبب المرتجع', 'أدخل سبب المرتجع:', '', (reason) => {
                                      fetch('/api/returns', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ order_id: order.id, amount: Number(amount), reason })
                                      }).then(() => {
                                        fetchData();
                                        toast.success('تم تسجيل المرتجع بنجاح');
                                      });
                                    });
                                  }
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="مرتجع"
                            >
                              <ArrowRightLeft size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                confirmAction('إلغاء الفاتورة', 'هل أنت متأكد من إلغاء هذه الفاتورة نهائياً؟ سيتم استعادة المخزون وحذف السجل.', () => {
                                  fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                        toast.success('تم إلغاء الفاتورة بنجاح');
                                        fetchData();
                                      } else {
                                        toast.error('فشل في إلغاء الفاتورة');
                                      }
                                    });
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="إلغاء نهائي"
                            >
                              <Trash2 size={18} />
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
                            promptAction('إيداع رأس مال', 'أدخل مبلغ الإيداع:', '', (amount) => {
                              if (amount && !isNaN(Number(amount))) {
                                promptAction('وصف الإيداع', 'أدخل وصف العملية:', '', (desc) => {
                                  fetch('/api/capital-movements', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'deposit', amount: Number(amount), description: desc })
                                  }).then(() => {
                                    fetchReports();
                                    toast.success('تم الإيداع بنجاح');
                                  });
                                });
                              }
                            });
                          }}
                          className="py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                        >
                          تسجيل إيداع
                        </button>
                        <button 
                          onClick={() => {
                            promptAction('تسجيل مسحوبات', 'أدخل مبلغ المسحوبات:', '', (amount) => {
                              if (amount && !isNaN(Number(amount))) {
                                promptAction('وصف المسحوبات', 'أدخل وصف العملية:', '', (desc) => {
                                  fetch('/api/capital-movements', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'withdrawal', amount: Number(amount), description: desc })
                                  }).then(() => {
                                    fetchReports();
                                    toast.success('تم تسجيل المسحوبات');
                                  });
                                });
                              }
                            });
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

              <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                <DailySalesReportPrint ref={dailyReportRef} orders={orders} date={new Date().toISOString().split('T')[0]} />
                <FinancialReportPrint ref={reportPrintRef} data={reportData} dateRange={dateRange} />
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-8">تحليل المبيعات اليومي</h3>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
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
                  onClick={() => {
                    setCustomerForm({ name: '', phone: '', email: '' });
                    setShowCustomerModal({ show: true, mode: 'add' });
                  }}
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
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setCustomerForm({ name: customer.name, phone: customer.phone, email: customer.email || '' });
                                setShowCustomerModal({ show: true, mode: 'edit', customerId: customer.id });
                              }}
                              className="text-brand-blue hover:underline font-bold text-sm"
                            >
                              تعديل
                            </button>
                            {customer.balance < 0 && (
                              <button 
                                onClick={() => {
                                  setShowCustomerPaymentModal({ show: true, customerId: customer.id, customerName: customer.name });
                                  setCustomerPaymentForm({ amount: Math.abs(customer.balance), account_id: accounts[0]?.id || 0, description: '' });
                                }}
                                className="text-emerald-600 hover:underline font-bold text-sm"
                              >
                                تسديد دين
                              </button>
                            )}
                          </div>
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
                  onClick={() => {
                    setSupplierForm({ name: '', contact_person: '', phone: '' });
                    setShowSupplierModal({ show: true, mode: 'add' });
                  }}
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
                          <button 
                            onClick={() => {
                              setSupplierForm({ name: supplier.name, contact_person: supplier.contact_person, phone: supplier.phone });
                              setShowSupplierModal({ show: true, mode: 'edit', supplierId: supplier.id });
                            }}
                            className="text-brand-blue hover:underline font-bold text-sm"
                          >
                            تعديل
                          </button>
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
                  onClick={() => {
                    setPurchaseForm({ supplier_id: 0, items: [] });
                    setShowPurchaseModal(true);
                  }}
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
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" defaultValue="سوق الكتاب" id="storeName" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">العملة</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200" defaultValue="ر.س" id="currency" />
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          const name = (document.getElementById('storeName') as HTMLInputElement).value;
                          const currency = (document.getElementById('currency') as HTMLInputElement).value;
                          toast.success('تم حفظ الإعدادات بنجاح (تجريبي)');
                        }}
                        className="w-full py-3 rounded-xl bg-brand-navy text-white font-bold hover:bg-brand-navy/90 transition-all"
                      >
                        حفظ إعدادات المتجر
                      </button>
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          promptAction('تصنيف جديد', 'اسم التصنيف الجديد:', '', (name) => {
                            if (name) {
                              fetch('/api/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name })
                              }).then(() => {
                                fetchData();
                                toast.success('تمت إضافة التصنيف');
                              });
                            }
                          });
                        }}
                        className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        إضافة تصنيف منتجات
                      </button>
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
                      <button 
                        onClick={() => {
                          promptAction('تغيير كلمة المرور', 'كلمة المرور الجديدة لـ admin', '', async (newPassword) => {
                            if (!newPassword) return;
                            try {
                              const res = await fetch('/api/users/password', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: 'admin', newPassword })
                              });
                              if (res.ok) toast.success('تم تغيير كلمة المرور بنجاح');
                              else toast.error('فشل تغيير كلمة المرور');
                            } catch (err) {
                              toast.error('حدث خطأ أثناء تغيير كلمة المرور');
                            }
                          });
                        }}
                        className="text-brand-blue font-bold text-xs"
                      >
                        تغيير كلمة المرور
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">cashier</p>
                        <p className="text-xs text-slate-500">كاشير</p>
                      </div>
                      <button 
                        onClick={() => {
                          promptAction('تغيير كلمة المرور', 'كلمة المرور الجديدة لـ cashier', '', async (newPassword) => {
                            if (!newPassword) return;
                            try {
                              const res = await fetch('/api/users/password', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: 'cashier', newPassword })
                              });
                              if (res.ok) toast.success('تم تغيير كلمة المرور بنجاح');
                              else toast.error('فشل تغيير كلمة المرور');
                            } catch (err) {
                              toast.error('حدث خطأ أثناء تغيير كلمة المرور');
                            }
                          });
                        }}
                        className="text-brand-blue font-bold text-xs"
                      >
                        تغيير كلمة المرور
                      </button>
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
                    onClick={fetchData}
                    className="p-3 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="تحديث البيانات"
                  >
                    <RefreshCw size={20} />
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      promptAction('حساب جديد', 'اسم الحساب الجديد:', '', (name) => {
                        if (name) {
                          fetch('/api/accounts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name })
                          }).then(() => {
                            fetchData();
                            toast.success('تم إنشاء الحساب');
                          });
                        }
                      });
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
                    <X size={24} />
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

        {/* Supplier Modal */}
        <AnimatePresence>
          {showSupplierModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-brand-navy mb-8">
                  {showSupplierModal.mode === 'add' ? 'إضافة مورد جديد' : 'تعديل بيانات المورد'}
                </h2>
                <form onSubmit={handleSupplierSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المورد</label>
                    <input 
                      type="text" required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={supplierForm.name}
                      onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المسؤول</label>
                    <input 
                      type="text" required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={supplierForm.contact_person}
                      onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <input 
                      type="text" required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={supplierForm.phone}
                      onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 bg-brand-navy text-white py-4 rounded-2xl font-black">حفظ</button>
                    <button type="button" onClick={() => setShowSupplierModal({ ...showSupplierModal, show: false })} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold">إلغاء</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Customer Modal */}
        <AnimatePresence>
          {showCustomerModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-brand-navy mb-8">
                  {showCustomerModal.mode === 'add' ? 'إضافة عميل جديد' : 'تعديل بيانات العميل'}
                </h2>
                <form onSubmit={handleCustomerSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل</label>
                    <input 
                      type="text" required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={customerForm.name}
                      onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <input 
                      type="text" required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={customerForm.phone}
                      onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                    <input 
                      type="email"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={customerForm.email}
                      onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 bg-brand-gold text-white py-4 rounded-2xl font-black">حفظ</button>
                    <button type="button" onClick={() => setShowCustomerModal({ ...showCustomerModal, show: false })} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold">إلغاء</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Customer Payment Modal */}
        <AnimatePresence>
          {showCustomerPaymentModal.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-black text-brand-navy mb-2">تسديد دين</h2>
                <p className="text-slate-500 mb-8 font-bold">العميل: {showCustomerPaymentModal.customerName}</p>
                
                <form onSubmit={handleCustomerPaymentSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">المبلغ المسدد</label>
                    <input 
                      type="number" required
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none font-black text-xl"
                      value={customerPaymentForm.amount || ''}
                      onChange={e => setCustomerPaymentForm({ ...customerPaymentForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الحساب المستلم</label>
                    <select 
                      required
                      className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold"
                      value={customerPaymentForm.account_id || ''}
                      onChange={e => setCustomerPaymentForm({ ...customerPaymentForm, account_id: Number(e.target.value) })}
                    >
                      <option value="">اختر الحساب...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ملاحظات</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-slate-200 outline-none font-bold min-h-[80px]"
                      placeholder="ملاحظات إضافية..."
                      value={customerPaymentForm.description}
                      onChange={e => setCustomerPaymentForm({ ...customerPaymentForm, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20">تأكيد التسديد</button>
                    <button type="button" onClick={() => setShowCustomerPaymentModal({ show: false })} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold">إلغاء</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <h2 className="text-2xl font-black text-brand-navy mb-8">تسجيل فاتورة شراء</h2>
                <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المورد</label>
                    <select 
                      required
                      className="w-full px-5 py-3 rounded-xl border border-slate-200"
                      value={purchaseForm.supplier_id}
                      onChange={e => setPurchaseForm({ ...purchaseForm, supplier_id: Number(e.target.value) })}
                    >
                      <option value="">اختر المورد</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">المنتجات</h3>
                      <button 
                        type="button"
                        onClick={() => setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, { book_id: 0, quantity: 1, unit_price: 0 }] })}
                        className="text-brand-blue font-bold text-sm flex items-center gap-1"
                      >
                        <Plus size={16} /> إضافة منتج
                      </button>
                    </div>
                    {purchaseForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl relative">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1">المنتج</label>
                          <select 
                            required
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            value={item.book_id}
                            onChange={e => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].book_id = Number(e.target.value);
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                          >
                            <option value="">اختر المنتج</option>
                            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                          <input 
                            type="number" required min="1"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].quantity = Number(e.target.value);
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">سعر التكلفة</label>
                          <input 
                            type="number" required min="0" step="0.01"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            value={item.unit_price}
                            onChange={e => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].unit_price = Number(e.target.value);
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newItems = purchaseForm.items.filter((_, i) => i !== index);
                            setPurchaseForm({ ...purchaseForm, items: newItems });
                          }}
                          className="absolute -left-2 -top-2 bg-white text-rose-500 p-1 rounded-full shadow-sm border border-slate-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black">حفظ الفاتورة</button>
                    <button type="button" onClick={() => setShowPurchaseModal(false)} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold">إلغاء</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {confirmDialog.show && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-brand-navy mb-4">{confirmDialog.title}</h3>
                <p className="text-slate-500 mb-8 font-bold leading-relaxed">{confirmDialog.message}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog({ ...confirmDialog, show: false });
                    }}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-600/20"
                  >
                    تأكيد
                  </button>
                  <button 
                    onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {promptDialog.show && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-navy/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
              >
                <h3 className="text-2xl font-black text-brand-navy mb-6 text-center">{promptDialog.title}</h3>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{promptDialog.label}</label>
                    <input 
                      autoFocus
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-gold focus:bg-white transition-all outline-none font-bold text-brand-navy"
                      value={promptDialog.value}
                      onChange={(e) => setPromptDialog({ ...promptDialog, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          promptDialog.onConfirm(promptDialog.value);
                          setPromptDialog({ ...promptDialog, show: false });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      promptDialog.onConfirm(promptDialog.value);
                      setPromptDialog({ ...promptDialog, show: false });
                    }}
                    className="flex-1 py-4 bg-brand-gold text-white rounded-2xl font-black shadow-lg shadow-brand-gold/20"
                  >
                    موافق
                  </button>
                  <button 
                    onClick={() => setPromptDialog({ ...promptDialog, show: false })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
