import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { BarChart2, Volume2, Mic } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "price-action": "Price Action",
  "factor-scores": "Factor Scores",
  "factor-accuracy": "Factor Accuracy",
  "system-performance": "System Performance",
  "signal-accuracy": "Signal Accuracy",
  sentiment: "Sentiment",
  "etf-flows": "ETF Flows",
  "regime-changes": "Regime Changes",
};

export default function VisualizationLibrary() {
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined);
  const [selectedViz, setSelectedViz] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: weeks } = trpc.visualizations.getWeeks.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (weeks?.length && !selectedWeek) setSelectedWeek(weeks[0]);
  }, [weeks]);  // eslint-disable-line react-hooks/exhaustive-deps

  const { data: visualizations, isLoading } = trpc.visualizations.getAll.useQuery(
    { weekOf: selectedWeek },
    { refetchOnWindowFocus: false, enabled: !!selectedWeek }
  );

  const filtered = useMemo(() => {
    if (!visualizations) return [];
    if (categoryFilter === "all") return visualizations;
    return visualizations.filter((v: any) => v.category === categoryFilter);
  }, [visualizations, categoryFilter]);

  const categories = useMemo(() => {
    if (!visualizations) return [];
    return Array.from(new Set(visualizations.map((v: any) => v.category as string)));
  }, [visualizations]);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-amber-500" />
          Visualization Library
        </h1>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c] || c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedWeek || ""} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {(weeks || []).map((w: string) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No visualizations found for this week.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Run the Sunday batch from the This Week page to generate charts.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((v: any) => (
          <Card
            key={v.id}
            className="border-border/50 overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5 group"
            onClick={() => setSelectedViz(v)}
          >
            <div className="aspect-video bg-muted/30 relative overflow-hidden">
              <img
                src={v.image_url}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://placehold.co/400x225/141414/f59e0b?text=${encodeURIComponent(v.title)}`;
                }}
              />
              {v.tts_audio_url && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Audio
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate">{v.title}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-xs capitalize border-border/50">
                  {CATEGORY_LABELS[v.category] || v.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{v.duration_seconds}s</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Detail Dialog */}
      <Dialog open={!!selectedViz} onOpenChange={() => setSelectedViz(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedViz?.title}</DialogTitle>
          </DialogHeader>
          {selectedViz && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
                <img
                  src={selectedViz.image_url}
                  alt={selectedViz.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://placehold.co/800x450/141414/f59e0b?text=${encodeURIComponent(selectedViz.title)}`;
                  }}
                />
              </div>

              {selectedViz.tts_audio_url && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Volume2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <audio controls className="flex-1 h-8" src={selectedViz.tts_audio_url} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 uppercase tracking-wider">
                    <Mic className="h-3 w-3" />
                    Narration
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {selectedViz.ai_narration || "No narration generated yet."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 uppercase tracking-wider">
                    <BarChart2 className="h-3 w-3" />
                    Prediction
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {selectedViz.ai_prediction || "No prediction generated yet."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                <span>Source: <code className="text-amber-400/70">{selectedViz.source_table}</code></span>
                <span>|</span>
                <span>Type: {selectedViz.chart_type}</span>
                <span>|</span>
                <span>Duration: {selectedViz.duration_seconds}s</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
