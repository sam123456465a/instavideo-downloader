import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Shield, 
  Zap, 
  Heart, 
  Copy, 
  Download,
  CheckCircle
} from "lucide-react";

const tips = [
  {
    icon: Copy,
    title: "Copy URL Correctly",
    description: "Make sure to copy the complete video URL from your browser's address bar, not just the shortened link.",
    category: "Basic"
  },
  {
    icon: Shield,
    title: "Respect Content Rights",
    description: "Only download videos you have permission to use. Always credit original creators when sharing.",
    category: "Legal"
  },
  {
    icon: Zap,
    title: "Choose Right Quality",
    description: "Higher quality means larger file sizes. Choose 720p for sharing, 1080p for editing, Original for archival.",
    category: "Quality"
  },
  {
    icon: Download,
    title: "Batch Downloads",
    description: "Process multiple videos by opening new tabs. Our service handles concurrent downloads efficiently.",
    category: "Productivity"
  },
  {
    icon: Heart,
    title: "Support Creators",
    description: "Consider following, liking, or supporting the original creators of content you download.",
    category: "Community"
  },
  {
    icon: CheckCircle,
    title: "Check File Format",
    description: "Most videos are downloaded as MP4 files, which are compatible with all major video players and editors.",
    category: "Technical"
  }
];

const stats = [
  { label: "Videos Downloaded", value: "2.5M+", icon: Download },
  { label: "Happy Users", value: "150K+", icon: Heart },
  { label: "Platforms Supported", value: "6+", icon: Shield },
  { label: "Success Rate", value: "99.2%", icon: CheckCircle },
];

export default function UsageTips() {
  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Tips */}
      <Card className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Lightbulb className="w-6 h-6" />
            Pro Tips & Best Practices
          </CardTitle>
          <CardDescription>
            Get the most out of our video downloader with these helpful tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <tip.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{tip.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {tip.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}