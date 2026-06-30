export interface IElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximized: (callback: (maximized: boolean) => void) => () => void;
  loginWithMicrosoft: () => Promise<{
    nickname: string;
    uuid: string;
    accessToken: string;
    skin: string;
  }>;
}

declare global {
  interface Window {
    electron?: IElectronAPI;
  }
}
