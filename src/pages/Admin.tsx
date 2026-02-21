import React, { useState, useEffect, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactQuillEditor } from "@/components/ReactQuillEditor";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  LogOut,
  Eye,
  EyeOff,
  Upload,
  X,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Code,
  Lock,
  User,
  Shield,
  BarChart3,
  Users,
  TrendingUp,
  Download,
  Calendar,
  Activity,
  BookOpen,
  Sparkles,
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Settings,
  LayoutDashboard,
  FileText,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { MediaLibrary } from "@/components/MediaLibrary";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API_BASE = getApiBaseUrl();

// Quill editor configuration
const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  },
  imageResize: {
    displaySize: true,
    modules: ['Resize', 'DisplaySize', 'Toolbar'],
  },
  clipboard: {
    matchVisual: false,
  },
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
  'align',
  'color', 'background',
  'blockquote', 'code-block',
  'width', 'height', 'style'
];

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  author: string;
  authorLinkedin: string;
  authorInstagram: string;
  authorTwitter: string;
  authorWebsite: string;
  date: string;
  readTime: string;
  tags: string[];
  featuredImage: {
    url: string;
    alt: string;
    credit: string;
  };
  content: string;
  published: boolean;
}

// Admin Management Component (for super_admin only)
const AdminManagement = ({ token, onError }: { token: string | null; onError: (error: string) => void }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'admin' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/users`, {
        credentials: "include", // Required for cookie-based authentication
      });
      if (response.status === 403) {
        onError('You do not have permission to manage users');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      onError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include", // Required for cookie-based authentication
        body: JSON.stringify(newUser),
      });

      if (response.status === 403) {
        onError('You do not have permission to create users');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      setShowCreateDialog(false);
      setNewUser({ username: '', password: '', email: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      onError(error.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: "include", // Required for cookie-based authentication
      });

      if (response.status === 403) {
        onError('You do not have permission to delete users');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      fetchUsers();
    } catch (error: any) {
      onError(error.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage admin users and their roles
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {showCreateDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Admin User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-user-username">Username</Label>
              <Input
                id="new-user-username"
                aria-label="Username for new user"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                aria-label="Password for new user"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password (min 12 chars)"
              />
            </div>
            <div>
              <Label htmlFor="new-user-email">Email (optional)</Label>
              <Input
                id="new-user-email"
                type="email"
                aria-label="Email address for new user (optional)"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full p-2 border rounded"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null); // Cooldown in seconds
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [contentEditorMode, setContentEditorMode] = useState<"visual" | "html">(
    "visual"
  );
  const [isSavingPost, setIsSavingPost] = useState(false);
  const quillEditorRef = React.useRef<any>(null);
  const slugManuallyEditedRef = React.useRef<boolean>(false);
  
  // Safety mechanism: Reset isSavingPost if it gets stuck
  useEffect(() => {
    if (isSavingPost) {
      const resetTimeout = setTimeout(() => {
        console.warn('⚠️ isSavingPost has been true for 60 seconds - auto-resetting');
        setIsSavingPost(false);
      }, 60000); // 60 second safety timeout
      
      return () => clearTimeout(resetTimeout);
    }
  }, [isSavingPost]);
  
  // Debug logging for button state
  useEffect(() => {
    const buttonDisabled = isSavingPost || !editingPost || !isAuthenticated;
    console.log('🔘 Button state changed:', {
      isSavingPost,
      hasEditingPost: !!editingPost,
      hasToken: !!token,
      isAuthenticated,
      buttonDisabled,
      reason: buttonDisabled 
        ? (!editingPost ? 'no editingPost' : !isAuthenticated ? 'not authenticated' : 'saving in progress')
        : 'enabled'
    });
  }, [isSavingPost, editingPost, token, isAuthenticated]);

  // File editor state
  const [activeTab, setActiveTab] = useState<"dashboard" | "posts" | "files" | "media" | "settings">("dashboard");

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [seoData, setSeoData] = useState<any>(null);
  const [accessibilityData, setAccessibilityData] = useState<any>(null);
  const [systemData, setSystemData] = useState<any>(null);

  // Safe number helper - prevents undefined values
  const safe = (v: any): number => {
    if (v === null || v === undefined) return 0;
    const num = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(num) ? num : 0;
  };
  const [loadingStates, setLoadingStates] = useState({
    traffic: false,
    seo: false,
    accessibility: false,
    system: false
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90" | "custom">("7");
  const [blogPerformance, setBlogPerformance] = useState<any[]>([]);
  const [blogSortBy, setBlogSortBy] = useState<"views" | "read_time" | "recent">("views");
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // Session management state
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionWarningCountdown, setSessionWarningCountdown] = useState(0);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // CMS Session Configuration (Industry Standard)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
  const SESSION_WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh token every 5 minutes

  // Token expiration is now handled server-side via cookie expiration

  // Auto logout handler
  const handleAutoLogout = (message: string) => {
    setIsSessionExpired(true);
    setToken(null);
    setIsAuthenticated(false);
    setPosts([]);
    setShowSessionWarning(false);
    setShowLogoutConfirm(false);

    // Clear all session data
    setLastActivity(0);
    setDashboardData(null);
    setTrafficData(null);
    setSeoData(null);
    setAccessibilityData(null);
    setSystemData(null);
    setBlogPerformance([]);

    // Call logout endpoint to clear server-side session
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Ignore errors - session may already be expired
    });

    toast({
      title: "Session Expired",
      description: message,
      variant: "destructive",
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      navigate("/admin", { replace: true });
    }, 2000);
  };

  // Server status state
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check server status
  useEffect(() => {
    const checkServerStatus = async () => {
      // Always use the production API
      const healthUrl = `${API_BASE}/health`;
      
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          // Accept both 'online' and 'ok' status values
          if (data.status === 'online' || data.status === 'ok') {
            setServerStatus('online');
            return;
          }
        }
        setServerStatus('offline');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.debug(`[Server Status] Failed to check ${healthUrl}:`, errorMessage);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    // Check server status every 30 seconds
    const statusInterval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(statusInterval);
  }, [API_BASE]);

  // Check if user is already authenticated via cookie
  useEffect(() => {
    // Verify authentication using dedicated auth check endpoint
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/check`, {
          credentials: "include", // Required for cookie-based authentication
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setLastActivity(Date.now());
            setToken("authenticated"); // Use placeholder to indicate authenticated state
            fetchPosts();
            fetchDashboardData(selectedPeriod);
            fetchBlogPerformance(
              dateRange.start,
              dateRange.end,
              blogSortBy
            );
          } else {
            setIsAuthenticated(false);
            setToken(null);
          }
        } else if (response.status === 401) {
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        setIsAuthenticated(false);
        setToken(null);
      }
    };

    verifyAuth();
  }, []);

  // Auto-refresh dashboard data every 60 seconds
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "dashboard") return;

    fetchAllDashboardData();
    const interval = setInterval(() => {
      fetchAllDashboardData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, selectedPeriod, activeTab]);

  // Fetch files when switching to files tab
  useEffect(() => {
    if (activeTab === "files" && isAuthenticated) {
      fetchFiles(currentPath);
    }
  }, [activeTab, isAuthenticated]);

  // Update last activity time
  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
  };

  // Track user activity (mouse, keyboard, clicks, scroll) with throttling
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastUpdate = 0;
    const THROTTLE_MS = 5000; // Update activity at most once every 5 seconds

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity updates to avoid excessive state updates
      if (now - lastUpdate >= THROTTLE_MS) {
        updateActivity();
        lastUpdate = now;
      }
    };

    // Also track visibility changes (tab focus/blur)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Handle page visibility change for logout (better for back/forward cache)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      // Use pagehide instead of beforeunload for better bfcache compatibility
      if (document.visibilityState === 'hidden') {
        // Attempt to logout when page becomes hidden
        if (navigator.sendBeacon) {
          try {
            const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
            navigator.sendBeacon(`${API_BASE}/auth/logout`, blob);
          } catch (error) {
            // Ignore errors
          }
        }
      }
    };

    // Use pagehide event for better bfcache support
    const handlePageHide = () => {
      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon(`${API_BASE}/auth/logout`, blob);
        } catch (error) {
          // Ignore errors
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isAuthenticated, API_BASE]);

  // Session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilTimeout = SESSION_TIMEOUT - timeSinceActivity;

      // Check if session timed out
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        handleAutoLogout("Your session timed out due to inactivity.");
        return;
      }

      // Show warning when 2 minutes remaining
      if (timeUntilTimeout <= SESSION_WARNING_TIME && timeUntilTimeout > 0) {
        setShowSessionWarning(true);
        setSessionWarningCountdown(Math.ceil(timeUntilTimeout / 1000));
      } else {
        setShowSessionWarning(false);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkSession);
  }, [isAuthenticated, lastActivity]);

  // Token refresh mechanism with improved error handling
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include", // Required for cookie-based authentication
        });

        if (response.ok) {
          // Cookie is automatically updated by server
          updateActivity();
        } else if (response.status === 401 || response.status === 403) {
          // Session expired or invalid, logout
          handleAutoLogout("Your session has expired. Please login again.");
        } else {
          // Other errors - log but don't logout (might be temporary network issue)
          console.warn("Token refresh returned status:", response.status);
        }
      } catch (error) {
        // Network errors - don't logout immediately (might be temporary)
        // Only logout if we've been offline for a while
        console.warn("Token refresh error (non-fatal):", error);
      }
    };

    const refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  // Extend session handler
  const handleExtendSession = async () => {
    updateActivity();
    setShowSessionWarning(false);

    // Refresh token
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Required for cookie-based authentication
      });

      if (response.ok) {
        // Cookie is automatically updated by server
        toast({
          title: "Session Extended",
          description: "Your session has been extended.",
        });
      }
    } catch (error) {
      console.error("Token refresh error:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we're in rate limit cooldown
    if (rateLimitCooldown !== null && rateLimitCooldown > 0) {
      toast({
        title: "Please wait",
        description: `Rate limit cooldown active. Please wait ${rateLimitCooldown} more seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const loginEndpoint = `${API_BASE}/auth/login`;
      console.info("[CMS] Attempting login", {
        endpoint: loginEndpoint,
        username,
        timestamp: new Date().toISOString(),
      });

      // Use a "simple" request to avoid CORS preflight issues on some hosts.
      // application/x-www-form-urlencoded with POST is a simple request, so the
      // browser skips the OPTIONS preflight that was being blocked by cPanel.
      const body = new URLSearchParams({
        username,
        password,
      });

      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        credentials: "include", // Required for cookie-based authentication
        body,
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        console.error("[CMS] Login API responded with error", {
          status: response.status,
          statusText: response.statusText,
          bodyPreview: errorPayload?.slice?.(0, 500) ?? "n/a",
        });
        
        // Handle specific error codes with helpful messages
        if (response.status === 429) {
          // Set cooldown timer: 3 minutes (180 seconds)
          setRateLimitCooldown(180);
          
          // Start countdown timer
          const cooldownInterval = setInterval(() => {
            setRateLimitCooldown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(cooldownInterval);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
          
          throw new Error("Rate limit exceeded. Please wait 3 minutes before trying again. A countdown timer will appear.");
        } else if (response.status === 423) {
          throw new Error("Account temporarily locked. Please try again later.");
        } else if (response.status === 401) {
          throw new Error("Invalid username or password. Please check your credentials and try again.");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later or contact support.");
        }
        
        // Try to parse server error message
        try {
          const errorData = JSON.parse(errorPayload);
          throw new Error(errorData.error || errorData.message || "Login failed");
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            throw new Error(errorPayload || "Login failed");
          }
          throw parseError;
        }
      }

      const data = await response.json();
      const now = Date.now();

      // Cookie is set automatically by server, no need to store token
      setIsAuthenticated(true);
      setToken("authenticated"); // Set placeholder token for button state
      setLastActivity(now);
      setIsSessionExpired(false);

      // Clear username, password, and rate limit cooldown
      setUsername("");
      setPassword("");
      setRateLimitCooldown(null);

      // Fetch data without passing token (using cookie)
      fetchPosts();
      fetchDashboardData(selectedPeriod);
      fetchBlogPerformance(
        dateRange.start,
        dateRange.end,
        blogSortBy
      );
      toast({
        title: "Login successful",
        description: "Welcome to the CMS!",
      });
    } catch (error: any) {
      console.error("[CMS] Login failed", error);
      const errorMessage = error.message || "Unable to connect to server. Please try again.";
      
      // For rate limit errors, provide more helpful guidance
      if (errorMessage.includes("Rate limit") || errorMessage.includes("too many")) {
        toast({
          title: "Login Rate Limited",
          description: errorMessage + " The rate limit will reset automatically. You can also try refreshing the page in a few minutes.",
          variant: "destructive",
          duration: 8000, // Show longer for rate limit errors
        });
      } else {
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };


  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async (skipConfirm = false) => {
    // Show confirmation dialog unless explicitly skipped (for auto-logout)
    if (!skipConfirm && !showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }

    // Call logout endpoint to clear cookie on server
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include", // Required for cookie-based authentication
      });

      if (!response.ok && response.status !== 401) {
        // 401 is OK - session already expired
        console.warn("Logout endpoint returned:", response.status);
      }
    } catch (error) {
      // Network errors are OK - we'll still clear client-side state
      console.error("Logout error (non-fatal):", error);
    }

    // Clear all session data securely
    setToken(null);
    setIsAuthenticated(false);
    setIsSessionExpired(false);
    setShowSessionWarning(false);
    setShowLogoutConfirm(false);
    setPosts([]);
    setUsername("");
    setPassword("");
    setLastActivity(0);

    // Clear any cached data
    setDashboardData(null);
    setTrafficData(null);
    setSeoData(null);
    setAccessibilityData(null);
    setSystemData(null);
    setBlogPerformance([]);

    toast({
      title: "Logged out",
      description: "You have been logged out successfully. All session data has been cleared.",
    });

    // Redirect to the admin login screen for clarity
    navigate("/admin", { replace: true });
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/posts`, {
        credentials: "include", // Required for cookie-based authentication
      });

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data);
      updateActivity(); // Update activity on successful API call
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async (period: string = "7") => {
    try {
      setDashboardLoading(true);
      const response = await fetch(`${API_BASE}/admin/analytics/dashboard?period=${period}`, {
        credentials: "include", // Required for cookie-based authentication
      });

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Admin] Dashboard data fetch failed:", response.status, errorText);
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      console.log("[Admin] Dashboard data received:", {
        activeSessions: data.activeSessions,
        summary: {
          activeUsers: data.summary?.activeUsers,
          sessions: data.summary?.sessions,
          screenPageViews: data.summary?.screenPageViews,
          averageSessionDuration: data.summary?.averageSessionDuration
        },
        statsCount: data.stats?.length || 0,
        timeframes: {
          today: data.timeframes?.today,
          thisWeek: data.timeframes?.thisWeek,
          thisMonth: data.timeframes?.thisMonth
        },
        dataSource: data.dataSource
      });
      setDashboardData(data);
      updateActivity();
    } catch (error: any) {
      console.error("[Admin] Dashboard data error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dashboard data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch real-time traffic data
  const fetchTrafficData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingStates(prev => ({ ...prev, traffic: true }));
      const response = await fetch(`${API_BASE}/stats/traffic`, {
        credentials: "include", // Required for cookie-based authentication
      });
      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        console.log("[Admin] Traffic data received:", {
          visitorsToday: data.summary?.visitorsToday,
          visitsWeek: data.summary?.visitsWeek,
          visitsMonth: data.summary?.visitsMonth,
          activeUsers: data.summary?.activeUsers,
          sessions: data.summary?.sessions,
          hasGraph: !!data.graph,
          graphLength: data.graph?.length || 0,
          sourcesCount: data.sources?.length || 0,
          topPagesCount: data.topPages?.length || 0
        });
        // Ensure graph data is properly formatted and sorted
        if (data.graph && Array.isArray(data.graph)) {
          data.graph = data.graph
            .map((item: any) => ({
              ...item,
              visits: safe(item.visits),
              sessions: safe(item.sessions),
              date: item.date || ''
            }))
            .filter((item: any) => item.date) // Remove items without dates
            .sort((a: any, b: any) => {
              // Sort by date ascending
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
          
          // Ensure we have at least one data point
          if (data.graph.length === 0) {
            const today = new Date();
            data.graph = [{
              date: today.toISOString().split('T')[0],
              visits: 0,
              sessions: 0
            }];
          }
        } else {
          // If no graph data, create empty array with today's date
          const today = new Date();
          data.graph = [{
            date: today.toISOString().split('T')[0],
            visits: 0,
            sessions: 0
          }];
        }
        console.log("[Admin] Traffic graph data:", {
          length: data.graph.length,
          sample: data.graph.slice(0, 3),
          last: data.graph[data.graph.length - 1]
        });
        setTrafficData(data);
      } else {
        console.error("[Admin] Traffic data fetch failed:", response.status);
      }
    } catch (error) {
      console.error("[Admin] Traffic data fetch error:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, traffic: false }));
    }
  };

  // Fetch SEO data
  const fetchSeoData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingStates(prev => ({ ...prev, seo: true }));
      const response = await fetch(`${API_BASE}/stats/seo`, {
        credentials: "include", // Required for cookie-based authentication
      });
      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        console.log("[Admin] SEO data received:", {
          indexedPages: data.indexedPages,
          seoScore: data.seoScore,
          seoErrors: data.seoErrors,
          schemaErrors: data.schemaErrors,
          brokenLinks: data.brokenLinks,
          duplicateTitles: data.issues?.duplicateTitles?.length || 0,
          hasGSC: data.gscEnabled
        });
        // Ensure seoScore is always a number
        const seoData = {
          ...data,
          seoScore: Number(data.seoScore) || 0,
          indexedPages: Number(data.indexedPages) || 0,
          seoErrors: Number(data.seoErrors) || 0,
          schemaErrors: Number(data.schemaErrors) || 0,
          brokenLinks: Number(data.brokenLinks) || 0,
          defaultTitlePages: Number(data.defaultTitlePages) || 0
        };
        console.log("[Admin] SEO data normalized:", seoData);
        console.log("[Admin] SEO duplicate titles details:", {
          count: seoData.issues?.duplicateTitles?.length || 0,
          items: seoData.issues?.duplicateTitles || [],
          defaultTitlePages: seoData.defaultTitlePages || 0
        });
        setSeoData(seoData);
      } else {
        console.error("[Admin] SEO data fetch failed:", response.status);
      }
    } catch (error) {
      console.error("[Admin] SEO data fetch error:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, seo: false }));
    }
  };

  // Fetch accessibility data
  const fetchAccessibilityData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingStates(prev => ({ ...prev, accessibility: true }));
      const response = await fetch(`${API_BASE}/stats/accessibility`, {
        credentials: "include", // Required for cookie-based authentication
      });
      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        console.log("[Admin] Accessibility data received:", {
          totalPages: data.totalPages,
          aaPass: data.aaPass,
          aaaPass: data.aaaPass,
          aaPassRate: data.aaPassRate,
          aaaPassRate: data.aaaPassRate,
          pagesFailing: data.pagesFailing,
          errorCounts: {
            contrastFailures: data.errors?.contrastFailures?.length || 0,
            missingLabels: data.errors?.missingLabels?.length || 0,
            ariaIssues: data.errors?.ariaIssues?.length || 0,
            headingOrderViolations: data.errors?.headingOrderViolations?.length || 0
          }
        });
        // Ensure all required fields are present
        const accData = {
          totalPages: Number(data.totalPages) || 0,
          aaPass: Number(data.aaPass) || 0,
          aaaPass: Number(data.aaaPass) || 0,
          aaPassRate: Number(data.aaPassRate) || 0,
          aaaPassRate: Number(data.aaaPassRate) || 0,
          pagesFailing: Number(data.pagesFailing) || 0,
          errors: data.errors || {}
        };
        console.log("[Admin] Accessibility data normalized:", accData);
        setAccessibilityData(accData);
      } else {
        console.error("[Admin] Accessibility data fetch failed:", response.status);
      }
    } catch (error) {
      console.error("[Admin] Accessibility data fetch error:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, accessibility: false }));
    }
  };

  // Fetch system health data
  const fetchSystemData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingStates(prev => ({ ...prev, system: true }));
      const response = await fetch(`${API_BASE}/stats/system`, {
        credentials: "include", // Required for cookie-based authentication
      });
      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        console.log("[Admin] System data received:", {
          uptime: data.uptime,
          uptimeFormatted: data.uptimeFormatted,
          errorRate: data.errorRate,
          version: data.version,
          lastDeployment: data.lastDeployment,
          sourceMapsEnabled: data.sourceMapsEnabled,
          memoryRSS: data.memory?.rss,
          memoryUsed: data.memory?.used,
          memoryHeapUsed: data.memory?.heapUsed
        });
        // Map memory data correctly
        const sysData = {
          ...data,
          memoryUsage: data.memory?.rss ? data.memory.rss * 1024 * 1024 : (data.memory?.used ? data.memory.used * 1024 * 1024 : 0) // Convert MB back to bytes for consistency
        };
        console.log("[Admin] System data normalized:", {
          ...sysData,
          memoryUsageMB: Math.round(sysData.memoryUsage / 1024 / 1024)
        });
        setSystemData(sysData);
      } else {
        console.error("[Admin] System data fetch failed:", response.status);
      }
    } catch (error) {
      console.error("[Admin] System data fetch error:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, system: false }));
    }
  };

  // Fetch all dashboard data
  const fetchAllDashboardData = async () => {
    if (!isAuthenticated) return;
    await Promise.all([
      fetchTrafficData(),
      fetchSeoData(),
      fetchAccessibilityData(),
      fetchSystemData(),
      fetchDashboardData(selectedPeriod)
    ]);
  };

  const fetchUsageStats = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/analytics/usage?startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: "include", // Required for cookie-based authentication
        }
      );

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch usage stats");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch usage stats",
        variant: "destructive",
      });
      return null;
    }
  };

  const fetchBlogPerformance = async (
    startDate: string,
    endDate: string,
    sortBy: string = "views"
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/analytics/blog-performance?startDate=${startDate}&endDate=${endDate}&sortBy=${sortBy}`,
        {
          credentials: "include", // Required for cookie-based authentication
        }
      );

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch blog performance");
      }

      const data = await response.json();
      setBlogPerformance(data.performance || []);
      updateActivity();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blog performance",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/analytics/export?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        {
          credentials: "include", // Required for cookie-based authentication
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const handlePeriodChange = (period: "7" | "30" | "90" | "custom") => {
    setSelectedPeriod(period);
    if (period !== "custom") {
      const days = parseInt(period);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateRange({ start: startDate, end: endDate });
      if (isAuthenticated) {
        fetchDashboardData(period);
        fetchBlogPerformance(startDate, endDate, blogSortBy);
      }
    }
  };

  // Calculate read time from content (average reading speed: 200 words per minute)
  const calculateReadTime = (content: string): string => {
    if (!content) return "1 min read";

    // Strip HTML tags and get text content
    const text = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = text.split(" ").filter((word) => word.length > 0).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));

    return `${minutes} min read`;
  };

  const handleNewPost = () => {
    // Auto-calculate date as per blog standards (current date in YYYY-MM-DD format)
    const today = new Date().toISOString().split("T")[0];
    setEditingPost({
      title: "",
      slug: "",
      excerpt: "",
      metaDescription: "",
      author: "Danish Khan",
      authorLinkedin: "https://www.linkedin.com/in/danishmk1286/",
      authorInstagram: "",
      authorTwitter: "",
      authorWebsite: "",
      date: today,
      readTime: "1 min read",
      tags: [],
      featuredImage: {
        url: "",
        alt: "",
        credit: "",
      },
      content: "",
      published: false,
    });
    setTagsInput("");
    setContentEditorMode("visual");
    slugManuallyEditedRef.current = false; // Reset for new post
    setIsDialogOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    const readTime = calculateReadTime(post.content);
    setEditingPost({ ...post, readTime });
    setTagsInput(post.tags.join(", "));
    setContentEditorMode("visual");
    // Track original title to detect changes
    slugManuallyEditedRef.current = true; // Start with manual edit flag
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    if (!title) return "";
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
  };

  // Handle title change with automatic slug generation
  const handleTitleChange = (title: string) => {
    if (editingPost) {
      const originalTitle = editingPost.title || '';
      const titleChanged = title.trim() !== originalTitle.trim();
      
      // Auto-generate slug if:
      // 1. Slug hasn't been manually edited, OR
      // 2. Title changed during edit (update slug to match new title)
      if (!slugManuallyEditedRef.current || (titleChanged && editingPost.id)) {
        const generatedSlug = generateSlug(title);
        setEditingPost({
          ...editingPost,
          title,
          slug: generatedSlug,
        });
        // If title changed during edit, allow slug to update
        if (titleChanged && editingPost.id) {
          slugManuallyEditedRef.current = false; // Allow auto-slug on title change
        }
      } else {
        // Keep slug as-is if manually edited and title hasn't changed
        setEditingPost({
          ...editingPost,
          title,
        });
      }
    }
  };

  // Handle slug change - mark as manually edited
  const handleSlugChange = (slug: string) => {
    if (editingPost) {
      slugManuallyEditedRef.current = true;
      setEditingPost({
        ...editingPost,
        slug: slug.toLowerCase().trim(),
      });
    }
  };

  // Validate slug format
  const validateSlug = (slug: string) => {
    return /^[a-z0-9-]+$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
  };

  // Check for duplicate slugs
  const isDuplicateSlug = (slug: string, currentId?: number) => {
    return posts.some(post =>
      post.slug === slug && post.id !== currentId
    );
  };

  const handleSavePost = async (publishedOverride?: boolean) => {
    if (!editingPost || !isAuthenticated) {
      console.warn('⚠️ Cannot save: missing editingPost or not authenticated', {
        hasEditingPost: !!editingPost,
        isAuthenticated,
        hasToken: !!token
      });
      return;
    }
    
    if (isSavingPost) {
      console.warn('⚠️ Save already in progress, ignoring duplicate request');
      return;
    }

    // Validation - do this BEFORE setting isSavingPost to true
    if (!editingPost.title?.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingPost.slug?.trim()) {
      toast({
        title: "Error",
        description: "Slug is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateSlug(editingPost.slug)) {
      toast({
        title: "Error",
        description: "Slug must contain only lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    if (isDuplicateSlug(editingPost.slug, editingPost.id)) {
      toast({
        title: "Error",
        description: "A post with this slug already exists",
        variant: "destructive",
      });
      return;
    }

    if (!editingPost.content?.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive",
      });
      return;
    }
    
    // Only set saving state after validation passes
    setIsSavingPost(true);
    
    // Safety timeout to ensure isSavingPost is reset even if something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Save operation timeout - resetting button state');
      setIsSavingPost(false);
    }, 30000); // 30 second timeout

    try {
      // Auto-calculate read time before saving
      const finalReadTime = calculateReadTime(editingPost.content);

      // Use publishedOverride if provided, otherwise use editingPost.published
      const publishedStatus = publishedOverride !== undefined 
        ? publishedOverride 
        : (editingPost.published ?? false);

      // Debugging logs
      console.log('Saving blog post:', {
        title: editingPost.title,
        slug: editingPost.slug,
        contentLength: editingPost.content.length,
        published: publishedStatus,
        publishedOverride: publishedOverride
      });

      // Auto-calculate date: use current date for new posts, keep original date for existing posts
      const postDate = editingPost.id
        ? editingPost.date // Keep original date when editing
        : new Date().toISOString().split("T")[0]; // Auto-set to today for new posts

      const postData = {
        ...editingPost,
        published: publishedStatus,
        readTime: finalReadTime,
        date: postDate,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      // Debugging log
      console.log('Post data being sent:', postData);

      const url = editingPost.id
        ? `${API_BASE}/admin/posts/${editingPost.id}`
        : `${API_BASE}/admin/posts`;
      const method = editingPost.id ? "PUT" : "POST";

      // Enhanced debugging for live server
      console.log('📤 Sending blog post request:', {
        url,
        method,
        hasToken: !!token,
        isAuthenticated,
        publishedStatus,
        contentLength: postData.content?.length || 0,
        cookies: document.cookie ? 'Present' : 'Missing'
      });

      // Check if we're still authenticated before making the request
      if (!isAuthenticated) {
        throw new Error("You are not logged in. Please refresh the page and login again.");
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Required for cookie-based authentication
          body: JSON.stringify(postData),
        });
      } catch (networkError: any) {
        console.error('❌ Network error:', networkError);
        throw new Error(`Network error: ${networkError.message || 'Failed to connect to server. Please check your internet connection and try again.'}`);
      }

      // Debugging log
      console.log('📥 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Handle specific HTTP status codes
        if (response.status === 401) {
          console.error('❌ 401 Unauthorized - Session expired or invalid');
          console.error('   Cookie present:', document.cookie.includes('cms_session'));
          console.error('   isAuthenticated:', isAuthenticated);
          console.error('   hasToken:', !!token);
          
          // Clear any stale authentication state
          setToken(null);
          setIsAuthenticated(false);
          
          // Show error and redirect to login
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
            duration: 5000,
          });
          
          // Reset saving state before redirect
          setIsSavingPost(false);
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate("/admin", { replace: true });
          }, 2000);
          
          return; // Return early instead of throwing to prevent further error handling
        }

        if (response.status === 403) {
          throw new Error("You don't have permission to perform this action.");
        }

        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }

        let errorMessage = "Failed to save post";
        try {
          const error = JSON.parse(errorText);
          // Handle validation errors array
          if (error.errors && Array.isArray(error.errors)) {
            const validationMessages = error.errors.map((e: any) => {
              if (e.path === 'content' && e.msg?.includes('500,000')) {
                return 'Content is too large. Please upload images using the image button instead of pasting them directly.';
              }
              return e.msg || e.message || 'Validation error';
            });
            errorMessage = validationMessages.join('. ');
          } else {
            errorMessage = error.error || error.message || errorMessage;
          }
        } catch (e) {
          // If error text is not JSON, use it directly or provide a helpful message
          if (errorText) {
            errorMessage = errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText;
          } else {
            errorMessage = `Server returned ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('API success response:', result);

      const statusText = publishedStatus ? "published" : "saved as draft";
      toast({
        title: "Success",
        description: `Post ${editingPost.id ? "updated and" : "created and"} ${statusText} successfully`,
      });

      updateActivity(); // Update activity on successful save
      setIsDialogOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error: any) {
      console.error('❌ Save post error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
      
      // More detailed error message for user
      let userMessage = error.message || "Failed to save post";
      
      // Provide helpful context for common errors
      if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        userMessage = "Unable to connect to the server. Please check your internet connection and ensure the server is running.";
      } else if (error.message?.includes('Session expired') || error.message?.includes('401')) {
        userMessage = "Your session has expired. Please refresh the page and login again.";
      } else if (error.message?.includes('429')) {
        userMessage = "Too many requests. Please wait a few moments and try again.";
      }
      
      toast({
        title: "Error Saving Post",
        description: userMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds
      });
    } finally {
      // Always reset the saving state, even if redirect happens
      clearTimeout(safetyTimeout);
      setIsSavingPost(false);
      console.log('✅ Save operation completed, button state reset');
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) {
      console.warn('[FRONTEND] handleDeletePost called but deletePostId is null');
      return;
    }

    const startTime = Date.now();
    const postId = deletePostId;
    
    console.log('\n' + '='.repeat(80));
    console.log(`🗑️  [FRONTEND] Starting delete operation for post ID: ${postId}`);
    console.log('='.repeat(80));
    console.log(`📤 [FRONTEND] API Request:`);
    console.log(`   URL: ${API_BASE}/admin/posts/${postId}`);
    console.log(`   Method: DELETE`);
    console.log(`   Credentials: include`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    try {
      console.log(`\n🔄 [FRONTEND] Sending DELETE request...`);
      const response = await fetch(`${API_BASE}/admin/posts/${postId}`, {
        method: "DELETE",
        credentials: "include", // Required for cookie-based authentication
      });

      const duration = Date.now() - startTime;
      console.log(`\n📥 [FRONTEND] Response received:`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   OK: ${response.ok}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`\n❌ [FRONTEND] Error response body:`, errorText);
        
        let errorMessage = "Failed to delete post";
        let errorDetails: any = {};
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || error.message || errorMessage;
          errorDetails = error;
          console.log(`   Parsed error:`, error);
        } catch (e) {
          console.log(`   Could not parse error as JSON:`, e);
          if (errorText) {
            errorMessage = errorText;
          } else {
            errorMessage = `Server returned ${response.status} ${response.statusText}`;
          }
        }
        
        console.error(`\n❌ [FRONTEND] Delete failed:`);
        console.error(`   Post ID: ${postId}`);
        console.error(`   Status: ${response.status}`);
        console.error(`   Error: ${errorMessage}`);
        console.error(`   Details:`, errorDetails);
        console.error('='.repeat(80) + '\n');
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`\n✅ [FRONTEND] Delete successful:`);
      console.log(`   Post ID: ${postId}`);
      console.log(`   Response:`, result);
      console.log(`   Total duration: ${Date.now() - startTime}ms`);
      console.log('='.repeat(80) + '\n');

      toast({
        title: "Success",
        description: "Post deleted successfully. It has been removed from the database and sitemap.",
      });

      updateActivity(); // Update activity on successful delete
      setDeletePostId(null);
      fetchPosts(); // Refresh the posts list
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ [FRONTEND] Delete post error:`);
      console.error(`   Post ID: ${postId}`);
      console.error(`   Error:`, error);
      console.error(`   Message: ${error.message || 'Unknown error'}`);
      console.error(`   Stack: ${error.stack || 'No stack trace'}`);
      console.error(`   Duration: ${duration}ms`);
      console.error('='.repeat(80) + '\n');
      
      toast({
        title: "Error Deleting Post",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingPost) return;

    // Add authentication check before uploading featured image
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      console.log('📤 Uploading featured image:', file.name, file.size, 'bytes');

      const response = await fetch(`${API_BASE}/admin/upload`, {
        method: "POST",
        credentials: "include", // Required for cookie-based authentication
        body: formData,
      });

      console.log('=== UPLOAD RESPONSE ===');
      console.log('Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      console.log('✅ Upload success, data:', data);

      // Improve upload debugging
      console.log("Upload API:", API_BASE);
      console.log("Returned URL:", data.url);

      // Ensure correct URL build logic
      let imageUrl = data.url;
      if (!imageUrl.startsWith("http")) {
        const origin = new URL(API_BASE).origin;
        if (!imageUrl.startsWith("/")) imageUrl = "/" + imageUrl;
        imageUrl = origin + imageUrl;
      }

      console.log("Final Image URL:", imageUrl);

      setEditingPost({
        ...editingPost,
        featuredImage: {
          ...editingPost.featuredImage,
          url: imageUrl,
        },
      });

      updateActivity(); // Update activity on successful upload
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('❌ Image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  // File editor functions
  const fetchFiles = async (dirPath: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/files?path=${encodeURIComponent(dirPath)}`,
        {
          credentials: "include", // Required for cookie-based authentication
        }
      );

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFileTree(data.items);
      setCurrentPath(data.path);
      updateActivity(); // Update activity on successful API call
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch files",
        variant: "destructive",
      });
    }
  };

  const handleFileClick = async (filePath: string) => {
    if (!isAuthenticated) return;

    setFileLoading(true);
    setSelectedFile(filePath);

    try {
      const response = await fetch(
        `${API_BASE}/admin/files/read?path=${encodeURIComponent(filePath)}`,
        {
          credentials: "include", // Required for cookie-based authentication
        }
      );

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to read file");
      }

      const data = await response.json();
      setFileContent(data.content);
      updateActivity(); // Update activity on successful file read
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to read file",
        variant: "destructive",
      });
      setSelectedFile(null);
      setFileContent("");
    } finally {
      setFileLoading(false);
    }
  };

  const handleDirectoryClick = (dirPath: string) => {
    if (isAuthenticated) {
      setCurrentPath(dirPath);
      fetchFiles(dirPath);
      setExpandedDirs((prev) => new Set(prev).add(dirPath));
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE}/admin/files/write`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Required for cookie-based authentication
        body: JSON.stringify({
          path: selectedFile,
          content: fileContent,
        }),
      });

      if (response.status === 401) {
        handleAutoLogout("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save file");
      }

      updateActivity(); // Update activity on successful file save
      toast({
        title: "Success",
        description: "File saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save file",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEOHead
        title="Admin Dashboard | The Color Contrast Checker"
        description="Admin dashboard for managing blog posts and website content"
        metaRobots="noindex, nofollow"
      />
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Site Navigation Header */}
        <div className="flex-shrink-0">
          <Header />
        </div>
        <SidebarProvider className="flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {isAuthenticated ? (
            <>
              {/* Sidebar */}
              <Sidebar variant="inset" collapsible="icon">
              <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold text-sidebar-foreground">CMS Admin</span>
                    <span className="text-xs text-sidebar-foreground/70">Dashboard</span>
                  </div>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>MENU</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveTab("dashboard")}
                        isActive={activeTab === "dashboard"}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveTab("posts")}
                        isActive={activeTab === "posts"}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Blog Posts</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveTab("media")}
                        isActive={activeTab === "media"}
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>Media Library</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveTab("files")}
                        isActive={activeTab === "files"}
                      >
                        <File className="h-4 w-4" />
                        <span>File Editor</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveTab("settings")}
                        isActive={activeTab === "settings"}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>SUPPORT</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <a href="/" target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          <span>View Website</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Top Header */}
              <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
                <SidebarTrigger />
                <div className="flex flex-1 items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="search"
                      id="admin-search"
                      aria-label="Search dashboard or type command"
                      placeholder="Search or type command..."
                      className="pl-9 h-9 w-full"
                    />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{username}</p>
                          <p className="text-xs leading-none text-muted-foreground">Administrator</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.open("/", "_blank", "noopener,noreferrer")}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Website</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        handleLogout(false);
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                  {/* Dashboard Tab */}
                  {activeTab === "dashboard" && (
                    <>
                      {/* Dashboard Header */}
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-bold">Overview</h2>
                          <p className="text-muted-foreground">
                            Monitor your tool usage and blog performance
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedPeriod === "7" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePeriodChange("7")}
                          >
                            Weekly
                          </Button>
                          <Button
                            variant={selectedPeriod === "30" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePeriodChange("30")}
                          >
                            Monthly
                          </Button>
                          <Button
                            variant={selectedPeriod === "90" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePeriodChange("90")}
                          >
                            Yearly
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleExportCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Filter
                          </Button>
                        </div>
                      </div>

                      {/* Four Core Dashboard Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Website Traffic Card */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Website Traffic
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.traffic ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : trafficData ? (
                              <>
                                <div className="text-2xl font-bold">
                                  {safe(trafficData.summary?.visitorsToday)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Visitors today
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">This week:</span>
                                    <span className="font-medium">{safe(trafficData.summary?.visitsWeek)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">This month:</span>
                                    <span className="font-medium">{safe(trafficData.summary?.visitsMonth)}</span>
                                  </div>
                                  {trafficData.summary?.monthChange !== undefined && (
                                    <div className="flex items-center mt-2 text-xs">
                                      {safe(trafficData.summary.monthChange) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                                      ) : (
                                        <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                                      )}
                                      <span className={safe(trafficData.summary.monthChange) >= 0 ? "text-green-500" : "text-red-500"}>
                                        {Math.abs(safe(trafficData.summary.monthChange))}%
                                      </span>
                                      <span className="text-muted-foreground ml-1">vs last month</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">No data</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Active Users Card */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Active Users
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.traffic ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : trafficData ? (
                              <>
                                <div className="text-2xl font-bold">
                                  {safe(trafficData.summary?.activeUsers)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Users online now
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Last 30 min:</span>
                                    <span className="font-medium">{safe(trafficData.summary?.sessionsLast30Min)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Avg session:</span>
                                    <span className="font-medium">
                                      {(() => {
                                        const duration = safe(trafficData.summary?.avgSessionDuration);
                                        if (duration > 0) {
                                          return `${Math.floor(duration / 60)}m ${duration % 60}s`;
                                        }
                                        return '0s';
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">No data</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* SEO Health Card */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              SEO Health
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.seo ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : seoData ? (
                              <>
                                <div className="text-2xl font-bold">
                                  {safe(seoData?.seoScore ?? 0)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  SEO Score
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Indexed pages:</span>
                                    <span className="font-medium">{safe(seoData?.indexedPages ?? 0)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">SEO errors:</span>
                                    <span className="font-medium text-red-500">{safe(seoData?.seoErrors ?? 0)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Schema errors:</span>
                                    <span className="font-medium text-red-500">{safe(seoData?.schemaErrors ?? 0)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Broken links:</span>
                                    <span className="font-medium text-red-500">{safe(seoData?.brokenLinks ?? 0)}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">No data</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Accessibility Score Card */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Accessibility Score
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.accessibility ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : accessibilityData ? (
                              <>
                                {(() => {
                                  const accData = accessibilityData || {};
                                  // Use aaPassRate and aaaPassRate directly from API, or calculate from totalPages/aaPass/aaaPass
                                  const totalPages = safe(accData.totalPages ?? 0);
                                  const aaPass = safe(accData.aaPass ?? 0);
                                  const aaaPass = safe(accData.aaaPass ?? 0);
                                  const aaPassRate = accData.aaPassRate !== undefined 
                                    ? safe(accData.aaPassRate) 
                                    : (totalPages > 0 ? Math.round((aaPass / totalPages) * 100) : 0);
                                  const aaaPassRate = accData.aaaPassRate !== undefined
                                    ? safe(accData.aaaPassRate)
                                    : (totalPages > 0 ? Math.round((aaaPass / totalPages) * 100) : 0);
                                  const pagesFailing = safe(accData.pagesFailing ?? (totalPages - aaPass));
                                  
                                  return (
                                    <>
                                      <div className="text-2xl font-bold">
                                        {safe(aaPassRate)}%
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        WCAG AA pass rate
                                      </p>
                                      <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Total pages:</span>
                                          <span className="font-medium">{safe(totalPages)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">AAA pass rate:</span>
                                          <span className="font-medium">{safe(aaaPassRate)}%</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">Pages failing:</span>
                                          <span className="font-medium text-red-500">{safe(pagesFailing)}</span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">No data</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Traffic Graph - Last 30 Days */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Traffic Graph (Last 30 Days)</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {loadingStates.traffic ? (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">Loading...</div>
                          ) : trafficData?.graph && Array.isArray(trafficData.graph) && trafficData.graph.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart 
                                data={trafficData.graph}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                <XAxis
                                  dataKey="date"
                                  stroke="hsl(var(--muted-foreground))"
                                  style={{ fontSize: '12px' }}
                                  tickFormatter={(value) => {
                                    // Format date to be more readable
                                    if (!value) return '';
                                    try {
                                      const date = new Date(value);
                                      if (isNaN(date.getTime())) {
                                        // Try parsing as YYYY-MM-DD if direct Date() fails
                                        const parts = String(value).split('-');
                                        if (parts.length === 3) {
                                          const parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                          return parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }
                                        return value;
                                      }
                                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    } catch (e) {
                                      return value;
                                    }
                                  }}
                                  interval="preserveStartEnd"
                                  minTickGap={30}
                                />
                                <YAxis
                                  stroke="hsl(var(--muted-foreground))"
                                  style={{ fontSize: '12px' }}
                                  allowDecimals={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px'
                                  }}
                                  labelFormatter={(value) => {
                                    if (!value) return '';
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                  }}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="visits"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth={2}
                                  name="Visits"
                                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                                  connectNulls={false}
                                  isAnimationActive={true}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                              No traffic data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Traffic Sources & Top Pages Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Traffic Sources Bar Chart */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Traffic Sources</CardTitle>
                              <CardDescription className="mt-1">
                                Last 30 days
                              </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.traffic ? (
                              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                  <span className="text-sm">Loading traffic sources...</span>
                                </div>
                              </div>
                            ) : trafficData?.sources && Array.isArray(trafficData.sources) && trafficData.sources.length > 0 ? (
                              <>
                                {/* Summary Stats */}
                                {(() => {
                                  const total = trafficData.sources.reduce((sum: number, item: any) => sum + safe(item.count), 0);
                                  const topSource = trafficData.sources.reduce((max: any, item: any) => 
                                    safe(item.count) > safe(max.count) ? item : max, trafficData.sources[0]
                                  );
                                  return (
                                    <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Sessions:</span>
                                        <span className="font-semibold">{total.toLocaleString()}</span>
                                      </div>
                                      {topSource && (
                                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border/50">
                                          <span className="text-muted-foreground">Top Source:</span>
                                          <span className="font-semibold text-primary">{topSource.source} ({total > 0 ? ((safe(topSource.count) / total) * 100).toFixed(1) : '0'}%)</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                <ResponsiveContainer width="100%" height={250}>
                                  <BarChart 
                                    data={trafficData.sources.map((item: any) => ({
                                      ...item,
                                      count: Number(item.count) || 0
                                    }))}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                                    <XAxis 
                                      dataKey="source" 
                                      stroke="hsl(var(--muted-foreground))"
                                      style={{ fontSize: '12px' }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={60}
                                    />
                                    <YAxis 
                                      stroke="hsl(var(--muted-foreground))"
                                      style={{ fontSize: '12px' }}
                                      allowDecimals={false}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                      }}
                                      formatter={(value: any, name: string, props: any) => {
                                        const total = trafficData.sources.reduce((sum: number, item: any) => sum + safe(item.count), 0);
                                        const safeValue = safe(value);
                                        const percentage = total > 0 ? ((safeValue / total) * 100).toFixed(1) : '0';
                                        return [`${safeValue.toLocaleString()} (${percentage}%)`, 'Sessions'];
                                      }}
                                    />
                                    <Bar 
                                      dataKey="count" 
                                      radius={[4, 4, 0, 0]}
                                    >
                                      {trafficData.sources.map((entry: any, index: number) => {
                                        const colors = [
                                          'hsl(var(--primary))',
                                          'hsl(var(--primary))',
                                          'hsl(var(--primary))',
                                          'hsl(var(--primary))',
                                        ];
                                        return (
                                          <Cell 
                                            key={`cell-${index}`}
                                            fill={colors[index % colors.length]}
                                          />
                                        );
                                      })}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground gap-2">
                                <div className="rounded-full bg-muted p-3">
                                  <BarChart3 className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium">No traffic sources data</p>
                                <p className="text-xs text-muted-foreground">Traffic data will appear here once available</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Top Pages Table */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Top Pages</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {loadingStates.traffic ? (
                              <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : trafficData?.topPages && trafficData.topPages.length > 0 ? (
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>URL</TableHead>
                                      <TableHead>Views</TableHead>
                                      <TableHead>Bounce Rate</TableHead>
                                      <TableHead>SEO Score</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {trafficData.topPages.slice(0, 5).map((page: any, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium text-xs">{page.url || 'N/A'}</TableCell>
                                        <TableCell>{page.views || 0}</TableCell>
                                        <TableCell>{page.bounce_rate ? `${page.bounce_rate.toFixed(1)}%` : 'N/A'}</TableCell>
                                        <TableCell>{page.seo_score ? `${page.seo_score.toFixed(1)}%` : 'N/A'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No page data available</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* SEO Issues List */}
                      <Card>
                        <CardHeader>
                          <CardTitle>SEO Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingStates.seo ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          ) : seoData?.issues ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Missing Meta Tags ({seoData.issues.missingMetaTags?.length || 0})</h4>
                                {seoData.issues.missingMetaTags?.length > 0 ? (
                                  <div className="space-y-1">
                                    {seoData.issues.missingMetaTags.slice(0, 5).map((issue: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {issue.url}: {issue.issue}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No missing meta tags</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-2">
                                  Duplicate Titles ({seoData.issues.duplicateTitles?.length || 0})
                                  {seoData.defaultTitlePages > 1 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({seoData.defaultTitlePages} pages using default title - will be unique after deployment)
                                    </span>
                                  )}
                                </h4>
                                {seoData.issues.duplicateTitles?.length > 0 ? (
                                  <div className="space-y-1">
                                    {seoData.issues.duplicateTitles.slice(0, 5).map((issue: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {issue.url}: "{issue.title}"
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No duplicate titles</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Invalid Structured Data ({seoData.issues.invalidStructuredData?.length || 0})</h4>
                                {seoData.issues.invalidStructuredData?.length > 0 ? (
                                  <div className="space-y-1">
                                    {seoData.issues.invalidStructuredData.slice(0, 5).map((issue: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {issue.url}: {issue.error}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No structured data errors</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No SEO data available</div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Accessibility Errors List */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Accessibility Errors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingStates.accessibility ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          ) : accessibilityData?.errors ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Contrast Failures ({accessibilityData.errors.contrastFailures?.length || 0})</h4>
                                {accessibilityData.errors.contrastFailures?.length > 0 ? (
                                  <div className="space-y-1">
                                    {accessibilityData.errors.contrastFailures.slice(0, 5).map((error: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {error.url}: {error.message}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No contrast failures</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Missing Labels ({accessibilityData.errors.missingLabels?.length || 0})</h4>
                                {accessibilityData.errors.missingLabels?.length > 0 ? (
                                  <div className="space-y-1">
                                    {accessibilityData.errors.missingLabels.slice(0, 5).map((error: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {error.url}: {error.message}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No missing labels</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-2">ARIA Issues ({accessibilityData.errors.ariaIssues?.length || 0})</h4>
                                {accessibilityData.errors.ariaIssues?.length > 0 ? (
                                  <div className="space-y-1">
                                    {accessibilityData.errors.ariaIssues.slice(0, 5).map((error: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {error.url}: {error.message}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No ARIA issues</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Heading Order Violations ({accessibilityData.errors.headingOrderViolations?.length || 0})</h4>
                                {accessibilityData.errors.headingOrderViolations?.length > 0 ? (
                                  <div className="space-y-1">
                                    {accessibilityData.errors.headingOrderViolations.slice(0, 5).map((error: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {error.url}: {error.message}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-500">No heading order violations</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No accessibility data available</div>
                          )}
                        </CardContent>
                      </Card>

                      {/* System Health Panel */}
                      <Card>
                        <CardHeader>
                          <CardTitle>System Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingStates.system ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          ) : systemData ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Uptime</div>
                                <div className="text-lg font-semibold">{systemData.uptimeFormatted || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Error Rate</div>
                                <div className="text-lg font-semibold">{safe(systemData?.errorRate ?? 0)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Version</div>
                                <div className="text-lg font-semibold">{systemData.version || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Source Maps</div>
                                <div className="text-lg font-semibold">
                                  {systemData.sourceMapsEnabled ? (
                                    <span className="text-green-500">Enabled</span>
                                  ) : (
                                    <span className="text-red-500">Disabled</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Last Deployment</div>
                                <div className="text-xs font-medium">
                                  {systemData.lastDeployment
                                    ? new Date(systemData.lastDeployment).toLocaleDateString()
                                    : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Memory Usage</div>
                                <div className="text-lg font-semibold">
                                  {(() => {
                                    // systemData.memory.rss is already in MB from backend
                                    const memMB = safe(systemData?.memory?.rss ?? systemData?.memory?.used ?? systemData?.memoryUsage ? Math.round(systemData.memoryUsage / 1024 / 1024) : 0);
                                    return `${memMB} MB`;
                                  })()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No system data available</div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Audit Log */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Audit Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-4">
                            Recent admin actions and security events
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`${API_BASE}/admin/audit-log?limit=50`, {
                                  credentials: "include", // Required for cookie-based authentication
                                });
                                if (response.ok) {
                                  const logs = await response.json();
                                  // TODO: Display logs in a table or modal
                                  toast({
                                    title: "Audit Log",
                                    description: `Loaded ${logs.length} log entries`,
                                  });
                                }
                              } catch (error) {
                                console.error("Audit log fetch error:", error);
                              }
                            }}
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            Load Audit Log
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Blog Performance - TailAdmin Style */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Blog Performance</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 mb-4">
                            <Button
                              variant={blogSortBy === "views" ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setBlogSortBy("views");
                                if (isAuthenticated) {
                                  fetchBlogPerformance(
                                    dateRange.start,
                                    dateRange.end,
                                    "views"
                                  );
                                }
                              }}
                            >
                              Top by Views
                            </Button>
                            <Button
                              variant={blogSortBy === "read_time" ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setBlogSortBy("read_time");
                                if (isAuthenticated) {
                                  fetchBlogPerformance(
                                    dateRange.start,
                                    dateRange.end,
                                    "read_time"
                                  );
                                }
                              }}
                            >
                              Top by Read Time
                            </Button>
                            <Button
                              variant={blogSortBy === "recent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setBlogSortBy("recent");
                                if (isAuthenticated) {
                                  fetchBlogPerformance(
                                    dateRange.start,
                                    dateRange.end,
                                    "recent"
                                  );
                                }
                              }}
                            >
                              Recently Published
                            </Button>
                          </div>
                          {blogPerformance.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Post</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead>Unique Views</TableHead>
                                    <TableHead>Avg Read Time</TableHead>
                                    <TableHead>Internal Clicks</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {blogPerformance.map((post: any) => (
                                    <TableRow key={post.post_id}>
                                      <TableCell className="font-medium">
                                        {post.title || post.post_slug}
                                      </TableCell>
                                      <TableCell>{post.total_views || 0}</TableCell>
                                      <TableCell>{post.unique_views || 0}</TableCell>
                                      <TableCell>
                                        {post.avg_read_time
                                          ? `${Math.round(post.avg_read_time / 60)} min`
                                          : "N/A"}
                                      </TableCell>
                                      <TableCell>{post.internal_clicks || 0}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                              No blog performance data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {dashboardLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading dashboard data...
                        </div>
                      )}
                    </>
                  )}

                  {/* Blog Posts Tab */}
                  {activeTab === "posts" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-bold">Blog Posts</h2>
                          <p className="text-muted-foreground">
                            Manage your blog content
                          </p>
                        </div>
                        <Button onClick={handleNewPost}>
                          <Plus className="w-4 h-4 mr-2" />
                          New Post
                        </Button>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Blog Posts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {posts.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                              <FileText className="w-14 h-14 mx-auto mb-4 text-muted-foreground/50" />
                              <h3 className="font-semibold text-lg mb-2">No blog posts yet</h3>
                              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Start sharing your accessibility insights with your first blog post
                              </p>
                              <Button onClick={handleNewPost} size="lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Post
                              </Button>
                            </div>
                          ) : (
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-[350px] font-semibold">Post</TableHead>
                                    <TableHead className="font-semibold">Author</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {posts.map((post) => (
                                    <TableRow key={post.id} className="group hover:bg-muted/20">
                                      <TableCell className="py-4">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                            {post.title}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                              /{post.slug}
                                            </span>
                                            {post.tags && post.tags.length > 0 && (
                                              <span className="text-xs text-muted-foreground">
                                                • {post.tags.slice(0, 2).join(", ")}
                                                {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm font-medium">{post.author}</span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(post.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={post.published ? "default" : "secondary"}
                                          className={`gap-1.5 ${
                                            post.published
                                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20"
                                              : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                          }`}
                                        >
                                          {post.published ? (
                                            <>
                                              <Eye className="w-3 h-3" />
                                              Live
                                            </>
                                          ) : (
                                            <>
                                              <EyeOff className="w-3 h-3" />
                                              Draft
                                            </>
                                          )}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                                          {post.published && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                                              title="View live post"
                                              className="h-8 w-8 p-0"
                                            >
                                              <ArrowUpRight className="w-4 h-4" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditPost(post)}
                                            title="Edit post"
                                            className="h-8 w-8 p-0 hover:text-primary"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletePostId(post.id!)}
                                            title="Delete post"
                                            className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {/* Posts count summary */}
                              <div className="px-4 py-3 border-t bg-muted/20 text-sm text-muted-foreground">
                                {posts.length} post{posts.length !== 1 ? "s" : ""} • 
                                {posts.filter(p => p.published).length} published • 
                                {posts.filter(p => !p.published).length} draft{posts.filter(p => !p.published).length !== 1 ? "s" : ""}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Account Settings Tab */}
                  {activeTab === "settings" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold">Account Settings</h2>
                        <p className="text-muted-foreground">
                          Manage your profile, password, and account security
                        </p>
                      </div>

                      <Tabs defaultValue="profile" className="w-full">
                        <TabsList>
                          <TabsTrigger value="profile">Profile</TabsTrigger>
                          <TabsTrigger value="password">Password</TabsTrigger>
                          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Profile Information</CardTitle>
                              <CardDescription>
                                Update your username, email, and display name
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor="settings-username">Username</Label>
                                <Input
                                  id="settings-username"
                                  aria-label="Username"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="Enter username"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Username must be 3-50 characters, lowercase letters, numbers, and underscores only
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="settings-email">Email</Label>
                                <Input
                                  id="settings-email"
                                  type="email"
                                  aria-label="Email address"
                                  placeholder="Enter email"
                                />
                              </div>
                              <div>
                                <Label htmlFor="settings-display-name">Display Name</Label>
                                <Input
                                  id="settings-display-name"
                                  aria-label="Display name"
                                  placeholder="Enter display name"
                                />
                              </div>
                              <Button onClick={async () => {
                                try {
                                  const emailInput = document.getElementById('settings-email') as HTMLInputElement;
                                  const displayNameInput = document.getElementById('settings-display-name') as HTMLInputElement;

                                  const response = await fetch(`${API_BASE}/admin/profile`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    credentials: "include", // Required for cookie-based authentication
                                    body: JSON.stringify({
                                      username: username.trim().toLowerCase(),
                                      email: emailInput?.value || undefined,
                                      displayName: displayNameInput?.value || undefined,
                                    }),
                                  });

                                  if (response.status === 401) {
                                    handleAutoLogout("Your session has expired. Please login again.");
                                    return;
                                  }

                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || 'Failed to update profile');
                                  }

                                  const data = await response.json();

                                  // Cookie is automatically updated by server if username changed
                                  toast({
                                    title: "Profile Updated",
                                    description: "Your profile has been updated successfully.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to update profile",
                                    variant: "destructive",
                                  });
                                }
                              }}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="password" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Change Password</CardTitle>
                              <CardDescription>
                                Update your password. Minimum 12 characters with uppercase, lowercase, number, and symbol.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                  id="current-password"
                                  type="password"
                                  placeholder="Enter current password"
                                />
                              </div>
                              <div>
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  placeholder="Enter new password"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Must be at least 12 characters with uppercase, lowercase, number, and symbol
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                  id="confirm-password"
                                  type="password"
                                  placeholder="Confirm new password"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={async () => {
                                  if (!isAuthenticated) return;
                                  try {
                                    const currentPasswordInput = document.getElementById('current-password') as HTMLInputElement;
                                    const newPasswordInput = document.getElementById('new-password') as HTMLInputElement;
                                    const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;

                                    const currentPassword = currentPasswordInput?.value || '';
                                    const newPassword = newPasswordInput?.value || '';
                                    const confirmPassword = confirmPasswordInput?.value || '';

                                    if (newPassword !== confirmPassword) {
                                      toast({
                                        title: "Error",
                                        description: "Passwords do not match",
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    const response = await fetch(`${API_BASE}/admin/change-password`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      credentials: "include", // Required for cookie-based authentication
                                      body: JSON.stringify({
                                        currentPassword,
                                        newPassword,
                                        confirmPassword,
                                      }),
                                    });

                                    if (response.status === 401) {
                                      handleAutoLogout("Your session has expired. Please login again.");
                                      return;
                                    }

                                    if (!response.ok) {
                                      const error = await response.json();
                                      throw new Error(error.error || 'Failed to change password');
                                    }

                                    // Cookie is automatically updated by server
                                    // Clear password fields
                                    if (currentPasswordInput) currentPasswordInput.value = '';
                                    if (newPasswordInput) newPasswordInput.value = '';
                                    if (confirmPasswordInput) confirmPasswordInput.value = '';

                                    toast({
                                      title: "Password Changed",
                                      description: "Your password has been changed successfully. All other sessions have been invalidated.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to change password",
                                      variant: "destructive",
                                    });
                                  }
                                }}>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Change Password
                                </Button>
                                <Button variant="outline" onClick={async () => {
                                  try {
                                    const response = await fetch(`${API_BASE}/admin/logout-all`, {
                                      method: 'POST',
                                      credentials: "include", // Required for cookie-based authentication
                                    });

                                    if (response.status === 401) {
                                      handleAutoLogout("Your session has expired. Please login again.");
                                      return;
                                    }

                                    if (!response.ok) {
                                      throw new Error('Failed to logout all devices');
                                    }

                                    toast({
                                      title: "All Sessions Logged Out",
                                      description: "You have been logged out of all devices.",
                                    });

                                    setTimeout(() => {
                                      handleLogout();
                                    }, 2000);
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to logout all devices",
                                      variant: "destructive",
                                    });
                                  }
                                }}>
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Sign Out of All Devices
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="roles" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Roles & Permissions</CardTitle>
                              <CardDescription>
                                Manage user roles and access permissions (Super Admin only)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <AdminManagement token={token} onError={(error) => {
                                toast({
                                  title: "Error",
                                  description: error,
                                  variant: "destructive",
                                });
                              }} />
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}

                  {/* Media Library Tab */}
                  {activeTab === "media" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold">Media Library</h2>
                        <p className="text-muted-foreground">
                          Manage all uploaded images, videos, and audio files
                        </p>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Media Files</CardTitle>
                          <CardDescription>
                            Upload, preview, and manage your media assets
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <MediaLibrary />
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* File Editor Tab */}
                  {activeTab === "files" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold">File Editor</h2>
                        <p className="text-muted-foreground">
                          Edit your project files directly from the admin panel
                        </p>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>File Editor</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Edit your project files directly from the admin panel. Changes
                            are saved immediately.
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* File Browser */}
                            <div className="lg:col-span-1 border rounded-lg p-4 max-h-[600px] overflow-y-auto">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">File Browser</h3>
                                <div className="flex gap-2">
                                  {currentPath && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const parentPath = currentPath
                                          .split("/")
                                          .slice(0, -1)
                                          .join("/");
                                        setCurrentPath(parentPath);
                                        if (isAuthenticated) fetchFiles(parentPath);
                                      }}
                                    >
                                      ← Back
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentPath("");
                                      if (isAuthenticated) fetchFiles("");
                                      setSelectedFile(null);
                                      setFileContent("");
                                    }}
                                  >
                                    Root
                                  </Button>
                                </div>
                              </div>
                              {currentPath && (
                                <div className="mb-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                                  Current: {currentPath || "root"}
                                </div>
                              )}
                              <div className="space-y-1">
                                {fileTree.map((item) => (
                                  <div key={item.path}>
                                    {item.type === "directory" ? (
                                      <div
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                        onClick={() => handleDirectoryClick(item.path)}
                                      >
                                        {expandedDirs.has(item.path) ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                        <Folder className="w-4 h-4 text-primary" />
                                        <span className="text-sm">{item.name}</span>
                                      </div>
                                    ) : (
                                      <div
                                        className={`flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer ${selectedFile === item.path
                                          ? "bg-primary/10"
                                          : ""
                                          }`}
                                        onClick={() => handleFileClick(item.path)}
                                      >
                                        <File className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm flex-1">
                                          {item.name}
                                        </span>
                                        {item.size && (
                                          <span className="text-xs text-muted-foreground">
                                            {(item.size / 1024).toFixed(1)}KB
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* File Editor */}
                            <div className="lg:col-span-2 border rounded-lg p-4">
                              {fileLoading ? (
                                <div className="flex items-center justify-center h-64">
                                  <p className="text-muted-foreground">Loading file...</p>
                                </div>
                              ) : selectedFile ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Code className="w-4 h-4" />
                                        <span className="font-medium">
                                          {selectedFile}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Edit the file content below
                                      </p>
                                    </div>
                                    <Button onClick={handleSaveFile}>
                                      <Save className="w-4 h-4 mr-2" />
                                      Save File
                                    </Button>
                                  </div>
                                  <Textarea
                                    value={fileContent}
                                    onChange={(e) => setFileContent(e.target.value)}
                                    className="font-mono text-sm min-h-[500px]"
                                    placeholder="File content will appear here..."
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-64">
                                  <div className="text-center">
                                    <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                      Select a file from the browser to edit
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                </div>
              </main>
            </div>

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost?.id ? "Edit Post" : "Create New Post"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPost?.id
                      ? "Update the blog post details below. Changes will be saved when you click Save."
                      : "Fill in the details below to create a new blog post. All fields marked with * are required."}
                  </DialogDescription>
                </DialogHeader>
                {editingPost && (
                  <div className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList>
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="seo">SEO & Media</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={editingPost.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="slug">Slug *</Label>
                          <Input
                            id="slug"
                            value={editingPost.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            required
                            placeholder="my-blog-post-url"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            URL-friendly identifier. Only lowercase letters, numbers, and hyphens allowed.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="excerpt">Excerpt</Label>
                          <Textarea
                            id="excerpt"
                            value={editingPost.excerpt}
                            onChange={(e) =>
                              setEditingPost({
                                ...editingPost,
                                excerpt: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="author">Author *</Label>
                          <Input
                            id="author"
                            value={editingPost.author}
                            onChange={(e) =>
                              setEditingPost({
                                ...editingPost,
                                author: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="text"
                            value={editingPost.date}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {editingPost.id
                              ? "Date is set when post is created and cannot be changed"
                              : "Date will be automatically set to today when you save this post"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="readTime">
                              Read Time (Auto-calculated)
                            </Label>
                            <Input
                              id="readTime"
                              value={editingPost.readTime}
                              readOnly
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculated from content length
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="authorLinkedin">Author LinkedIn</Label>
                            <Input
                              id="authorLinkedin"
                              value={editingPost.authorLinkedin}
                              onChange={(e) =>
                                setEditingPost({
                                  ...editingPost,
                                  authorLinkedin: e.target.value,
                                })
                              }
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                        </div>
                        
                        {/* Author Social Links */}
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Author Social Links (optional)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="authorInstagram">Instagram</Label>
                              <Input
                                id="authorInstagram"
                                value={editingPost.authorInstagram}
                                onChange={(e) =>
                                  setEditingPost({
                                    ...editingPost,
                                    authorInstagram: e.target.value,
                                  })
                                }
                                placeholder="https://instagram.com/username"
                              />
                            </div>
                            <div>
                              <Label htmlFor="authorTwitter">Twitter/X</Label>
                              <Input
                                id="authorTwitter"
                                value={editingPost.authorTwitter}
                                onChange={(e) =>
                                  setEditingPost({
                                    ...editingPost,
                                    authorTwitter: e.target.value,
                                  })
                                }
                                placeholder="https://twitter.com/username"
                              />
                            </div>
                            <div>
                              <Label htmlFor="authorWebsite">Website</Label>
                              <Input
                                id="authorWebsite"
                                value={editingPost.authorWebsite}
                                onChange={(e) =>
                                  setEditingPost({
                                    ...editingPost,
                                    authorWebsite: e.target.value,
                                  })
                                }
                                placeholder="https://example.com"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="WCAG, Accessibility, Design"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="published"
                            checked={editingPost.published}
                            onChange={(e) =>
                              setEditingPost({
                                ...editingPost,
                                published: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <Label htmlFor="published">Published</Label>
                        </div>
                      </TabsContent>

                      <TabsContent value="content" className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="content">Content *</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  contentEditorMode === "visual"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setContentEditorMode("visual")}
                              >
                                Visual Editor
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  contentEditorMode === "html"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setContentEditorMode("html")}
                              >
                                HTML Code
                              </Button>
                            </div>
                          </div>

                          {contentEditorMode === "visual" ? (
                            <div>
                              <div className="space-y-2">
                                <ReactQuillEditor
                                  ref={quillEditorRef}
                                  value={editingPost?.content || ""}
                                  onChange={(value) => {
                                    const newReadTime = calculateReadTime(value);
                                    setEditingPost({
                                      ...editingPost,
                                      content: value,
                                      readTime: newReadTime,
                                    });
                                  }}
                                  modules={quillModules}
                                  formats={quillFormats}
                                  theme="snow"
                                  style={{ minHeight: "300px" }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
                                <span>
                                  {(() => {
                                    const text = (editingPost.content || "")
                                      .replace(/<[^>]*>/g, " ")
                                      .replace(/\s+/g, " ")
                                      .trim();
                                    const wordCount = text.split(" ").filter((word: string) => word.length > 0).length;
                                    return `${wordCount.toLocaleString()} words`;
                                  })()}
                                </span>
                                <span>{editingPost.readTime}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                id="content"
                                value={editingPost.content}
                                onChange={(e) => {
                                  const newContent = e.target.value;
                                  const newReadTime = calculateReadTime(newContent);
                                  setEditingPost({
                                    ...editingPost,
                                    content: newContent,
                                    readTime: newReadTime,
                                  });
                                }}
                                rows={20}
                                className="font-mono text-sm"
                                placeholder='<div class="space-y-6 text-base md:text-lg">
  <p>Your content here...</p>
  <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">Heading</h2>
</div>'
                              />
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
                                <span>
                                  {(() => {
                                    const text = (editingPost.content || "")
                                      .replace(/<[^>]*>/g, " ")
                                      .replace(/\s+/g, " ")
                                      .trim();
                                    const wordCount = text.split(" ").filter((word: string) => word.length > 0).length;
                                    return `${wordCount.toLocaleString()} words`;
                                  })()}
                                </span>
                                <span>{editingPost.readTime}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="seo" className="space-y-4">
                        {/* Meta Description */}
                        <div>
                          <Label htmlFor="metaDescription">Meta Description</Label>
                          <Textarea
                            id="metaDescription"
                            value={editingPost.metaDescription}
                            onChange={(e) =>
                              setEditingPost({
                                ...editingPost,
                                metaDescription: e.target.value,
                              })
                            }
                            rows={3}
                            placeholder="SEO meta description (recommended: 150-160 characters)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {editingPost.metaDescription?.length || 0}/160 characters
                          </p>
                        </div>

                        {/* Featured Image Section */}
                        <div className="space-y-4 border rounded-lg p-4">
                          <h4 className="font-medium">Featured Image</h4>
                          
                          {/* Image Upload */}
                          <div>
                            <Label htmlFor="featuredImageUpload">Upload Image</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                id="featuredImageUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Or enter URL manually */}
                          <div>
                            <Label htmlFor="featuredImageUrl">Or Enter Image URL</Label>
                            <Input
                              id="featuredImageUrl"
                              value={editingPost.featuredImage?.url || ""}
                              onChange={(e) =>
                                setEditingPost({
                                  ...editingPost,
                                  featuredImage: {
                                    ...editingPost.featuredImage,
                                    url: e.target.value,
                                  },
                                })
                              }
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>

                          {/* Image Preview */}
                          {editingPost.featuredImage?.url && (
                            <div className="space-y-2">
                              <Label>Preview</Label>
                              <div className="relative border rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={editingPost.featuredImage.url}
                                  alt={editingPost.featuredImage.alt || "Featured image preview"}
                                  className="w-full h-48 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    setEditingPost({
                                      ...editingPost,
                                      featuredImage: {
                                        url: "",
                                        alt: "",
                                        credit: "",
                                      },
                                    })
                                  }
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Alt Text */}
                          <div>
                            <Label htmlFor="featuredImageAlt">Alt Text</Label>
                            <Input
                              id="featuredImageAlt"
                              value={editingPost.featuredImage?.alt || ""}
                              onChange={(e) =>
                                setEditingPost({
                                  ...editingPost,
                                  featuredImage: {
                                    ...editingPost.featuredImage,
                                    alt: e.target.value,
                                  },
                                })
                              }
                              placeholder="Describe the image for accessibility"
                            />
                          </div>

                          {/* Image Credit */}
                          <div>
                            <Label htmlFor="featuredImageCredit">Image Credit (optional)</Label>
                            <Input
                              id="featuredImageCredit"
                              value={editingPost.featuredImage?.credit || ""}
                              onChange={(e) =>
                                setEditingPost({
                                  ...editingPost,
                                  featuredImage: {
                                    ...editingPost.featuredImage,
                                    credit: e.target.value,
                                  },
                                })
                              }
                              placeholder="Photo by John Doe on Unsplash"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Dialog Footer with Save/Cancel buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingPost(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSavingPost || !editingPost || !isAuthenticated}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('💾 Save as Draft clicked', {
                            isSavingPost,
                            hasEditingPost: !!editingPost,
                            isAuthenticated,
                            hasToken: !!token
                          });
                          handleSavePost(false); // Explicitly save as draft
                        }}
                      >
                        {isSavingPost ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save as Draft
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        disabled={isSavingPost || !editingPost || !isAuthenticated}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('📤 Save & Publish clicked', {
                            isSavingPost,
                            hasEditingPost: !!editingPost,
                            isAuthenticated,
                            hasToken: !!token
                          });
                          handleSavePost(true); // Explicitly save as published
                        }}
                      >
                        {isSavingPost ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingPost?.published ? "Update Post" : "Save & Publish"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
              open={deletePostId !== null}
              onOpenChange={(open) => !open && setDeletePostId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    blog post.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePost}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Session Warning Dialog */}
            <AlertDialog open={showSessionWarning} onOpenChange={() => { }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your session will expire in{" "}
                    {Math.floor(sessionWarningCountdown / 60)}:
                    {(sessionWarningCountdown % 60).toString().padStart(2, "0")} due
                    to inactivity.
                    <br />
                    <br />
                    Click "Stay Logged In" to extend your session, or you will be
                    automatically logged out.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => handleLogout(true)}>
                    Logout Now
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleExtendSession}>
                    Stay Logged In
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? All unsaved changes will be lost.
                    <br />
                    <br />
                    Your session will be securely terminated and all session data will be cleared.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleLogout(true)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="min-h-screen w-full flex items-center justify-center bg-background py-8 px-4 sm:py-12">
            <div className="w-full max-w-md sm:max-w-lg mx-auto">
              {/* Login Card with Authority Background */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-card border border-border/60">
                {/* Background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/8 dark:to-transparent"></div>
                <div className="absolute inset-0 bg-muted/40 dark:bg-muted/30"></div>

                {/* Content */}
                <div className="relative p-6 sm:p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <Shield className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
                        CMS Admin Login
                      </h1>
                      <p className="text-sm text-foreground/70">
                        Secure access to the content management system
                      </p>
                      
                      {/* Server Status Indicator */}
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
                          serverStatus === 'offline' ? 'bg-red-500' :
                          'bg-yellow-500 animate-pulse'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          serverStatus === 'online' ? 'text-green-600 dark:text-green-400' :
                          serverStatus === 'offline' ? 'text-red-600 dark:text-red-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {serverStatus === 'online' ? 'Server Online' :
                           serverStatus === 'offline' ? 'Server Offline' :
                           'Checking Server...'}
                        </span>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-semibold">
                          Username
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="username"
                            aria-label="Username for admin login"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                            className="pl-10 h-11"
                            placeholder="Enter your username"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="password"
                            type="password"
                            aria-label="Password for admin login"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            className="pl-10 h-11"
                            placeholder="Enter your password"
                          />
                        </div>
                      </div>
                      
                      {/* Rate Limit Cooldown Display */}
                      {rateLimitCooldown !== null && rateLimitCooldown > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="animate-spin">
                              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                            <span className="text-amber-800 dark:text-amber-200 font-medium">
                              Rate limit cooldown: {Math.floor(rateLimitCooldown / 60)}:{(rateLimitCooldown % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Please wait before attempting to login again.
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold"
                        disabled={rateLimitCooldown !== null && rateLimitCooldown > 0}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {rateLimitCooldown !== null && rateLimitCooldown > 0 
                          ? `Wait ${Math.floor(rateLimitCooldown / 60)}:${(rateLimitCooldown % 60).toString().padStart(2, '0')}`
                          : "Sign In"
                        }
                      </Button>
                    </form>
                  </div>

                  {/* Subtle border */}
                  <div className="absolute inset-0 border border-border/40 dark:border-border/30 rounded-2xl pointer-events-none"></div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Your session is secured with industry-standard encryption
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
    </>
  );
};

export default Admin;
