# Reusable delivery workflow

## Control flow

1. **Discover:** establish repository, product, environment, control-plane, integration, and evidence baselines.
2. **Understand:** map the request to approved outcomes, requirements, decisions, constraints, and acceptance criteria.
3. **Analyse:** assess dependencies, risks, affected contracts, and current implementation quality.
4. **Consult:** engage persistent roles and the smallest risk-selected specialist set.
5. **Decide:** make bounded reversible decisions; route human-owned decisions through the durable decision protocol.
6. **Plan:** order contract-first work by dependency; define ownership and independent assurance.
7. **Implement:** build the smallest coherent increment and developer-owned unit evidence.
8. **Test:** independently verify acceptance criteria and affected regression/risk paths.
9. **Document:** update contracts, traceability, decisions, status, operations, and evidence.
10. **Handoff:** report what changed, what passed, residual risk, external action, and next governed work.

## Work hierarchy and completion

Goals decompose into features, stories, tasks, defects, decisions, and release records. Closing a story does not complete its parent feature/goal while mapped success criteria remain unverified or undispositioned. Failed criteria create durable defects routed to the owning component. Fixes require independent retest and regression evidence.

## Parallelism

Parallel execution is dependency-aware. Shared interfaces are agreed first. Each worker receives explicit inputs, outputs, paths, acceptance criteria, and stop conditions. Conflicting changes to the same contract or path are serialized. Integrators reconcile evidence and interfaces; they do not accept “tests pass” without inspectable results.
