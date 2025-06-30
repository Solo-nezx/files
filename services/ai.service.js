const OpenAI = require('openai');
const User = require('../models/User');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  /**
   * Generate evaluation questions based on job role and evaluation type
   */
  async generateEvaluationQuestions(jobTitle, evaluationType) {
    try {
      const prompt = this.buildQuestionGenerationPrompt(jobTitle, evaluationType);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in employee performance evaluation and professional development."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const rawQuestions = response.choices[0].message.content;
      return this.parseQuestions(rawQuestions);
    } catch (error) {
      console.error('Error generating evaluation questions:', error);
      throw new Error('Failed to generate evaluation questions');
    }
  }

  /**
   * Generate development suggestions based on evaluation scores
   */
  async generateDevelopmentSuggestions(userId, evaluationResults) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const lowScoreCategories = this.identifyLowScoreCategories(evaluationResults);
      if (lowScoreCategories.length === 0) {
        return {
          suggestions: ["No specific development areas identified. Continue building on current strengths."]
        };
      }

      const prompt = this.buildSuggestionPrompt(user.jobTitle, lowScoreCategories);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career coach specializing in professional development."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const suggestions = response.choices[0].message.content;
      return {
        suggestions: this.parseSuggestions(suggestions)
      };
    } catch (error) {
      console.error('Error generating development suggestions:', error);
      throw new Error('Failed to generate development suggestions');
    }
  }

  // Helper methods remain the same
  buildQuestionGenerationPrompt(jobTitle, evaluationType) {
    return `Generate 10 professional evaluation questions for a ${jobTitle} role. 
      These questions are for a ${evaluationType} evaluation.
      Each question should be focused on skills, competencies, and behaviors relevant to the role.
      Format each question with a category label in this format:
      
      Category: [Leadership/Communication/Technical Skills/etc]
      Question: [Question text]
      Type: rating (on a 1-5 scale)
      
      For the last 2 questions, make them open-ended and use 'Type: text' instead.`;
  }

  parseQuestions(rawText) {
    // Implementation to parse the AI response into structured question objects
    const questions = [];
    const lines = rawText.split('\n');
    
    let currentQuestion = {};
    
    for (const line of lines) {
      if (line.startsWith('Category:')) {
        if (Object.keys(currentQuestion).length > 0) {
          questions.push({...currentQuestion});
          currentQuestion = {};
        }
        currentQuestion.category = line.replace('Category:', '').trim();
      } else if (line.startsWith('Question:')) {
        currentQuestion.text = line.replace('Question:', '').trim();
      } else if (line.startsWith('Type:')) {
        const type = line.replace('Type:', '').trim();
        currentQuestion.type = type;
        
        if (type === 'rating') {
          currentQuestion.ratingScale = { min: 1, max: 5 };
        }
        
        if (Object.keys(currentQuestion).length >= 3) {
          questions.push({...currentQuestion});
          currentQuestion = {};
        }
      }
    }
    
    // Add the last question if it exists
    if (Object.keys(currentQuestion).length > 0) {
      questions.push({...currentQuestion});
    }
    
    return questions;
  }

  identifyLowScoreCategories(evaluationResults) {
    // Group scores by category and identify those below threshold (e.g., 3.0)
    const threshold = 3.0;
    const categorizedScores = {};
    
    evaluationResults.forEach(result => {
      result.answers.forEach(answer => {
        if (answer.ratingValue) {
          if (!categorizedScores[answer.category]) {
            categorizedScores[answer.category] = [];
          }
          categorizedScores[answer.category].push(answer.ratingValue);
        }
      });
    });
    
    return Object.entries(categorizedScores)
      .filter(([category, scores]) => {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return average < threshold;
      })
      .map(([category]) => category);
  }

  buildSuggestionPrompt(jobTitle, lowScoreCategories) {
    return `As a professional development coach, provide specific development suggestions for a ${jobTitle} who needs improvement in the following areas: ${lowScoreCategories.join(', ')}.
      
      For each area, suggest:
      1. One specific skill-building activity
      2. One resource (book, course, or online training)
      3. One practical workplace application
      
      Format your response as a bullet-point list for each category.`;
  }

  parseSuggestions(rawText) {
    // Parse the suggestions into an array
    // Simple implementation - split by double newlines and clean up
    return rawText
      .split('\n\n')
      .map(suggestion => suggestion.trim())
      .filter(suggestion => suggestion.length > 0);
  }
}

module.exports = new AIService();