'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client, WeeklyReport, Withdrawal, CommissionPayment } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateWeeklyInvoice } from '@/lib/invoiceGenerator';

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [commissionForm, setCommissionForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [activeTab, setActiveTab] = useState<'weekly' | 'withdrawals' | 'commission'>('weekly');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientData(selectedClientId);
    }
  }, [selectedClientId]);

  async function loadClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading clients:', error);
    } else {
      setClients(data || []);
      if (data && data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadClientData(clientId: string) {
    const supabase = createClient();

    const [reportsRes, withdrawalsRes, commissionRes] = await Promise.all([
      supabase
        .from('weekly_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start', { ascending: false }),
      supabase
        .from('withdrawals')
        .select('*')
        .eq('client_id', clientId)
        .order('withdrawal_date', { ascending: false }),
      supabase
        .from('commission_payments')
        .select('*')
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false }),
    ]);

    if (!reportsRes.error) setWeeklyReports(reportsRes.data || []);
    if (!withdrawalsRes.error) setWithdrawals(withdrawalsRes.data || []);
    if (!commissionRes.error) setCommissionPayments(commissionRes.data || []);
  }

  async function handleWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) return;

    const supabase = createClient();

    const { error } = await supabase.from('withdrawals').insert({
      client_id: selectedClientId,
      amount: parseFloat(withdrawalForm.amount),
      withdrawal_date: withdrawalForm.withdrawal_date,
      notes: withdrawalForm.notes || null,
    });

    if (error) {
      alert('Error recording withdrawal: ' + error.message);
      return;
    }

    const { data: client } = await supabase
      .from('clients')
      .select('total_withdrawals')
      .eq('id', selectedClientId)
      .single();

    if (client) {
      await supabase
        .from('clients')
        .update({
          total_withdrawals: client.total_withdrawals + parseFloat(withdrawalForm.amount),
        })
        .eq('id', selectedClientId);
    }

    setWithdrawalDialogOpen(false);
    setWithdrawalForm({ amount: '', withdrawal_date: new Date().toISOString().split('T')[0], notes: '' });
    loadClients();
    loadClientData(selectedClientId);
  }

  async function handleCommissionPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) return;

    const supabase = createClient();

    const { error } = await supabase.from('commission_payments').insert({
      client_id: selectedClientId,
      amount: parseFloat(commissionForm.amount),
      payment_date: commissionForm.payment_date,
      notes: commissionForm.notes || null,
    });

    if (error) {
      alert('Error recording commission payment: ' + error.message);
      return;
    }

    const { data: client } = await supabase
      .from('clients')
      .select('commission_due, commission_received')
      .eq('id', selectedClientId)
      .single();

    if (client) {
      const paymentAmount = parseFloat(commissionForm.amount);
      await supabase
        .from('clients')
        .update({
          commission_received: client.commission_received + paymentAmount,
          commission_due: Math.max(0, client.commission_due - paymentAmount),
        })
        .eq('id', selectedClientId);
    }

    setCommissionDialogOpen(false);
    setCommissionForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
    loadClients();
    loadClientData(selectedClientId);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No clients found. Add a client first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Client Reports & Settlement</h1>
        <p className="text-muted-foreground mt-1">
          View client performance, record withdrawals, and track commission payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={(value) => setSelectedClientId(value || '')}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choose a client to view their reports">
                {selectedClient?.name || 'Choose a client to view their reports'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClient && (
        <>
          {/* Client Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Commission Rate: {selectedClient.commission_percentage}% of profit
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Initial Investment</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedClient.invested_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Profit/Loss</p>
                  <p className={`text-2xl font-bold ${selectedClient.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedClient.total_profit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      selectedClient.invested_amount +
                        selectedClient.total_profit -
                        selectedClient.total_withdrawals
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available to withdraw
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Commission Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedClient.commission_due)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    To be paid to you
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg">Client Withdraws Money</span>
                </CardTitle>
                <CardDescription>
                  When client withdraws profit or capital from their account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setWithdrawalDialogOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  Record Withdrawal
                </Button>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Total Withdrawn So Far</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(selectedClient.total_withdrawals)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg">Client Pays Commission</span>
                </CardTitle>
                <CardDescription>
                  When client pays you commission on their profits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setCommissionDialogOpen(true)}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  Record Commission Payment
                </Button>
                <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Received:</span>
                    <span className="font-semibold">{formatCurrency(selectedClient.commission_received)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span className="font-medium">Pending:</span>
                    <span className="font-bold">{formatCurrency(selectedClient.commission_due)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Section */}
          <div className="space-y-4">
            {/* Custom Horizontal Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Weekly Performance
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                  activeTab === 'withdrawals'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Withdrawal History
              </button>
              <button
                onClick={() => setActiveTab('commission')}
                className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                  activeTab === 'commission'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Commission History
              </button>
            </div>

            {/* Weekly Performance Content */}
            {activeTab === 'weekly' && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance Summary</CardTitle>
                  <CardDescription>
                    View weekly profit/loss breakdown for {selectedClient.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week Start</TableHead>
                        <TableHead>Week End</TableHead>
                        <TableHead className="text-right">Weekly Profit/Loss</TableHead>
                        <TableHead className="text-center">Trading Days</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No weekly data available yet. Add daily PNL entries to see weekly summaries.
                          </TableCell>
                        </TableRow>
                      ) : (
                        weeklyReports.map((report, index) => {
                          // Always use 50% commission for invoices
                          const INVOICE_COMMISSION_PERCENTAGE = 50;
                          const commissionAmount = report.weekly_pnl > 0
                            ? (report.weekly_pnl * INVOICE_COMMISSION_PERCENTAGE) / 100
                            : 0;

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(report.week_start).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                {new Date(report.week_end).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${report.weekly_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {report.weekly_pnl >= 0 ? '+' : ''}{formatCurrency(report.weekly_pnl)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">{report.trading_days}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (!selectedClient) return;
                                    generateWeeklyInvoice({
                                      clientName: selectedClient.name,
                                      weekStart: report.week_start,
                                      weekEnd: report.week_end,
                                      weeklyPnl: report.weekly_pnl,
                                      commissionPercentage: INVOICE_COMMISSION_PERCENTAGE,
                                      commissionAmount: commissionAmount,
                                      tradingDays: report.trading_days,
                                    });
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  Generate Invoice
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Withdrawal History Content */}
            {activeTab === 'withdrawals' && (
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal History</CardTitle>
                  <CardDescription>
                    All withdrawals made by {selectedClient.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount Withdrawn</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No withdrawals recorded yet. Use the button above to record when client withdraws money.
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((withdrawal) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              {new Date(withdrawal.withdrawal_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(withdrawal.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{withdrawal.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Commission History Content */}
            {activeTab === 'commission' && (
              <Card>
                <CardHeader>
                  <CardTitle>Commission Payment History</CardTitle>
                  <CardDescription>
                    All commission payments received from {selectedClient.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Amount Received</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No commission payments recorded yet. Use the button above to record when client pays commission.
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissionPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">
                      Total Received: {formatCurrency(selectedClient.commission_received)}
                    </p>
                    <p className="text-sm font-medium text-orange-600">
                      Commission Due: {formatCurrency(selectedClient.commission_due)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Record Client Withdrawal</DialogTitle>
            <DialogDescription className="text-base">
              Recording withdrawal for <span className="font-semibold text-foreground">{selectedClient?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdrawal}>
            <div className="grid gap-5 py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Current Balance: </span>
                  {formatCurrency(
                    (selectedClient?.invested_amount || 0) +
                      (selectedClient?.total_profit || 0) -
                      (selectedClient?.total_withdrawals || 0)
                  )}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="w_amount" className="text-base">How much did client withdraw? *</Label>
                <Input
                  id="w_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter withdrawal amount"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  required
                  className="text-lg h-12"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="w_date" className="text-base">When was the withdrawal made? *</Label>
                <Input
                  id="w_date"
                  type="date"
                  value={withdrawalForm.withdrawal_date}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawal_date: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="w_notes" className="text-base">Add notes (optional)</Label>
                <Input
                  id="w_notes"
                  placeholder="e.g., Weekly profit withdrawal, Emergency withdrawal"
                  value={withdrawalForm.notes}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setWithdrawalDialogOpen(false);
                setWithdrawalForm({ amount: '', withdrawal_date: new Date().toISOString().split('T')[0], notes: '' });
              }} size="lg">
                Cancel
              </Button>
              <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700">
                Save Withdrawal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Record Commission Payment</DialogTitle>
            <DialogDescription className="text-base">
              Recording commission payment from <span className="font-semibold text-foreground">{selectedClient?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCommissionPayment}>
            <div className="grid gap-5 py-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                <p className="text-sm text-orange-900">
                  <span className="font-semibold">Commission Pending: </span>
                  <span className="text-lg font-bold">{formatCurrency(selectedClient?.commission_due || 0)}</span>
                </p>
                <p className="text-xs text-orange-800">
                  Commission Rate: {selectedClient?.commission_percentage}% of profit
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="c_amount" className="text-base">How much commission did client pay? *</Label>
                <Input
                  id="c_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter commission amount"
                  value={commissionForm.amount}
                  onChange={(e) => setCommissionForm({ ...commissionForm, amount: e.target.value })}
                  required
                  className="text-lg h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Can be partial or full payment of pending commission
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="c_date" className="text-base">When was the payment received? *</Label>
                <Input
                  id="c_date"
                  type="date"
                  value={commissionForm.payment_date}
                  onChange={(e) => setCommissionForm({ ...commissionForm, payment_date: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="c_notes" className="text-base">Add notes (optional)</Label>
                <Input
                  id="c_notes"
                  placeholder="e.g., Weekly commission, Partial payment"
                  value={commissionForm.notes}
                  onChange={(e) => setCommissionForm({ ...commissionForm, notes: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setCommissionDialogOpen(false);
                setCommissionForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
              }} size="lg">
                Cancel
              </Button>
              <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
                Save Commission Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
