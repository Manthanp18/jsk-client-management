'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client, WeeklyReport, Withdrawal, CommissionPayment } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            View weekly reports, withdrawals, and commission payments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={(value) => setSelectedClientId(value || '')}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a client" />
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
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(selectedClient.invested_amount)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${selectedClient.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedClient.total_profit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    selectedClient.invested_amount +
                      selectedClient.total_profit -
                      selectedClient.total_withdrawals
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(selectedClient.commission_due)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedClient.commission_percentage}% on profit
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full md:w-[600px] grid-cols-3">
              <TabsTrigger value="weekly">Weekly Reports</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly PNL Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week Start (Monday)</TableHead>
                        <TableHead>Week End (Friday)</TableHead>
                        <TableHead className="text-right">Weekly PNL</TableHead>
                        <TableHead className="text-center">Trading Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No weekly data yet. Add daily PNL entries to see weekly reports.
                          </TableCell>
                        </TableRow>
                      ) : (
                        weeklyReports.map((report, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(report.week_start).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>
                              {new Date(report.week_end).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={report.weekly_pnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {formatCurrency(report.weekly_pnl)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{report.trading_days}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Withdrawals History</CardTitle>
                  <Button onClick={() => setWithdrawalDialogOpen(true)}>
                    Record Withdrawal
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No withdrawals recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((withdrawal) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              {new Date(withdrawal.withdrawal_date).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(withdrawal.amount)}
                            </TableCell>
                            <TableCell>{withdrawal.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Total Withdrawals: {formatCurrency(selectedClient.total_withdrawals)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commission">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commission Payments</CardTitle>
                  <Button onClick={() => setCommissionDialogOpen(true)}>
                    Record Payment
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No commission payments recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissionPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
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
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Withdrawal</DialogTitle>
            <DialogDescription>
              Record a withdrawal for {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdrawal}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="w_amount">Amount *</Label>
                <Input
                  id="w_amount"
                  type="number"
                  step="0.01"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="w_date">Date *</Label>
                <Input
                  id="w_date"
                  type="date"
                  value={withdrawalForm.withdrawal_date}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawal_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="w_notes">Notes</Label>
                <Input
                  id="w_notes"
                  value={withdrawalForm.notes}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawalDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Withdrawal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Commission Payment</DialogTitle>
            <DialogDescription>
              Record a commission payment from {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCommissionPayment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="c_amount">Amount *</Label>
                <Input
                  id="c_amount"
                  type="number"
                  step="0.01"
                  value={commissionForm.amount}
                  onChange={(e) => setCommissionForm({ ...commissionForm, amount: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Commission due: {formatCurrency(selectedClient?.commission_due || 0)}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c_date">Date *</Label>
                <Input
                  id="c_date"
                  type="date"
                  value={commissionForm.payment_date}
                  onChange={(e) => setCommissionForm({ ...commissionForm, payment_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c_notes">Notes</Label>
                <Input
                  id="c_notes"
                  value={commissionForm.notes}
                  onChange={(e) => setCommissionForm({ ...commissionForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCommissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
