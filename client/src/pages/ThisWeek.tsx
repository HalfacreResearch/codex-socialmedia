import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Sparkles, Play, RefreshCw, CheckCircle2, Clock, BarChart2, Film, BookOpen } from "lucide-react";
import { useLocation } from "wouter";

function getThisSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7 - day);
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split("T")[0];
}

function getLastSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day - (day === 0 ? 7 : day);
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split("T")[0];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  assembling: { label: "Assembling", color: "bg-amber-500/20 text-amber-400" },
  ready_for_reaction: { label: "Ready to Watch", color: "bg-blue-500/20 text-blue-400" },
  reaction_uploaded: { label: "Reaction Uploaded", color: "bg-purple-500/20 text-purple-400" },
  metadata_ready: { label: "Awaiting Approval", color: "bg-orange-500/20 text-orange-400" },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400" },
  posted: { label: "Posted", color: "bg-green-600/20 text-green-300" },
};

export default function ThisWeek() {
  const [, setLocation] = useLocation();
  const [generating, setGenerating] = useState(false);
  const weekOf = useMemo(() => getLastSunday(), []);

  const { data: visualizations, refetch: refetchViz } = trpc.visualizations.getAll.useQuery(
    { weekOf },
    { refetchOnWindowFocus: false }
  );

  const { data: montages, refetch: refetchMontages } = trpc.montages.getAll.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );

  const { data: stats } = trpc.stats.getLatest.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const generateMutation = trpc.visualizations.generateWeekly.useMutation({
    onSuccess: (result) => {
      setGenerating(false);
      if (result.success) {
        toast.success(`Generated ${result.chartsGenerated} charts for week of ${weekOf}`);
      } else {
        toast.warning(`Generated ${result.chartsGenerated} charts. Some errors: ${result.errors.join(", ")}`);
      }
      refetchViz();
    },
    onError: (err) => {
      setGenerating(false);
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const createMontageMutation = trpc.montages.create.useMutation({
    onSuccess: () => {
      toast.success("Montage created. Head to Montage Studio to build it.");
      refetchMontages();
      setLocation("/montage");
    },
    onError: (err) => toast.error(err.message),
  });

  const thisWeekMontage = montages?.find((m: any) => m.week_of === weekOf);
  const vizCount = visualizations?.length || 0;
  const status = thisWeekMontage ? STATUS_LABELS[thisWeekMontage.status] : null;

  function handleGenerate() {
    setGenerating(true);
    generateMutation.mutate({ weekOf });
  }

  function handleCreateMontage() {
    if (!visualizations?.length) {
      toast.error("Generate visualizations first.");
      return;
    }
    const ids = visualizations.slice(0, 12).map((v: any) => v.id);
    createMontageMutation.mutate({ weekOf, visualizationIds: ids });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            This Week
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Week of {weekOf}</p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Sunday Batch
            </>
          )}
        </Button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "BTC Alpha", value: `${stats.btc_alpha_percent || "—"}%` },
            { label: "CAGR", value: `${stats.cagr_percent || "—"}%` },
            { label: "Win Rate", value: `${stats.win_rate_percent || "—"}%` },
            { label: "Active Clients", value: stats.active_clients || "—" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold text-amber-400 mt-0.5">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Production pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Charts */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-amber-500" />
              Step 1: Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vizCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{vizCount} charts ready</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setLocation("/visualizations")}
                >
                  View Library
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">No charts yet</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click "Run Sunday Batch" to generate charts from all tradinghq data sources.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Montage */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Film className="h-4 w-4 text-amber-500" />
              Step 2: Montage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekMontage ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${status?.color}`}>{status?.label}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setLocation("/montage")}
                >
                  Open Studio
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Not started</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black"
                  onClick={handleCreateMontage}
                  disabled={vizCount === 0}
                >
                  Create Montage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Publish */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-amber-500" />
              Step 3: Publish
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekMontage?.status === "approved" || thisWeekMontage?.status === "posted" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm">
                    {thisWeekMontage.status === "posted" ? "Published" : "Ready to post"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setLocation("/montage")}
                >
                  {thisWeekMontage.status === "posted" ? "View Post" : "Post Now"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Waiting for approval</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete the montage and approve the metadata before posting.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* This week's charts preview */}
      {vizCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">This Week's Charts</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/visualizations")}
              className="text-xs text-amber-500 hover:text-amber-400"
            >
              View all {vizCount}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(visualizations || []).slice(0, 8).map((v: any) => (
              <Card
                key={v.id}
                className="border-border/50 overflow-hidden cursor-pointer hover:border-amber-500/50 transition-colors"
                onClick={() => setLocation("/visualizations")}
              >
                <div className="aspect-video bg-muted/50 relative overflow-hidden">
                  <img
                    src={v.image_url}
                    alt={v.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/400x225/141414/f59e0b?text=${encodeURIComponent(v.title)}`;
                    }}
                  />
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent publications */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/publications")}
            >
              Add Publication
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/calendar")}
            >
              Content Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/visualizations")}
            >
              Visualization Library
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
