import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Google Font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('link[href*="Space+Mono"]')) {
  document.head.appendChild(fontLink);
}

const paramIcons = {
  'T2M': '🌡️',
  'PRECTOTCORR': '🌧️',
  'WS2M': '💨',
  'RH2M': '💧',
  'SNODP': '❄️'
};

const getParameterDisplayName = (param) => {
  const names = {
    "T2M": "Temperature",
    "PRECTOTCORR": "Precipitation", 
    "WS2M": "Wind Speed",
    "RH2M": "Humidity",
    "SNODP": "Snow Depth"
  };
  return names[param] || param;
};

// Mock data for demonstration
const mockData = {
  parameters: ['T2M', 'PRECTOTCORR', 'WS2M', 'RH2M', 'SNODP'],
  data: [
    { T2M: 28.12, PRECTOTCORR: 6.23, WS2M: 2.01, RH2M: 65.5, SNODP: 0 },
    { T2M: 27.10, PRECTOTCORR: 0.02, WS2M: 0.67, RH2M: 58.2, SNODP: 0 },
    { T2M: 29.67, PRECTOTCORR: 41.56, WS2M: 4.32, RH2M: 72.8, SNODP: 0 },
  ],
  units: {
    T2M: { units: 'C' },
    PRECTOTCORR: { units: 'MM/DAY' },
    WS2M: { units: 'M/S' },
    RH2M: { units: '%' },
    SNODP: { units: 'M' }
  },
  location: 'Sample Location'
};

const WeatherStats = ({ data = mockData }) => {
  const [interpretations, setInterpretations] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchInterpretations = async () => {
      const newInterpretations = {};
      
      const mockInterpretations = {
        'T2M': 'Temperature shows moderate warmth with slight variations typical for this season.',
        'PRECTOTCORR': 'Precipitation levels indicate sporadic rainfall with one significant event.',
        'WS2M': 'Wind speeds are generally calm with occasional moderate gusts.',
        'RH2M': 'Humidity levels are comfortable, ranging from moderate to slightly high.',
        'SNODP': 'No snow depth recorded, consistent with current seasonal conditions.'
      };
      
      for (const param of data.parameters) {
        setTimeout(() => {
          setInterpretations(prev => ({
            ...prev,
            [param]: mockInterpretations[param] || 'Analysis complete'
          }));
        }, Math.random() * 2000 + 1000);
      }
    };

    if (data && data.location) {
      fetchInterpretations();
    }
  }, [data]);

  const calculateStats = (values) => {
    const validValues = values.filter(v => v !== null && !isNaN(v));
    if (validValues.length === 0) return { mean: 'N/A', min: 'N/A', max: 'N/A' };
    
    const sum = validValues.reduce((a, b) => a + b, 0);
    return {
      mean: (sum / validValues.length).toFixed(2),
      min: Math.min(...validValues).toFixed(2),
      max: Math.max(...validValues).toFixed(2)
    };
  };

  const getCardGradient = (param) => {
    const gradients = {
      'T2M': 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
      'PRECTOTCORR': 'linear-gradient(135deg, rgba(116, 185, 255, 0.2) 0%, rgba(0, 150, 255, 0.1) 100%)',
      'WS2M': 'linear-gradient(135deg, rgba(255, 210, 63, 0.2) 0%, rgba(255, 235, 59, 0.1) 100%)',
      'RH2M': 'linear-gradient(135deg, rgba(116, 185, 255, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%)',
      'SNODP': 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(200, 230, 255, 0.1) 100%)'
    };
    return gradients[param] || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c1e 0%, #1a1a2e 25%, #16213e 75%, #0f3460 100%)',
      padding: '60px 30px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(116, 185, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 210, 63, 0.05) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
        animate={{
          background: [
            `radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(116, 185, 255, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(255, 210, 63, 0.05) 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 70%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 70% 30%, rgba(116, 185, 255, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 50% 50%, rgba(255, 210, 63, 0.05) 0%, transparent 50%)`
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />

      <motion.div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          style={{
            color: '#fff',
            textAlign: 'center',
            fontSize: '3rem',
            fontFamily: "'Space Mono', monospace",
            fontWeight: '700',
            marginBottom: '50px',
            textShadow: '0 0 30px rgba(255, 210, 63, 0.5)',
            letterSpacing: '2px'
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          WEATHER ANALYTICS
        </motion.h1>

        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '40px',
            padding: '20px 0'
          }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
        >
          {data.parameters.map((param, index) => {
            const values = data.data.map(row => row[param]);
            const stats = calculateStats(values);
            const unit = data.units[param]?.units || '';
            const displayName = getParameterDisplayName(param);
            const icon = paramIcons[param] || '📈';
            
            return (
              <motion.div
                key={param}
                style={{
                  background: getCardGradient(param),
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '24px',
                  padding: '40px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  minHeight: '400px'
                }}
                variants={{
                  hidden: { 
                    opacity: 0, 
                    y: 60,
                    rotateX: -15
                  },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    rotateX: 0,
                    transition: {
                      duration: 0.8,
                      type: "spring",
                      bounce: 0.3
                    }
                  }
                }}
                whileHover={{
                  scale: 1.02,
                  y: -10,
                  rotateY: 2,
                  transition: { duration: 0.3 }
                }}
                onHoverStart={() => setHoveredCard(param)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                {/* Floating particles effect */}
                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
                      radial-gradient(2px 2px at 40% 70%, rgba(255, 210, 63, 0.4), transparent),
                      radial-gradient(1px 1px at 90% 40%, rgba(116, 185, 255, 0.3), transparent),
                      radial-gradient(1px 1px at 60% 10%, rgba(255, 107, 53, 0.3), transparent)
                    `,
                    backgroundSize: '100px 100px, 80px 80px, 60px 60px, 120px 120px',
                    opacity: hoveredCard === param ? 1 : 0.3
                  }}
                  animate={{
                    backgroundPosition: [
                      '0% 0%, 0% 0%, 0% 0%, 0% 0%',
                      '100% 100%, -100% 100%, 100% -100%, -100% -100%'
                    ]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Main content */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <motion.div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '30px'
                    }}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <motion.span
                      style={{
                        fontSize: '3.5rem',
                        marginRight: '20px',
                        filter: 'drop-shadow(0 0 10px rgba(255, 210, 63, 0.5))'
                      }}
                      animate={{
                        rotate: hoveredCard === param ? [0, -10, 10, 0] : 0,
                        scale: hoveredCard === param ? 1.1 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {icon}
                    </motion.span>
                    <div>
                      <h2 style={{
                        color: '#fff',
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: '700',
                        fontSize: '1.8rem',
                        margin: 0,
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                      }}>
                        {displayName}
                      </h2>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: '5px 0 0 0',
                        fontSize: '1rem',
                        letterSpacing: '1px',
                        fontFamily: "'Space Mono', monospace"
                      }}>
                        Real-time Analysis
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '25px',
                      marginBottom: '30px'
                    }}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: index * 0.1 + 0.8
                        }
                      }
                    }}
                  >
                    {[
                      { value: stats.mean, label: 'AVERAGE', color: '#ffd23f', icon: '📊' },
                      { value: stats.min, label: 'MINIMUM', color: '#74b9ff', icon: '❄️' },
                      { value: stats.max, label: 'MAXIMUM', color: '#ff6b35', icon: '🔥' }
                    ].map((metric, metricIndex) => (
                      <motion.div
                        key={metricIndex}
                        style={{
                          textAlign: 'center',
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { 
                            opacity: 1, 
                            scale: 1,
                            transition: { type: "spring", bounce: 0.4 }
                          }
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{
                          fontSize: '1.2rem',
                          marginBottom: '10px'
                        }}>
                          {metric.icon}
                        </div>
                        <motion.div
                          style={{
                            fontSize: '2.2rem',
                            fontWeight: '700',
                            color: metric.color,
                            fontFamily: "'Space Mono', monospace",
                            textShadow: `0 0 20px ${metric.color}40`,
                            marginBottom: '8px'
                          }}
                          whileHover={{
                            textShadow: `0 0 30px ${metric.color}80`,
                            scale: 1.1
                          }}
                        >
                          {metric.value}
                        </motion.div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          letterSpacing: '1px',
                          fontWeight: '700',
                          fontFamily: "'Space Mono', monospace"
                        }}>
                          {metric.label}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginTop: '4px',
                          fontFamily: "'Space Mono', monospace"
                        }}>
                          {unit}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <AnimatePresence>
                    {interpretations[param] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 210, 63, 0.15) 0%, rgba(255, 210, 63, 0.05) 100%)',
                          border: '1px solid rgba(255, 210, 63, 0.3)',
                          borderRadius: '16px',
                          padding: '20px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          background: 'linear-gradient(to bottom, #ffd23f, #ff6b35)',
                          borderRadius: '2px'
                        }} />
                        
                        <motion.div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '12px',
                            marginLeft: '12px'
                          }}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🤖</span>
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#ffd23f',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontFamily: "'Space Mono', monospace"
                          }}>
                            AI Analysis
                          </span>
                        </motion.div>
                        
                        <motion.p
                          style={{
                            fontSize: '1.1rem',
                            color: '#fff',
                            lineHeight: '1.6',
                            margin: 0,
                            marginLeft: '12px',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                            fontFamily: "'Space Mono', monospace"
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {interpretations[param]}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WeatherStats;