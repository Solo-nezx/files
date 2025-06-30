module.exports = {
  // Application configuration
  app: {
    name: 'Dimensions 360° Evaluation',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    corsOrigins: process.env.CORS_ORIGINS || '*'
  },
  
  // Database configuration
  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dimensions-360',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dimensions-360-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Email configuration for notifications
  email: {
    from: process.env.EMAIL_FROM || 'noreply@dimensions.com',
    smtp: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },
  
  // Evaluation configuration
  evaluation: {
    ratingScale: {
      min: 1,
      max: 5,
      labels: [
        'Needs significant improvement',
        'Needs some improvement',
        'Meets expectations',
        'Exceeds expectations',
        'Outstanding performance'
      ]
    },
    defaultCategories: [
      'Leadership',
      'Communication',
      'Technical Skills',
      'Teamwork',
      'Problem Solving',
      'Time Management',
      'Initiative',
      'Quality of Work'
    ]
  }
};