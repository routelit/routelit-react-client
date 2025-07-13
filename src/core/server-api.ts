export async function sendEvent(
  event: CustomEvent<UIEventPayload>,
  fragmentId: string | undefined,
  abortController: AbortController
): Promise<ActionsResponse> {
  // Get the first response from the stream for backward compatibility
  const generator = sendEventStream(event, fragmentId, abortController);
  const result = await generator.next();

  if (result.done) {
    throw new Error("No response received from server");
  }

  return result.value as ActionsResponse;
}

export async function* sendEventStream(
  event: CustomEvent<UIEventPayload>,
  fragmentId: string | undefined,
  abortController: AbortController
): AsyncGenerator<ActionsResponse | Action> {
  if (event.detail.type === "navigate") {
    yield* handleNavigateStream(
      event as CustomEvent<NavigateEventPayload>,
      abortController
    );
    return;
  }
  yield* handleUIEventStream(event, fragmentId, abortController);
}

interface UIEvent {
  componentId: string;
  type: string;
  data: Record<string, unknown>;
  formId?: string;
}

interface RequestBody {
  uiEvent: UIEvent;
  fragmentId?: string;
}

async function* sendUIEventStream(
  url: string,
  body: RequestBody,
  headers?: Record<string, string>,
  abortController?: AbortController
): AsyncGenerator<ActionsResponse | Action> {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
    signal: abortController?.signal,
  });

  if (!res.ok) {
    throw new Error("Failed to send server event");
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/jsonlines")) {
    yield* parseJsonLinesStream(res);
  } else {
    const response = await res.json();
    yield response;
  }
}

function maybeParseJson(line: string): ActionsResponse | Action | undefined {
  const trimmedLine = line.trim();
  if (trimmedLine) {
    try {
      const jsonObject = JSON.parse(trimmedLine);
      return jsonObject;
    } catch (error) {
      console.warn("Failed to parse final JSON chunk:", error);
    }
  }
  return undefined;
}

async function* parseJsonLinesStream(
  response: Response
): AsyncGenerator<ActionsResponse | Action> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        const jsonObject = maybeParseJson(buffer);
        if (jsonObject) {
          yield jsonObject;
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const jsonObject = maybeParseJson(line);
        if (jsonObject) {
          yield jsonObject;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* handleUIEventStream(
  event: CustomEvent<UIEventPayload>,
  fragmentId: string | undefined,
  abortController: AbortController
): AsyncGenerator<ActionsResponse | Action> {
  const { id, type, formId, ...data } = event.detail;
  const url = new URL(window.location.href);
  const body: RequestBody = {
    uiEvent: {
      componentId: id,
      type,
      data,
      formId,
    },
    fragmentId,
  };
  yield* sendUIEventStream(url.toString(), body, undefined, abortController);
}

async function* handleNavigateStream(
  event: CustomEvent<NavigateEventPayload>,
  abortController: AbortController
): AsyncGenerator<ActionsResponse | Action> {
  const { href, id, type, lastURL, ...data } = event.detail;
  const body: RequestBody = {
    uiEvent: {
      componentId: id,
      type,
      data: {
        ...data,
        href,
      },
    },
  };
  const headers: Record<string, string> = {};
  if (lastURL) {
    headers["X-Referer"] = lastURL;
  }

  yield* sendUIEventStream(href, body, headers, abortController);

  // Handle browser navigation after all responses are processed
  if (event.detail.replace) {
    window.history.replaceState(null, "", href);
  } else {
    window.history.pushState(null, "", href);
  }
}
