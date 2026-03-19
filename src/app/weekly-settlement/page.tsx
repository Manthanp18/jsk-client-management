'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';

interface ClientWeeklyData {
  client: Client;
  weeklyPnl: number;
  weekCommission: number;
  tradingDays: number;
}

export default function WeeklySettlementPage() {
  const [weeklyData, setWeeklyData] = useState<ClientWeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState({ start: '', end: '' });
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  function getWeekDates(weekOffset: number = 0) {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of current week
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
    monday.setDate(today.getDate() + daysFromMonday);

    // Apply week offset (positive = future, negative = past)
    monday.setDate(monday.getDate() + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    // Calculate Friday of that week
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return {
      monday: monday.toISOString().split('T')[0],
      friday: friday.toISOString().split('T')[0],
    };
  }

  const loadWeeklyData = useCallback(async () => {
    const supabase = createClient();
    const weekDates = getWeekDates(selectedWeekOffset);

    setWeekDates({ start: weekDates.monday, end: weekDates.friday });

    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (clientsError) {
      console.error('Error loading clients:', clientsError);
      setLoading(false);
      return;
    }

    // For each client, get this week's PNL
    const weeklyDataPromises = (clients || []).map(async (client) => {
      const { data: pnlData, error: pnlError } = await supabase
        .from('daily_pnl')
        .select('pnl_amount, date')
        .eq('client_id', client.id)
        .gte('date', weekDates.monday)
        .lte('date', weekDates.friday);

      if (pnlError) {
        console.error('Error loading PNL for client:', pnlError);
        return {
          client,
          weeklyPnl: 0,
          weekCommission: 0,
          tradingDays: 0,
        };
      }

      const weeklyPnl = (pnlData || []).reduce((sum, entry) => sum + entry.pnl_amount, 0);

      // Calculate commission only if weekly PNL is positive
      const weekCommission = weeklyPnl > 0
        ? (weeklyPnl * client.commission_percentage) / 100
        : 0;

      return {
        client,
        weeklyPnl,
        weekCommission,
        tradingDays: pnlData?.length || 0,
      };
    });

    const results = await Promise.all(weeklyDataPromises);
    setWeeklyData(results);
    setLoading(false);
  }, [selectedWeekOffset]);

  useEffect(() => {
    loadWeeklyData();
  }, [loadWeeklyData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totals = {
    weeklyPnl: weeklyData.reduce((sum, d) => sum + d.weeklyPnl, 0),
    weekCommission: weeklyData.reduce((sum, d) => sum + d.weekCommission, 0),
    profitableClients: weeklyData.filter(d => d.weeklyPnl > 0).length,
    lossClients: weeklyData.filter(d => d.weeklyPnl < 0).length,
  };

  if (loading) {
    return <div className="text-center py-12">Loading weekly settlement data...</div>;
  }

  const isCurrentWeek = selectedWeekOffset === 0;
  const isFutureWeek = selectedWeekOffset > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Weekly Settlement</h1>
          <p className="text-muted-foreground mt-1">
            {formatDate(weekDates.start)} - {formatDate(weekDates.end)} (Mon-Fri)
          </p>
          {isCurrentWeek && (
            <Badge className="mt-2 bg-blue-100 text-blue-800">Current Week</Badge>
          )}
          {selectedWeekOffset === -1 && (
            <Badge className="mt-2 bg-gray-100 text-gray-800">Last Week</Badge>
          )}
          {selectedWeekOffset < -1 && (
            <Badge className="mt-2 bg-gray-100 text-gray-800">
              {Math.abs(selectedWeekOffset)} weeks ago
            </Badge>
          )}
          {isFutureWeek && (
            <Badge className="mt-2 bg-purple-100 text-purple-800">Future Week</Badge>
          )}
        </div>

        {/* Week Navigation Controls */}
        <div className="space-y-3">
          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
            >
              ← Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
            >
              Next Week →
            </Button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <Button
              variant={selectedWeekOffset === -1 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedWeekOffset(-1)}
            >
              Last Week
            </Button>
            <Button
              variant={isCurrentWeek ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedWeekOffset(0)}
              className={isCurrentWeek ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Current Week
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Week PNL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.weeklyPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.weeklyPnl)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.weekCommission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This week only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profitable Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totals.profitableClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loss Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totals.lossClients}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client-wise Settlement Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-center">Trading Days</TableHead>
                <TableHead className="text-right">Weekly PNL</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead className="text-right">Your Commission</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No trading data for this week yet.
                  </TableCell>
                </TableRow>
              ) : (
                weeklyData.map((data) => (
                  <TableRow key={data.client.id}>
                    <TableCell className="font-medium">{data.client.name}</TableCell>
                    <TableCell className="text-center">{data.tradingDays}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${data.weeklyPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.weeklyPnl)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {data.client.commission_percentage}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(data.weekCommission)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {data.weeklyPnl > 0 ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Profit
                        </Badge>
                      ) : data.weeklyPnl < 0 ? (
                        <Badge variant="destructive">Loss</Badge>
                      ) : (
                        <Badge variant="secondary">No Trade</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {weeklyData.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                {isCurrentWeek ? 'This Week\'s Settlement Summary' : 'Week Settlement Summary'}
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Total commission {isCurrentWeek ? 'to collect' : 'collected'} this week: <span className="font-bold">{formatCurrency(totals.weekCommission)}</span></p>
                <p>• {totals.profitableClients} clients made profit</p>
                <p>• {totals.lossClients} clients had losses (no commission)</p>
                <p className="text-xs text-blue-600 mt-2">
                  Note: Commission is calculated only on profitable clients. Clients in loss don&apos;t incur commission until they recover.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
