import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, FlatList } from 'react-native';
import { useDecks, useCreateDeck, useDeckMutation } from '../hooks/useQuestions';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  questionId: string;
}

export const DeckSelector: React.FC<Props> = ({ visible, onClose, questionId }) => {
  const { data: decks } = useDecks();
  const createDeck = useCreateDeck();
  const deckMutation = useDeckMutation();
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const isInDeck = (deckId: string) => decks?.find((d) => d.id === deckId)?.questionIds.includes(questionId);

  const handleToggle = (deckId: string, currentlyInDeck: boolean) => {
    Haptics.selectionAsync();
    deckMutation.mutate({
      deckId,
      questionId,
      action: currentlyInDeck ? 'remove' : 'add',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View className="flex-1 justify-end bg-slate-900/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-3xl p-6 max-h-[85%] shadow-lg pb-10">
          
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-extrabold text-slate-900">Study Decks</Text>
              <Text className="text-sm font-medium text-slate-500 mt-1">Organize this question for review</Text>
            </View>
            <Pressable onPress={onClose} className="bg-slate-100 p-2 rounded-full">
              <Feather name="x" size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Create New Toggle */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreate(!showCreate);
            }}
            className="flex-row items-center mb-4 py-2"
          >
            <Feather name="plus-circle" size={18} color="#2563eb" />
            <Text className="text-blue-600 font-bold ml-2 text-base">Create New Deck</Text>
          </Pressable>

          {/* Create Input Area */}
          {showCreate && (
            <View className="flex-row gap-3 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <TextInput
                value={newDeckName}
                onChangeText={setNewDeckName}
                placeholder="Name your new deck..."
                placeholderTextColor="#94a3b8"
                className="flex-1 px-3 py-2 text-base text-slate-900"
                autoFocus
              />
              <Pressable
                onPress={() => {
                  if (!newDeckName.trim()) return;
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  createDeck.mutate({ name: newDeckName.trim() });
                  setNewDeckName('');
                  setShowCreate(false);
                }}
                className={`px-5 rounded-xl items-center justify-center shadow-sm ${
                  !newDeckName.trim() ? 'bg-slate-200' : 'bg-blue-600'
                }`}
              >
                <Text className={`font-bold ${!newDeckName.trim() ? 'text-slate-400' : 'text-white'}`}>
                  Save
                </Text>
              </Pressable>
            </View>
          )}

          {/* Decks List */}
          <FlatList
            data={decks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const inDeck = isInDeck(item.id);
              return (
                <Pressable
                  onPress={() => handleToggle(item.id, !!inDeck)}
                  className={`flex-row justify-between items-center p-4 rounded-2xl border mb-3 shadow-sm ${
                    inDeck ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                      inDeck ? 'bg-blue-600' : 'bg-slate-100'
                    }`}>
                      <Feather name="layers" size={18} color={inDeck ? 'white' : '#64748b'} />
                    </View>
                    <View>
                      <Text className={`font-bold text-base ${inDeck ? 'text-blue-900' : 'text-slate-900'}`}>
                        {item.name}
                      </Text>
                      <Text className={`text-xs font-medium ${inDeck ? 'text-blue-600/80' : 'text-slate-500'}`}>
                        {item.questionIds.length} items inside
                      </Text>
                    </View>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    inDeck ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-transparent'
                  }`}>
                    {inDeck && <Feather name="check" size={12} color="white" />}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="py-10 items-center opacity-50">
                <Feather name="box" size={40} color="#94a3b8" className="mb-3" />
                <Text className="text-slate-500 font-medium">You don't have any study decks yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};
