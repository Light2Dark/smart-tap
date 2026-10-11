package app.smarttap.data

import org.junit.Assert.assertEquals
import org.junit.Test

class CardsJsonTest {
    @Test
    fun parsesTheCardList() {
        val cards =
            parseCardList(
                """
                {"cards":[{"id":6,"title":"GitHub","destinationUrl":"https://github.com/Light2Dark","publicId":"400c6b7b4660b7a09dcb8aae"}]}
                """.trimIndent(),
            )
        assertEquals(1, cards.size)
        assertEquals(6L, cards[0].id)
        assertEquals("GitHub", cards[0].title)
        assertEquals("https://github.com/Light2Dark", cards[0].destinationUrl)
        assertEquals(null, cards[0].imageUrl)
    }

    @Test
    fun parsesAnArtworkUrl() {
        val cards =
            parseCardList(
                """
                {"cards":[{"id":7,"title":"Marimo","destinationUrl":"https://marimo.io/","publicId":"53133c1ae6d9e99a0f99063c","imageUrl":"https://example.com/card.png"}]}
                """.trimIndent(),
            )
        assertEquals("https://example.com/card.png", cards[0].imageUrl)
        assertEquals(null, cards[0].backImageUrl)
    }

    @Test
    fun parsesABackImageUrl() {
        val cards =
            parseCardList(
                """
                {"cards":[{"id":7,"title":"Marimo","destinationUrl":"https://marimo.io/","publicId":"53133c1ae6d9e99a0f99063c","backImageUrl":"https://example.com/back.png"}]}
                """.trimIndent(),
            )
        assertEquals("https://example.com/back.png", cards[0].backImageUrl)
    }

    @Test
    fun emptyBodyIsAnEmptyList() {
        assertEquals(0, parseCardList("{}").size)
    }
}
