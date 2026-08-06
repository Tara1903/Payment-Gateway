# StarPay Companion App Architecture

Welcome to the architectural documentation for the StarPay Companion App. This document outlines the fundamental design principles and structure of the application.

## Clean Architecture

This project strictly follows Clean Architecture principles to separate concerns, improve testability, and decouple the UI from the business logic and data sources.

The architecture is divided into three primary layers:
1.  **Presentation Layer**: UI components, ViewModels, and UI state.
2.  **Domain Layer**: Use cases, domain models, and repository interfaces. This is the core of the application and depends on nothing but itself.
3.  **Data Layer**: Repository implementations, API clients, local databases, and DTOs (Data Transfer Objects).

## MVI (Model-View-Intent) Flow

The Presentation layer utilizes the MVI architectural pattern for predictable and reactive UI state management.

-   **Model (State)**: Represents the single source of truth for the UI at any given moment (`UiState`). This state is strictly immutable.
-   **View**: Jetpack Compose functions that observe the `UiState` and render the UI accordingly.
-   **Intent (Event)**: Actions initiated by the user or system (e.g., button clicks, lifecycle events). These are handled by the ViewModel as `UiEvent`.

### Data Flow
1.  **User Action**: The View captures user interaction and sends a `UiEvent` to the ViewModel.
2.  **Processing**: The ViewModel receives the `UiEvent`, executes necessary domain logic (via Use Cases), and updates the `UiState`.
3.  **Render**: The ViewModel exposes the new `UiState` as a `StateFlow`. The View observes this and automatically re-renders with the latest data.

## Navigation Events

Navigation is handled via one-time events to avoid anti-patterns like consuming navigation state manually or re-triggering navigation on configuration changes.
We use a `SharedFlow` or a custom `Event` wrapper in ViewModels to emit `NavigationEvent` objects, which are then collected in the UI layer (typically a Compose `LaunchedEffect`) to trigger Jetpack Navigation commands.

## Module Isolation Rules

To enforce boundaries and build scalability, the codebase adheres to strict module isolation:

-   **Feature modules** (`feature:home`, `feature:payment`) **MUST** depend on `domain` and `core`. They **MUST NOT** depend on `data` or other `feature` modules directly (unless using a shared navigation artifact).
-   **Domain module** (`domain`) is pure Kotlin. It **MUST NOT** depend on Android framework classes, `data`, or `feature` modules.
-   **Data module** (`data`) depends on `domain` to implement its repository interfaces.
-   **App module** (`app`) is the composer. It depends on all modules to assemble the dependency injection graph (Hilt) and wire up the application.
