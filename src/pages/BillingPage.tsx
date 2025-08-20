import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Calendar,
  User,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Heart,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime, formatCurrency } from '../lib/utils';
import { PaymentTransaction, Visit, Patient, Department } from '../types';

export const BillingPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    visit_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingAmount: 0,
    completedTransactions: 0,
    monthlyRevenue: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payment transactions with related data
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          visit:visits(
            *,
            patient:patients(*),
            doctor:doctors(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch visits for payment processing
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
        .eq('payment_status', 'pay_at_clinic')
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);

      if (departmentsError) throw departmentsError;

      setTransactions(transactionsData || []);
      setVisits(visitsData || []);
      setDepartments(departmentsData || []);

      // Calculate analytics
      calculateAnalytics(transactionsData || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (transactionsData: PaymentTransaction[]) => {
    const today = new Date().toISOString().split('T')[0];
    const completedTransactions = transactionsData.filter(t => t.status === 'completed');
    
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const todayRevenue = completedTransactions
      .filter(t => t.created_at.startsWith(today))
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const pendingAmount = transactionsData
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Calculate monthly revenue for last 12 months
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM format
      
      return completedTransactions
        .filter(t => t.created_at.startsWith(monthStr))
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    }).reverse();

    setAnalytics({
      totalRevenue,
      todayRevenue,
      pendingAmount,
      completedTransactions: completedTransactions.length,
      monthlyRevenue
    });
  };

  const processPayment = async () => {
    try {
      setError('');
      
      if (!paymentForm.visit_id || !paymentForm.amount) {
        setError('Please select a visit and enter amount');
        return;
      }

      const visit = visits.find(v => v.id === paymentForm.visit_id);
      if (!visit) {
        setError('Visit not found');
        return;
      }

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          visit_id: paymentForm.visit_id,
          patient_id: visit.patient_id,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update visit payment status
      const { error: visitError } = await supabase
        .from('visits')
        .update({ payment_status: 'paid' })
        .eq('id', paymentForm.visit_id);

      if (visitError) throw visitError;

      setSuccess('Payment processed successfully!');
      setShowPaymentModal(false);
      setPaymentForm({
        visit_id: '',
        amount: '',
        payment_method: 'cash',
        notes: ''
      });
      
      fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment. Please try again.');
    }
  };

  const generateReceipt = (transaction: PaymentTransaction) => {
    const visit = transaction.visit as any;
    const patient = visit?.patient;
    const doctor = visit?.doctor;
    const department = departments.find(d => d.name === visit?.department);

    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">Sancura Hospital</h1>
          <p style="margin: 5px 0;">Payment Receipt</p>
          <p style="margin: 5px 0;">Receipt #: ${transaction.id.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0;">Date: ${formatDate(transaction.created_at)}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Patient Information</h3>
          <p><strong>Name:</strong> ${patient?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${patient?.phone || 'N/A'}</p>
          <p><strong>Patient ID:</strong> ${patient?.uid || 'N/A'}</p>
          ${visit?.stn ? `<p><strong>Token Number:</strong> #${visit.stn}</p>` : ''}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Service Details</h3>
          <p><strong>Department:</strong> ${department?.display_name || visit?.department || 'N/A'}</p>
          ${doctor ? `<p><strong>Doctor:</strong> ${doctor.name}</p>` : ''}
          <p><strong>Visit Date:</strong> ${visit?.visit_date ? formatDate(visit.visit_date) : 'N/A'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Amount</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Consultation Fee</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(parseFloat(transaction.amount.toString()))}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>${formatCurrency(parseFloat(transaction.amount.toString()))}</strong></td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Payment Method:</strong> ${transaction.payment_method.toUpperCase()}</p>
          <p><strong>Transaction ID:</strong> ${transaction.transaction_id || transaction.id.substring(0, 12)}</p>
          <p><strong>Status:</strong> ${transaction.status.toUpperCase()}</p>
          <p><strong>Processed At:</strong> ${transaction.processed_at ? formatTime(transaction.processed_at) : 'N/A'}</p>
        </div>

        <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 20px; margin-top: 20px;">
          <p style="margin: 0; font-size: 12px; color: #666;">Thank you for choosing Sancura Hospital</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">This is a computer-generated receipt</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${patient?.name || 'Patient'}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${receiptContent}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const visit = transaction.visit as any;
    const patient = visit?.patient;
    
    const matchesSearch = !searchQuery || 
      patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient?.phone.includes(searchQuery) ||
      transaction.transaction_id?.includes(searchQuery);

    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    const matchesMethod = !methodFilter || transaction.payment_method === methodFilter;
    const matchesDate = !dateFilter || transaction.created_at.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'online', label: 'Online' },
    { value: 'insurance', label: 'Insurance' }
  ];

  const visitOptions = [
    { value: '', label: 'Select Visit' },
    ...visits.map(visit => ({
      value: visit.id,
      label: `${visit.patient?.name} - Token #${visit.stn} - ${visit.department}`
    }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sancura Billing</h1>
                <p className="text-sm text-gray-600">Comprehensive billing and payment management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button onClick={() => setShowPaymentModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                <Heart className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess('')} className="ml-auto">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.todayRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.pendingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.completedTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">Monthly Revenue Trend</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end space-x-2">
              {analytics.monthlyRevenue.map((revenue, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    style={{ 
                      height: `${Math.max(4, (revenue / Math.max(...analytics.monthlyRevenue)) * 200)}px` 
                    }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search by patient, phone, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Select
                options={methodOptions}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Transactions ({filteredTransactions.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const visit = transaction.visit as any;
                    const patient = visit?.patient;
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {patient?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {patient?.phone || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(parseFloat(transaction.amount.toString()))}
                          </div>
                          {visit?.stn && (
                            <div className="text-sm text-gray-500">
                              Token #{visit.stn}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {transaction.payment_method.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(transaction.created_at)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(transaction.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateReceipt(transaction)}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowReceiptModal(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Process Payment"
        size="lg"
      >
        <div className="space-y-6">
          <Select
            label="Select Visit"
            value={paymentForm.visit_id}
            onChange={(e) => {
              const selectedVisit = visits.find(v => v.id === e.target.value);
              const department = departments.find(d => d.name === selectedVisit?.department);
              setPaymentForm(prev => ({ 
                ...prev, 
                visit_id: e.target.value,
                amount: department?.consultation_fee?.toString() || '500'
              }));
            }}
            options={visitOptions}
            required
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
            <Select
              label="Payment Method"
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'upi', label: 'UPI' },
                { value: 'online', label: 'Online' },
                { value: 'insurance', label: 'Insurance' }
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {paymentForm.visit_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Visit Details</h4>
              {(() => {
                const visit = visits.find(v => v.id === paymentForm.visit_id);
                return visit ? (
                  <div className="text-sm text-blue-800">
                    <p><strong>Patient:</strong> {visit.patient?.name}</p>
                    <p><strong>Token:</strong> #{visit.stn}</p>
                    <p><strong>Department:</strong> {visit.department}</p>
                    <p><strong>Date:</strong> {formatDate(visit.visit_date)}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              className="flex-1"
            >
              Process Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong>Sancura</strong> - Advanced Hospital Billing System | 
              Developed by{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Aftab Alam
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};