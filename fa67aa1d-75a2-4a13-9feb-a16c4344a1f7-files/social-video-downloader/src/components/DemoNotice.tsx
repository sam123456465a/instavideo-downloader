import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Code, Server, Download } from "lucide-react";

export default function DemoNotice() {
  return (
    <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20 animate-fade-in">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Code className="w-3 h-3 mr-1" />
            DEMO MODE
          </Badge>
          <span className="font-semibold">Interactive Preview</span>
        </div>
        <p className="text-sm mb-3">
          This is a fully functional frontend demo. Real video downloading requires a backend API to:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <Card className="p-2 bg-blue-100/50 dark:bg-blue-800/30 border-blue-200">
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>Process URLs</span>
            </div>
          </Card>
          <Card className="p-2 bg-blue-100/50 dark:bg-blue-800/30 border-blue-200">
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>Extract Videos</span>
            </div>
          </Card>
          <Card className="p-2 bg-blue-100/50 dark:bg-blue-800/30 border-blue-200">
            <div className="flex items-center gap-1">
              <Badge className="w-3 h-3" />
              <span>Remove Watermarks</span>
            </div>
          </Card>
        </div>
      </AlertDescription>
    </Alert>
  );
}