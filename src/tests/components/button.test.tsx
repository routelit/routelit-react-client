import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Button from '../../components/button';
import { useFormDispatcher } from '../../core/context';

// Mock the context hook
vi.mock('../../core/context', () => ({
  useFormDispatcher: vi.fn(),
}));

describe('Button Component', () => {
  const defaultProps = {
    text: 'Click me',
    id: 'test-button',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with text content', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('has correct id attribute', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('id', 'test-button');
  });

  it('has button type attribute', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls dispatch function when clicked', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(mockDispatch).toHaveBeenCalledWith({});
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('uses default event name "click" when not specified', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    
    expect(useFormDispatcher).toHaveBeenCalledWith('test-button', 'click');
  });

  it('uses custom event name when specified', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} eventName="submit" />);
    
    expect(useFormDispatcher).toHaveBeenCalledWith('test-button', 'submit');
  });

  it('passes additional props to button element', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(
      <Button
        {...defaultProps}
        className="custom-button"
        data-testid="custom-button"
      />
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveClass('custom-button');
  });

  it('handles multiple clicks correctly', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(mockDispatch).toHaveBeenCalledWith({});
  });

  it('renders with different text content', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(<Button text="Submit Form" id="submit-btn" />);
    expect(screen.getByText('Submit Form')).toBeInTheDocument();
  });

  it('handles aria attributes correctly', () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcher).mockReturnValue(mockDispatch);

    render(
      <Button
        {...defaultProps}
        aria-label="Submit form"
        aria-describedby="description"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toHaveAttribute('aria-describedby', 'description');
  });
}); 