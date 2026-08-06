# Package Structure

The StarPay Companion App is organized by feature and architectural layer. The following defines the primary package mapping across the app.

## Overview

```text
com.starpay.companion
├── core        # Shared utilities, extensions, UI components
├── data        # Network, database, and repository implementations
├── di          # Hilt Dependency Injection modules
├── domain      # Business logic, models, and repository interfaces
├── feature     # Distinct user-facing features (UI and Presentation logic)
├── service     # Foreground/Background Android Services
└── worker      # WorkManager workers for scheduled tasks
```

## Detailed Breakdown

### `core`
Contains classes and utilities shared across the entire application.
-   `core.network`: Network utilities, interceptors, error handling.
-   `core.ui`: Shared Jetpack Compose components (buttons, text styles, theme).
-   `core.util`: Extension functions, date formatters, common helpers.

### `domain`
The pure Kotlin core of the app.
-   `domain.model`: Enterprise business models.
-   `domain.repository`: Interfaces for data access.
-   `domain.usecase`: Granular business rules and logic.

### `data`
Data retrieval and storage mechanisms.
-   `data.local`: Room databases, DataStore preferences, DAOs.
-   `data.remote`: Retrofit services, API models (DTOs).
-   `data.repository`: Concrete implementations of `domain.repository` interfaces.
-   `data.mapper`: Functions to convert between DTOs/Entities and Domain Models.

### `feature`
Each major screen or flow in the app has its own package under `feature`.
-   `feature.auth`: Login, registration, password reset.
-   `feature.home`: Dashboard and main user landing.
-   `feature.payment`: Transaction flows, UPI deep-linking.

Inside a feature package (e.g., `feature.payment`):
-   `PaymentScreen.kt`: The main Compose entry point.
-   `PaymentViewModel.kt`: The ViewModel managing MVI state.
-   `PaymentContract.kt`: Defines `State`, `Event`, and `Effect` (Navigation).

### `di`
Dependency Injection configurations.
-   `di.NetworkModule`: Provides Retrofit and OkHttp instances.
-   `di.DatabaseModule`: Provides Room and DataStore instances.
-   `di.RepositoryModule`: Binds repository interfaces to implementations.

### `service` & `worker`
-   `service`: Contains components like FirebaseMessagingService or persistent notification services.
-   `worker`: WorkManager classes for background sync, offline data upload, etc.
