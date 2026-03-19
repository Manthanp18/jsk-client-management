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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of all clients and their performance
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold truncate">
              {formatCurrency(totalStats.totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold truncate">
              {formatCurrency(totalStats.totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Commission Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold truncate">
              {formatCurrency(totalStats.totalCommissionDue)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              Received: {formatCurrency(totalStats.totalCommissionReceived)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
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
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No clients found. Add your first client to get started.
              </div>
            ) : (
              clients.map((client) => (
                <Card key={client.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-base">{client.name}</h3>
                    <Badge variant={client.total_profit >= 0 ? 'default' : 'destructive'} className="text-xs">
                      {client.total_profit >= 0 ? 'Profit' : 'Loss'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Invested</p>
                      <p className="font-medium">{formatCurrency(client.invested_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total Profit</p>
                      <p className={`font-medium ${client.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(client.total_profit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Current Balance</p>
                      <p className="font-semibold">{formatCurrency(calculateCurrentBalance(client))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commission %</p>
                      <p className="font-medium">{client.commission_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commission Due</p>
                      <p className="font-medium">{formatCurrency(client.commission_due)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Withdrawals</p>
                      <p className="font-medium">{formatCurrency(client.total_withdrawals)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
