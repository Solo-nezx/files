const nodemailer = require('nodemailer');
const User = require('../models/User');
const config = require('../config');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport(config.email.smtp);
  }

  /**
   * Send email notification to user
   */
  async sendEmail(to, subject, content) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html: content
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Notify user when a new evaluation cycle starts
   */
  async notifyEvaluationCycleStart(evaluationCycle) {
    try {
      // Get all participants
      const participantIds = evaluationCycle.participants.map(p => p.userId);
      const users = await User.find({ _id: { $in: participantIds } });

      for (const user of users) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #445872;">${evaluationCycle.title}</h1>
            <p>Hello ${user.firstName},</p>
            <p>You have been included in the "${evaluationCycle.title}" evaluation cycle.</p>
            <p><strong>Start Date:</strong> ${new Date(evaluationCycle.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(evaluationCycle.endDate).toLocaleDateString()}</p>
            ${evaluationCycle.description ? `<p><strong>Description:</strong> ${evaluationCycle.description}</p>` : ''}
            <p>Please log into the Dimensions 360° Evaluation platform to complete your assigned evaluations.</p>
            <p>
              <a href="${config.appUrl}/evaluations" style="background-color: #445872; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Go to Evaluations
              </a>
            </p>
          </div>
        `;

        await this.sendEmail(user.email, `New Evaluation Cycle: ${evaluationCycle.title}`, emailContent);
      }
    } catch (error) {
      console.error('Error notifying evaluation cycle start:', error);
    }
  }

  /**
   * Notify user when an evaluation is completed for them
   */
  async notifyEvaluationCompleted(evaluationResponse) {
    try {
      // Get evaluated user
      const evaluatedUser = await User.findById(evaluationResponse.evaluatedUserId);
      if (!evaluatedUser) return;

      // Get evaluator (optional)
      const evaluator = await User.findById(evaluationResponse.evaluatorId);
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #445872;">Evaluation Completed</h1>
          <p>Hello ${evaluatedUser.firstName},</p>
          <p>A new evaluation has been completed for you in the 360° Evaluation platform.</p>
          <p><strong>Evaluator Type:</strong> ${evaluationResponse.relationshipType.replace('_', ' ')}</p>
          ${evaluator ? `<p><strong>Evaluator:</strong> ${evaluator.firstName} ${evaluator.lastName}</p>` : ''}
          <p>Please log into the Dimensions 360° Evaluation platform to view your results.</p>
          <p>
            <a href="${config.appUrl}/results" style="background-color: #445872; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View Results
            </a>
          </p>
        </div>
      `;

      await this.sendEmail(evaluatedUser.email, 'New Evaluation Completed', emailContent);
    } catch (error) {
      console.error('Error notifying evaluation completed:', error);
    }
  }

  /**
   * Remind users of pending evaluations
   */
  async sendPendingEvaluationsReminder() {
    try {
      // Get all active evaluation cycles
      const activeCycles = await EvaluationCycle.find({
        status: 'active',
        endDate: { $gte: new Date() }
      });
      
      if (activeCycles.length === 0) return;
      
      // For each cycle, find pending evaluations
      for (const cycle of activeCycles) {
        // Find pending evaluations
        const pendingEvaluations = await EvaluationResponse.find({
          evaluationCycleId: cycle._id,
          status: { $in: ['pending', 'in_progress'] }
        }).populate('evaluatorId', 'firstName lastName email');
        
        // Group by evaluator
        const evaluatorMap = pendingEvaluations.reduce((acc, evaluation) => {
          const evaluatorId = evaluation.evaluatorId._id.toString();
          if (!acc[evaluatorId]) {
            acc[evaluatorId] = {
              evaluator: evaluation.evaluatorId,
              evaluations: []
            };
          }
          acc[evaluatorId].evaluations.push(evaluation);
          return acc;
        }, {});
        
        // Send reminder to each evaluator
        for (const { evaluator, evaluations } of Object.values(evaluatorMap)) {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h1 style="color: #445872;">Reminder: Pending Evaluations</h1>
              <p>Hello ${evaluator.firstName},</p>
              <p>You have ${evaluations.length} pending evaluation(s) for the "${cycle.title}" cycle that need to be completed.</p>
              <p><strong>Cycle End Date:</strong> ${new Date(cycle.endDate).toLocaleDateString()}</p>
              <p>Please log into the Dimensions 360° Evaluation platform to complete your evaluations.</p>
              <p>
                <a href="${config.appUrl}/evaluations" style="background-color: #445872; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                  Complete Evaluations
                </a>
              </p>
            </div>
          `;
          
          await this.sendEmail(evaluator.email, 'Reminder: Pending Evaluations', emailContent);
        }
      }
    } catch (error) {
      console.error('Error sending pending evaluations reminder:', error);
    }
  }
}

module.exports = new NotificationService();