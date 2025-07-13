import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactRenderer from '../../core/react-renderer';

// Mock the Fragment component
vi.mock('../../components/fragment', () => ({
  default: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`fragment-${id}`}>
      {children}
    </div>
  ),
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('ReactRenderer', () => {
  let mockManager: any;
  let mockComponentStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockManager = {
      subscribe: vi.fn(() => () => {}),
      getComponentsTree: vi.fn(() => []),
    };

    mockComponentStore = {
      get: vi.fn(),
      subscribe: vi.fn(() => () => {}),
      getVersion: vi.fn(() => 1),
    };
  });

  it('renders nothing when components tree is empty', () => {
    mockManager.getComponentsTree.mockReturnValue([]);
    
    const { container } = render(
      <ReactRenderer manager={mockManager} componentStore={mockComponentStore} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders container with rl-container class when components exist', () => {
    const mockComponent = vi.fn(() => <div>Test Component</div>);
    mockComponentStore.get.mockReturnValue(mockComponent);
    
    const componentsTree = [
      {
        name: 'test-component',
        key: 'test-1',
        props: {},
        children: undefined,
        address: undefined,
        stale: false,
      },
    ];
    
    mockManager.getComponentsTree.mockReturnValue(componentsTree);
    
    render(
      <ReactRenderer manager={mockManager} componentStore={mockComponentStore} />
    );
    
    const container = screen.getByText('Test Component').closest('.rl-container');
    expect(container).toBeInTheDocument();
  });

  it('renders fragment components correctly', () => {
    const componentsTree = [
      {
        name: 'fragment',
        key: 'fragment-1',
        props: { id: 'test-fragment' },
        children: [
          {
            name: 'test-component',
            key: 'test-1',
            props: {},
            children: undefined,
            address: undefined,
            stale: false,
          },
        ],
        address: [0],
        stale: false,
      },
    ];
    
    mockManager.getComponentsTree.mockReturnValue(componentsTree);
    
    mockComponentStore.get.mockImplementation((name: string) => {
      if (name === 'test-component') return () => <div>Child Component</div>;
      return null;
    });
    
    render(
      <ReactRenderer manager={mockManager} componentStore={mockComponentStore} />
    );

    // Only check for the fragment's presence
    const fragment = screen.getByTestId('fragment-test-fragment');
    expect(fragment).toBeInTheDocument();
  });

  it('renders stale components with rl-stale wrapper', () => {
    const mockComponent = vi.fn(() => <div>Stale Component</div>);
    mockComponentStore.get.mockReturnValue(mockComponent);
    
    const componentsTree = [
      {
        name: 'test-component',
        key: 'test-1',
        props: {},
        children: undefined,
        address: undefined,
        stale: true,
      },
    ];
    
    mockManager.getComponentsTree.mockReturnValue(componentsTree);
    
    render(
      <ReactRenderer manager={mockManager} componentStore={mockComponentStore} />
    );
    
    const staleWrapper = screen.getByText('Stale Component').closest('.rl-stale');
    expect(staleWrapper).toBeInTheDocument();
  });

  it('subscribes to manager and component store', () => {
    mockManager.getComponentsTree.mockReturnValue([]);
    
    render(
      <ReactRenderer manager={mockManager} componentStore={mockComponentStore} />
    );
    
    expect(mockManager.subscribe).toHaveBeenCalled();
    expect(mockComponentStore.subscribe).toHaveBeenCalled();
  });
}); 