export function Suggestions({ 
  suggestions, 
  background, 
  onSelect, 
  selectedIndex, 
  onClose, 
  onReset,
  loading,
  originalForeground
}) {
  return (
    <div className="suggestions">
      <div className="suggestions-header">
        <h3>
          <span className="suggestions-icon">✦</span>
          AI-Suggested accessible colors
        </h3>
        <button 
          className="suggestions-close" 
          onClick={onClose}
          aria-label="Close suggestions"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="suggestions-loading">
          <div className="loading-spinner"></div>
          <span>Finding accessible alternatives...</span>
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="suggestions-content">
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={`suggestion-card ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => onSelect(suggestion.color, index)}
              >
                {/* Color Swatch */}
                <div 
                  className="suggestion-swatch"
                  style={{ backgroundColor: suggestion.color }}
                >
                  {selectedIndex === index && (
                    <div className="suggestion-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Color Info */}
                <div className="suggestion-details">
                  <code className="suggestion-hex">{suggestion.color.toUpperCase()}</code>
                  <div className="suggestion-stats">
                    <span className="suggestion-ratio">{suggestion.ratio}:1</span>
                    <span className={`suggestion-badge badge-${suggestion.level.toLowerCase()}`}>
                      {suggestion.level}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="suggestions-footer">
            <button 
              className="reset-btn"
              onClick={onReset}
              title="Reset to original color"
            >
              <div 
                className="reset-swatch"
                style={{ backgroundColor: originalForeground }}
              />
              <span>Reset to {originalForeground.toUpperCase()}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="suggestions-empty">
          <span>No suggestions available</span>
        </div>
      )}
    </div>
  );
}

