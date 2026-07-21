import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNotes, useAddNote, useDeleteNote } from '../hooks/useQuestions';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  questionId: string;
}

export const QuestionNotes: React.FC<Props> = ({ questionId }) => {
  const { data: notes, isLoading } = useNotes(questionId);
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const [newNote, setNewNote] = useState('');

  const handleAdd = () => {
    if (!newNote.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addNote.mutate({ questionId, content: newNote.trim() });
    setNewNote('');
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteNote.mutate(id);
  };

  return (
    <View className="mt-6">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
        My Private Notes
      </Text>

      <View className="flex-row items-end gap-3 mb-4">
        <TextInput
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Jot down a reminder or thought..."
          placeholderTextColor="#94a3b8"
          className="flex-1 bg-amber-50/50 border border-amber-200 rounded-2xl px-4 py-3 text-slate-900 min-h-[50px] max-h-32"
          multiline
        />
        <Pressable
          onPress={handleAdd}
          disabled={!newNote.trim() || addNote.isPending}
          className={`h-[50px] w-[50px] rounded-2xl items-center justify-center shadow-sm ${
            !newNote.trim() ? 'bg-slate-200' : 'bg-amber-500'
          }`}
        >
          {addNote.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Feather name="plus" size={24} color={!newNote.trim() ? '#94a3b8' : 'white'} />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#f59e0b" className="my-4" />
      ) : notes?.length === 0 ? (
        <View className="items-center py-4 opacity-50">
          <Feather name="edit-3" size={24} color="#94a3b8" className="mb-2" />
          <Text className="text-slate-500 text-sm italic">No notes attached to this question yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-3 shadow-sm flex-row justify-between items-start">
              <Text className="text-amber-900 font-medium text-base flex-1 mr-4 leading-relaxed">
                {item.content}
              </Text>
              <Pressable 
                onPress={() => handleDelete(item.id)} 
                className="bg-amber-100/50 p-2 rounded-full"
              >
                <Feather name="trash-2" size={14} color="#d97706" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
};
