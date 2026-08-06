package com.starpay.companion.parser.registry

import com.starpay.companion.domain.model.ParseResult

interface BankParser {
    fun parse(sender: String, message: String, timestamp: Long): ParseResult
}
