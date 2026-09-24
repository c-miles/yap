import { initialStepper, stepQuality, StepperState } from "./qualityStepper";

const run = (state: StepperState, samples: string[][]) =>
  samples.reduce((current, reasons) => stepQuality(current, reasons), state);

test("steps down after two cpu-bound samples, not one", () => {
  expect(run(initialStepper(0), [["cpu"]]).stepDown).toBe(0);
  expect(run(initialStepper(0), [["cpu"], ["cpu"]]).stepDown).toBe(1);
});

test("half the senders being cpu-bound counts, a minority doesn't", () => {
  expect(run(initialStepper(0), [["cpu", "none"], ["cpu", "none"]]).stepDown).toBe(1);
  expect(run(initialStepper(0), [["cpu", "none", "none"], ["cpu", "none", "none"]]).stepDown).toBe(0);
});

test("never steps down more than twice", () => {
  expect(run(initialStepper(0), Array(12).fill(["cpu"])).stepDown).toBe(2);
});

test("steps back up after four clear samples, not three", () => {
  const down = run(initialStepper(0), [["cpu"], ["cpu"]]);
  expect(run(down, Array(3).fill(["none"])).stepDown).toBe(1);
  expect(run(down, Array(4).fill(["bandwidth"])).stepDown).toBe(0);
});

test("a phone never steps up past its floor", () => {
  expect(run(initialStepper(1), Array(12).fill(["none"])).stepDown).toBe(1);
});

test("holds steady when no sender reports a reason (Safari, Firefox)", () => {
  const down = run(initialStepper(0), [["cpu"], ["cpu"]]);
  expect(run(down, Array(12).fill([])).stepDown).toBe(1);
});

test("waits twice as long before retrying a step-up that didn't stick", () => {
  const cpu = [["cpu"], ["cpu"]];
  const retried = run(initialStepper(0), [...cpu, ...Array(4).fill(["none"]), ...cpu]);
  expect(retried.stepDown).toBe(1);

  expect(run(retried, Array(4).fill(["none"])).stepDown).toBe(1);
  expect(run(retried, Array(8).fill(["none"])).stepDown).toBe(0);
});

test("the back-off stops growing, so a recovered machine still climbs back", () => {
  const cpu = [["cpu"], ["cpu"]];
  let state = initialStepper(0);
  for (let i = 0; i < 10; i++) {
    state = run(state, [...cpu, ...Array(64).fill(["none"])]);
  }
  state = run(state, cpu);
  expect(run(state, Array(32).fill(["none"])).stepDown).toBe(0);
});
