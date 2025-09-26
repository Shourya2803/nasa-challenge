import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

const ReportExport = ({ data, insights }) => {
  const [generating, setGenerating] = useState(false);
  const [probabilities, setProbabilities] = useState(null);

  const fetchProbabilities = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/probabilities', {
        data: data.data,
        parameters: data.parameters,
        units: data.units,
        location: data.location
      });
      setProbabilities(response.data.probabilities);
      return response.data.probabilities;
    } catch (error) {
      console.error('Error fetching probabilities:', error);
      return null;
    }
  };

  const exportCSV = async () => {
    const probs = probabilities || await fetchProbabilities();
    const headers = [
      'Date', 
      ...data.parameters.map(p => `${p} (${data.units[p]?.units || ''})`),
      ...data.parameters.map(p => `${p}_Extreme_Probability`),
      ...data.parameters.map(p => `${p}_Above_Average_Probability`),
      ...data.parameters.map(p => `${p}_Anomaly_Probability`)
    ];
    
    const rows = data.data.map(row => [
      row.date,
      ...data.parameters.map(p => row[p] || ''),
      ...data.parameters.map(p => probs?.[p]?.extreme_event || 0),
      ...data.parameters.map(p => probs?.[p]?.above_average || 0),
      ...data.parameters.map(p => probs?.[p]?.anomaly || 0)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa-weather-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportJSON = async () => {
    const probs = probabilities || await fetchProbabilities();
    const reportData = {
      location: data.location,
      parameters: data.parameters,
      units: data.units,
      data: data.data,
      probabilities: probs || {},
      ai_insights: insights,
      generated_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa-weather-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Capture the main content
      const element = document.querySelector('.App');
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        allowTaint: true
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Add title page
      pdf.setFontSize(20);
      pdf.text('NASA POWER Weather Analysis Report', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Location: ${data.location.lat}°N, ${data.location.lon}°E`, 20, 45);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
      
      // Add AI summary
      if (insights) {
        pdf.text('AI Analysis Summary:', 20, 75);
        const splitText = pdf.splitTextToSize(insights.substring(0, 500) + '...', 170);
        pdf.text(splitText, 20, 85);
      }
      
      pdf.addPage();
      
      // Add charts and data
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`nasa-weather-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
      margin: '20px 0',
      flexWrap: 'wrap'
    }}>
      <button 
        onClick={exportCSV}
        className="btn"
        style={{
          background: 'linear-gradient(45deg, #74b9ff, #0984e3)',
          padding: '12px 20px',
          fontSize: '14px'
        }}
      >
         Export CSV
      </button>
      
      <button 
        onClick={exportJSON}
        className="btn"
        style={{
          background: 'linear-gradient(45deg, #a29bfe, #6c5ce7)',
          padding: '12px 20px',
          fontSize: '14px'
        }}
      >
         Export JSON
      </button>
      
      <button 
        onClick={generatePDF}
        disabled={generating}
        className="btn"
        style={{
          background: generating ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(45deg, #fd79a8, #e84393)',
          padding: '12px 20px',
          fontSize: '14px'
        }}
      >
        {generating ? ' Generating...' : ' Generate PDF'}
      </button>
    </div>
  );
};

export default ReportExport;
