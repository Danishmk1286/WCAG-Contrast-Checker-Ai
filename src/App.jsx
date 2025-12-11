import { useState, useEffect, useRef } from 'react';
import { ColorPicker } from './components/ColorPicker';
import { ContrastResult } from './components/ContrastResult';
import { Suggestions } from './components/Suggestions';
import { getContrastRatio, isValidHex } from './utils/contrast';
import { generateSuggestions, getAISuggestions } from './utils/ai-fix';
import './App.css';

function App() {
  const [foreground, setForeground] = useState('#049a68');
  const [background, setBackground] = useState('#ffffff');
  const [ratio, setRatio] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const originalColorsRef = useRef({ foreground: '#049a68', background: '#ffffff' });

  // Calculate contrast ratio when colors change
  useEffect(() => {
    if (isValidHex(foreground) && isValidHex(background)) {
      const newRatio = getContrastRatio(foreground, background);
      setRatio(newRatio);
    }
  }, [foreground, background]);

  // Fetch AI suggestions
  const handleGetAISuggestions = async () => {
    if (!isValidHex(foreground) || !isValidHex(background)) return;
    
    // Store original colors when getting suggestions
    originalColorsRef.current = { foreground, background };
    
    setLoading(true);
    setShowSuggestions(true);
    try {
      const aiSuggestions = await getAISuggestions(foreground, background);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions(generateSuggestions(foreground, background));
    } finally {
      setLoading(false);
    }
  };

  // Generate suggestions for specific colors
  const fetchSuggestionsForColors = async (fg, bg) => {
    if (!isValidHex(fg) || !isValidHex(bg)) return;
    
    setLoading(true);
    try {
      const newSuggestions = await getAISuggestions(fg, bg);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions(generateSuggestions(fg, bg));
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (color, index) => {
    setForeground(color);
    setSelectedSuggestion(index);
  };

  // Fixed swap colors handler
  const handleSwapColors = () => {
    // Capture current values before swapping
    const currentForeground = foreground;
    const currentBackground = background;
    
    // Swap the colors
    setForeground(currentBackground);
    setBackground(currentForeground);
    
    // Update original colors ref with swapped values
    originalColorsRef.current = { 
      foreground: currentBackground, 
      background: currentForeground 
    };
    
    // Clear selection since colors changed
    setSelectedSuggestion(null);
    
    // If suggestions panel is open, regenerate for the new color combination
    if (showSuggestions) {
      fetchSuggestionsForColors(currentBackground, currentForeground);
    }
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestion(null);
  };

  const handleResetColors = () => {
    setForeground(originalColorsRef.current.foreground);
    setBackground(originalColorsRef.current.background);
    setSelectedSuggestion(null);
  };

  const needsFix = ratio < 4.5;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <svg className="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14" fill="currentColor"/>
          </svg>
          <h1>AI Color Contrast Checker</h1>
        </div>
        <p className="tagline">Check WCAG 2.2 compliance and get AI-powered suggestions</p>
      </header>

      <main className="main">
        {/* Color Input Section - Compact */}
        <section className="input-section">
          <div className="color-inputs">
            <ColorPicker
              label="Text Color"
              color={foreground}
              onChange={setForeground}
            />
            
            <button 
              className="swap-button" 
              onClick={handleSwapColors}
              aria-label="Swap colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/>
              </svg>
            </button>
            
            <ColorPicker
              label="Background"
              color={background}
              onChange={setBackground}
            />
          </div>
        </section>

        {/* Always Visible Results Section */}
        {isValidHex(foreground) && isValidHex(background) && (
          <section className="results-section">
            <ContrastResult
              ratio={ratio}
              foreground={foreground}
              background={background}
            />

            {/* Action Button */}
            <div className="action-section">
              {needsFix && !showSuggestions && (
                <button
                  className="ai-button"
                  onClick={handleGetAISuggestions}
                  disabled={loading}
                >
                  <span className="ai-button-icon">✦</span>
                  <span>{loading ? 'Analyzing...' : 'Get AI Fix Suggestions'}</span>
                </button>
              )}
              
              {!needsFix && !showSuggestions && (
                <div className="success-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span>Your colors meet WCAG accessibility standards!</span>
                </div>
              )}
            </div>

            {/* Suggestions Panel */}
            {showSuggestions && (
              <Suggestions
                suggestions={suggestions}
                background={background}
                onSelect={handleSuggestionSelect}
                selectedIndex={selectedSuggestion}
                onClose={handleCloseSuggestions}
                onReset={handleResetColors}
                loading={loading}
                originalForeground={originalColorsRef.current.foreground}
              />
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Built for accessible design
          <span className="footer-dot">•</span>
          <a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" rel="noopener noreferrer">
            WCAG 2.2 Guidelines
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

