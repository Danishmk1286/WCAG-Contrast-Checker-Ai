import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';

interface ContrastResult {
  ratio: number;
  aaLarge: boolean;
  aaNormal: boolean;
  aaaLarge: boolean;
  aaaNormal: boolean;
}

const ColorAccessibilityChecker: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState('#22c55e');
  const [backgroundColor, setBackgroundColor] = useState('#0a0a0a');
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null);

  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Calculate contrast ratio
  const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Check WCAG compliance
  const checkCompliance = (ratio: number): ContrastResult => {
    return {
      ratio,
      aaLarge: ratio >= 3,
      aaNormal: ratio >= 4.5,
      aaaLarge: ratio >= 4.5,
      aaaNormal: ratio >= 7
    };
  };

  useEffect(() => {
    const ratio = getContrastRatio(primaryColor, backgroundColor);
    setContrastResult(checkCompliance(ratio));
  }, [primaryColor, backgroundColor]);

  const getStatusIcon = (passed: boolean) => {
    return passed ? 
      <CheckCircle className="w-4 h-4 text-success" /> : 
      <XCircle className="w-4 h-4 text-destructive" />;
  };

  const getStatusBadge = (passed: boolean, label: string) => {
    return (
      <Badge variant={passed ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getStatusIcon(passed)}
        {label}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Color Input Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Color Accessibility Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color Input */}
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Background Color Input */}
            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#0a0a0a"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: backgroundColor,
                color: primaryColor,
                borderColor: 'hsl(var(--border))'
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Sample Text</h3>
              <p className="text-sm">This is how your text will look with the selected colors.</p>
            </div>
            
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: primaryColor,
                color: backgroundColor,
                borderColor: 'hsl(var(--border))'
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Inverted Sample</h3>
              <p className="text-sm">This shows the inverted color combination.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {contrastResult && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Accessibility Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contrast Ratio */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {contrastResult.ratio.toFixed(2)}:1
              </div>
              <p className="text-muted-foreground">Contrast Ratio</p>
            </div>

            <Separator />

            {/* WCAG AA Compliance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">WCAG AA Compliance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">Large Text (18pt+)</span>
                  {getStatusBadge(contrastResult.aaLarge, contrastResult.aaLarge ? 'Pass' : 'Fail')}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">Normal Text</span>
                  {getStatusBadge(contrastResult.aaNormal, contrastResult.aaNormal ? 'Pass' : 'Fail')}
                </div>
              </div>
            </div>

            {/* WCAG AAA Compliance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">WCAG AAA Compliance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">Large Text (18pt+)</span>
                  {getStatusBadge(contrastResult.aaaLarge, contrastResult.aaaLarge ? 'Pass' : 'Fail')}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">Normal Text</span>
                  {getStatusBadge(contrastResult.aaaNormal, contrastResult.aaaNormal ? 'Pass' : 'Fail')}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Recommendations</h3>
              <div className="p-4 rounded-lg bg-muted text-sm">
                {contrastResult.aaNormal ? (
                  <p className="text-success-foreground">✅ Your color combination meets WCAG AA standards for normal text.</p>
                ) : contrastResult.aaLarge ? (
                  <p className="text-warning-foreground">⚠️ Your colors work for large text but need improvement for normal text. Consider increasing contrast.</p>
                ) : (
                  <p className="text-destructive-foreground">❌ Your color combination doesn't meet WCAG standards. Please choose colors with higher contrast.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ColorAccessibilityChecker;