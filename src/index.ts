import { ScrollMagicPlugin } from './ScrollMagic';

export { ScrollMagic as default } from './ScrollMagic';

// TODO: learn how to properly export those.
// export { EventType, EventLocation, ScrollDirection } from './ScrollMagicEvent';

// types
export type { ScrollMagicPlugin };

// TODO: reconsider factory type. Is it possible to better infer the supplied options?
export type ScrollMagicPluginFactory<T extends any> = (options: T) => ScrollMagicPlugin;

export type { Public as ScrollMagicOptions } from './Options';
export type { ScrollMagicError } from './ScrollMagicError';
export type { ScrollMagicEvent } from './ScrollMagicEvent';
