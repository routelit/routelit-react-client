function getTarget(componentsTree: RouteLitComponent[], address: number[]): RouteLitComponent[] {
  let target = componentsTree;
  for (let i = 0; i < address.length - 1; i++) {
    if (!target[address[i]].children) {
      target[address[i]].children = [];
    }
    target = target[address[i]].children!;
  }
  return target;
}

export function applyAddAction(
  componentsTree: RouteLitComponent[],
  action: AddAction
) {
  const target = getTarget(componentsTree, action.address);
  target.splice(action.address[action.address.length - 1], 0, action.element);
}

export function applyRemoveAction(
  componentsTree: RouteLitComponent[],
  action: RemoveAction
) {
  const target = getTarget(componentsTree, action.address);
  target.splice(action.address[action.address.length - 1], 1);
}

export function applySetAction(
  componentsTree: RouteLitComponent[],
  action: SetAction
) {
  const target = getTarget(componentsTree, action.address);
  const targetIndex = action.address[action.address.length - 1];
  const oldElement = target[targetIndex];
  
  // Keep the children from the old element
  if (oldElement && oldElement.children) {
    action.element.children = oldElement.children;
  }
  
  target[targetIndex] = action.element;
  if (action.element.stale) {
    action.element.stale = undefined;
  }
}

export function applyUpdateAction(
  componentsTree: RouteLitComponent[],
  action: UpdateAction
) {
  const target = getTarget(componentsTree, action.address);
  const element = target[action.address[action.address.length - 1]];
  element.props = action.props;
  if (element.stale) {
    element.stale = undefined;
  }
}


export function applyFreshBoundaryAction(
  componentsTree: RouteLitComponent[],
  action: FreshBoundaryAction,
) {
  const target = getTarget(componentsTree, action.address);
  const staleStartsAt = action.address[action.address.length - 1] + 1;
  
  // Helper function to mark leaf nodes as stale in depth-first manner
  const markLeafNodesStale = (components: RouteLitComponent[]): number => {
    let staleCount = 0;
    for (const component of components) {
      if (!component.children || component.children.length === 0) {
        // This is a leaf node (no children), mark it as stale
        component.stale = true;
        staleCount++;
      } else {
        // This has children, traverse deeper
        const childrenStaleCount = markLeafNodesStale(component.children);
        // If all children are stale, mark the parent as stale
        if (childrenStaleCount === component.children.length) {
          component.stale = true;
        }
      }
    }
    return staleCount;
  };
  
  // Mark all leaf nodes as stale starting from the specified index
  const componentsToProcess = target.slice(staleStartsAt);
  markLeafNodesStale(componentsToProcess);
}

export function removeStaleComponents(componentsTree: RouteLitComponent[]) {
  for (let i = componentsTree.length - 1; i >= 0; i--) {
    const component = componentsTree[i];
    if (component.stale) {
      componentsTree.splice(i, 1);
    } else if (component.children?.length) {
      removeStaleComponents(component.children);
    }
  }
}

function handleNoChangeAction(
  componentsTree: RouteLitComponent[],
  action: NoChangeAction
) {
  const target = getTarget(componentsTree, action.address);
  const element = target[action.address[action.address.length - 1]];
  if (element.stale) {
    element.stale = undefined;
  }
}


function prependAddressToActionsArray(
  actionResponses: Action[],
  address: number[]
): Action[] {
  return actionResponses.map((action) => {
    return { ...action, address: address.concat(action.address) };
  });
}

export function prependAddressToActions(
  actionResponse: ActionsResponse,
  address: number[]
): ActionsResponse {
  return {
    ...actionResponse,
    actions: prependAddressToActionsArray(actionResponse.actions, address),
  };
}

export function applyActions(
  componentsTree: RouteLitComponent[],
  actions: Action[]
) {
  actions.forEach((action) => {
    switch (action.type) {
      case "add":
        applyAddAction(componentsTree, action as AddAction);
        break;
      case "remove":
        applyRemoveAction(componentsTree, action as RemoveAction);
        break;
      case "set":
        applySetAction(componentsTree, action as SetAction);
        break;
      case "update":
        applyUpdateAction(componentsTree, action as UpdateAction);
        break;
      case "fresh_boundary":
        applyFreshBoundaryAction(componentsTree, action as FreshBoundaryAction);
        break;
      case "last":
        removeStaleComponents(componentsTree);
        break;
      case "no_change":
        handleNoChangeAction(componentsTree, action as NoChangeAction);
        break;
    }
  });
}
