# Tiny Stack VM

A dependency-free Node 22 interpreter for make.fun's tiny stack ISA. It reads each `program.bin` and `input.bin` under `/input/<id>/` and writes the program's exact stdout bytes and exit code under `/output/<id>/`.

The VM uses bounded typed-array stacks and memory, 32-bit wrapping arithmetic, signed and unsigned integer operations, relative branches, calls, byte input/output, and the ISA's trap codes. Each instruction validates its opcode, immediate and stack effect before applying instruction-specific traps; output written before a trap is preserved. The runner sorts instance IDs and has no external state, so repeated executions are deterministic.

The implementation follows the published ISA and is validated against the kit's practice set. To reproduce locally from the competition kit, run:

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/this/repository --driver process
```

Practice validation answered all 40 instances and matched the kit reference exactly. The final set is drawn after entries close, so its score is not known in advance.
