import type { ReactNode } from 'react';

interface Tile {
  id: string;
  node: ReactNode;
}

interface VideoGridProps {
  tiles: Tile[];
}

export function VideoGrid({ tiles }: VideoGridProps) {
  const n = tiles.length;

  if (n === 1) {
    return (
      <div className="w-full h-full p-2">
        <div className="w-full h-full">{tiles[0].node}</div>
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="w-full h-full p-2 flex gap-2">
        <div className="flex-1 min-w-0">{tiles[0].node}</div>
        <div className="flex-1 min-w-0">{tiles[1].node}</div>
      </div>
    );
  }

  // 3 tiles: equal thirds in a row
  return (
    <div className="w-full h-full p-2 flex gap-2">
      {tiles.slice(0, 3).map(t => (
        <div key={t.id} className="flex-1 min-w-0">{t.node}</div>
      ))}
    </div>
  );
}
