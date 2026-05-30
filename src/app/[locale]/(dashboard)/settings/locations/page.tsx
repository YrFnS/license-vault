'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  createdAt: string;
  _count?: {
    licenses: number;
  };
}

interface LocationFormData {
  name: string;
  city: string;
  state: string;
  zip: string;
}

const emptyForm: LocationFormData = { name: '', city: '', state: '', zip: '' };

export default function LocationsPage() {
  const t = useTranslations('locations');
  const ts = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const json = await res.json();
      setLocations(json.locations || []);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const openCreateDialog = () => {
    setEditingLocation(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setForm({
      name: location.name,
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setDeletingLocation(location);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingLocation) {
        // Update
        const res = await fetch(`/api/locations/${editingLocation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            city: form.city || null,
            state: form.state || null,
            zip: form.zip || null,
          }),
        });
        if (!res.ok) throw new Error('Failed to update location');
        toast.success('Location updated successfully');
      } else {
        // Create
        const res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            city: form.city || undefined,
            state: form.state || undefined,
            zip: form.zip || undefined,
          }),
        });
        if (!res.ok) throw new Error('Failed to create location');
        toast.success('Location created successfully');
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingLocation(null);
      fetchLocations();
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;

    try {
      const res = await fetch(`/api/locations/${deletingLocation.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete location');
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch {
      toast.error('Failed to delete location');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingLocation(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
          <Plus className="size-4 me-1" />
          {t('addNew')}
        </Button>
      </div>

      {/* Location Cards Grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
              <MapPin className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('noLocations')}</p>
            <Button onClick={openCreateDialog} variant="outline" size="sm" className="mt-4">
              <Plus className="size-4 me-1" />
              {t('addNew')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 mt-0.5">
                      <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{location.name}</h3>
                      {(location.city || location.state || location.zip) && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {[location.city, location.state].filter(Boolean).join(', ')}
                          {location.zip ? ` ${location.zip}` : ''}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <MapPin className="size-3 me-1" />
                        {t('licenseCount', {
                          count: location._count?.licenses || 0,
                          plural: (location._count?.licenses || 0) !== 1 ? 's' : '',
                        })}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditDialog(location)}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">{tc('edit')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(location)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">{tc('delete')}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? t('edit') : t('addNew')}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update the location details below.'
                : 'Fill in the details for the new location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="loc-name">{t('name')}</Label>
              <Input
                id="loc-name"
                placeholder="e.g., Main Office"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loc-city">{t('city')}</Label>
                <Input
                  id="loc-city"
                  placeholder="e.g., Los Angeles"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-state">{t('state')}</Label>
                <Input
                  id="loc-state"
                  placeholder="e.g., CA"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-zip">{t('zip')}</Label>
              <Input
                id="loc-zip"
                placeholder="e.g., 90001"
                value={form.zip}
                onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {saving && <Loader2 className="size-4 me-1 animate-spin" />}
              {editingLocation ? tc('save') : tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
