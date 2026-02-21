import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What is WCAG 2.1 compliance?",
      answer: <>
        <a
          href="https://www.w3.org/TR/WCAG21/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WCAG 2.1 (Web Content Accessibility Guidelines)
        </a>{" "}
        is the international standard for web accessibility published by the W3C. It defines success criteria across three levels: A (minimum), AA (recommended), and AAA (enhanced). For color contrast, WCAG 2.1 requires a minimum ratio of 4.5:1 for normal text and 3:1 for large text to meet AA compliance. Most accessibility laws, including the ADA and Section 508, reference WCAG 2.1 AA as the compliance standard.
      </>
    },
    {
      question: "How does AI help in color contrast?",
      answer: <>
        Our AI uses a TensorFlow.js machine learning model trained on over 5,000 accessible color combinations. Unlike traditional tools that only detect failures, our AI instantly suggests the closest compliant color alternatives using Delta E (CIEDE2000) color distance calculations. This ensures suggestions preserve your brand identity by finding colors that are perceptually similar to your original choice while meeting WCAG requirements. The AI analyzes hue, saturation, and lightness to recommend fixes that maintain design aesthetics.
      </>
    },
    {
      question: "What is WCAG and why is color contrast important?",
      answer: <>
        <a
          href="https://www.w3.org/WAI/standards-guidelines/wcag/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WCAG (Web Content Accessibility Guidelines)
        </a>{" "}
        are international standards for web accessibility. Color contrast is crucial because it ensures that text is readable for people with visual impairments, including{" "}
        <a
          href="https://www.colorblindawareness.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          color blindness
        </a>{" "}
        and low vision. Proper contrast ratios make your content accessible to everyone.
      </>
    },
    {
      question: "What's the difference between WCAG AA and AAA standards?",
      answer: <>
        <a
          href="https://webaim.org/articles/contrast/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WCAG AA
        </a>{" "}
        requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.{" "}
        <a
          href="https://www.w3.org/TR/WCAG21/#contrast-minimum"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WCAG AAA
        </a>{" "}
        is more stringent, requiring 7:1 for normal text and 4.5:1 for large text. AA is the legal requirement in many countries, while AAA provides enhanced accessibility.
      </>
    },
    {
      question: "What is considered 'large text' in WCAG guidelines?",
      answer: <>
        Large text is defined as 18 point (24px) and larger, or 14 point (18.5px) and larger if bold. These text sizes have lower contrast requirements because they're easier to read at lower contrast ratios. You can read more about this in the{" "}
        <a
          href="https://www.w3.org/TR/WCAG21/#dfn-large-scale"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WCAG definition of large text
        </a>.
      </>
    },
    {
      question: "How is this tool different from WebAIM's contrast checker?",
      answer: <>
        While{" "}
        <a
          href="https://webaim.org/resources/contrastchecker/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WebAIM's Contrast Checker
        </a>{" "}
        is excellent for testing contrast ratios, our Smart Color Contrast Assistant goes further by providing instant AI-powered fix suggestions. Instead of manually adjusting colors until you find one that passes, our tool uses machine learning to suggest the closest accessible alternatives that preserve your design intent. We also offer color blindness simulation, APCA (WCAG 3.0) scoring, and a Figma plugin integration.
      </>
    },
    {
      question: "Do these guidelines apply to logos and decorative elements?",
      answer: <>
        WCAG contrast requirements primarily apply to text content. Logos, decorative images, and incidental text (like in photographs) are generally exempt. However, any text in images that conveys important information should meet{" "}
        <a
          href="https://www.w3.org/WAI/tutorials/images/text/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          contrast requirements
        </a>.
      </>
    },
    {
      question: "Can I use this tool for mobile app design?",
      answer: <>
        Yes! While WCAG was originally created for web content, the color contrast principles apply to all digital interfaces, including mobile apps. Many mobile platforms also reference WCAG guidelines in their{" "}
        <a
          href="https://developer.apple.com/accessibility/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Apple Accessibility
        </a>{" "}
        and{" "}
        <a
          href="https://developer.android.com/guide/topics/ui/accessibility"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Android Accessibility
        </a>{" "}
        documentation.
      </>
    }
  ];

  // Extract text content from React elements for structured data
  const extractText = (element: React.ReactNode): string => {
    if (typeof element === "string") return element;
    if (typeof element === "number") return String(element);
    if (Array.isArray(element)) {
      return element.map(extractText).join(" ");
    }
    if (React.isValidElement(element)) {
      if (element.props.children) {
        return extractText(element.props.children);
      }
    }
    return "";
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": typeof faq.question === "string" ? faq.question : "",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": extractText(faq.answer)
      }
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Card className="border-border/60 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm md:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
};

export default FAQ;
