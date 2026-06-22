import type { ReactNode } from 'react';

interface Tile {
  id: string;
  node: ReactNode;
}

interface VideoGridProps {
  tiles: Tile[];
}

function gridStyle(n: number): React.CSSProperties {
  if (n <= 1) return { gridTemplateColumns: '1fr' };
  if (n <= 2) return { gridTemplateColumns: 'repeat(2, 1fr)' };
  if (n <= 4) return { gridTemplateColumns: 'repeat(2, 1fr)' };
  if (n <= 9) return { gridTemplateColumns: 'repeat(3, 1fr)' };
  return { gridTemplateColumns: 'repeat(4, 1fr)' };
}

export function VideoGrid({ tiles }: VideoGridProps) {
  const n = tiles.length;

  // 3 participants: first 2 side by side, third centered below
  if (n === 3) {
    return (
      <div className="w-full h-full flex flex-col gap-2 p-2">
        <div className="flex gap-2" style={{ flex: '1 1 50%' }}>
          <div className="flex-1">{tiles[0].node}</div>
          <div className="flex-1">{tiles[1].node}</div>
        </div>
        <div className="flex justify-center" style={{ flex: '1 1 50%' }}>
          <div style={{ width: '50%' }}>{tiles[2].node}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-2"
      style={{ display: 'grid', ...gridStyle(n), gap: 8, gridAutoRows: '1fr' }}
    >
      {tiles.map(t => (
        <div key={t.id} className="min-h-0">
          {t.node}
        </div>
      ))}
    </div>
  );
}
