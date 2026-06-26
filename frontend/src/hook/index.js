/**
 * Central export file for all custom hooks
 * Import hooks from here for consistency
 * 
 * @example
 * import { useMobile, useDeviceType, useClickOutside } from '@/hook'
 */

export { default as useMobile, useMobile as useMobileNamed } from './use-mobile'
export { default as useDeviceType, useDeviceType as useDeviceTypeNamed } from './use-device-type'
export { default as useClickOutside, useClickOutside as useClickOutsideNamed } from './use-click-outside'
export { default as useLocalStorage, useLocalStorage as useLocalStorageNamed } from './use-local-storage'
export { default as useToggle, useToggle as useToggleNamed } from './use-toggle'
export { default as useBodyScrollLock, useBodyScrollLock as useBodyScrollLockNamed } from './use-body-scroll-lock'
export { default as useEscapeKey, useEscapeKey as useEscapeKeyNamed } from './use-escape-key'
export { default as useCountdown, useCountdown as useCountdownNamed } from './use-countdown'

