import { createContext, useContext, useEffect } from 'react';

export interface OceanApi {
  setDepth: (fraction: number) => void;
  muted: boolean;
  toggleMute: () => void;
}

export const OceanContext = createContext<OceanApi>({
  setDepth: () => undefined,
  muted: false,
  toggleMute: () => undefined,
});

export function useOcean(): OceanApi {
  return useContext(OceanContext);
}

/** يضبط عمق الخلفية (٠ = السطح، ١ = القاع) */
export function useOceanDepth(fraction: number): void {
  const { setDepth } = useOcean();
  useEffect(() => {
    setDepth(Math.max(0, Math.min(1, fraction)));
  }, [fraction, setDepth]);
}
