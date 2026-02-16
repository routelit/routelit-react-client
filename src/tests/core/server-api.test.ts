import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { sendEvent, sendEventStream } from "../../core/server-api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.history
Object.defineProperty(window, "history", {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000/test",
    origin: "http://localhost:3000",
  },
  writable: true,
});

describe("server-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendEvent (backward compatibility)", () => {
    it("should send UI event and return first response", async () => {
      const mockResponse = {
        actions: [
          {
            type: "add",
            address: [0],
            element: { name: "div", key: "test", props: {}, address: [0] },
          },
        ],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click", data: "test" },
      });

      const result = await sendEvent(event);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            uiEvent: {
              componentId: "test-id",
              type: "click",
              data: { data: "test" },
            },
          }),
          credentials: "include",
        }),
      );
    });

    it("should handle navigation events", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<NavigateEventPayload>("test", {
        detail: {
          id: "nav-id",
          type: "navigate",
          href: "/new-page",
          lastURL: "http://localhost:3000/old",
        },
      });

      const result = await sendEvent(event);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/new-page",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Referer": "http://localhost:3000/old",
          }),
        }),
      );
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      await expect(sendEvent(event)).rejects.toThrow(
        "Failed to send server event",
      );
    });

    it("should handle fragment ID in request body", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const fragmentId = "test-fragment";
      await sendEvent(event, fragmentId);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          body: JSON.stringify({
            uiEvent: {
              componentId: "test-id",
              type: "click",
              data: {},
            },
            fragmentId: "test-fragment",
          }),
        }),
      );
    });

    it("should throw error when no response is received", async () => {
      // Mock an empty stream
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: stream,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      await expect(sendEvent(event)).rejects.toThrow(
        "No response received from server",
      );
    });
  });

  describe("sendEventStream", () => {
    it("should handle regular JSON response as single item stream", async () => {
      const mockResponse = {
        actions: [
          {
            type: "add",
            address: [0],
            element: { name: "div", key: "test", props: {}, address: [0] },
          },
        ],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockResponse);
    });

    it("should handle JSON lines streaming response", async () => {
      const mockResponses = [
        {
          actions: [
            {
              type: "add",
              address: [0],
              element: { name: "div1", key: "test1", props: {}, address: [0] },
            },
          ],
          target: "fragment",
        },
        {
          actions: [
            {
              type: "add",
              address: [1],
              element: { name: "div2", key: "test2", props: {}, address: [1] },
            },
          ],
          target: "fragment",
        },
      ];

      const jsonLines = mockResponses.map((r) => JSON.stringify(r)).join("\n");
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(jsonLines));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: stream,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResponses[0]);
      expect(results[1]).toEqual(mockResponses[1]);
    });

    it("should handle partial JSON lines chunks", async () => {
      const mockResponses = [
        { actions: [], target: "fragment", id: 1 },
        { actions: [], target: "fragment", id: 2 },
      ];

      const jsonLines = mockResponses.map((r) => JSON.stringify(r)).join("\n");
      const encoder = new TextEncoder();

      // Split the data into chunks that break JSON lines
      const fullData = encoder.encode(jsonLines);
      const midPoint = Math.floor(fullData.length / 2);
      const chunk1 = fullData.slice(0, midPoint);
      const chunk2 = fullData.slice(midPoint);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(chunk1);
          setTimeout(() => {
            controller.enqueue(chunk2);
            controller.close();
          }, 10);
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: stream,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResponses[0]);
      expect(results[1]).toEqual(mockResponses[1]);
    });

    it("should handle navigation events with streaming", async () => {
      const mockResponse = {
        actions: [
          {
            type: "add",
            address: [0],
            element: { name: "page", key: "new-page", props: {}, address: [0] },
          },
        ],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<NavigateEventPayload>("test", {
        detail: {
          id: "nav-id",
          type: "navigate",
          href: "/new-page",
          replace: false,
        },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockResponse);
      expect(window.history.pushState).toHaveBeenCalledWith(
        null,
        "",
        "/new-page",
      );
    });

    it("should handle navigation with replace flag", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<NavigateEventPayload>("test", {
        detail: {
          id: "nav-id",
          type: "navigate",
          href: "/replace-page",
          replace: true,
        },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/replace-page",
      );
    });

    it("should handle malformed JSON lines gracefully", async () => {
      const validResponse = { actions: [], target: "fragment" };
      const jsonLines =
        JSON.stringify(validResponse) +
        "\n" +
        "invalid json" +
        "\n" +
        JSON.stringify(validResponse);
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(jsonLines));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: stream,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(validResponse);
      expect(results[1]).toEqual(validResponse);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse final JSON chunk:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should handle empty stream", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: stream,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(0);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const generator = sendEventStream(event);

      await expect(generator.next()).rejects.toThrow(
        "Failed to send server event",
      );
    });

    it("should throw error when response body is not readable", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/jsonlines"]]),
        body: null,
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const generator = sendEventStream(event);

      await expect(generator.next()).rejects.toThrow(
        "Response body is not readable",
      );
    });

    it("should handle fragment ID in request body", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const fragmentId = "test-fragment";
      const results = [];
      for await (const response of sendEventStream(event, fragmentId)) {
        results.push(response);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          body: JSON.stringify({
            uiEvent: {
              componentId: "test-id",
              type: "click",
              data: {},
            },
            fragmentId: "test-fragment",
          }),
        }),
      );
    });

    it.skip("should handle abort controller signal", async () => {
      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      // Mock fetch to check if signal is passed
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve({ actions: [], target: "fragment" }),
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({}),
      );
    });

    it("should handle individual action responses", async () => {
      const mockAction = {
        type: "add",
        address: [0],
        element: { name: "div", key: "test", props: {}, address: [0] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockAction),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click" },
      });

      const results = [];
      for await (const response of sendEventStream(event)) {
        results.push(response);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockAction);
    });
  });

  describe("file upload", () => {
    it("should use FormData when files are included in event data", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      // Create a mock FormData to track what's passed
      const mockFormData = {
        append: vi.fn(),
        has: vi.fn().mockReturnValue(true),
      };

      // Mock the global FormData constructor
      const originalFormData = global.FormData;
      global.FormData = vi.fn(() => mockFormData) as any;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      // Create mock files
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const mockFiles = [mockFile] as unknown as FileList;

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "file-input", type: "change", files: mockFiles },
      });

      await sendEvent(event);

      // Verify FormData was used
      expect(global.FormData).toHaveBeenCalled();
      expect(mockFormData.append).toHaveBeenCalledWith(
        "json",
        expect.stringContaining('"componentId":"file-input"'),
      );
      expect(mockFormData.append).toHaveBeenCalledWith("files", mockFile);

      // Restore original FormData
      global.FormData = originalFormData;
    });

    it("should use JSON request when no files are included", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "test-id", type: "click", data: "test" },
      });

      await sendEvent(event);

      // Verify fetch was called with JSON body (not FormData)
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            uiEvent: {
              componentId: "test-id",
              type: "click",
              data: { data: "test" },
            },
          }),
        }),
      );
    });

    it("should handle multiple files in FormData", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      const mockFormData = {
        append: vi.fn(),
        has: vi.fn().mockReturnValue(true),
      };

      const originalFormData = global.FormData;
      global.FormData = vi.fn(() => mockFormData) as any;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      // Create multiple mock files
      const mockFile1 = new File(["content 1"], "file1.txt", {
        type: "text/plain",
      });
      const mockFile2 = new File(["content 2"], "file2.txt", {
        type: "text/plain",
      });
      const mockFiles = [mockFile1, mockFile2] as unknown as FileList;

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "multi-file-input", type: "change", files: mockFiles },
      });

      await sendEvent(event);

      // Verify both files were appended
      expect(mockFormData.append).toHaveBeenCalledWith("files", mockFile1);
      expect(mockFormData.append).toHaveBeenCalledWith("files", mockFile2);

      global.FormData = originalFormData;
    });

    it("should handle file upload with fragment ID", async () => {
      const mockResponse = {
        actions: [],
        target: "fragment",
      };

      const mockFormData = {
        append: vi.fn(),
        has: vi.fn().mockReturnValue(true),
      };

      const originalFormData = global.FormData;
      global.FormData = vi.fn(() => mockFormData) as any;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
      const mockFiles = [mockFile] as unknown as FileList;

      const event = new CustomEvent<UIEventPayload>("test", {
        detail: { id: "file-input", type: "change", files: mockFiles },
      });

      const fragmentId = "test-fragment";
      await sendEvent(event, fragmentId);

      // Verify fragment ID was included in the JSON payload
      expect(mockFormData.append).toHaveBeenCalledWith(
        "json",
        expect.stringContaining('"fragmentId":"test-fragment"'),
      );

      global.FormData = originalFormData;
    });
  });
});
