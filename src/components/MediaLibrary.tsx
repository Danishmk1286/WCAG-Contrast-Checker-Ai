import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image as ImageIcon,
  Video,
  Music,
  File,
  Search,
  X,
  Copy,
  Trash2,
  Play,
  Pause,
  Upload,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getApiBaseUrl } from "@/lib/api";

const API_BASE = getApiBaseUrl();

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: "image" | "video" | "audio" | "other";
  size: number;
  uploadedAt: string;
  modifiedAt: string;
  extension: string;
}

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  selectMode?: boolean;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  selectMode = false,
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "size" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(`${API_BASE}/admin/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        successCount++;
      } catch (error: any) {
        console.error(`Upload error for ${file.name}:`, error);
        errorCount++;
      }
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
      });
      fetchMedia(); // Refresh the list
    } else if (errorCount > 0) {
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${errorCount} file(s)`,
        variant: "destructive",
      });
    }
  };

  // Sort files
  const sortFiles = (filesToSort: MediaFile[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "name":
          comparison = a.filename.localeCompare(b.filename);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (searchTerm) params.append("search", searchTerm);
      if (filterType !== "all") params.append("type", filterType);

      const response = await fetch(`${API_BASE}/admin/media?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      setFiles(data.files || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load media",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page, searchTerm, filterType]);

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/admin/media/${filename}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = url.startsWith("http")
      ? url
      : `${new URL(API_BASE).origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handlePreview = (file: MediaFile) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handlePlayAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(
        url.startsWith("http") ? url : `${new URL(API_BASE).origin}${url}`
      );
      audioRef.current = audio;
      audio.play();
      setPlayingAudio(url);
      audio.onended = () => setPlayingAudio(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/50 rounded-lg border-2 border-dashed">
        <div className="flex items-center gap-3">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Upload Media Files</p>
            <p className="text-sm text-muted-foreground">
              Images, videos, and audio files (max 10MB each)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <label htmlFor="media-library-file-input" className="sr-only">
            Upload media files (images, videos, audio)
          </label>
          <input
            id="media-library-file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            aria-label="Upload media files"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Upload media files (images, videos, audio)"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search, Filter, and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "date" | "size" | "name") => setSortBy(value)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>
        <Button variant="outline" size="icon" onClick={fetchMedia} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading media...
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No media files found</p>
          <p className="text-sm mt-1">Upload files to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortFiles(files).map((file) => (
            <Card
              key={file.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                {file.type === "image" ? (
                  <div
                    className="aspect-square bg-muted relative"
                    onClick={() =>
                      selectMode && onSelect
                        ? onSelect(file.url)
                        : handlePreview(file)
                    }
                  >
                    <img
                      src={
                        file.url.startsWith("http")
                          ? file.url
                          : `${new URL(API_BASE).origin}${file.url}`
                      }
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(file.url);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {!selectMode && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.filename);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : file.type === "video" ? (
                  <div
                    className="aspect-square bg-muted relative flex items-center justify-center"
                    onClick={() => handlePreview(file)}
                  >
                    <Video className="w-12 h-12 text-muted-foreground" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(file.url);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {!selectMode && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.filename);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : file.type === "audio" ? (
                  <div className="aspect-square bg-muted relative flex flex-col items-center justify-center p-4">
                    <Music className="w-12 h-12 text-muted-foreground mb-2" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePlayAudio(file.url)}
                    >
                      {playingAudio === file.url ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(file.url);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {!selectMode && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.filename);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    <File className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2 text-xs">
                  <div className="font-medium truncate">{file.filename}</div>
                  <div className="text-muted-foreground">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.filename}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {selectedFile.type === "image" && (
                <img
                  src={
                    selectedFile.url.startsWith("http")
                      ? selectedFile.url
                      : `${new URL(API_BASE).origin}${selectedFile.url}`
                  }
                  alt={selectedFile.filename}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              )}
              {selectedFile.type === "video" && (
                <video
                  src={
                    selectedFile.url.startsWith("http")
                      ? selectedFile.url
                      : `${new URL(API_BASE).origin}${selectedFile.url}`
                  }
                  controls
                  className="w-full"
                />
              )}
              {selectedFile.type === "audio" && (
                <audio
                  src={
                    selectedFile.url.startsWith("http")
                      ? selectedFile.url
                      : `${new URL(API_BASE).origin}${selectedFile.url}`
                  }
                  controls
                  className="w-full"
                />
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCopyUrl(selectedFile.url)}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                {!selectMode && (
                  <Button
                    onClick={() => {
                      handleDelete(selectedFile.filename);
                      setPreviewOpen(false);
                    }}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};




