# Tiny Stack VM

A dependency-free Node 22 interpreter for make.fun's tiny stack ISA. It reads each `program.bin` and `input.bin` under `/input/<id>/` and writes the program's exact stdout bytes and exit code under `/output/<id>/`.

It uses bounded typed-array stacks and memory; handles 32-bit wrapping, signed/unsigned math, branches, calls, byte I/O and traps; and preserves output already written when a program traps. The sorted batch runner has no external state, making repeated executions deterministic.

To reproduce locally from the competition kit:

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/this/repository --driver process
```

The implementation matches all 40 published practice instances exactly. The final set is drawn after entries close, so its score is unknown in advance.
