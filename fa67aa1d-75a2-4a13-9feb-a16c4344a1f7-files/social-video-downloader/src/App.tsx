import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Download, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Video,
  Instagram,
  Youtube,
  Music,
  Facebook,
  Camera,
  FileVideo,
  User,
  Clock,
  HardDrive
} from "lucide-react";
import { useVideoDownloader } from "@/hooks/useVideoDownloader";
import FAQ from "@/components/FAQ";
import UsageTips from "@/components/UsageTips";
import ThemeToggle from "@/components/ThemeToggle";
import DemoNotice from "@/components/DemoNotice";
import TechnicalImplementation from "@/components/TechnicalImplementation";

export default function Home() {
  const [url, setUrl] = useState("");
  const {
    isLoading,
    error,
    videoInfo,
    downloadProgress,
    fetchVideoInfo,
    downloadVideo,
    reset
  } = useVideoDownloader();

  const supportedPlatforms = [
    { name: "TikTok", icon: Video, color: "bg-red-500", gradient: "from-red-500 to-pink-500" },
    { name: "Instagram", icon: Instagram, color: "bg-gradient-to-r from-purple-500 to-pink-500", gradient: "from-purple-500 to-pink-500" },
    { name: "YouTube", icon: Youtube, color: "bg-red-600", gradient: "from-red-600 to-red-700" },
    { name: "Twitter/X", icon: Music, color: "bg-gray-900", gradient: "from-gray-800 to-gray-900" },
    { name: "Facebook", icon: Facebook, color: "bg-blue-600", gradient: "from-blue-600 to-blue-700" },
    { name: "Snapchat", icon: Camera, color: "bg-yellow-400", gradient: "from-yellow-400 to-yellow-500" },
  ];

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    try {
      await fetchVideoInfo(url);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDownload = async (qualityUrl: string, filename: string) => {
    try {
      await downloadVideo(qualityUrl, filename);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    setUrl("");
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
              <Download className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Social Video Downloader
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Download videos from your favorite social media platforms without watermarks. 
            Fast, free, and secure.
          </p>
        </div>

        {/* Demo Notice */}
        <DemoNotice />

        {/* Supported Platforms */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">
            Supported Platforms
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {supportedPlatforms.map((platform) => (
              <Badge key={platform.name} variant="secondary" className={`px-4 py-2 bg-gradient-to-r ${platform.gradient} text-white border-0`}>
                <platform.icon className="w-4 h-4 mr-2" />
                {platform.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* URL Input Form */}
        <Card className="mb-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Enter Video URL
            </CardTitle>
            <CardDescription>
              Paste the link to the video you want to download
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://www.tiktok.com/@username/video/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 input-glow"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !url.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Get Video
                    </>
                  )}
                </Button>
              </div>
              {(videoInfo || error) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  Start New Download
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/20 animate-slide-up">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Download Progress */}
        {downloadProgress && (
          <Card className="mb-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl animate-slide-up">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Downloading...</h3>
                  <span className="text-sm text-muted-foreground">{downloadProgress.speed}</span>
                </div>
                <Progress value={downloadProgress.percentage} className="w-full h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{downloadProgress.percentage}% complete</span>
                  <span>{downloadProgress.downloadedBytes}/{downloadProgress.totalBytes} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Information */}
        {videoInfo && (
          <Card className="mb-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl animate-slide-up">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3">
                  <div className="relative">
                    <img
                      src={videoInfo.thumbnail}
                      alt="Video thumbnail"
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {videoInfo.duration}
                    </div>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{videoInfo.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{videoInfo.description}</p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={videoInfo.author.avatar} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{videoInfo.author.name}</span>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileVideo className="w-3 h-3" />
                        {videoInfo.platform}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {videoInfo.duration}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Quality Options
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {videoInfo.quality.map((quality) => (
                        <Button
                          key={quality.label}
                          onClick={() => handleDownload(quality.url, `${videoInfo.title}-${quality.label}`)}
                          disabled={!!downloadProgress}
                          variant="outline"
                          className="group flex items-center justify-between p-4 h-auto hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-200 border-2 hover:border-primary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                              <HardDrive className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium flex items-center gap-2">
                                {quality.label}
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  DEMO
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">{quality.fileSize}</div>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">No Watermarks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Download clean videos without platform watermarks
              </p>
            </CardContent>
          </Card>

          <Card className="text-center backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ animationDelay: '1s' }}>
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">High Quality</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Multiple quality options including original resolution
              </p>
            </CardContent>
          </Card>

          <Card className="text-center backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ animationDelay: '2s' }}>
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Platforms</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Support for TikTok, Instagram, YouTube, and more
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Tips and Statistics */}
        <div className="mb-12">
          <UsageTips />
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <FAQ />
        </div>

        {/* Technical Implementation */}
        <div className="mb-12">
          <TechnicalImplementation />
        </div>

        {/* Footer */}
        <footer className="text-center space-y-4 pt-8 border-t border-border/20">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">© 2024 Social Video Downloader. Download responsibly and respect content creators.</p>
            <p className="text-xs">
              This tool is for educational purposes. Users are responsible for complying with platform terms of service and copyright laws.
            </p>
          </div>
          <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground">
            <span>Built with ❤️ for content creators</span>
            <span>•</span>
            <span>Fast & Secure</span>
            <span>•</span>
            <span>Always Free</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
