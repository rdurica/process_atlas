import ScreenNode from './ScreenNode';
import NotificationNode from './NotificationNode';
import ConditionNode from './ConditionNode';
import ActionNode from './ActionNode';
import StartNode from './StartNode';
import EndNode from './EndNode';

export const nodeTypes = {
    screen: ScreenNode,
    notification: NotificationNode,
    condition: ConditionNode,
    if: ConditionNode,
    action: ActionNode,
    start: StartNode,
    end: EndNode,
};

export { default as ScreenNode } from './ScreenNode';
export { default as NotificationNode } from './NotificationNode';
export { default as ConditionNode } from './ConditionNode';
export { default as ActionNode } from './ActionNode';
export { default as StartNode } from './StartNode';
export { default as EndNode } from './EndNode';
