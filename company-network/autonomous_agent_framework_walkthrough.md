# Autonomous Agent Framework Walkthrough

This document provides a detailed walkthrough of the newly implemented Autonomous Agent Framework for the **Software Company Network**. The architecture emphasizes modularity, separation of concerns, and robust reasoning patterns for AI agents.

## 1. Directory Structure & Core Components

The framework is located under `company-network/backend/agents/`. It is split into **Core Engines** and **Agent Definitions**.

### Core Engines (`agents/core/`)
These engines power the cognitive and execution abilities of the agents.

- **`llm_provider.py`**: Contains `LLMProvider` and `MockLLMProvider`. This abstraction ensures the framework is provider-agnostic. Currently, it uses mocked responses for the PoC, but it provides explicit interfaces (`generate_response`, `analyze_json`) to easily plug in OpenAI, Anthropic, or any other LLM SDK in the future.
- **`memory_manager.py`**: Implements four distinct types of memory:
  - **Working Memory**: For short-lived execution context.
  - **Short-Term Memory**: For ongoing conversation and task contexts.
  - **Long-Term Memory**: For semantic retrieval of past projects and patterns.
  - **Decision Memory**: Logs the reasoning and confidence of agent actions for auditability.
  *(Currently backed by `InMemoryStore`, designed to integrate with PostgreSQL/pgvector).*
- **`planning_engine.py`**: Takes a high-level goal (e.g., "Generate a proposal") and utilizes the LLM to break it down into sequential, actionable tasks assigned to specialized agents.
- **`reasoning_engine.py`**: Implements an "Observe -> Analyze -> Evaluate -> Execute" loop. For a given task, the reasoning engine determines the next best action, whether to invoke a tool, or formulate a final decision, accompanied by a confidence score.
- **`tool_executor.py`**: A registry that allows agents to register custom capabilities (e.g., calculating costs, searching databases) that the reasoning engine can invoke dynamically.
- **`a2a_communicator.py`**: Handles the formatting of structured JSON messages required by the A2A Gateway for cross-network and inter-agent communication.
- **`agent_runtime.py`**: The central orchestrator. It manages agent lifecycles, registers agents, assigns goals, and handles top-level execution errors.

## 2. Agent Definitions

Each specialist agent inherits from the `BaseAgent` (in `agents/base_agent.py`), which wires up the core engines described above.

- **`ProjectManagerAgent`**: Acts as the orchestrator. It registers tools like `delegate_task` and `generate_proposal`. Its primary loop involves receiving a client goal, planning it, and delegating sub-tasks to specialist agents.
- **`BusinessAnalystAgent`**: Focuses on requirement extraction. Registers the `extract_user_stories` tool and stores parsed requirements in long-term memory.
- **`TechnicalAgent`**: The system architect. It registers `search_architecture_patterns` to retrieve similar past solutions from memory.
- **`CostAgent`**: Uses the `calculate_resource_cost` tool to handle budget and timeline metrics.
- **`TimelineAgent`**: Responsible for sprint planning and milestone definitions.
- **`RiskAgent`**: Registers `identify_dependency_risks` to scan architectures for potential pitfalls.

## 3. Execution Lifecycle Example

When the `AgentRuntime` assigns a goal to the Project Manager Agent, the following lifecycle occurs:

1. **Plan**: The PM Agent invokes its `PlanningEngine` to break the client requirement into tasks (e.g., "Analyze Requirements", "Design Architecture").
2. **Reason**: The PM Agent iterates over the tasks, invoking the `ReasoningEngine` to observe the current context and decide the best action (e.g., delegating a task).
3. **Execute**: Based on the reasoned decisions, the PM Agent utilizes its tools (like `delegate_task`) and the `A2ACommunicator` to route instructions to the BA and Technical agents.
4. **Memory Update**: Throughout this process, every decision is logged to the `decision_memory` with a confidence score, ensuring the process is traceable and auditable.

## Next Steps for Production
- Replace `MockLLMProvider` with a real implementation (e.g., `OpenAILLMProvider`).
- Replace `InMemoryStore` with a real database connector for long-term and semantic memory.
- Connect `A2ACommunicator` to the actual HTTP/WebSocket endpoints of the A2A Gateway.
