export declare type TaskPriority =
  /** Tasks that stop users from interacting with the page. This includes rendering the page to the point where it can be used, or responding to user input. */
  | "user-blocking"
  /**
   * Tasks that are visible to the user but not necessarily blocking user actions. This might include rendering non-essential parts of the page, such as non-essential images or animations.
   * This is the default priority.
   */
  | "user-visible"
  /** Tasks that are not time-critical. This might include log processing or initializing third party libraries that aren't required for rendering. */
  | "background";


export interface TaskSignal extends AbortSignal {
    readonly priority: TaskPriority;
}

export interface PostTaskOptions {
  /**
   * The immutable priority of the task. One of: "user-blocking", "user-visible", "background". If set, this priority is used for the lifetime of the task and priority set on the signal is ignored.
   */
  priority?: TaskPriority;
  /**
   * A TaskSignal or AbortSignal that can be used to abort the task (from its associated controller).
   * If the options.priority parameter is set then the task priority cannot be changed, and any priority on the signal is ignored. Otherwise, if the signal is a TaskSignal its priority is used to set the initial task priority, and the signal's controller may later use it to change the task priority.
   */
  signal?: AbortSignal | TaskSignal;
  /**
   * The minimum amount of time after which the task will be added to the scheduler queue, in whole milliseconds. The actual delay may be higher than specified, but will not be less. The default delay is 0.
   */
  delay?: number;
}

export declare class Scheduler {
  postTask<ReturnValue>(
    callback: () => ReturnValue | Promise<ReturnValue>,
    options?: PostTaskOptions
  ): Promise<ReturnValue>;
}

export declare class TaskController extends AbortController {
  readonly signal: TaskSignal;
  setPriority: (priority: TaskPriority) => void;
}
