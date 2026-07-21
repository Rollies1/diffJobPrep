import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const fonts = {
  heading: isIOS ? 'SpaceGrotesk-Bold' : 'SpaceGrotesk-Bold',
  headingSemi: isIOS ? 'SpaceGrotesk-SemiBold' : 'SpaceGrotesk-SemiBold',
  body: isIOS ? 'PlusJakartaSans-Regular' : 'PlusJakartaSans-Regular',
  bodySemi: isIOS ? 'PlusJakartaSans-SemiBold' : 'PlusJakartaSans-SemiBold',
  bodyBold: isIOS ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Bold',
  caption: isIOS ? 'PlusJakartaSans-Medium' : 'PlusJakartaSans-Medium',
  mono: isIOS ? 'SpaceGrotesk-Medium' : 'SpaceGrotesk-Medium',
};
