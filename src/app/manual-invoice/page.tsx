'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { generateMultiClientInvoice } from '@/lib/invoiceGenerator';
import { ChevronDown, X } from 'lucide-react';

interface ClientData {
  clientId: string;
  clientName: string;
  totalProfit: string;
  commissionPercentage: string;
  vpsChargesEnabled: boolean;
  vpsCharges: string;
}

export default function ManualInvoicePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientsData, setClientsData] = useState<Record<string, ClientData>>({});
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

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

  function handleClientSelection(clientId: string, checked: boolean) {
    if (checked) {
      setSelectedClientIds((prev) => [...prev, clientId]);
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        setClientsData((prev) => ({
          ...prev,
          [clientId]: {
            clientId: client.id,
            clientName: client.name,
            totalProfit: '',
            commissionPercentage: '50',
            vpsChargesEnabled: false,
            vpsCharges: '',
          },
        }));
      }
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
      setClientsData((prev) => {
        const newData = { ...prev };
        delete newData[clientId];
        return newData;
      });
    }
  }

  function handleClientDataChange(clientId: string, field: keyof ClientData, value: string | boolean) {
    setClientsData((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: value,
      },
    }));
  }

  function calculateClientCommission(clientId: string) {
    const clientData = clientsData[clientId];
    if (!clientData) return 0;
    const profit = parseFloat(clientData.totalProfit) || 0;
    const percentage = parseFloat(clientData.commissionPercentage) || 0;
    return (profit * percentage) / 100;
  }

  function calculateClientTotal(clientId: string) {
    const clientData = clientsData[clientId];
    if (!clientData) return 0;
    const commission = calculateClientCommission(clientId);
    const vpsCharges = clientData.vpsChargesEnabled ? (parseFloat(clientData.vpsCharges) || 0) : 0;
    return commission + vpsCharges;
  }

  function calculateGrandTotal() {
    let totalCommission = 0;
    let totalVps = 0;

    selectedClientIds.forEach((clientId) => {
      totalCommission += calculateClientCommission(clientId);
      const clientData = clientsData[clientId];
      if (clientData?.vpsChargesEnabled) {
        totalVps += parseFloat(clientData.vpsCharges) || 0;
      }
    });

    return { totalCommission, totalVps, grandTotal: totalCommission + totalVps };
  }

  async function handleGenerateInvoice() {
    if (selectedClientIds.length === 0) {
      alert('Please select at least one client');
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select start and end dates');
      return;
    }

    // Validate all selected clients have required data
    for (const clientId of selectedClientIds) {
      const clientData = clientsData[clientId];
      if (!clientData.totalProfit) {
        alert(`Please enter profit for ${clientData.clientName}`);
        return;
      }
      const profit = parseFloat(clientData.totalProfit);
      if (isNaN(profit)) {
        alert(`Please enter a valid profit amount for ${clientData.clientName}`);
        return;
      }
    }

    setGenerating(true);

    try {
      const invoiceClients = selectedClientIds.map((clientId) => {
        const clientData = clientsData[clientId];
        const profit = parseFloat(clientData.totalProfit);
        const commissionPercentage = parseFloat(clientData.commissionPercentage);
        const commission = (profit * commissionPercentage) / 100;
        const vpsCharges = clientData.vpsChargesEnabled ? (parseFloat(clientData.vpsCharges) || 0) : 0;

        return {
          clientName: clientData.clientName,
          weeklyPnl: profit,
          commissionPercentage,
          commissionAmount: commission,
          vpsCharges: vpsCharges > 0 ? vpsCharges : undefined,
        };
      });

      await generateMultiClientInvoice({
        clients: invoiceClients,
        weekStart: dateRange.startDate,
        weekEnd: dateRange.endDate,
      });

      alert('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const { totalCommission, totalVps, grandTotal } = calculateGrandTotal();
  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Client Invoice Generator</CardTitle>
            <CardDescription>
              Select multiple clients and generate a consolidated invoice with their weekly profits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Multi-Select Client Dropdown */}
            <div className="space-y-2">
              <Label>Select Clients</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    role="combobox"
                  >
                    <span className="truncate">
                      {selectedClientIds.length === 0
                        ? 'Select clients...'
                        : `${selectedClientIds.length} client(s) selected`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="max-h-64 overflow-auto space-y-1">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center space-x-3 rounded-md px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          id={client.id}
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={(checked) =>
                            handleClientSelection(client.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={client.id}
                          className="text-sm font-medium leading-none text-black cursor-pointer flex-1"
                        >
                          {client.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Selected Clients Badges */}
              {selectedClientIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedClients.map((client) => (
                    <Badge key={client.id} variant="secondary" className="pl-2 pr-1">
                      {client.name}
                      <button
                        onClick={() => handleClientSelection(client.id, false)}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Client Input Sections */}
            {selectedClientIds.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Client Details</h3>
                </div>

                {selectedClientIds.map((clientId) => {
                  const clientData = clientsData[clientId];
                  if (!clientData) return null;

                  const commission = calculateClientCommission(clientId);
                  const clientTotal = calculateClientTotal(clientId);
                  const vpsAmount = clientData.vpsChargesEnabled
                    ? parseFloat(clientData.vpsCharges) || 0
                    : 0;

                  return (
                    <Card key={clientId} className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">{clientData.clientName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Total Profit */}
                        <div className="space-y-2">
                          <Label htmlFor={`profit-${clientId}`}>
                            Weekly Profit (USC)
                          </Label>
                          <Input
                            id={`profit-${clientId}`}
                            type="number"
                            placeholder="e.g., 100000"
                            value={clientData.totalProfit}
                            onChange={(e) =>
                              handleClientDataChange(clientId, 'totalProfit', e.target.value)
                            }
                          />
                        </div>

                        {/* Commission Percentage */}
                        <div className="space-y-2">
                          <Label htmlFor={`commission-${clientId}`}>
                            Commission Percentage (%)
                          </Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id={`commission-${clientId}`}
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={clientData.commissionPercentage}
                              onChange={(e) =>
                                handleClientDataChange(
                                  clientId,
                                  'commissionPercentage',
                                  e.target.value
                                )
                              }
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              = {commission.toLocaleString('en-IN')} USC
                            </span>
                          </div>
                        </div>

                        {/* VPS Charges */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`vps-${clientId}`}>VPS Charges</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {clientData.vpsChargesEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <Switch
                                id={`vps-${clientId}`}
                                checked={clientData.vpsChargesEnabled}
                                onCheckedChange={(checked) =>
                                  handleClientDataChange(
                                    clientId,
                                    'vpsChargesEnabled',
                                    checked
                                  )
                                }
                              />
                            </div>
                          </div>
                          {clientData.vpsChargesEnabled && (
                            <Input
                              type="number"
                              placeholder="Enter VPS charges amount"
                              value={clientData.vpsCharges}
                              onChange={(e) =>
                                handleClientDataChange(clientId, 'vpsCharges', e.target.value)
                              }
                            />
                          )}
                        </div>

                        {/* Client Total */}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Client Total:</span>
                            <span className="text-lg font-bold">
                              {clientTotal.toLocaleString('en-IN')} USC
                            </span>
                          </div>
                          {clientData.vpsChargesEnabled && vpsAmount > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              (Commission: {commission.toLocaleString('en-IN')} + VPS: {vpsAmount.toLocaleString('en-IN')})
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Grand Total Summary */}
            {selectedClientIds.length > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Commission:</span>
                  <span className="font-medium">
                    {totalCommission.toLocaleString('en-IN')} USC
                  </span>
                </div>
                {totalVps > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total VPS Charges:</span>
                    <span className="font-medium">
                      {totalVps.toLocaleString('en-IN')} USC
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Grand Total Invoice Amount:</span>
                    <span className="text-2xl font-bold">
                      {grandTotal.toLocaleString('en-IN')} USC
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateInvoice}
              disabled={
                generating ||
                selectedClientIds.length === 0 ||
                !dateRange.startDate ||
                !dateRange.endDate
              }
              className="w-full"
              size="lg"
            >
              {generating ? 'Generating...' : 'Generate Consolidated Invoice PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
