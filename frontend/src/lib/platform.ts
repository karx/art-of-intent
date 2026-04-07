import { Capacitor } from '@capacitor/core';

/** True when running inside a Capacitor native shell (iOS or Android). */
export const isNative = Capacitor.isNativePlatform();

/** 'ios' | 'android' | 'web' */
export const platform = Capacitor.getPlatform();

export const isIOS     = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb     = platform === 'web';
