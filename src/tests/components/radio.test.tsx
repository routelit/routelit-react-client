import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RadioGroup from '../../components/radio';
import { useFormDispatcherWithAttr, useIsLoading } from '../../core/context';

// Mock the context hooks
vi.mock('../../core/context', () => ({
  useFormDispatcherWithAttr: vi.fn(),
  useIsLoading: vi.fn(),
}));

describe('RadioGroup Component', () => {
  const defaultProps = {
    id: 'test-radio',
    label: 'Test Radio Group',
    value: 'option1',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2', caption: 'Description for option 2' },
      'option3', // Simple string option
    ],
  };

  beforeEach(() => {
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(vi.fn());
    vi.mocked(useIsLoading).mockReturnValue(false);
  });

  it('renders with label', () => {
    render(<RadioGroup {...defaultProps} />);
    expect(screen.getByText('Test Radio Group')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(<RadioGroup {...defaultProps} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders all options correctly', () => {
    render(<RadioGroup {...defaultProps} />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    expect(screen.getByLabelText('option3')).toBeInTheDocument();
  });

  it('displays caption when provided', () => {
    render(<RadioGroup {...defaultProps} />);
    expect(screen.getByText('Description for option 2')).toBeInTheDocument();
  });

  it('handles option selection correctly', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<RadioGroup {...defaultProps} />);
    const option2 = screen.getByLabelText('Option 2');
    
    fireEvent.click(option2);
    expect(mockDispatch).toHaveBeenCalledWith('option2');
  });

  it('applies flex direction correctly', () => {
    render(<RadioGroup {...defaultProps} flexDirection="row" />);
    const container = document.querySelector('.rl-form-control-group');
    expect(container).toHaveClass('rl-flex-row');
  });

  it('handles disabled state correctly', () => {
    const options = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2', disabled: true },
    ];
    
    render(<RadioGroup {...defaultProps} options={options} />);
    const option2 = screen.getByLabelText('Option 2') as HTMLInputElement;
    expect(option2.disabled).toBe(true);
  });

  it('handles loading state correctly', () => {
    vi.mocked(useIsLoading).mockReturnValue(true);
    
    render(<RadioGroup {...defaultProps} />);
    const option1 = screen.getByLabelText('Option 1') as HTMLInputElement;
    expect(option1.disabled).toBe(true);
  });

  it('handles simple string options correctly', () => {
    const options = ['option1', 'option2'];
    render(<RadioGroup {...defaultProps} options={options} />);
    
    expect(screen.getByLabelText('option1')).toBeInTheDocument();
    expect(screen.getByLabelText('option2')).toBeInTheDocument();
  });
}); 