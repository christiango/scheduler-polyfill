import {
  Scheduler,
  TaskController,
  TaskSignal,
  TaskPriorityChangeEvent,
} from '../src/index.js';

describe('Package exports', () => {
  it('exposes scheduler.yield()', async () => {
    const scheduler = new Scheduler();
    await scheduler.yield();
  });

  it('exposes TaskSignal and priority change events', () => {
    const controller = new TaskController();
    expect(controller.signal).to.be.instanceOf(TaskSignal);
    let event;
    controller.signal.onprioritychange = (e) => {
      event = e;
    };
    controller.setPriority('background');
    expect(event).to.be.instanceOf(TaskPriorityChangeEvent);
    expect(event.previousPriority).to.equal('user-visible');
  });
});
