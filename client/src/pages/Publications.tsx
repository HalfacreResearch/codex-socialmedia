import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { BookOpen, Plus, Link2, Loader2, ExternalLink, Linkedin } from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  newsletter: { label: "Newsletter", color: "bg-blue-500/20 text-blue-400" },
  article: { label: "Article", color: "bg-green-500/20 text-green-400" },
  podcast: { label: "Podcast", color: "bg-purple-500/20 text-purple-400" },
  speech: { label: "Speech", color: "bg-orange-500/20 text-orange-400" },
  video: { label: "Video", color: "bg-red-500/20 text-red-400" },
  blog: { label: "Blog", color: "bg-amber-500/20 text-amber-400" },
};

export default function Publications() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const [newPub, setNewPub] = useState({
    type: "newsletter" as any,
    title: "",
    url: "",
    platform: "",
    publishedAt: new Date().toISOString().split("T")[0],
    summary: "",
  });

  const { data: publications, refetch } = trpc.publications.getAll.useQuery(
    { type: typeFilter === "all" ? undefined : typeFilter },
    { refetchOnWindowFocus: false }
  );

  const addMutation = trpc.publications.add.useMutation({
    onSuccess: () => {
      toast.success("Publication added.");
      setShowAddDialog(false);
      setNewPub({ type: "newsletter", title: "", url: "", platform: "", publishedAt: new Date().toISOString().split("T")[0], summary: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkImportMutation = trpc.publications.bulkImportLinkedIn.useMutation({
    onSuccess: (result) => {
      setBulkImporting(false);
      toast.success(`Imported ${result.imported} publications.`);
      if (result.results.some((r: any) => !r.success)) {
        toast.warning(`${result.results.filter((r: any) => !r.success).length} failed to import.`);
      }
      setShowBulkDialog(false);
      setBulkUrls("");
      refetch();
    },
    onError: (err) => {
      setBulkImporting(false);
      toast.error(err.message);
    },
  });

  function handleBulkImport() {
    const urls = bulkUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (!urls.length) {
      toast.error("No valid URLs found. Each URL should be on its own line.");
      return;
    }
    setBulkImporting(true);
    bulkImportMutation.mutate({ urls });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-500" />
          Publications
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkDialog(true)}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Bulk Import LinkedIn
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Publication
          </Button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "newsletter", "article", "podcast", "speech", "video", "blog"].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            className={typeFilter === t ? "bg-amber-500 text-black hover:bg-amber-400" : ""}
            onClick={() => setTypeFilter(t)}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]?.label || t}
          </Button>
        ))}
      </div>

      {/* Publications list */}
      {!publications?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No publications yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Add your LinkedIn newsletters, podcast appearances, and articles here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {publications.map((p: any) => (
            <Card key={p.id} className="border-border/50 hover:border-amber-500/30 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs border-0 ${TYPE_LABELS[p.type]?.color}`}>
                        {TYPE_LABELS[p.type]?.label || p.type}
                      </Badge>
                      {p.platform && (
                        <span className="text-xs text-muted-foreground">{p.platform}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(p.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    {p.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.summary}</p>
                    )}
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-amber-500 hover:text-amber-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Publication Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={newPub.type} onValueChange={(v) => setNewPub({ ...newPub, type: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Input
                  placeholder="LinkedIn, YouTube, Spotify..."
                  value={newPub.platform}
                  onChange={(e) => setNewPub({ ...newPub, platform: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="Publication title"
                value={newPub.title}
                onChange={(e) => setNewPub({ ...newPub, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://..."
                value={newPub.url}
                onChange={(e) => setNewPub({ ...newPub, url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Published Date</Label>
              <Input
                type="date"
                value={newPub.publishedAt}
                onChange={(e) => setNewPub({ ...newPub, publishedAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Summary (optional)</Label>
              <Textarea
                placeholder="Brief description..."
                rows={2}
                value={newPub.summary}
                onChange={(e) => setNewPub({ ...newPub, summary: e.target.value })}
              />
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={() => addMutation.mutate({ ...newPub, publishedAt: new Date(newPub.publishedAt).toISOString() })}
              disabled={!newPub.title}
            >
              Add Publication
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-400" />
              Bulk Import from LinkedIn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste your LinkedIn newsletter or article URLs below, one per line. The system will extract the title and date from each URL.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">LinkedIn URLs (one per line)</Label>
              <Textarea
                placeholder="https://www.linkedin.com/pulse/...&#10;https://www.linkedin.com/pulse/..."
                rows={10}
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                {bulkUrls.split("\n").filter((u) => u.trim().startsWith("http")).length} valid URLs detected
              </p>
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={handleBulkImport}
              disabled={bulkImporting}
            >
              {bulkImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Import All
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
