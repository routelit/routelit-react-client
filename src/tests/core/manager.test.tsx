import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RouteLitManager } from '../../core/manager';
import * as serverApi from '../../core/server-api';
import * as actions from '../../core/actions';

// Mock the dependencies
vi.mock('../../core/server-api', () => ({
  sendEvent: vi.fn(),
  sendEventStream: vi.fn()
}));

vi.mock('../../core/actions', () => ({
  applyActions: vi.fn((draft, actions) => {
    // Simple mock implementation that actually modifies the draft
    actions.forEach((action: AddAction) => {
      if (action.type === 'add') {
        if (action.address.length === 1) {
          draft[action.address[0]] = action.element;
        }
      }
    });
  }),
  prependAddressToActions: vi.fn((resp: ActionsResponse, address: number[]) => ({
    ...resp,
    actions: resp.actions.map(action => ({
      ...action,
      address: [...address, ...action.address]
    }))
  }))
}));

// Helper function to create async generator from array
async function* createAsyncGenerator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

describe('RouteLitManager', () => {
  let manager: RouteLitManager;
  const mockComponentsTree: RouteLitComponent[] = [
    {
      name: 'test',
      props: { id: 'test1' },
      key: 'test1',
      address: [0]
    },
    {
      name: 'test2',
      props: { id: 'test2' },
      key: 'test2',
      address: [1],
      children: [
        {
          name: 'child',
          props: { id: 'child' },
          key: 'child',
          address: [1, 0]
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Save the original window.location and history
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost',
        origin: 'http://localhost'
      },
      writable: true
    });

    window.history.pushState = vi.fn();
    window.history.replaceState = vi.fn();
    document.dispatchEvent = vi.fn();
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();

    // Mock sendEventStream to return async generator with responses
    vi.mocked(serverApi.sendEventStream).mockImplementation((event) => {
      if (event.detail.type === 'initialize') {
        return createAsyncGenerator([{
          actions: mockComponentsTree.map((component, index) => ({
            type: 'add',
            address: [index],
            element: component
          } as AddAction)),
          target: 'fragment' as const
        }]);
      }
      return createAsyncGenerator([{
        actions: [],
        target: 'fragment' as const
      }]);
    });

    // Also mock sendEvent for backward compatibility tests
    vi.mocked(serverApi.sendEvent).mockImplementation((event) => {
      if (event.detail.type === 'initialize') {
        return Promise.resolve({
          actions: mockComponentsTree.map((component, index) => ({
            type: 'add',
            address: [index],
            element: component
          } as AddAction)),
          target: 'fragment'
        });
      }
      return Promise.resolve({
        actions: [],
        target: 'fragment'
      });
    });

    // Initialize a new manager for each test with empty components tree
    manager = new RouteLitManager({});
  });

  describe('initialization and cleanup', () => {
    it('should register event listeners on initialize', () => {
      manager.initialize();

      expect(document.addEventListener).toHaveBeenCalledWith(
        'routelit:event',
        expect.any(Function)
      );

      expect(window.addEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should send initialize event and fetch initial data on initialize', async () => {
      // Wait for the initialize call to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      manager.initialize();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(serverApi.sendEventStream).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'initialize',
            id: 'browser-navigation'
          })
        }),
        undefined,
        expect.any(AbortController)
      );
    });

    it('should remove event listeners on terminate', () => {
      manager.terminate();

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'routelit:event',
        expect.any(Function)
      );

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });
  });

  describe('event handling', () => {
    it('should handle UI events using streaming by sending them to the server', async () => {
      const eventDetail = {
        id: 'test-id',
        type: 'click',
        someData: 'value'
      };

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: eventDetail
      });

      await manager.handleEvent(event);

      expect(serverApi.sendEventStream).toHaveBeenCalledWith(event, undefined, expect.any(AbortController));
    });

    it('should handle multiple streaming responses', async () => {
      const responses: ActionsResponse[] = [
        { actions: [{ type: 'add', address: [0], element: { name: 'div1', key: 'div1', props: {}, address: [0] } } as AddAction], target: 'fragment' as const },
        { actions: [{ type: 'add', address: [1], element: { name: 'div2', key: 'div2', props: {}, address: [1] } } as AddAction], target: 'fragment' as const }
      ];

      vi.mocked(serverApi.sendEventStream).mockReturnValue(createAsyncGenerator(responses));

      const applyActionsSpy = vi.spyOn(manager, 'applyActions');

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      await manager.handleEvent(event);

      expect(applyActionsSpy).toHaveBeenCalledTimes(2);
      expect(applyActionsSpy).toHaveBeenNthCalledWith(1, responses[0]);
      expect(applyActionsSpy).toHaveBeenNthCalledWith(2, responses[1]);
    });

    it('should update loading state during streaming event handling', async () => {
      const loadingListener = vi.fn();
      manager.subscribeIsLoading(loadingListener);

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      // Create a promise that we can resolve manually
      let resolvePromise!: (value: ActionsResponse) => void;
      const controlledGenerator = (async function* () {
        const response = await new Promise<ActionsResponse>(resolve => { 
          resolvePromise = resolve; 
        });
        yield response;
      })();

      vi.mocked(serverApi.sendEventStream).mockReturnValue(controlledGenerator);

      // Start handling the event
      const handlePromise = manager.handleEvent(event);

      // Give the loading state a moment to update
      await new Promise(resolve => setTimeout(resolve, 0));

      // Loading state should be true
      expect(manager.isLoading()).toBe(true);
      expect(loadingListener).toHaveBeenCalledWith(true);

      // Reset the mock to ensure we're testing the right callback
      loadingListener.mockClear();

      // Resolve the promise
      resolvePromise({ actions: [], target: 'fragment' as const });

      // Wait for the event handler to complete
      await handlePromise;

      // Loading should be false after completion
      expect(manager.isLoading()).toBe(false);
      expect(loadingListener).toHaveBeenCalledWith(false);
    });

    it('should handle errors during streaming event processing', async () => {
      const errorListener = vi.fn();
      manager.subscribeError(errorListener);

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      const testError = new Error('Test streaming error');
      vi.mocked(serverApi.sendEventStream).mockImplementation(async function* (): AsyncGenerator<ActionsResponse> {
        throw testError;
        yield { actions: [], target: 'fragment' as const }; // This line will never be reached, but TypeScript requires it
      });

      await manager.handleEvent(event);

      expect(manager.getError()).toBe(testError);
      expect(errorListener).toHaveBeenCalledWith(testError);
    });

    it('should handle navigation events with streaming', async () => {
      const event = new CustomEvent<NavigateEventPayload>('routelit:event', {
        detail: {
          id: 'nav-1',
          type: 'navigate',
          href: '/new-page'
        }
      });

      const response: ActionsResponse = {
        actions: [{ type: 'add', address: [0], element: { name: 'new', key: 'new', props: {}, address: [0] } } as AddAction],
        target: 'fragment' as const
      };

      vi.mocked(serverApi.sendEventStream).mockReturnValue(createAsyncGenerator([response]));

      await manager.handleEvent(event);

      expect(serverApi.sendEventStream).toHaveBeenCalledWith(event, undefined, expect.any(AbortController));
    });

    it('should not handle navigation events when in a fragment', async () => {
      const fragmentManager = new RouteLitManager({
        fragmentId: 'test-fragment'
      });

      const event = new CustomEvent<NavigateEventPayload>('routelit:event', {
        detail: {
          id: 'nav-1',
          type: 'navigate',
          href: '/new-page'
        }
      });

      await fragmentManager.handleEvent(event);

      expect(serverApi.sendEventStream).not.toHaveBeenCalled();
    });

    it('should handle popstate events', () => {
      // Set up window location
      window.location.href = 'http://localhost/page2';

      // Trigger popstate handler
      manager.handlePopState();

      // Check if a navigate event was dispatched
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'routelit:event',
          detail: expect.objectContaining({
            type: 'navigate',
            id: 'browser-navigation',
            href: 'http://localhost/page2'
          })
        })
      );
    });

    it('should abort previous requests when new event is handled', async () => {
      const event1 = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test1', type: 'click' }
      });

      const event2 = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test2', type: 'click' }
      });

      // Mock sendEventStream to track abort controller calls
      const abortControllers: AbortController[] = [];
      vi.mocked(serverApi.sendEventStream).mockImplementation((_event, _fragmentId, abortController) => {
        abortControllers.push(abortController);
        return createAsyncGenerator([{ actions: [], target: 'fragment' as const }]);
      });

      // Start first event
      const promise1 = manager.handleEvent(event1);
      
      // Start second event before first completes
      const promise2 = manager.handleEvent(event2);

      await Promise.all([promise1, promise2]);

      // Should have created two abort controllers
      expect(abortControllers).toHaveLength(2);
      
      // The first abort controller should have been aborted
      expect(abortControllers[0].signal.aborted).toBe(true);
      
      // The second abort controller should not be aborted
      expect(abortControllers[1].signal.aborted).toBe(false);
    });

    it('should handle individual action responses', async () => {
      const action: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'test', props: {}, address: [0] }
      };

      vi.mocked(serverApi.sendEventStream).mockReturnValue(createAsyncGenerator([action]));

      const applyActionsSpy = vi.spyOn(manager, 'applyActions');

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      await manager.handleEvent(event);

      expect(applyActionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [action],
          target: 'fragment'
        }),
        true
      );
    });

    it('should handle fragment ID in event handling', async () => {
      const fragmentManager = new RouteLitManager({
        fragmentId: 'test-fragment'
      });

      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      await fragmentManager.handleEvent(event);

      expect(serverApi.sendEventStream).toHaveBeenCalledWith(
        event,
        'test-fragment',
        expect.any(AbortController)
      );
    });
  });

  describe('component tree handling', () => {
    it('should apply actions to the component tree', async () => {
      // Initialize manager to populate components tree
      manager.initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      const addAction: AddAction = {
        type: 'add',
        address: [1],
        element: { name: 'div', key: 'new', props: {}, address: [1] }
      };

      const actionsResponse: ActionsResponse = {
        actions: [addAction],
        target: 'fragment'
      };

      // Create a spy on applyActions before calling the method
      const applyActionsSpy = vi.spyOn(actions, 'applyActions');

      manager.applyActions(actionsResponse);

      // Use simpler assertion to check if it was called
      expect(applyActionsSpy).toHaveBeenCalled();
    });

    it('should notify listeners when component tree changes', async () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      // Initialize manager to populate components tree
      manager.initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      const addAction: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'new', props: {}, address: [0] }
      };

      const actionsResponse: ActionsResponse = {
        actions: [addAction],
        target: 'fragment'
      };

      manager.applyActions(actionsResponse);

      expect(listener).toHaveBeenCalled();
    });

    it('should access components at a specific address', async () => {
      // Initialize manager to populate components tree
      manager.initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Test accessing root level component which should exist
      const components = manager.getAtAddress([1]);
      expect(components).toBeDefined();
      
      // Test that we can get the components tree
      const tree = manager.getComponentsTree();
      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('parent-child fragment relationship', () => {
    it('should delegate actions to parent manager when in a fragment', async () => {
      const parentManager = new RouteLitManager({});
      // Initialize parent manager
      parentManager.initialize();
      await new Promise(resolve => setTimeout(resolve, 0));

      const childManager = new RouteLitManager({
        fragmentId: 'child-fragment',
        parentManager,
        address: [0] // Use a valid address that exists
      });

      // Spy on parent manager's applyActions
      const applyActionsSpy = vi.spyOn(parentManager, 'applyActions');

      const addAction: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'new', props: {}, address: [0] }
      };

      const actionsResponse: ActionsResponse = {
        actions: [addAction],
        target: 'fragment'
      };

      childManager.applyActions(actionsResponse);

      // Verify that prependAddressToActions was called with the correct address
      expect(actions.prependAddressToActions).toHaveBeenCalledWith(
        actionsResponse,
        [0]
      );

      // Check that parent's applyActions was called with the processed actions
      expect(applyActionsSpy).toHaveBeenCalled();
    });

    it('should propagate loading state from parent to child', () => {
      const parentManager = new RouteLitManager({});

      // Set parent to loading
      const loadingEvent = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      // Create an unresolved generator
      vi.mocked(serverApi.sendEventStream).mockReturnValue((async function* () {
        // This generator never resolves, keeping loading state true
        await new Promise(() => {});
        yield { actions: [], target: 'fragment' as const };
      })());

      // Start the loading process on parent
      parentManager.handleEvent(loadingEvent);

      // Create child manager
      const childManager = new RouteLitManager({
        fragmentId: 'child',
        parentManager
      });

      // Child should report loading because parent is loading
      expect(childManager.isLoading()).toBe(true);
    });

    it('should propagate errors from parent to child', async () => {
      const parentManager = new RouteLitManager({});
      const childManager = new RouteLitManager({
        fragmentId: 'child',
        parentManager
      });

      // Make parent throw an error
      const error = new Error('Test error');
      const event = new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      });

      vi.mocked(serverApi.sendEventStream).mockImplementation(async function* (): AsyncGenerator<ActionsResponse> {
        throw error;
        yield { actions: [], target: 'fragment' as const }; // This line will never be reached, but TypeScript requires it
      });

      // Now that handleEvent is async, we can await it
      await parentManager.handleEvent(event);

      // Child should see the parent's error
      expect(childManager.getError()).toBe(error);
    });

    it('should handle app-level actions in fragments', () => {
      const parentManager = new RouteLitManager({});
      const childManager = new RouteLitManager({
        fragmentId: 'child',
        parentManager,
        address: [0]
      });

      const appAction: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'app-element', props: {}, address: [0] },
        target: 'app'
      };

      const applyActionsSpy = vi.spyOn(parentManager, 'applyActions');

      childManager.batchAction(appAction);

      // Should delegate to parent without prepending address
      expect(applyActionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [appAction],
          target: 'app'
        }),
        true
      );
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing to component tree changes', () => {
      const listener = vi.fn();

      const unsubscribe = manager.subscribe(listener);

      // Apply actions to trigger notification
      const addAction1: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'new', props: {}, address: [0] }
      };

      manager.applyActions({
        actions: [addAction1],
        target: 'fragment'
      });

      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe and verify no more calls
      unsubscribe();

      const addAction2: AddAction = {
        type: 'add',
        address: [1],
        element: { name: 'span', key: 'another', props: {}, address: [1] }
      };

      manager.applyActions({
        actions: [addAction2],
        target: 'fragment'
      });

      expect(listener).toHaveBeenCalledTimes(1); // Still just one call
    });

    it('should allow subscribing to loading state changes', () => {
      const listener = vi.fn();

      manager.subscribeIsLoading(listener);

      // Create a never-resolving generator to keep loading state true
      vi.mocked(serverApi.sendEventStream).mockReturnValue((async function* () {
        // This generator never resolves, keeping loading state true
        await new Promise(() => {});
        yield { actions: [], target: 'fragment' as const };
      })());

      // Trigger loading state change
      manager.handleEvent(new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      }));

      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should allow subscribing to error state changes', async () => {
      const listener = vi.fn();

      manager.subscribeError(listener);

      // Make the API call fail
      const error = new Error('Test error');
      vi.mocked(serverApi.sendEventStream).mockImplementation(async function* (): AsyncGenerator<ActionsResponse> {
        throw error;
        yield { actions: [], target: 'fragment' as const }; // This line will never be reached, but TypeScript requires it
      });

      // Trigger error - now that handleEvent is async, we can await it
      await manager.handleEvent(new CustomEvent<UIEventPayload>('routelit:event', {
        detail: { id: 'test', type: 'click' }
      }));

      expect(listener).toHaveBeenCalledWith(error);
    });

    it('should propagate subscriptions from parent to child', () => {
      const parentManager = new RouteLitManager({});
      const childManager = new RouteLitManager({
        fragmentId: 'child',
        parentManager
      });

      const listener = vi.fn();
      childManager.subscribe(listener);

      // Apply action to parent
      const addAction: AddAction = {
        type: 'add',
        address: [0],
        element: { name: 'div', key: 'test', props: {}, address: [0] }
      };

      parentManager.applyActions({
        actions: [addAction],
        target: 'fragment'
      });

      // Child listener should be called
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('URL tracking', () => {
    it('should track last URL correctly', () => {
      const manager = new RouteLitManager({});
      
      // Initial URL should be from window.location
      expect(manager.getLastURL()).toBe('http://localhost');

      // Update URL through navigation event
      const event = new CustomEvent<NavigateEventPayload>('routelit:event', {
        detail: {
          id: 'nav-1',
          type: 'navigate',
          href: '/new-page'
        }
      });

      manager.handleEvent(event);

      // URL should be updated
      expect(manager.getLastURL()).toBe('http://localhost/new-page');
    });

    it('should handle external URLs', () => {
      const manager = new RouteLitManager({});
      
      const event = new CustomEvent<NavigateEventPayload>('routelit:event', {
        detail: {
          id: 'nav-1',
          type: 'navigate',
          href: 'https://external.com/page'
        }
      });

      manager.handleEvent(event);

      // External URL should be preserved as-is
      expect(manager.getLastURL()).toBe('https://external.com/page');
    });

    it('should inherit last URL from parent manager', () => {
      const parentManager = new RouteLitManager({});
      parentManager.handleEvent(new CustomEvent<NavigateEventPayload>('routelit:event', {
        detail: {
          id: 'nav-1',
          type: 'navigate',
          href: '/parent-page'
        }
      }));

      const childManager = new RouteLitManager({
        fragmentId: 'child',
        parentManager
      });

      // Child should inherit parent's last URL
      expect(childManager.getLastURL()).toBe('http://localhost/parent-page');
    });
  });
});
