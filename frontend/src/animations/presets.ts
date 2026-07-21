import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export const springs = {
  gentle: { damping: 15, stiffness: 120 } as WithSpringConfig,
  bouncy: { damping: 10, stiffness: 400 } as WithSpringConfig,
  snappy: { damping: 20, stiffness: 300 } as WithSpringConfig,
};

export const timings = {
  fast: { duration: 150 } as WithTimingConfig,
  normal: { duration: 300 } as WithTimingConfig,
  slow: { duration: 500 } as WithTimingConfig,
};
