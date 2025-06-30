import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllEvaluations, fetchDepartments, fetchEvaluationCycles } from '../../features/evaluation/evaluationSlice';
import DashboardFilter from './DashboardFilter';
import EvaluationSummaryChart from './charts/EvaluationSummaryChart';
import CompletionStatusChart from './charts/CompletionStatusChart';
import DepartmentComparisonChart from './charts/DepartmentComparisonChart';
import EvaluationTable from './tables/EvaluationTable';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { evaluations, cycles, departments, loading } = useSelector((state) => state.evaluation);
  const [filters, setFilters] = useState({
    cycle: '',
    department: '',
    evaluatorType: ''
  });

  useEffect(() => {
    dispatch(fetchEvaluationCycles());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    // Fetch evaluations based on filters
    const queryParams = new URLSearchParams();
    if (filters.cycle) queryParams.append('cycleId', filters.cycle);
    if (filters.department) queryParams.append('department', filters.department);
    if (filters.evaluatorType) queryParams.append('evaluatorType', filters.evaluatorType);
    
    dispatch(fetchAllEvaluations(queryParams.toString()));
  }, [dispatch, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="spinner"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      
      <DashboardFilter 
        cycles={cycles}
        departments={departments}
        filters={filters}
        onChange={handleFilterChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Evaluation Summary</h2>
          <EvaluationSummaryChart data={evaluations} />
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Completion Status</h2>
          <CompletionStatusChart data={evaluations} />
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Department Comparison</h2>
          <DepartmentComparisonChart data={evaluations} />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Evaluation Results</h2>
        <EvaluationTable evaluations={evaluations} />
      </div>
    </div>
  );
};

export default AdminDashboard;