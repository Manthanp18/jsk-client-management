'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

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
    }
    setLoading(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateCurrentBalance = (client: Client) => {
    return client.invested_amount + client.total_profit - client.total_withdrawals;
  };

  const totalStats = {
    totalInvested: clients.reduce((sum, c) => sum + c.invested_amount, 0),
    totalProfit: clients.reduce((sum, c) => sum + c.total_profit, 0),
    totalCommissionDue: clients.reduce((sum, c) => sum + c.commission_due, 0),
    totalCommissionReceived: clients.reduce((sum, c) => sum + c.commission_received, 0),
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all clients and their performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.totalCommissionDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Received: {formatCurrency(totalStats.totalCommissionReceived)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead className="text-right">Commission Due</TableHead>
                <TableHead className="text-right">Total Withdrawals</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No clients found. Add your first client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.invested_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={client.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(client.total_profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateCurrentBalance(client))}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.commission_percentage}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.commission_due)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.total_withdrawals)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={client.total_profit >= 0 ? 'default' : 'destructive'}>
                        {client.total_profit >= 0 ? 'Profit' : 'Loss'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
