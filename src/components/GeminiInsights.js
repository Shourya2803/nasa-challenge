import React from 'react';

const GeminiInsights = ({ insights }) => {
  const formatInsights = (text) => {
    if (!text) return null;
    
    const sections = text.split(/(?=\d+\.\s+[A-Z\s]+:)/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      const lines = section.trim().split('\n');
      const firstLine = lines[0];
      
      const headingMatch = firstLine.match(/^(\d+)\.\s+([A-Z\s]+):/);
      
      if (headingMatch) {
        const [, number, title] = headingMatch;
        const content = lines.slice(1).join('\n').trim();
        
        return (
          <div key={index} style={{ marginBottom: '25px' }}>
            <h3 style={{
              color: '#ffd23f',
              fontFamily: 'Orbitron, monospace',
              fontSize: '1.1rem',
              marginBottom: '10px',
              borderBottom: '2px solid rgba(255, 210, 63, 0.3)',
              paddingBottom: '5px'
            }}>
              {number}. {title}
            </h3>
            <div style={{
              color: '#fff',
              lineHeight: '1.6',
              fontSize: '0.95rem',
              paddingLeft: '15px'
            }}>
              {content.split('\n').map((line, lineIndex) => {
                if (!line.trim()) return <br key={lineIndex} />;
                
                if (line.trim().startsWith('-')) {
                  return (
                    <div key={lineIndex} style={{ margin: '5px 0', paddingLeft: '10px' }}>
                      {line.trim().substring(1).trim()}
                    </div>
                  );
                }
                
                return (
                  <p key={lineIndex} style={{ margin: '8px 0' }}>
                    {line.trim()}
                  </p>
                );
              })}
            </div>
          </div>
        );
      }
      
      return (
        <div key={index} style={{ marginBottom: '15px' }}>
          {section.split('\n').map((line, lineIndex) => {
            if (!line.trim()) return <br key={lineIndex} />;
            
            if (line.trim().startsWith('-')) {
              return (
                <div key={lineIndex} style={{ margin: '5px 0', color: '#fff' }}>
                  {line.trim().substring(1).trim()}
                </div>
              );
            }
            
            return (
              <p key={lineIndex} style={{ margin: '8px 0', color: '#fff', lineHeight: '1.6' }}>
                {line.trim()}
              </p>
            );
          })}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="chart-container" style={{position: 'relative'}}>
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '15px', 
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '2rem',
          animation: 'float 2s ease-in-out infinite'
        }}></div>
        <h2 style={{
          color: '#fff', 
          fontFamily: 'Orbitron, monospace', 
          margin: 0,
          textAlign: 'center'
        }}>
          AI Analysis
        </h2>
        <div style={{
          fontSize: '2rem',
          animation: 'float 2s ease-in-out infinite reverse'
        }}></div>
      </div>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        backdropFilter: 'blur(5px)'
      }}>
        {insights ? (
          <div style={{ fontFamily: 'Space Mono, monospace' }}>
            {formatInsights(insights)}
          </div>
        ) : (
          <div style={{
            color: '#ffd23f',
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            fontFamily: 'Orbitron, monospace'
          }}>
            No analysis available. Please fetch weather data first.
          </div>
        )}
      </div>
      
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '1.5rem',
        opacity: 0.6
      }}></div>
    </div>
  );
};

export default GeminiInsights;
