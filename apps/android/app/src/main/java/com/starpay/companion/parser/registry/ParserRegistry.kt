package com.starpay.companion.parser.registry

import com.starpay.companion.parser.GenericSmsParser
import javax.inject.Inject

class ParserRegistry @Inject constructor(
    private val genericSmsParser: GenericSmsParser
) {
    fun getParser(sender: String): BankParser {
        return genericSmsParser
    }
}
