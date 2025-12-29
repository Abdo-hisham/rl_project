import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import VisualizationCanvas from './VisualizationCanvas';
import FrozenLakeCanvas from './FrozenLakeCanvas';
import BreakoutCanvas from './BreakoutCanvas';

interface EnvironmentVisualizationProps {
  showValues?: boolean;
  showPolicy?: boolean;
  highlightedCell?: [number, number] | null;
  animatedPosition?: [number, number] | null;
}

const EnvironmentVisualization: React.FC<EnvironmentVisualizationProps> = (props) => {
  const { selectedEnvironment } = useSelector((state: RootState) => state.environment);

  if (selectedEnvironment === 'frozen_lake') {
    return (
      <FrozenLakeCanvas
        showValues={props.showValues}
        showPolicy={props.showPolicy}
        animatedPosition={props.animatedPosition}
      />
    );
  }

  if (selectedEnvironment === 'breakout') {
    return (
      <BreakoutCanvas
        showValues={props.showValues}
        showPolicy={props.showPolicy}
        animatedPosition={props.animatedPosition}
      />
    );
  }

  return (
    <VisualizationCanvas
      showValues={props.showValues}
      showPolicy={props.showPolicy}
      highlightedCell={props.highlightedCell}
      animatedPosition={props.animatedPosition}
    />
  );
};

export default EnvironmentVisualization;
