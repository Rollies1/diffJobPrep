import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-slate-50 px-8 pb-12">
      <View className="w-32 h-32 bg-white rounded-full items-center justify-center shadow-sm mb-8 border border-slate-100">
        <Feather name="compass" size={48} color="#94a3b8" />
      </View>
      
      <Text className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Lost in space</Text>
      
      <Text className="text-slate-500 text-center text-lg leading-relaxed mb-10 font-medium">
        The route you're looking for has drifted off into the void.
      </Text>
      
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.replace('/(app)/dashboard');
        }}
        className="bg-blue-600 px-8 py-4 rounded-full flex-row items-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
      >
        <Feather name="home" size={18} color="white" className="mr-2" />
        <Text className="text-white font-extrabold text-base uppercase tracking-wider">
          Return to Base
        </Text>
      </Pressable>
    </View>
  );
}
