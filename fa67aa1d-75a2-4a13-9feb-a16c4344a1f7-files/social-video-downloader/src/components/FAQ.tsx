import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqData = [
  {
    question: "Is this video downloader really free?",
    answer: "Yes, our social media video downloader is completely free to use. There are no hidden charges, subscriptions, or premium features. You can download as many videos as you want without any limitations."
  },
  {
    question: "Which social media platforms are supported?",
    answer: "We support major platforms including TikTok, Instagram, YouTube, Twitter/X, Facebook, and Snapchat. We're continuously working to add support for more platforms based on user demand."
  },
  {
    question: "Do downloaded videos have watermarks?",
    answer: "No, our downloader removes platform watermarks and branding from the videos, giving you clean, original content. However, please respect content creators' rights and use downloaded content responsibly."
  },
  {
    question: "What video qualities are available for download?",
    answer: "We offer multiple quality options including 360p, 720p, 1080p, and Original quality (when available). The available qualities depend on the source video's original resolution."
  },
  {
    question: "Is it safe to use this downloader?",
    answer: "Yes, our service is completely safe. We don't store your videos on our servers, don't require account registration, and don't collect personal information. All downloads are processed securely."
  },
  {
    question: "Why is my video download failing?",
    answer: "Download failures can occur due to several reasons: the video might be private, the URL might be incorrect, or the platform might have changed their API. Try refreshing the page and ensure the video is public and accessible."
  },
  {
    question: "Can I download private videos?",
    answer: "No, our service can only download publicly available videos. Private or restricted content cannot be accessed or downloaded through our platform."
  },
  {
    question: "Is there a limit to how many videos I can download?",
    answer: "There's no strict limit on the number of videos you can download. However, we may implement reasonable rate limiting to ensure fair usage and maintain service quality for all users."
  }
];

export default function FAQ() {
  return (
    <Card className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <HelpCircle className="w-6 h-6" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Find answers to common questions about our video downloader
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}