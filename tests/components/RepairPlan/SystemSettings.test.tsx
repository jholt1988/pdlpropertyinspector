// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from "react";
import SystemSettings from '../../../src/components/RepairPlan/SystemSettings';
import { sampleConfig } from './sampleData';

const Wrapper = () => {
  const [config, setConfig] = React.useState(sampleConfig);
  return <SystemSettings config={config} setConfig={setConfig} />;
};

describe('SystemSettings component', () => {
  it('renders range input for threshold', () => {
    render(<Wrapper />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});

