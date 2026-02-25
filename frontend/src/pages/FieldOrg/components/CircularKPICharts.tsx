import React, { useState, useEffect } from 'react';
import { fieldOrgAPI } from '../../../services/api';
import { Loader2 } from 'lucide-react';

const managerKPIFactors = [
  'Leadership effectiveness',
  'Decision-making quality',
  'Resource allocation',
  'Team coordination',
  'Field supervision',
];

const employeeKPIFactors = [
  'Timeliness & quality of DPR preparation',
  'Survey accuracy',
  'Adherence to project timelines',
  'Expenditure vs. financial targets',
  'Physical progress of works',
  'Compliance with technical standards',
];

interface CircularGaugeProps {
  score: number;
  label: string;
  factors: string[];
  color: string;
}

function CircularGauge({ score, label, factors, color }: CircularGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all">
      <h3 className="text-gray-900 mb-6 text-center">{label}</h3>

      {/* Circular Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg height={radius * 2} width={radius * 2}>
            {/* Background circle */}
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Animated progress circle */}
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-in-out',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                strokeLinecap: 'round',
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          {/* Center score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl text-gray-900">{animatedScore}</span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* KPI Factors */}
      <div className="space-y-2">
        <p className="text-sm text-gray-700 mb-3">KPI Factors:</p>
        {factors.map((factor, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-2`} style={{ backgroundColor: color }}></div>
            <p className="text-sm text-gray-600 leading-relaxed">{factor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CircularKPICharts() {
  const [managerKPI, setManagerKPI] = useState(0);
  const [employeeKPI, setEmployeeKPI] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIScores();
  }, []);

  const loadKPIScores = async () => {
    try {
      setLoading(true);
      const [managerResponse, employeeResponse] = await Promise.all([
        fieldOrgAPI.getAverageManagerKPI(),
        fieldOrgAPI.getAverageEmployeeKPI(),
      ]);
      
      setManagerKPI(managerResponse.data?.averageKPI || 0);
      setEmployeeKPI(employeeResponse.data?.averageKPI || 0);
    } catch (error) {
      console.error('Failed to load KPI scores:', error);
      setManagerKPI(0);
      setEmployeeKPI(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CircularGauge
        score={Math.round(managerKPI)}
        label="Average Manager KPI Score"
        factors={managerKPIFactors}
        color="#8b5cf6"
      />
      <CircularGauge
        score={Math.round(employeeKPI)}
        label="Average Field Employee KPI Score"
        factors={employeeKPIFactors}
        color="#06b6d4"
      />
    </div>
  );
}
