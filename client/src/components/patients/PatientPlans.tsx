import React from 'react';
import { Edit, Trash2, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface BasePlan {
  status: string;
  start_date: string;
  end_date?: string;
}

export interface PatientPlansProps<T extends BasePlan> {
  plans: T[];
  selectedPlanId: string | number | null;
  onSelectPlan: (id: string | number) => void;
  onEditPlan: (plan: T) => void;
  onDeletePlan: (plan: T) => void;
  idField: keyof T;
  nameField: keyof T;
  planType: 'Diet' | 'Exercise';
  maxHeight?: string;
}

function PatientPlans<T extends BasePlan>({
  plans,
  selectedPlanId,
  onSelectPlan,
  onEditPlan,
  onDeletePlan,
  idField,
  nameField,
  planType,
  maxHeight = 'calc(100vh-300px)'
}: PatientPlansProps<T>) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="text-orange-500" size={16} />;
      case 'active':
        return <Clock className="text-red-500" size={16} />;
      case 'pending':
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-orange-800">{planType} Plans</h2>
      </div>
      
      <div className={`max-h-[${maxHeight}] overflow-y-auto`}>
        {plans.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="mx-auto mb-2" size={24} />
            <p>No {planType.toLowerCase()} plans assigned</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {plans.map(plan => {
              const planId = plan[idField] as string | number;
              const planName = plan[nameField] as string;
              return (
                <div
                  key={planId}
                  className={`p-4 transition-colors hover:bg-orange-50 cursor-pointer ${
                    selectedPlanId === planId ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                  onClick={() => onSelectPlan(planId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-orange-800">{planName}</h3>
                        {getStatusIcon(plan.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(plan.start_date)}</span>
                        </div>
                        {plan.end_date && (
                          <div className="flex items-center gap-1">
                            <span>to</span>
                            <span>{formatDate(plan.end_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPlan(plan);
                        }}
                        className="p-1 rounded-full hover:bg-orange-100 text-orange-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlan(plan);
                        }}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientPlans; 
