# Contributing to StarPay Companion

Welcome to the StarPay Companion App project! We appreciate your contributions. Please follow these guidelines to ensure a smooth development workflow.

## Branching Strategy

We follow a feature-branch workflow.

1.  **Main Branch**: `main` holds the current production-ready code.
2.  **Development Branch**: `develop` is the integration branch for upcoming releases.
3.  **Feature Branches**: Branch off from `develop` using the format `feature/ticket-number-description`.
    -   *Example*: `feature/SP-123-add-upi-deep-link`
4.  **Bugfix Branches**: Branch off from `develop` using the format `bugfix/ticket-number-description`.
5.  **Hotfix Branches**: Branch off from `main` using the format `hotfix/ticket-number-description`.

## Pull Request Guidelines

Before submitting a Pull Request (PR), ensure you meet the following criteria:

1.  **Target Branch**: PRs for new features/bugs should target `develop`. Hotfixes target `main` (and subsequently `develop`).
2.  **Passing Checks**:
    -   Your code must compile cleanly.
    -   All unit and integration tests must pass (`./gradlew test`).
    -   Ktlint formatting must be applied (`./gradlew ktlintCheck`).
    -   Detekt analysis must pass without severe issues (`./gradlew detekt`).
3.  **PR Description**:
    -   Clearly describe the problem being solved and the approach taken.
    -   Link to relevant Jira/Issue tracker tickets.
    -   Include screenshots or videos for any UI changes.
4.  **Code Review**:
    -   At least one approval from a core team member is required before merging.
    -   Address all review comments constructively.

## Commit Messages

Write clear, concise commit messages. We prefer the Conventional Commits format:

-   `feat: Add UPI payment screen`
-   `fix: Resolve crash on transaction history`
-   `refactor: Extract NetworkModule to di package`
-   `docs: Update architecture documentation`

## Testing

New features **must** be accompanied by relevant unit tests (for ViewModels, UseCases, Mappers) using JUnit and Mockito. UI components should have Compose Previews and basic UI tests where applicable.
