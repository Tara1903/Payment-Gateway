# Code Style & Tooling

The StarPay Companion App uses strict tooling to enforce a consistent and safe codebase.

## Jetpack Compose Rules

To ensure high performance and prevent unnecessary recompositions, strictly adhere to Compose stability rules:

1.  **Immutability**: Data classes used in Compose State should be immutable (`val` properties only).
2.  **`@Immutable` and `@Stable`**: Annotate UI models appropriately.
    -   Use `@Immutable` when all public properties of the class are deeply immutable.
    -   Use `@Stable` if the state might change, but Compose will be notified of the changes, and the public properties will not change their identity.
3.  **Collections**: Avoid using standard `List`, `Set`, or `Map` as state types in Compose because they are unstable interfaces. Use Kotlinx Immutable collections (e.g., `ImmutableList`) or wrap standard collections in an `@Immutable` wrapper class.
4.  **State Hoisting**: Hoist state to at least the ViewModel or the nearest common parent composable. Composables should be as stateless as possible.
5.  **`remember`**: Use `remember` carefully. Do not use it to cache data that should be managed by the ViewModel. Use it for UI-specific transient state (e.g., scroll position, animation states).

## Linting and Formatting

We use `ktlint` and `detekt` to enforce code style and identify code smells. These plugins are integrated into the Gradle build.

### ktlint
Ktlint enforces standard Kotlin formatting conventions (indentation, spacing, import ordering).
-   **Run Check**: `./gradlew ktlintCheck`
-   **Run Format**: `./gradlew ktlintFormat`
-   Code failing ktlint checks will break the CI build.

### Detekt
Detekt is a static code analysis tool that flags complexity, code smells, and potential bugs.
-   **Run Detekt**: `./gradlew detekt`
-   Configuration is maintained in `config/detekt/detekt.yml`.
-   Pay close attention to rules regarding complex methods, large classes, and deep nesting. Suppress warnings only when absolutely necessary, using `@Suppress("RuleName")` with a comment explaining why.

## Strict TypeScript/Kotlin Rule
While the overarching project might utilize TypeScript, the Android Application is strictly **Kotlin**. No Java files are permitted for new code. All types must be strictly defined (no ambiguous generics without boundaries).
