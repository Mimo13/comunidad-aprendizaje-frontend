import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';
import { describe, it, expect } from 'vitest';

describe('LoadingScreen', () => {
  it('renders loading message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/Cargando Familias Colaboradoras.../i)).toBeInTheDocument();
  });

  it('renders circular progress', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
