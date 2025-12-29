export interface GridCell {
  x: number;
  y: number;
  value?: number;
  action?: number;
  isAgent: boolean;
  isGoal: boolean;
}

export const ACTION_SYMBOLS: Record<number, string> = {
  0: '↑',
  1: '↓',
  2: '←',
  3: '→',
};

export const ACTION_NAMES: Record<number, string> = {
  0: 'Up',
  1: 'Down',
  2: 'Left',
  3: 'Right',
};

export function getValueColor(value: number, minValue: number, maxValue: number): string {
  const range = maxValue - minValue || 1;
  const normalized = (value - minValue) / range;
  
  const r = Math.round(255 - normalized * 200);
  const g = Math.round(255 - normalized * 50);
  const b = Math.round(255 - normalized * 200);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function parseStateKey(key: string): [number, number] | null {
  const match = key.match(/\((\d+),\s*(\d+)\)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return null;
}

export function createStateKey(x: number, y: number): string {
  return `(${x}, ${y})`;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  cellSize: number,
  padding: number
): void {
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridSize; i++) {
    const pos = padding + i * cellSize;
    
    ctx.beginPath();
    ctx.moveTo(pos, padding);
    ctx.lineTo(pos, padding + gridSize * cellSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, pos);
    ctx.lineTo(padding + gridSize * cellSize, pos);
    ctx.stroke();
  }
}

export function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  padding: number,
  cell: GridCell,
  minValue: number,
  maxValue: number
): void {
  const canvasX = padding + x * cellSize;
  const canvasY = padding + y * cellSize;

  if (cell.isGoal) {
    ctx.fillStyle = '#dcfce7';
  } else if (cell.value !== undefined) {
    ctx.fillStyle = getValueColor(cell.value, minValue, maxValue);
  } else {
    ctx.fillStyle = '#f9fafb';
  }
  
  ctx.fillRect(canvasX + 1, canvasY + 1, cellSize - 2, cellSize - 2);

  if (cell.value !== undefined && !cell.isAgent) {
    ctx.fillStyle = '#374151';
    ctx.font = `${cellSize / 4}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.value.toFixed(1), canvasX + cellSize / 2, canvasY + cellSize / 2);
  }

  if (cell.action !== undefined && !cell.isGoal && !cell.isAgent) {
    ctx.fillStyle = '#6b7280';
    ctx.font = `${cellSize / 3}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(ACTION_SYMBOLS[cell.action], canvasX + cellSize / 2, canvasY + cellSize - 5);
  }

  if (cell.isAgent) {
    ctx.beginPath();
    ctx.arc(canvasX + cellSize / 2, canvasY + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (cell.isGoal) {
    ctx.fillStyle = '#22c55e';
    ctx.font = `${cellSize / 2}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', canvasX + cellSize / 2, canvasY + cellSize / 2);
  }
}
