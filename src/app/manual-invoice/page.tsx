'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateWeeklyInvoice } from '@/lib/invoiceGenerator';

export default function ManualInvoicePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    totalProfit: '',
    commissionPercentage: '50',
    startDate: '',
    endDate: '',
    vpsChargesEnabled: false,
    vpsCharges: '',
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
      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          clientId: data[0].id,
          clientName: data[0].name,
        }));
      }
    }
    setLoading(false);
  }

  function handleClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
      }));
    }
  }

  function calculateCommission() {
    const profit = parseFloat(formData.totalProfit) || 0;
    const percentage = parseFloat(formData.commissionPercentage) || 0;
    return (profit * percentage) / 100;
  }

  function calculateTotalInvoiceAmount() {
    const commission = calculateCommission();
    const vpsCharges = formData.vpsChargesEnabled ? (parseFloat(formData.vpsCharges) || 0) : 0;
    return commission + vpsCharges;
  }

  async function handleGenerateInvoice() {
    if (!formData.clientName || !formData.totalProfit || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const profit = parseFloat(formData.totalProfit);
    if (isNaN(profit) || profit <= 0) {
      alert('Please enter a valid profit amount');
      return;
    }

    const commission = calculateCommission();

    setGenerating(true);

    try {
      const vpsCharges = formData.vpsChargesEnabled ? (parseFloat(formData.vpsCharges) || 0) : 0;

      await generateWeeklyInvoice({
        clientName: formData.clientName,
        weekStart: formData.startDate,
        weekEnd: formData.endDate,
        weeklyPnl: profit,
        commissionPercentage: parseFloat(formData.commissionPercentage),
        commissionAmount: commission,
        tradingDays: 0, // Not needed for manual invoice
        vpsCharges: vpsCharges > 0 ? vpsCharges : undefined,
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

  const commissionAmount = calculateCommission();
  const totalInvoiceAmount = calculateTotalInvoiceAmount();
  const vpsChargesAmount = formData.vpsChargesEnabled ? (parseFloat(formData.vpsCharges) || 0) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Manual Invoice Generator</CardTitle>
            <CardDescription>
              Generate a custom invoice for any client with manual profit and commission settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={handleClientChange}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Choose a client...">
                    {formData.clientName || "Choose a client..."}
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
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Total Profit */}
            <div className="space-y-2">
              <Label htmlFor="totalProfit">Total Profit (USC)</Label>
              <Input
                id="totalProfit"
                type="number"
                placeholder="e.g., 100000"
                value={formData.totalProfit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalProfit: e.target.value }))
                }
              />
            </div>

            {/* Commission Percentage */}
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">
                Commission Percentage (%)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="commissionPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionPercentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commissionPercentage: e.target.value,
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  = {commissionAmount.toLocaleString('en-IN')} USC
                </span>
              </div>
            </div>

            {/* VPS Charges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vpsCharges">VPS Charges</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formData.vpsChargesEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    id="vpsCharges"
                    checked={formData.vpsChargesEnabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        vpsChargesEnabled: checked,
                        vpsCharges: checked ? prev.vpsCharges : '',
                      }))
                    }
                  />
                </div>
              </div>
              {formData.vpsChargesEnabled && (
                <Input
                  type="number"
                  placeholder="Enter VPS charges amount"
                  value={formData.vpsCharges}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vpsCharges: e.target.value }))
                  }
                />
              )}
            </div>

            {/* Invoice Amount Display */}
            <div className="p-4 bg-secondary/20 rounded-lg border space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Commission Amount:</span>
                <span className="font-medium">
                  {commissionAmount.toLocaleString('en-IN')} USC
                </span>
              </div>
              {formData.vpsChargesEnabled && vpsChargesAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">VPS Charges:</span>
                  <span className="font-medium">
                    {vpsChargesAmount.toLocaleString('en-IN')} USC
                  </span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Invoice Amount:</span>
                  <span className="text-2xl font-bold">
                    {totalInvoiceAmount.toLocaleString('en-IN')} USC
                  </span>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateInvoice}
              disabled={generating || !formData.clientName || !formData.totalProfit || !formData.startDate || !formData.endDate}
              className="w-full"
              size="lg"
            >
              {generating ? 'Generating...' : 'Generate Invoice PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
