import { StaticLoader } from '@/components/StaticLoader';

export default function Loading() {
  return (
    <StaticLoader
      label="Hydrating Command Center"
      sublabel="Connecting to isolated workspace matrix..."
      fullScreen={true}
    />
  );
}
