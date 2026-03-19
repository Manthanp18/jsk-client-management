'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client, DailyPnl } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ClientPnlEntry {
  client: Client;
  todayPnl: number | null;
  hasEntry: boolean;
  entryId?: string;
  yesterdayPnl?: number;
}

export default function DailyPnlPage() {
  const [clients, setClients] = useState<ClientPnlEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [pnlInputs, setPnlInputs] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get all active clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      setLoading(false);
      return;
    }

    // Get yesterday's date for reference
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // For each client, check if they have an entry for selected date and yesterday
    const clientEntriesPromises = (clientsData || []).map(async (client) => {
      const [todayResult, yesterdayResult] = await Promise.all([
        supabase
          .from('daily_pnl')
          .select('*')
          .eq('client_id', client.id)
          .eq('date', selectedDate)
          .single(),
        supabase
          .from('daily_pnl')
          .select('pnl_amount')
          .eq('client_id', client.id)
          .eq('date', yesterdayStr)
          .single(),
      ]);

      return {
        client,
        todayPnl: todayResult.data?.pnl_amount || null,
        hasEntry: !!todayResult.data,
        entryId: todayResult.data?.id,
        yesterdayPnl: yesterdayResult.data?.pnl_amount || undefined,
      };
    });

    const results = await Promise.all(clientEntriesPromises);
    setClients(results);

    // Initialize inputs with existing values
    const initialInputs: { [key: string]: string } = {};
    results.forEach((entry) => {
      if (entry.todayPnl !== null) {
        initialInputs[entry.client.id] = entry.todayPnl.toString();
      }
    });
    setPnlInputs(initialInputs);

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateClientTotals(clientId: string) {
    const supabase = createClient();

    const { data: pnlData } = await supabase
      .from('daily_pnl')
      .select('pnl_amount')
      .eq('client_id', clientId);

    const totalProfit = (pnlData || []).reduce((sum, entry) => sum + entry.pnl_amount, 0);

    const { data: client } = await supabase
      .from('clients')
      .select('commission_percentage, commission_received')
      .eq('id', clientId)
      .single();

    if (client) {
      const commissionDue = totalProfit > 0
        ? (totalProfit * client.commission_percentage) / 100 - client.commission_received
        : 0;

      await supabase
        .from('clients')
        .update({
          total_profit: totalProfit,
          commission_due: Math.max(0, commissionDue),
        })
        .eq('id', clientId);
    }
  }

  async function savePnl(clientId: string) {
    const pnlValue = pnlInputs[clientId];

    if (!pnlValue || pnlValue.trim() === '') {
      alert('Please enter a PNL amount');
      return;
    }

    setSaving({ ...saving, [clientId]: true });
    const supabase = createClient();
    const clientEntry = clients.find((c) => c.client.id === clientId);

    if (clientEntry?.hasEntry && clientEntry.entryId) {
      // Update existing entry
      const { error } = await supabase
        .from('daily_pnl')
        .update({
          pnl_amount: parseFloat(pnlValue),
        })
        .eq('id', clientEntry.entryId);

      if (error) {
        alert('Error updating entry: ' + error.message);
      } else {
        await updateClientTotals(clientId);
        loadData();
      }
    } else {
      // Insert new entry
      const { error } = await supabase.from('daily_pnl').insert({
        client_id: clientId,
        date: selectedDate,
        pnl_amount: parseFloat(pnlValue),
      });

      if (error) {
        alert('Error adding entry: ' + error.message);
      } else {
        await updateClientTotals(clientId);
        loadData();
      }
    }

    setSaving({ ...saving, [clientId]: false });
  }

  async function deletePnl(clientId: string, entryId: string) {
    const confirm = window.confirm('Are you sure you want to delete this entry?');
    if (!confirm) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('daily_pnl')
      .delete()
      .eq('id', entryId);

    if (error) {
      alert('Error deleting entry: ' + error.message);
    } else {
      await updateClientTotals(clientId);
      setPnlInputs({ ...pnlInputs, [clientId]: '' });
      loadData();
    }
  }

  const handleInputChange = (clientId: string, value: string) => {
    setPnlInputs({ ...pnlInputs, [clientId]: value });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const todayEntries = clients.filter((c) => c.hasEntry).length;
  const totalTodayPnl = clients.reduce((sum, c) => sum + (c.todayPnl || 0), 0);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Daily PNL Entry</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Enter PNL for all clients - see everyone at once
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Label htmlFor="date" className="text-sm">Select Date</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-48 h-10"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
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
            <CardTitle className="text-xs sm:text-sm font-medium">Entries Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {todayEntries} / {clients.length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {clients.length - todayEntries} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total PNL Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold truncate ${totalTodayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalTodayPnl)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            All Clients - {new Date(selectedDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Client Name</TableHead>
                <TableHead className="text-right w-[120px]">Yesterday</TableHead>
                <TableHead className="w-[200px]">PNL Amount</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No clients found. Add clients first.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((entry) => (
                  <TableRow
                    key={entry.client.id}
                    className={entry.hasEntry ? 'bg-green-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {entry.client.name}
                      <div className="text-xs text-muted-foreground">
                        {entry.client.commission_percentage}% commission
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.yesterdayPnl !== undefined ? (
                        <span className={entry.yesterdayPnl >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                          {formatCurrency(entry.yesterdayPnl)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={pnlInputs[entry.client.id] || ''}
                        onChange={(e) => handleInputChange(entry.client.id, e.target.value)}
                        placeholder="Enter PNL (+ or -)"
                        className={entry.hasEntry ? 'border-green-500' : ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            savePnl(entry.client.id);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {entry.hasEntry ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Saved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => savePnl(entry.client.id)}
                          disabled={saving[entry.client.id]}
                        >
                          {saving[entry.client.id] ? 'Saving...' : entry.hasEntry ? 'Update' : 'Save'}
                        </Button>
                        {entry.hasEntry && entry.entryId && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePnl(entry.client.id, entry.entryId!)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No clients found. Add clients first.
              </div>
            ) : (
              clients.map((entry) => (
                <Card key={entry.client.id} className={`p-4 ${entry.hasEntry ? 'bg-green-50 border-green-200' : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{entry.client.name}</h3>
                        <p className="text-xs text-muted-foreground">{entry.client.commission_percentage}% commission</p>
                      </div>
                      {entry.hasEntry ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          Saved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                    </div>

                    {entry.yesterdayPnl !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Yesterday: </span>
                        <span className={entry.yesterdayPnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {formatCurrency(entry.yesterdayPnl)}
                        </span>
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`pnl-${entry.client.id}`} className="text-sm">PNL Amount</Label>
                      <Input
                        id={`pnl-${entry.client.id}`}
                        type="number"
                        step="0.01"
                        value={pnlInputs[entry.client.id] || ''}
                        onChange={(e) => handleInputChange(entry.client.id, e.target.value)}
                        placeholder="Enter PNL (+ or -)"
                        className={`mt-1 h-10 ${entry.hasEntry ? 'border-green-500' : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            savePnl(entry.client.id);
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => savePnl(entry.client.id)}
                        disabled={saving[entry.client.id]}
                        className="flex-1"
                      >
                        {saving[entry.client.id] ? 'Saving...' : entry.hasEntry ? 'Update' : 'Save'}
                      </Button>
                      {entry.hasEntry && entry.entryId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePnl(entry.client.id, entry.entryId!)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>💡 Quick Tips:</strong>
              <br />
              • Green rows/cards = Already saved for today
              • Enter positive numbers for profit, negative for loss (e.g., -5000)
              • Press Enter after typing to quickly save
              • Yesterday&apos;s PNL shown for reference
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
