import { checkWCAGCompliance, getComplianceLevel } from '../utils/contrast';

export function ContrastResult({ ratio, foreground, background }) {
  const compliance = checkWCAGCompliance(ratio);
  const level = getComplianceLevel(ratio);
  const isPassing = ratio >= 4.5;

  return (
    <div className="contrast-result">
      <div 
        className="preview-box"
        style={{ backgroundColor: background, color: foreground }}
      >
        <span className="preview-text">Sample Text</span>
        <span className="preview-text large">Large Text</span>
      </div>
      
      <div className="ratio-display">
        <span className="ratio-value">{ratio.toFixed(2)}:1</span>
        <span className={`compliance-badge ${isPassing ? 'pass' : 'fail'}`}>
          {level}
        </span>
      </div>
      
      <div className="compliance-details">
        <div className="compliance-row">
          <span>Normal Text (AA)</span>
          <span className={compliance.aa.normal ? 'pass' : 'fail'}>
            {compliance.aa.normal ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div className="compliance-row">
          <span>Large Text (AA)</span>
          <span className={compliance.aa.large ? 'pass' : 'fail'}>
            {compliance.aa.large ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div className="compliance-row">
          <span>Normal Text (AAA)</span>
          <span className={compliance.aaa.normal ? 'pass' : 'fail'}>
            {compliance.aaa.normal ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
        <div className="compliance-row">
          <span>Large Text (AAA)</span>
          <span className={compliance.aaa.large ? 'pass' : 'fail'}>
            {compliance.aaa.large ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
      </div>
    </div>
  );
}


