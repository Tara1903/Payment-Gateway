package com.starpay.companion.core.base

import com.starpay.companion.core.fakes.FakeDispatcherProvider
import com.starpay.companion.core.rules.CoroutineTestRule
import org.junit.Rule

abstract class BaseViewModelTest {
    @get:Rule
    val coroutineTestRule = CoroutineTestRule()

    val dispatcherProvider = FakeDispatcherProvider(coroutineTestRule.testDispatcher)
}
