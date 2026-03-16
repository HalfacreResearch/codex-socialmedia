import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useRef, useMemo } from "react";
import {
  Film,
  FileText,
  Upload,
  CheckCircle2,
  Youtube,
  Twitter,
  Linkedin,
  Copy,
  Loader2,
  ChevronRight,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "draft", label: "Select Charts" },
  { key: "assembling", label: "Generate Script" },
  { key: "ready_for_reaction", label: "Watch & React" },
  { key: "reaction_uploaded", label: "Generate Metadata" },
  { key: "metadata_ready", label: "Approve & Post" },
  { key: "approved", label: "Post to Platforms" },
  { key: "posted", label: "Done" },
];

function getStepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

export default function MontageStudio() {
  const [scriptLoading, setScriptLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [postingYT, setPostingYT] = useState(false);
  const [postingX, setPostingX] = useState(false);
  const [editedMeta, setEditedMeta] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: montages, refetch } = trpc.montages.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Get the latest (most recent) montage
  const montage = useMemo(() => {
    if (!montages?.length) return null;
    return montages[0];
  }, [montages]);

  const generateScriptMutation = trpc.montages.generateScript.useMutation({
    onSuccess: (data) => {
      setScriptLoading(false);
      toast.success("Script generated. Review it below.");
      refetch();
    },
    onError: (err) => {
      setScriptLoading(false);
      toast.error(err.message);
    },
  });

  const uploadReactionMutation = trpc.montages.uploadReactionVideo.useMutation({
    onSuccess: () => {
      setUploadLoading(false);
      toast.success("Reaction video uploaded.");
      refetch();
    },
    onError: (err) => {
      setUploadLoading(false);
      toast.error(err.message);
    },
  });

  const generateMetaMutation = trpc.montages.generateMetadata.useMutation({
    onSuccess: (data) => {
      setMetaLoading(false);
      setEditedMeta(data);
      toast.success("Metadata generated. Review and approve.");
      refetch();
    },
    onError: (err) => {
      setMetaLoading(false);
      toast.error(err.message);
    },
  });

  const approveMutation = trpc.montages.approve.useMutation({
    onSuccess: () => {
      toast.success("Approved. Ready to post.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const postYTMutation = trpc.montages.postToYouTube.useMutation({
    onSuccess: () => {
      setPostingYT(false);
      toast.success("Posted to YouTube.");
      refetch();
    },
    onError: (err) => {
      setPostingYT(false);
      toast.error(err.message);
    },
  });

  const postXMutation = trpc.montages.postToX.useMutation({
    onSuccess: () => {
      setPostingX(false);
      toast.success("Posted to X.");
      refetch();
    },
    onError: (err) => {
      setPostingX(false);
      toast.error(err.message);
    },
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !montage) return;
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadReactionMutation.mutate({
        montageId: montage.id,
        videoBase64: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  if (!montage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Film className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No montage started yet.</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Go to This Week and click "Create Montage" to start.
        </p>
      </div>
    );
  }

  const stepIndex = getStepIndex(montage.status);
  const meta = editedMeta || {
    title: montage.title,
    description: montage.description,
    x_copy: montage.x_copy,
    linkedin_copy: montage.linkedin_copy,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Film className="h-6 w-6 text-amber-500" />
          Montage Studio
        </h1>
        <Badge className="text-xs bg-amber-500/20 text-amber-400 border-0">
          Week of {montage.week_of}
        </Badge>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i < stepIndex
                  ? "bg-green-500/20 text-green-400"
                  : i === stepIndex
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {i < stepIndex && <CheckCircle2 className="h-3 w-3" />}
              {step.label}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Charts selected */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Charts Selected ({montage.visualization_ids?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {montage.visualization_ids?.length || 0} charts selected for this montage.
            Target duration: {Math.round((montage.target_duration_seconds || 480) / 60)} minutes.
          </p>
        </CardContent>
      </Card>

      {/* Step 2: Generate Script */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            AI Script
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {montage.ai_script ? (
            <div className="space-y-2">
              <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
                  {montage.ai_script}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                This is your conversation guide. Watch the montage video, then film your reaction.
              </p>
            </div>
          ) : (
            <Button
              onClick={() => {
                setScriptLoading(true);
                generateScriptMutation.mutate({ montageId: montage.id });
              }}
              disabled={scriptLoading}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              {scriptLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating script...
                </>
              ) : (
                "Generate Script"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Upload Reaction */}
      {(montage.status === "ready_for_reaction" ||
        montage.status === "reaction_uploaded" ||
        montage.status === "metadata_ready" ||
        montage.status === "approved" ||
        montage.status === "posted") && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4 text-amber-500" />
              Your Reaction Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {montage.reaction_video_url ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">Reaction video uploaded</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Watch the montage video, film your reaction, then upload it here.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Reaction Video
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate Metadata */}
      {(montage.status === "reaction_uploaded" ||
        montage.status === "metadata_ready" ||
        montage.status === "approved" ||
        montage.status === "posted") && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publishing Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {montage.status === "reaction_uploaded" && !meta.title && (
              <Button
                onClick={() => {
                  setMetaLoading(true);
                  generateMetaMutation.mutate({ montageId: montage.id });
                }}
                disabled={metaLoading}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {metaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating metadata...
                  </>
                ) : (
                  "Generate Title, Description & Post Copy"
                )}
              </Button>
            )}

            {meta.title && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">YouTube Title</Label>
                  <Input
                    value={meta.title || ""}
                    onChange={(e) => setEditedMeta({ ...meta, title: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">YouTube Description</Label>
                  <Textarea
                    value={meta.description || ""}
                    onChange={(e) => setEditedMeta({ ...meta, description: e.target.value })}
                    rows={5}
                    className="text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Twitter className="h-3 w-3" />
                      X Post Copy
                    </Label>
                    <Textarea
                      value={meta.x_copy || ""}
                      onChange={(e) => setEditedMeta({ ...meta, x_copy: e.target.value })}
                      rows={4}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {(meta.x_copy || "").length}/280
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn Copy
                    </Label>
                    <Textarea
                      value={meta.linkedin_copy || ""}
                      onChange={(e) => setEditedMeta({ ...meta, linkedin_copy: e.target.value })}
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                </div>

                {montage.status === "metadata_ready" && (
                  <Button
                    onClick={() =>
                      approveMutation.mutate({
                        montageId: montage.id,
                        title: meta.title,
                        description: meta.description,
                        xCopy: meta.x_copy,
                        linkedinCopy: meta.linkedin_copy,
                      })
                    }
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve & Enable Posting
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Post */}
      {(montage.status === "approved" || montage.status === "posted") && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Post to Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setPostingYT(true);
                  postYTMutation.mutate({ montageId: montage.id });
                }}
                disabled={postingYT || montage.youtube_video_id}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {postingYT ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Youtube className="h-4 w-4 mr-2" />
                )}
                {montage.youtube_video_id ? "Posted to YouTube" : "Post to YouTube"}
              </Button>

              <Button
                onClick={() => {
                  setPostingX(true);
                  postXMutation.mutate({ montageId: montage.id });
                }}
                disabled={postingX || montage.x_post_id}
                className="bg-black hover:bg-zinc-800 text-white border border-white/20"
              >
                {postingX ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Twitter className="h-4 w-4 mr-2" />
                )}
                {montage.x_post_id ? "Posted to X" : "Post to X"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(montage.linkedin_copy || "");
                  toast.success("LinkedIn copy copied to clipboard.");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy LinkedIn Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
