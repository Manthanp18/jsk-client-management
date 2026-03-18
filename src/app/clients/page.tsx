'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    invested_amount: '',
    commission_percentage: '',
    total_profit: '',
    commission_due: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();

    const total_profit = parseFloat(formData.total_profit) || 0;
    const commission_percentage = parseFloat(formData.commission_percentage) || 0;

    const commission_due = total_profit > 0
      ? (total_profit * commission_percentage) / 100
      : 0;

    if (editingClientId) {
      // Update existing client
      const { error } = await supabase.from('clients').update({
        name: formData.name,
        email: formData.email || null,
        invested_amount: parseFloat(formData.invested_amount) || 0,
        commission_percentage: commission_percentage,
      }).eq('id', editingClientId);

      if (error) {
        alert('Error updating client: ' + error.message);
        console.error(error);
        return;
      }

      alert('Client updated successfully!');
    } else {
      // Insert new client
      const { data: newClient, error } = await supabase.from('clients').insert({
        name: formData.name,
        email: formData.email || null,
        invested_amount: parseFloat(formData.invested_amount) || 0,
        commission_percentage: commission_percentage,
        total_profit: total_profit,
        commission_due: commission_due,
      }).select().single();

      if (error) {
        alert('Error adding client: ' + error.message);
        console.error(error);
        return;
      }

      // If client has existing profit, create a daily PNL entry for today
      if (total_profit !== 0 && newClient) {
        const today = new Date().toISOString().split('T')[0];
        const { error: pnlError } = await supabase.from('daily_pnl').insert({
          client_id: newClient.id,
          date: today,
          pnl_amount: total_profit,
          notes: 'Initial profit when client was added',
        });

        if (pnlError) {
          console.error('Error creating initial PNL entry:', pnlError);
          alert('Client added but failed to create initial PNL entry. You can add it manually in Daily PNL page.');
        }
      }
    }

    setDialogOpen(false);
    resetForm();
    loadClients();
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      invested_amount: '',
      commission_percentage: '',
      total_profit: '',
      commission_due: '',
    });
    setEditingClientId(null);
  }

  function handleEdit(client: Client) {
    setFormData({
      name: client.name,
      email: client.email || '',
      invested_amount: client.invested_amount.toString(),
      commission_percentage: client.commission_percentage.toString(),
      total_profit: client.total_profit.toString(),
      commission_due: client.commission_due.toString(),
    });
    setEditingClientId(client.id);
    setDialogOpen(true);
  }

  async function handleDelete(clientId: string, clientName: string) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${clientName}"?\n\nThis will permanently delete:\n• Client information\n• All daily PNL entries\n• All withdrawals\n• All commission payments\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      alert('Error deleting client: ' + error.message);
      console.error(error);
    } else {
      alert(`Client "${clientName}" has been deleted successfully.`);
      loadClients();
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateCurrentBalance = (client: Client) => {
    return client.invested_amount + client.total_profit - client.total_withdrawals;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your trading clients
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Invested Amount</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Commission Due</TableHead>
                <TableHead className="text-right">Commission Received</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No clients yet. Click Add Client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.invested_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.commission_percentage}%
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
                      {formatCurrency(client.commission_due)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(client.commission_received)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(client)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(client.id, client.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClientId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClientId
                ? 'Update client information. Note: Total profit is managed through daily PNL entries.'
                : 'Add a new client with their investment details and historical profit if any.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invested_amount">Invested Amount *</Label>
                <Input
                  id="invested_amount"
                  type="number"
                  step="0.01"
                  value={formData.invested_amount}
                  onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission_percentage">Commission Percentage * (%)</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                  required
                />
              </div>
              {!editingClientId && (
                <div className="grid gap-2">
                  <Label htmlFor="total_profit">Current Total Profit (if any)</Label>
                  <Input
                    id="total_profit"
                    type="number"
                    step="0.01"
                    value={formData.total_profit}
                    onChange={(e) => setFormData({ ...formData, total_profit: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-600">
                    Enter existing profit if adding mid-week. This will be recorded as today&apos;s PNL entry and will appear in Weekly Settlement.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit">{editingClientId ? 'Update Client' : 'Add Client'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
