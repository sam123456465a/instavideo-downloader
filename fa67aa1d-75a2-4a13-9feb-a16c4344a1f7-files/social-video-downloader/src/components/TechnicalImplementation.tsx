import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Database, 
  Shield, 
  Zap, 
  Code,
  Cloud,
  Download,
  RefreshCw
} from "lucide-react";

const implementationSteps = [
  {
    icon: Server,
    title: "Backend API Server",
    description: "Node.js/Python server to handle video processing requests",
    tech: "Express.js, FastAPI",
    color: "bg-blue-500"
  },
  {
    icon: Database,
    title: "URL Processing Engine", 
    description: "Extract video URLs from social media platform APIs",
    tech: "yt-dlp, Playwright",
    color: "bg-green-500"
  },
  {
    icon: RefreshCw,
    title: "Video Processing",
    description: "Download, process, and remove watermarks from videos",
    tech: "FFmpeg, OpenCV",
    color: "bg-purple-500"
  },
  {
    icon: Cloud,
    title: "CDN Storage",
    description: "Temporary storage for processed videos before download",
    tech: "AWS S3, Cloudflare",
    color: "bg-orange-500"
  },
  {
    icon: Shield,
    title: "Security & Rate Limiting",
    description: "Protect against abuse and ensure responsible usage",
    tech: "Redis, JWT",
    color: "bg-red-500"
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Fast processing and delivery with caching layers",
    tech: "Docker, Kubernetes",
    color: "bg-cyan-500"
  }
];

export default function TechnicalImplementation() {
  return (
    <Card className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Code className="w-6 h-6" />
          How Real Implementation Works
        </CardTitle>
        <CardDescription>
          Technical architecture required for production video downloader
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {implementationSteps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors h-full">
                <div className={`p-3 rounded-full ${step.color} text-white mb-3`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-3 flex-1">
                  {step.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {step.tech}
                </Badge>
              </div>
              {index < implementationSteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Production Workflow
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. User submits social media URL</p>
            <p>2. Backend validates and extracts video metadata</p>
            <p>3. Video is downloaded and processed (watermark removal)</p>
            <p>4. Processed video is temporarily stored on CDN</p>
            <p>5. Download link is provided to user</p>
            <p>6. File is automatically deleted after download/timeout</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}