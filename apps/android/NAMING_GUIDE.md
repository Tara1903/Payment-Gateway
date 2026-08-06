# Naming Guide

To maintain a consistent and readable codebase across the StarPay Companion App, we enforce specific naming conventions based on the role and layer of a class.

## Data Layer

### `Dto` (Data Transfer Object)
Used strictly for network responses and requests. These map directly to JSON structures.
-   **Convention**: `[EntityName]Dto`
-   **Example**: `UserDto`, `TransactionResponseDto`

### `Entity`
Used strictly for local database tables (Room).
-   **Convention**: `[EntityName]Entity`
-   **Example**: `UserEntity`, `TransactionEntity`

## Domain Layer

### `Model` (Domain Model)
The pure business representation of an object. Stripped of all network or database specific annotations.
-   **Convention**: `[EntityName]`
-   **Example**: `User`, `Transaction`

### `UseCase`
Encapsulates a single piece of business logic. Must be a verb phrase.
-   **Convention**: `[Action][EntityName]UseCase`
-   **Example**: `LoginUserUseCase`, `GetTransactionHistoryUseCase`

### `Repository` (Interface)
Defines the contract for data access.
-   **Convention**: `[EntityName]Repository`
-   **Example**: `UserRepository`, `PaymentRepository`

## Presentation Layer

### `ViewModel`
Manages UI state for a specific screen or flow.
-   **Convention**: `[ScreenName]ViewModel`
-   **Example**: `HomeViewModel`, `PaymentViewModel`

### UI State and Events (MVI)
Defined typically within a Contract interface or as sealed classes.
-   **State**: `[ScreenName]UiState` (e.g., `PaymentUiState`)
-   **Event**: `[ScreenName]UiEvent` (e.g., `PaymentUiEvent.OnSubmitClicked`)
-   **Effect/Navigation**: `[ScreenName]UiEffect` (e.g., `PaymentUiEffect.NavigateToSuccess`)

## Data Mapping

### `Mapper`
Functions (often extensions) that convert data between layers.
-   **Convention**: `to[TargetType]()`
-   **Example**:
    ```kotlin
    fun UserDto.toDomain(): User
    fun User.toEntity(): UserEntity
    ```
