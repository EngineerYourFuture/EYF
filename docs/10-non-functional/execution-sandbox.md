# Execution Sandbox Hardening

**Section 14 of PRD — Non-Negotiable.**

All code execution must run inside an isolated Docker container with the following constraints enforced:

---

## Hardening Requirements

| Constraint | Configuration |
|------------|--------------|
| Network | `--network none` — no outbound/inbound network |
| Filesystem | Read-only root FS + `tmpfs` for writable scratch dirs only |
| Host Mounts | No host FS mounts except controlled scratch |
| Memory | Strict memory limit (e.g., 256MB) |
| CPU | Strict CPU quota |
| PIDs | PID limit to prevent fork bombs |
| Time | Execution time limit (enforced at container level) |
| Syscalls | `seccomp` profile applied |
| MAC | AppArmor or SELinux profile applied |
| Privileges | `--no-new-privileges` flag set |
| Runtime | Language runtime allowlist — only approved images |
| Output | Normalized output only — no internal stack traces leaked |

---

## Goal

Prevent:
- Network exfiltration
- Host filesystem access
- Resource exhaustion attacks (fork bombs, memory bombs)
- Privilege escalation
- Sandbox escape

---

## Related

- [DSA Module](../05-functional-requirements/dsa-module.md)
