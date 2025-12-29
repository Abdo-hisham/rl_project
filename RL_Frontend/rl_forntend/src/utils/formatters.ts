export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function formatAlgorithmName(id: string): string {
  const names: Record<string, string> = {
    value_iteration: 'Value Iteration',
    policy_iteration: 'Policy Iteration',
    mc_first_visit: 'MC First Visit',
    mc_every_visit: 'MC Every Visit',
    mc_control: 'MC Control',
    td_zero: 'TD(0)',
  };
  return names[id] || snakeToTitle(id);
}

export function formatActionName(action: number): string {
  const actions: Record<number, string> = {
    0: 'Up',
    1: 'Down',
    2: 'Left',
    3: 'Right',
  };
  return actions[action] || `Action ${action}`;
}
