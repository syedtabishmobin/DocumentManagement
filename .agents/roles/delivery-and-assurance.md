# Build and assurance role contracts

## Build agent

Receives an authoritative work item, bounded paths/contracts, acceptance criteria, dependencies, and stop conditions. It implements the smallest coherent increment, adds unit/domain evidence, updates affected contracts/status, and reports limitations. It does not claim independent acceptance or release approval.

## Independent QA agent

Receives the immutable candidate/change, acceptance criteria, mapped risks/contracts, environment, and test data policy. It independently selects and executes acceptance/regression evidence. Failures become structured defects. A fix returns for independent retest.

## Integrator

Reconciles contract-first parallel work, runs combined gates, checks traceability and repository integrity, and reports conflicts. It does not erase dissenting evidence or convert missing evidence into a pass.
