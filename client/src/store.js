import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import evaluationReducer from './features/evaluation/evaluationSlice';
import userReducer from './features/user/userSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    evaluation: evaluationReducer,
    user: userReducer
  }
});