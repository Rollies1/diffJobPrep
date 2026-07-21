import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTimeline } from '../hooks/useQuestions';
import { Feather } from '@expo/vector-icons';

interface Props {
  questionId: string;
}

export const QuestionTimeline: React.FC<Props> = ({ questionId }) => {
  const { data: timeline, isLoading } = useTimeline(questionId);

  if (isLoading) {
    return (
      <View className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm items-center justify-center">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!timeline || timeline.attempts.length === 0) {
    return (
      <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm items-center">
        <Feather name="bar-chart-2" size={24} color="#cbd5e1" className="mb-2" />
        <Text className="text-sm font-bold text-slate-400">No practice history yet</Text>
      </View>
    );
  }

  const attempts = timeline.attempts;
  const maxTime = Math.max(...attempts.map((a) => a.timeSpent), 1);

  return (
    <View className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
        Your Practice History
      </Text>
      
      <View className="flex-row items-end justify-between h-28 gap-1.5 border-b border-slate-100 pb-2">
        {attempts.slice(-10).map((attempt, idx) => {
          // ensure a min height for visibility
          const height = Math.max((attempt.timeSpent / maxTime) * 100, 15); 
          return (
            <View key={idx} className="flex-1 items-center justify-end h-full group">
              <View
                className={`w-full rounded-t-md ${attempt.correct ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ height: `${height}%` }}
              />
              <Text className="text-[10px] font-bold text-slate-400 mt-2" numberOfLines={1}>
                {new Date(attempt.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View className="flex-row justify-between mt-4">
        <View className="flex-row items-center">
          <Feather name="target" size={14} color="#64748b" className="mr-1.5" />
          <Text className="text-xs font-bold text-slate-600">
            {attempts.filter((a) => a.correct).length}/{attempts.length} correct
          </Text>
        </View>
        <View className="flex-row items-center">
          <Feather name="clock" size={14} color="#64748b" className="mr-1.5" />
          <Text className="text-xs font-bold text-slate-600">
            Avg {Math.round(attempts.reduce((a, b) => a + b.timeSpent, 0) / attempts.length)}s
          </Text>
        </View>
      </View>
    </View>
  );
};
