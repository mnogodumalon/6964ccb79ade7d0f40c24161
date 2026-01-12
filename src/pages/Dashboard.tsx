import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Aufgaben, Kategorien, Schnellerfassung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  ListTodo,
  TrendingUp,
  Filter,
  Calendar,
  Flag,
  Tag,
  Loader2
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Color Maps
const PRIORITY_COLORS: Record<string, string> = {
  niedrig: '#10b981',    // green
  mittel: '#f59e0b',     // amber
  hoch: '#ef4444',       // red
  sehr_hoch: '#dc2626',  // dark red
};

const KATEGORIE_COLORS: Record<string, string> = {
  rot: '#ef4444',
  blau: '#3b82f6',
  gruen: '#10b981',
  gelb: '#eab308',
  orange: '#f97316',
  lila: '#a855f7',
  grau: '#6b7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  niedrig: 'Niedrig',
  mittel: 'Mittel',
  hoch: 'Hoch',
  sehr_hoch: 'Sehr hoch',
};

export default function Dashboard() {
  const [aufgaben, setAufgaben] = useState<Aufgaben[]>([]);
  const [kategorien, setKategorien] = useState<Kategorien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('alle');
  const [filterCategory, setFilterCategory] = useState<string>('alle');
  const [filterStatus, setFilterStatus] = useState<string>('alle');

  // Form State for Quick Entry
  const [formData, setFormData] = useState<Schnellerfassung['fields']>({
    aufgabe_titel: '',
    aufgabe_beschreibung: '',
    aufgabe_faelligkeit: '',
    aufgabe_prioritaet: 'mittel',
    aufgabe_kategorie: undefined,
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [aufgabenData, kategorienData] = await Promise.all([
        LivingAppsService.getAufgaben(),
        LivingAppsService.getKategorien(),
      ]);
      setAufgaben(aufgabenData);
      setKategorien(kategorienData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      toast.error('Daten konnten nicht geladen werden. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  // Submit Quick Entry
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.aufgabe_titel?.trim()) {
      toast.error('Bitte gib einen Aufgabentitel ein.');
      return;
    }

    try {
      setSubmitting(true);
      await LivingAppsService.createSchnellerfassungEntry(formData);
      toast.success('Aufgabe wurde erfolgreich erfasst.');
      setDialogOpen(false);
      // Reset form
      setFormData({
        aufgabe_titel: '',
        aufgabe_beschreibung: '',
        aufgabe_faelligkeit: '',
        aufgabe_prioritaet: 'mittel',
        aufgabe_kategorie: undefined,
      });
      // Reload data
      await loadData();
    } catch (err) {
      toast.error('Aufgabe konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle Task Completion
  async function toggleTaskCompletion(task: Aufgaben) {
    try {
      await LivingAppsService.updateAufgabenEntry(task.record_id, {
        erledigt: !task.fields.erledigt,
      });
      toast.success(
        task.fields.erledigt
          ? 'Aufgabe als offen markiert.'
          : 'Aufgabe als erledigt markiert.'
      );
      await loadData();
    } catch (err) {
      toast.error('Status konnte nicht aktualisiert werden.');
    }
  }

  // Calculate KPIs
  const today = startOfDay(new Date());
  const totalTasks = aufgaben.length;
  const completedTasks = aufgaben.filter(t => t.fields.erledigt).length;
  const openTasks = totalTasks - completedTasks;
  const overdueTasks = aufgaben.filter(t =>
    !t.fields.erledigt &&
    t.fields.faelligkeitsdatum &&
    isBefore(new Date(t.fields.faelligkeitsdatum), today)
  ).length;

  // Filter Tasks
  const filteredTasks = aufgaben.filter(task => {
    if (filterStatus !== 'alle') {
      const isCompleted = task.fields.erledigt === true;
      if (filterStatus === 'erledigt' && !isCompleted) return false;
      if (filterStatus === 'offen' && isCompleted) return false;
    }
    if (filterPriority !== 'alle' && task.fields.prioritaet !== filterPriority) return false;
    if (filterCategory !== 'alle') {
      const taskKategorieId = extractRecordId(task.fields.kategorie);
      if (taskKategorieId !== filterCategory) return false;
    }
    return true;
  });

  // Stats Data for Charts
  const priorityStats = [
    { name: 'Niedrig', value: aufgaben.filter(t => t.fields.prioritaet === 'niedrig' && !t.fields.erledigt).length, color: PRIORITY_COLORS.niedrig },
    { name: 'Mittel', value: aufgaben.filter(t => t.fields.prioritaet === 'mittel' && !t.fields.erledigt).length, color: PRIORITY_COLORS.mittel },
    { name: 'Hoch', value: aufgaben.filter(t => t.fields.prioritaet === 'hoch' && !t.fields.erledigt).length, color: PRIORITY_COLORS.hoch },
    { name: 'Sehr hoch', value: aufgaben.filter(t => t.fields.prioritaet === 'sehr_hoch' && !t.fields.erledigt).length, color: PRIORITY_COLORS.sehr_hoch },
  ].filter(item => item.value > 0);

  const categoryStats = kategorien.map(kat => {
    const count = aufgaben.filter(t => {
      const katId = extractRecordId(t.fields.kategorie);
      return katId === kat.record_id && !t.fields.erledigt;
    }).length;
    return {
      name: kat.fields.kategorie_name || 'Unbenannt',
      value: count,
      color: kat.fields.farbe ? KATEGORIE_COLORS[kat.fields.farbe] : '#6b7280',
    };
  }).filter(item => item.value > 0);

  // Get Kategorie Name by ID
  function getKategorieName(kategorieUrl: string | undefined): string {
    if (!kategorieUrl) return 'Keine Kategorie';
    const katId = extractRecordId(kategorieUrl);
    if (!katId) return 'Keine Kategorie';
    const kat = kategorien.find(k => k.record_id === katId);
    return kat?.fields.kategorie_name || 'Unbekannt';
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Fehler beim Laden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData} className="w-full">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Toaster />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Aufgabenverwaltung</h1>
            <p className="text-muted-foreground">Überblick über alle deine Aufgaben</p>
          </div>

          {/* Quick Entry Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" />
                Neue Aufgabe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schnellerfassung</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titel">Aufgabe *</Label>
                  <Input
                    id="titel"
                    value={formData.aufgabe_titel || ''}
                    onChange={(e) => setFormData({ ...formData, aufgabe_titel: e.target.value })}
                    placeholder="z.B. Meeting vorbereiten"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="beschreibung">Notizen</Label>
                  <Textarea
                    id="beschreibung"
                    value={formData.aufgabe_beschreibung || ''}
                    onChange={(e) => setFormData({ ...formData, aufgabe_beschreibung: e.target.value })}
                    placeholder="Zusätzliche Details..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="faelligkeit">Fällig am</Label>
                  <Input
                    id="faelligkeit"
                    type="date"
                    value={formData.aufgabe_faelligkeit || ''}
                    onChange={(e) => setFormData({ ...formData, aufgabe_faelligkeit: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="prioritaet">Priorität</Label>
                  <Select
                    value={formData.aufgabe_prioritaet || 'mittel'}
                    onValueChange={(value) => setFormData({ ...formData, aufgabe_prioritaet: value as any })}
                  >
                    <SelectTrigger id="prioritaet">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="hoch">Hoch</SelectItem>
                      <SelectItem value="sehr_hoch">Sehr hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="kategorie">Kategorie</Label>
                  <Select
                    value={formData.aufgabe_kategorie ? extractRecordId(formData.aufgabe_kategorie) || undefined : undefined}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      aufgabe_kategorie: createRecordUrl(APP_IDS.KATEGORIEN, value)
                    })}
                  >
                    <SelectTrigger id="kategorie">
                      <SelectValue placeholder="Auswählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {kategorien.map((kat) => (
                        <SelectItem key={kat.record_id} value={kat.record_id}>
                          {kat.fields.kategorie_name || 'Unbenannt'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichern...
                      </>
                    ) : (
                      'Erstellen'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt
              </CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Alle Aufgaben</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Erledigt
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%'} abgeschlossen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offen
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{openTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Noch zu erledigen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Überfällig
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Fälligkeitsdatum überschritten</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {(priorityStats.length > 0 || categoryStats.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Chart */}
            {priorityStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Offene Aufgaben nach Priorität
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={priorityStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Category Chart */}
            {categoryStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Offene Aufgaben nach Kategorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Task List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Aufgabenliste</CardTitle>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Status</SelectItem>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="erledigt">Erledigt</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Prioritäten</SelectItem>
                    <SelectItem value="niedrig">Niedrig</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                    <SelectItem value="sehr_hoch">Sehr hoch</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Kategorien</SelectItem>
                    {kategorien.map((kat) => (
                      <SelectItem key={kat.record_id} value={kat.record_id}>
                        {kat.fields.kategorie_name || 'Unbenannt'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Aufgaben gefunden</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {aufgaben.length === 0
                    ? 'Erstelle deine erste Aufgabe über den "Neue Aufgabe" Button.'
                    : 'Keine Aufgaben mit den gewählten Filtern. Probiere andere Filter aus.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isOverdue = task.fields.faelligkeitsdatum &&
                    !task.fields.erledigt &&
                    isBefore(new Date(task.fields.faelligkeitsdatum), today);

                  return (
                    <div
                      key={task.record_id}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        task.fields.erledigt
                          ? 'bg-muted/50 opacity-75'
                          : 'bg-card hover:bg-accent'
                      } ${isOverdue ? 'border-red-500' : ''}`}
                    >
                      <Checkbox
                        checked={task.fields.erledigt || false}
                        onCheckedChange={() => toggleTaskCompletion(task)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold ${task.fields.erledigt ? 'line-through text-muted-foreground' : ''}`}>
                            {task.fields.titel || 'Ohne Titel'}
                          </h4>
                          {task.fields.prioritaet && (
                            <Badge
                              style={{
                                backgroundColor: PRIORITY_COLORS[task.fields.prioritaet],
                                color: 'white'
                              }}
                              className="shrink-0"
                            >
                              {PRIORITY_LABELS[task.fields.prioritaet]}
                            </Badge>
                          )}
                        </div>

                        {task.fields.beschreibung && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.fields.beschreibung}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {task.fields.faelligkeitsdatum && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.fields.faelligkeitsdatum), 'dd.MM.yyyy', { locale: de })}
                            </span>
                          )}

                          {task.fields.kategorie && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {getKategorieName(task.fields.kategorie)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
