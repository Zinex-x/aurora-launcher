export interface IElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximized: (callback: (maximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electron?: IElectronAPI;
  }
}
