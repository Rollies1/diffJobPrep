import React from 'react';
import { View, Text, Pressable, TextInput, Image, ScrollView } from 'react-native';
import { Question } from '../../services/questionService';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  question: Question;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  showFeedback?: boolean;
  feedback?: { correct: boolean; feedback?: string; explanation?: string };
}

export const QuestionRenderer: React.FC<Props> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  showCorrect,
  showFeedback,
  feedback,
}) => {
  return (
    <View>
      {/* Media Carousel */}
      {question.mediaUrls && question.mediaUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {question.mediaUrls.map((url, idx) => (
            <View key={idx} className="mr-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <Image
                source={{ uri: url }}
                className="w-72 h-48 bg-slate-100"
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Type-specific renderer */}
      {question.type === 'mcq' && (
        question.options && question.options.length > 0
          ? <MCQRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled, showCorrect }} />
          : <FillBlankRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled }} />
      )}
      {question.type === 'fill_blank' && (
        <FillBlankRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled }} />
      )}
      {question.type === 'code' && (
        <CodeRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled }} />
      )}
      {question.type === 'matching' && (
        <MatchingRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled }} />
      )}
      {question.type === 'essay' && (
        <EssayRenderer {...{ question, selectedAnswer, onSelectAnswer, disabled }} />
      )}

      {/* Instant Feedback Overlay */}
      {showFeedback && feedback && (
        <View
          className={`mt-6 p-5 rounded-3xl border shadow-sm ${
            feedback.correct
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <View className="flex-row items-center mb-2">
            <Feather 
              name={feedback.correct ? 'check-circle' : 'x-circle'} 
              size={20} 
              color={feedback.correct ? '#059669' : '#e11d48'} 
            />
            <Text
              className={`font-extrabold text-base ml-2 ${feedback.correct ? 'text-emerald-800' : 'text-rose-800'}`}
            >
              {feedback.correct ? 'Correct!' : 'Not quite right'}
            </Text>
          </View>
          {feedback.feedback && (
            <Text className="text-sm font-medium text-slate-700 leading-relaxed mb-1">{feedback.feedback}</Text>
          )}
          {feedback.explanation && (
            <Text className="text-sm text-slate-600 leading-relaxed mt-2">{feedback.explanation}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const MCQRenderer: React.FC<Props> = ({ question, selectedAnswer, onSelectAnswer, disabled, showCorrect }) => {
  const handleSelect = (option: string) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onSelectAnswer?.(option);
  };

  return (
    <View className="gap-3">
      {question.options?.map((option, idx) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = showCorrect && option === question.correctAnswer;
        const isWrong = showCorrect && isSelected && !isCorrect;

        return (
          <Pressable
            key={idx}
            onPress={() => handleSelect(option)}
            disabled={disabled}
            className={`p-4 rounded-2xl border-2 shadow-sm flex-row items-center ${
              isCorrect
                ? 'border-emerald-500 bg-emerald-50'
                : isWrong
                ? 'border-rose-500 bg-rose-50'
                : isSelected
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
                isCorrect ? 'border-emerald-500 bg-emerald-500' :
                isWrong ? 'border-rose-500 bg-rose-500' :
                isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}
            >
              {(isSelected || isCorrect || isWrong) && (
                <Feather name={isWrong ? 'x' : 'check'} size={14} color="white" />
              )}
            </View>
            <Text className={`flex-1 text-base font-medium ${isCorrect ? 'text-emerald-900' : isWrong ? 'text-rose-900' : 'text-slate-800'}`}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const FillBlankRenderer: React.FC<Props> = ({ selectedAnswer, onSelectAnswer, disabled }) => (
  <View className="bg-white rounded-2xl shadow-sm border border-slate-200">
    <TextInput
      value={selectedAnswer || ''}
      onChangeText={onSelectAnswer}
      placeholder="Type your answer here..."
      placeholderTextColor="#94a3b8"
      editable={!disabled}
      className="p-4 text-base text-slate-900 min-h-[100px]"
      multiline
    />
  </View>
);

const CodeRenderer: React.FC<Props> = ({ question, selectedAnswer, onSelectAnswer, disabled }) => (
  <View className="rounded-2xl overflow-hidden border border-slate-800 shadow-sm bg-slate-900">
    <View className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex-row justify-between items-center">
      <Text className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
        {question.language || 'Editor'}
      </Text>
      <View className="flex-row gap-1.5">
        <View className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
      </View>
    </View>
    {question.codeTemplate && !selectedAnswer && (
      <View className="px-4 pt-4">
        <Text className="text-slate-500 text-xs font-mono mb-2">// Template</Text>
        <Text className="text-blue-300 font-mono text-sm">{question.codeTemplate}</Text>
      </View>
    )}
    <TextInput
      value={selectedAnswer || ''}
      onChangeText={onSelectAnswer}
      placeholder={`// Write your ${question.language || 'code'} solution...\n// Tap here to edit`}
      placeholderTextColor="#475569"
      editable={!disabled}
      multiline
      className="p-4 text-sm text-emerald-400 font-mono min-h-[200px]"
      textAlignVertical="top"
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
    />
  </View>
);

const MatchingRenderer: React.FC<Props> = ({ question, selectedAnswer, onSelectAnswer, disabled }) => {
  const pairs = React.useMemo(() => {
    try { return selectedAnswer ? JSON.parse(selectedAnswer) : {}; } catch { return {}; }
  }, [selectedAnswer]);

  const handlePair = (left: string, right: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = { ...pairs, [left]: right };
    onSelectAnswer?.(JSON.stringify(next));
  };

  return (
    <View className="gap-4">
      {question.matchingPairs?.map((pair, idx) => (
        <View key={idx} className="flex-row items-stretch gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <View className="flex-1 justify-center">
            <Text className="text-slate-800 font-bold text-center">{pair.left}</Text>
          </View>
          <View className="justify-center">
            <Text className="text-slate-300 font-bold">→</Text>
          </View>
          <View className="flex-1 gap-2">
            {question.matchingPairs?.map((p) => {
              const isMatched = pairs[pair.left] === p.right;
              return (
                <Pressable
                  key={p.right}
                  onPress={() => !disabled && handlePair(pair.left, p.right)}
                  className={`p-3 rounded-xl border-2 items-center justify-center ${
                    isMatched ? 'border-blue-600 bg-blue-100 shadow-sm' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-medium ${isMatched ? 'text-blue-900' : 'text-slate-700'}`}>
                    {p.right}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const EssayRenderer: React.FC<Props> = ({ selectedAnswer, onSelectAnswer, disabled }) => (
  <View className="bg-white rounded-2xl shadow-sm border border-slate-200">
    <TextInput
      value={selectedAnswer || ''}
      onChangeText={onSelectAnswer}
      placeholder="Write your detailed essay answer here..."
      placeholderTextColor="#94a3b8"
      editable={!disabled}
      multiline
      className="p-4 text-base text-slate-900 min-h-[250px]"
      textAlignVertical="top"
    />
  </View>
);
