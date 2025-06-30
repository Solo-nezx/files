const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  /**
   * Generate evaluation results PDF for a user
   */
  async generateEvaluationResultsPDF(results, userData) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          },
          info: {
            Title: `${userData.firstName} ${userData.lastName} - 360° Evaluation Results`,
            Author: 'Dimensions 360° Evaluation Platform'
          }
        });
        
        // Define output file path
        const fileName = `evaluation_results_${userData._id}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '..', 'temp', fileName);
        
        // Create writable stream
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Add header with logo
        this.addHeader(doc, userData);
        
        // Add summary section
        this.addSummarySection(doc, results, userData);
        
        // Add detailed results by cycle
        this.addDetailedResults(doc, results);
        
        // Add suggestions section if available
        if (results.suggestions && results.suggestions.length > 0) {
          this.addSuggestionsSection(doc, results.suggestions);
        }
        
        // Add footer
        this.addFooter(doc);
        
        // Finalize the PDF
        doc.end();
        
        // Return the file path when the stream is closed
        stream.on('finish', () => {
          resolve(filePath);
        });
        
        stream.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Add header section to PDF
   */
  addHeader(doc, userData) {
    // Add logo
    const logoPath = path.join(__dirname, '..', 'public', 'images', 'dimensions-logo.png');
    doc.image(logoPath, 50, 50, { width: 150 });
    
    // Add title
    doc.moveDown(2);
    doc.fontSize(20).font('Helvetica-Bold').text('360° Evaluation Results', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text(`${userData.firstName} ${userData.lastName}`, { align: 'center' });
    doc.fontSize(12).text(`${userData.jobTitle} | ${userData.department}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(2);
  }
  
  /**
   * Add summary section to PDF
   */
  addSummarySection(doc, results, userData) {
    doc.fontSize(16).font('Helvetica-Bold').text('Evaluation Summary', { underline: true });
    doc.moveDown(1);
    
    // Calculate overall average across all cycles
    const overallScores = [];
    results.forEach(cycle => {
      if (cycle.overallAverage) {
        overallScores.push(cycle.overallAverage);
      }
    });
    
    const overallAverage = overallScores.length > 0 ? 
      overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length : 
      null;
    
    // Display overall average
    doc.fontSize(12).font('Helvetica-Bold').text('Overall Performance Score:');
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor(this.getScoreColor(overallAverage))
      .text(overallAverage ? overallAverage.toFixed(2) : 'N/A', { align: 'center' });
    doc.fillColor('black');
    
    // Display rating scale explanation
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('Rating Scale:');
    doc.fontSize(10).font('Helvetica')
      .text('1: Needs significant improvement')
      .text('2: Needs some improvement')
      .text('3: Meets expectations')
      .text('4: Exceeds expectations')
      .text('5: Outstanding performance');
    
    doc.moveDown(2);
  }
  
  /**
   * Add detailed results by cycle to PDF
   */
  addDetailedResults(doc, results) {
    doc.fontSize(16).font('Helvetica-Bold').text('Detailed Results by Evaluation Cycle', { underline: true });
    doc.moveDown(1);
    
    results.forEach((cycle, index) => {
      doc.fontSize(14).font('Helvetica-Bold').text(cycle.cycleTitle);
      doc.fontSize(10).font('Helvetica')
        .text(`Period: ${new Date(cycle.cycleDates.start).toLocaleDateString()} - ${new Date(cycle.cycleDates.end).toLocaleDateString()}`);
      doc.moveDown(0.5);
      
      // Create a table for cycle results
      const tableTop = doc.y;
      const tableWidth = doc.page.width - 100;
      const colWidth = tableWidth / 5;
      
      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Evaluation Type', 50, tableTop);
      doc.text('# Evaluations', 50 + colWidth, tableTop, { width: colWidth, align: 'center' });
      doc.text('Avg. Score', 50 + colWidth * 2, tableTop, { width: colWidth, align: 'center' });
      doc.text('Min. Score', 50 + colWidth * 3, tableTop, { width: colWidth, align: 'center' });
      doc.text('Max. Score', 50 + colWidth * 4, tableTop, { width: colWidth, align: 'center' });
      
      doc.moveTo(50, tableTop - 5).lineTo(50 + tableWidth, tableTop - 5).stroke();
      doc.moveTo(50, tableTop + 15).lineTo(50 + tableWidth, tableTop + 15).stroke();
      
      doc.moveDown(1);
      let rowTop = doc.y;
      
      // Table rows
      doc.fontSize(10).font('Helvetica');
      
      // Self evaluation row
      this.addTableRow(doc, {
        type: 'Self',
        count: cycle.results.self.length,
        average: cycle.results.selfAverage,
        scores: cycle.results.self.map(e => e.averageScore),
        y: rowTop
      }, colWidth);
      
      rowTop += 20;
      
      // Manager evaluation row
      this.addTableRow(doc, {
        type: 'Manager',
        count: cycle.results.manager.length,
        average: cycle.results.managerAverage,
        scores: cycle.results.manager.map(e => e.averageScore),
        y: rowTop
      }, colWidth);
      
      rowTop += 20;
      
      // Peer evaluation row
      this.addTableRow(doc, {
        type: 'Peer',
        count: cycle.results.peer.length,
        average: cycle.results.peerAverage,
        scores: cycle.results.peer.map(e => e.averageScore),
        y: rowTop
      }, colWidth);
      
      rowTop += 20;
      
      // Direct report evaluation row
      this.addTableRow(doc, {
        type: 'Direct Report',
        count: cycle.results.direct_report.length,
        average: cycle.results.direct_reportAverage,
        scores: cycle.results.direct_report.map(e => e.averageScore),
        y: rowTop
      }, colWidth);
      
      rowTop += 20;
      
      // Overall row
      doc.moveTo(50, rowTop - 5).lineTo(50 + tableWidth, rowTop - 5).stroke();
      doc.font('Helvetica-Bold');
      
      this.addTableRow(doc, {
        type: 'OVERALL',
        count: this.getTotalEvaluationsCount(cycle),
        average: cycle.overallAverage,
        scores: this.getAllScores(cycle),
        y: rowTop,
        isBold: true
      }, colWidth);
      
      doc.moveTo(50, rowTop + 15).lineTo(50 + tableWidth, rowTop + 15).stroke();
      
      // Add some space before the next cycle
      doc.moveDown(3);
      
      // Add page break if needed
      if (index < results.length - 1 && doc.y > doc.page.height - 150) {
        doc.addPage();
      }
    });
  }
  
  /**
   * Add a row to the results table
   */
  addTableRow(doc, row, colWidth) {
    const { type, count, average, scores, y, isBold } = row;
    
    if (isBold) {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }
    
    doc.text(type, 50, y);
    doc.text(count.toString(), 50 + colWidth, y, { width: colWidth, align: 'center' });
    
    if (average) {
      doc.fillColor(this.getScoreColor(average));
      doc.text(average.toFixed(2), 50 + colWidth * 2, y, { width: colWidth, align: 'center' });
      doc.fillColor('black');
    } else {
      doc.text('N/A', 50 + colWidth * 2, y, { width: colWidth, align: 'center' });
    }
    
    const validScores = scores.filter(s => s !== null && s !== undefined);
    const minScore = validScores.length > 0 ? Math.min(...validScores) : null;
    const maxScore = validScores.length > 0 ? Math.max(...validScores) : null;
    
    doc.text(minScore ? minScore.toFixed(2) : 'N/A', 50 + colWidth * 3, y, { width: colWidth, align: 'center' });
    doc.text(maxScore ? maxScore.toFixed(2) : 'N/A', 50 + colWidth * 4, y, { width: colWidth, align: 'center' });
  }
  
  /**
   * Add development suggestions section to PDF
   */
  addSuggestionsSection(doc, suggestions) {
    doc.addPage();
    
    doc.fontSize(16).font('Helvetica-Bold').text('Development Suggestions', { underline: true });
    doc.moveDown(1);
    
    doc.fontSize(12).font('Helvetica').text(
      'The following development suggestions are based on your evaluation results and are tailored to help you improve in specific areas.'
    );
    doc.moveDown(1);
    
    suggestions.forEach((suggestion, index) => {
      doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${suggestion.category || 'Development Area'}`);
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica-Bold').text('Skill Building Activity:');
      doc.fontSize(10).font('Helvetica').text(suggestion.skillBuilding || suggestion);
      doc.moveDown(0.5);
      
      if (suggestion.resource) {
        doc.fontSize(10).font('Helvetica-Bold').text('Recommended Resource:');
        doc.fontSize(10).font('Helvetica').text(suggestion.resource);
        doc.moveDown(0.5);
      }
      
      if (suggestion.application) {
        doc.fontSize(10).font('Helvetica-Bold').text('Practical Application:');
        doc.fontSize(10).font('Helvetica').text(suggestion.application);
      }
      
      doc.moveDown(1.5);
    });
  }
  
  /**
   * Add footer to PDF
   */
  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Add footer line
      doc.moveTo(50, doc.page.height - 50).lineTo(doc.page.width - 50, doc.page.height - 50).stroke();
      
      // Add page number and company name
      doc.fontSize(8).font('Helvetica')
        .text(
          `Dimensions 360° Evaluation | Page ${i + 1} of ${pageCount}`,
          50,
          doc.page.height - 40,
          { align: 'center', width: doc.page.width - 100 }
        );
    }
  }
  
  /**
   * Helper to get color based on score
   */
  getScoreColor(score) {
    if (!score) return 'black';
    if (score < 2) return '#e74c3c'; // red
    if (score < 3) return '#f39c12'; // orange
    if (score < 4) return '#2c3e50'; // navy blue
    return '#27ae60'; // green
  }
  
  /**
   * Helper to get total evaluation count
   */
  getTotalEvaluationsCount(cycle) {
    return cycle.results.self.length +
      cycle.results.manager.length +
      cycle.results.peer.length +
      cycle.results.direct_report.length;
  }
  
  /**
   * Helper to get all scores combined
   */
  getAllScores(cycle) {
    return [
      ...cycle.results.self.map(e => e.averageScore),
      ...cycle.results.manager.map(e => e.averageScore),
      ...cycle.results.peer.map(e => e.averageScore),
      ...cycle.results.direct_report.map(e => e.averageScore)
    ].filter(score => score !== null && score !== undefined);
  }
}

module.exports = new PDFService();