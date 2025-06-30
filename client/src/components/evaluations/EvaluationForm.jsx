import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEvaluationForm, submitEvaluationResponse } from '../../features/evaluation/evaluationSlice';
import RatingQuestion from './questions/RatingQuestion';
import TextQuestion from './questions/TextQuestion';

const EvaluationForm = () => {
  const { evaluationId, userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { form, loading, error } = useSelector((state) => state.evaluation);
  const [answers, setAnswers] = useState({});
  const [formStatus, setFormStatus] = useState('not_started');
  
  useEffect(() => {
    dispatch(fetchEvaluationForm(evaluationId));
  }, [dispatch, evaluationId]);
  
  useEffect(() => {
    if (form && form.questions) {
      const initialAnswers = {};
      form.questions.forEach(question => {
        initialAnswers[question._id] = question.type === 'rating' ? 0 : '';
      });
      setAnswers(initialAnswers);
      setFormStatus('in_progress');
    }
  }, [form]);
  
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all questions are answered
    const unansweredQuestions = Object.entries(answers).filter(([id, value]) => {
      const question = form.questions.find(q => q._id === id);
      return question.type === 'rating' ? value === 0 : value.trim() === '';
    });
    
    if (unansweredQuestions.length > 0) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    // Prepare submission data
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
      const question = form.questions.find(q => q._id === questionId);
      return {
        questionId,
        questionText: question.text,
        category: question.category,
        ...(question.type === 'rating' ? { ratingValue: value } : { textResponse: value })
      };
    });
    
    const submissionData = {
      evaluationId,
      evaluatedUserId: userId,
      formId: form._id,
      answers: formattedAnswers
    };
    
    try {
      await dispatch(submitEvaluationResponse(submissionData)).unwrap();
      alert('Evaluation submitted successfully!');
      navigate('/evaluations');
    } catch (error) {
      alert(`Error submitting evaluation: ${error.message}`);
    }
  };
  
  const handleSaveDraft = () => {
    // Implementation for saving as draft
    // Similar to submit but with status 'in_progress'
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="spinner"></div>
    </div>;
  }
  
  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }
  
  if (!form) {
    return <div className="text-center p-4">No evaluation form found.</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{form.title}</h1>
      <p className="text-gray-600 mb-6">{form.description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {form.questions.map((question) => (
          <div key={question._id} className="border-b pb-6">
            {question.type === 'rating' ? (
              <RatingQuestion 
                question={question}
                value={answers[question._id]}
                onChange={(value) => handleAnswerChange(question._id, value)}
              />
            ) : (
              <TextQuestion 
                question={question}
                value={answers[question._id]}
                onChange={(value) => handleAnswerChange(question._id, value)}
              />
            )}
          </div>
        ))}
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-950 text-white rounded hover:bg-blue-800"
          >
            Submit Evaluation
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvaluationForm;