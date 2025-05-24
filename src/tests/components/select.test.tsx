import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Select from '../../components/select';
import { useFormDispatcherWithAttr, useIsLoading } from '../../core/context';

// Mock the context hooks
vi.mock('../../core/context', () => ({
  useFormDispatcherWithAttr: vi.fn(),
  useIsLoading: vi.fn(),
}));

describe('Select Component', () => {
  const defaultProps = {
    id: 'test-select',
    label: 'Test Select',
    value: 'option1',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      'option3', // Simple string option
    ],
  };

  beforeEach(() => {
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(vi.fn());
    vi.mocked(useIsLoading).mockReturnValue(false);
  });

  it('renders with label', () => {
    render(<Select {...defaultProps} />);
    expect(screen.getByText('Test Select')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(<Select {...defaultProps} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders all options correctly', () => {
    render(<Select {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option1');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('option3')).toBeInTheDocument();
  });

  it('handles option selection correctly', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<Select {...defaultProps} />);
    const select = screen.getByRole('combobox');
    
    fireEvent.change(select, { target: { value: 'option2' } });
    expect(mockDispatch).toHaveBeenCalledWith('option2');
  });

  it('handles disabled state correctly', () => {
    const options = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2', disabled: true },
    ];
    
    render(<Select {...defaultProps} options={options} />);
    const select = screen.getByRole('combobox');
    const option2 = select.querySelector('option[value="option2"]') as HTMLOptionElement;
    expect(option2.disabled).toBe(true);
  });

  it('handles loading state correctly', () => {
    vi.mocked(useIsLoading).mockReturnValue(true);
    
    render(<Select {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('handles simple string options correctly', () => {
    const options = ['option1', 'option2'];
    render(<Select {...defaultProps} options={options} />);
    
    expect(screen.getByText('option1')).toBeInTheDocument();
    expect(screen.getByText('option2')).toBeInTheDocument();
  });

  it('displays helper text when provided', () => {
    render(<Select {...defaultProps} helperText="This is a helper text" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('helpertext', 'This is a helper text');
  });

  it('displays error text when provided', () => {
    render(<Select {...defaultProps} errorText="This is an error" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('errortext', 'This is an error');
  });

  it('does not dispatch change when value remains the same', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<Select {...defaultProps} value="option1" />);
    const select = screen.getByRole('combobox');
    
    fireEvent.change(select, { target: { value: 'option1' } });
    expect(mockDispatch).not.toHaveBeenCalled();
  });
}); 