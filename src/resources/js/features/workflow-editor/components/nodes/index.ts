import ScreenNode from './ScreenNode';
import NotificationNode from './NotificationNode';
import ConditionNode from './ConditionNode';
import ActionNode from './ActionNode';
import TimerNode from './TimerNode';
import SubprocessNode from './SubprocessNode';
import NoteNode from './NoteNode';
import StartNode from './StartNode';
import EndNode from './EndNode';

export const nodeTypes = {
    screen: ScreenNode,
    notification: NotificationNode,
    condition: ConditionNode,
    if: ConditionNode,
    action: ActionNode,
    timer: TimerNode,
    subprocess: SubprocessNode,
    note: NoteNode,
    start: StartNode,
    end: EndNode,
};
