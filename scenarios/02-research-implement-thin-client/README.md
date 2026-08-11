# Scenario 02 — Research + implement

## Intake (CLI)

> “Research the rates endpoint contract and implement a thin typed client with timeout.”

## Flow

1. Hermes writes brief (done criteria + boundaries)  
2. Claude Code implements `sample-target/src/rates-client.ts`  
3. Tests pass → Hermes marks `done`  
4. Audit log records brief → worker → done

## Note

In demo mode, the sim runner stages the worker result without calling live agents.
