import React from 'react';
import { View, Text, Animated, SafeAreaView } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const NetworkStatus: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (!isOnline) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.spring(translateY, {
      toValue: isOnline ? -100 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className="absolute top-0 left-0 right-0 z-[100] bg-rose-600 shadow-lg"
      pointerEvents="none"
    >
      <SafeAreaView>
        <View className="px-4 py-3 flex-row items-center justify-center pt-12">
          <Feather name="wifi-off" size={16} color="white" className="mr-2" />
          <Text className="text-white text-sm font-extrabold uppercase tracking-widest">
            No Internet Connection
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};
