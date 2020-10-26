/**
 * Allows you to subscribe on window selection range and track it realtime, using pointers, touches, mouse and keyboard
 * @param htmlElement subscription target
 * @param config
 */
export function track(
  htmlElement: Node,
  config: {
    callback: (
      selection: Selection,
      additional?: { kind?: string; reason?: string }
    ) => unknown;
    useBubbling?: boolean;
    trackDynamically?: boolean;
    trackMouse?: boolean;
    trackKeyBoard?: boolean;
    trackPointer?: boolean;
    trackTouch?: boolean;
    subscribeToDocument?: boolean;
  }
) {
  function useCallbacksByKind(
    kind: string,
    measure: (
      selection: Selection,
      additional?: { kind?: string; reason?: string; originalEvent: Event }
    ) => unknown
  ) {
    // TODO: maybe it's worth to substract selection from htmlElement
    let tracking = false;
    return {
      down(e: Event) {
        tracking = true;
        if (config.trackDynamically) {
          measure(window.getSelection(), {
            kind,
            reason: 'down',
            originalEvent: e,
          });
        }
      },
      move(e: Event) {
        if (tracking) {
          if (config.trackDynamically) {
            measure(window.getSelection(), {
              kind,
              reason: 'move',
              originalEvent: e,
            });
          }
        }
      },
      up(e: Event) {
        if (tracking) {
          tracking = false;

          measure(window.getSelection(), {
            kind,
            reason: 'up',
            originalEvent: e,
          });
        }
      },
    };
  }

  interface ConfigPart {
    check: boolean;
    events: { down?: string; move?: string; up?: string };
  }

  const devicesConfig: {
    mouse: ConfigPart;
    touch: ConfigPart;
    keyboard: ConfigPart;
    pointer: ConfigPart;
  } = {
    mouse: {
      check: config.trackMouse,
      events: { down: 'mousedown', move: 'mousemove', up: 'mouseup' },
    },
    touch: {
      check: config.trackTouch,
      events: { down: 'touchstart', move: 'touchmove', up: 'touchend' },
    },
    keyboard: {
      check: config.trackKeyBoard,
      events: { down: 'keydown', up: 'keyup' },
    },
    pointer: {
      check: config.trackPointer,
      events: { down: 'pointerdown', move: 'pointermove', up: 'pointerup' },
    },
  };

  const element = config.subscribeToDocument ? document : htmlElement;

  const dispose = Object.entries(devicesConfig)
    .filter(([, params]) => params.check)
    .map(([kind, params]) => {
      const unsubscribeList: [string, () => void][] = [];
      const handlers = useCallbacksByKind(kind, config.callback);
      Object.entries(params.events).forEach(([type, eventName]) => {
        element.addEventListener(
          eventName,
          handlers[type],
          !config.useBubbling
        );
        unsubscribeList.push([eventName, handlers[type]]);
      });
      return unsubscribeList;
    })
    .flat();

  return () => {
    dispose.forEach(([eventName, handler]) => {
      element.removeEventListener(eventName, handler);
    });
  };
}

/**
 * Removes all selections.
 * Simple proxy for removeAllRanges func
 */
export function removeAllSelection() {
  window.getSelection().removeAllRanges();
}

/**
 * Selects the range from startNode with startOffset to endNode with endOffset
 * if endNode isn't provided it uses startNode as endNode
 * if endOffset isn't provided it uses startOffset as endOffset (so it will be only a caret)
 * if startOffset isn't provided it will be judged as a zero offset
 * @param config
 */
export function select(config: {
  startNode: Node;
  startOffset?: number;
  endNode?: Node;
  endOffset?: number;
}) {
  const range = document.createRange();
  range.setStart(config.startNode, config.startOffset ?? 0);
  range.setEnd(
    config.endNode ?? config.startNode,
    config.endOffset ?? config.startOffset ?? 0
  );
  document.getSelection().addRange(range);
  
}

/**
 * Removes all selection and selects a new range from startNode with startOffset to endNode with endOffset
 * if endNode isn't provided it uses startNode as endNode
 * if endOffset isn't provided it uses startOffset as endOffset (so it will be only a caret)
 * if startOffset isn't provided it will be judged as a zero offset
 * @param config
 */
export function selectOnly(config: {
  startNode: Node;
  startOffset?: number;
  endNode?: Node;
  endOffset?: number;
}) {
  removeAllSelection();
  select(config);
}

function checkSelection(htmlElement: Node, range: Range): Range {
  const ancestor = range.commonAncestorContainer;

  // Check if the whole selection belongs to htmlElement
  let current = ancestor;
  while (current) {
    if (current === htmlElement) {
      return range;
    }
    current = current.parentElement;
  }

  if (range.collapsed) {
    return null;
  }

  let foundRange = false;
  let foundHtmlElement = false;
  function traverse(
    htmlElement: Node,
    originalRange: Range,
    current: Node,
    range: Range,
    tail: boolean
  ) {
    if (current === originalRange.startContainer) {
      foundRange = true;
      if (foundHtmlElement) {
        range.setStart(current, originalRange.startOffset);
      }
    }

    if (current === htmlElement) {
      foundHtmlElement = true;
      if (foundRange) {
        range.setStart(current, 0);
      }
    }

    if (current === originalRange.endContainer) {
      if (!foundHtmlElement) {
        return null;
      }
      range.setEnd(current, originalRange.endOffset);
      return range;
    }

    for (let i = 0; i < current.childNodes.length; i++) {
      let result = traverse(
        htmlElement,
        originalRange,
        current.childNodes[i],
        range,
        (tail || current === htmlElement) && current.childNodes.length === i + 1
      );
      if (result === null) {
        return null;
      }
      if (result instanceof Range) {
        return result;
      }
    }
    if (tail) {
      if (!foundRange) {
        return null;
      }
      range.setEnd(current, current.textContent.length);
      return range;
    }
  }

  return traverse(htmlElement, range, ancestor, new Range(), false);
}
/**
 * Count selections which is inside definite node
 * @param htmlElement
 */
export function getSelectionInsideNode(
  htmlElement: Node,
  selection: Selection
): Range[] {
  if (!selection.containsNode(htmlElement, true)) {
    return [];
  }

  const ranges = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = checkSelection(htmlElement, selection.getRangeAt(i));
    if (range) {
      ranges.push(range);
    }
  }

  return ranges;
}
