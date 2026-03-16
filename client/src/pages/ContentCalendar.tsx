import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Calendar, CheckCircle2, XCircle, Loader2, Sparkles, Twitter, Linkedin, Youtube, Copy } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  posted: "bg-blue-500/20 text-blue-400",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  x: <Twitter className="h-3 w-3" />,
  linkedin: <Linkedin className="h-3 w-3" />,
  youtube: <Youtube className="h-3 w-3" />,
};

export default function ContentCalendar() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genContext, setGenContext] = useState("");
  const [genPlatform, setGenPlatform] = useState<"x" | "linkedin" | "youtube">("x");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: drafts, refetch } = trpc.contentDrafts.getAll.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { refetchOnWindowFocus: false }
  );

  const generateMutation = trpc.contentDrafts.generateDraft.useMutation({
    onSuccess: () => {
      setGenerating(false);
      toast.success("Draft generated. Review it below.");
      setShowGenerateDialog(false);
      setGenContext("");
      refetch();
    },
    onError: (err) => {
      setGenerating(false);
      toast.error(err.message);
    },
  });

  const approveMutation = trpc.contentDrafts.approve.useMutation({
    onSuccess: () => {
      toast.success("Draft approved.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.contentDrafts.reject.useMutation({
    onSuccess: () => {
      toast.success("Draft rejected.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleGenerate() {
    if (!genContext.trim()) {
      toast.error("Provide some context for the post.");
      return;
    }
    setGenerating(true);
    generateMutation.mutate({ platform: genPlatform, context: genContext });
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-amber-500" />
          Content Calendar
        </h1>
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          onClick={() => setShowGenerateDialog(true)}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Draft
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {["all", "draft", "approved", "rejected", "posted"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className={statusFilter === s ? "bg-amber-500 text-black hover:bg-amber-400" : ""}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {!drafts?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No content drafts yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Generate AI drafts for X, LinkedIn, or YouTube posts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d: any) => (
            <Card key={d.id} className="border-border/50">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs border-0 flex items-center gap-1 ${STATUS_COLORS[d.status]}`}>
                        {PLATFORM_ICONS[d.platform]}
                        {d.platform.charAt(0).toUpperCase() + d.platform.slice(1)}
                      </Badge>
                      <Badge className={`text-xs border-0 ${STATUS_COLORS[d.status]}`}>
                        {d.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {d.draft_copy}
                    </p>
                  </div>
                </div>
                {d.status === "draft" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white"
                      onClick={() => approveMutation.mutate({ id: d.id })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => rejectMutation.mutate({ id: d.id })}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(d.draft_copy);
                        toast.success("Copied to clipboard.");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                  </div>
                )}
                {d.status === "approved" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(d.draft_copy);
                        toast.success("Copied to clipboard.");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Generate AI Draft
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={genPlatform} onValueChange={(v) => setGenPlatform(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube Description</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Context</Label>
              <Textarea
                placeholder="What is this post about? Paste a chart narration, a signal summary, or describe the topic..."
                rows={5}
                value={genContext}
                onChange={(e) => setGenContext(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
