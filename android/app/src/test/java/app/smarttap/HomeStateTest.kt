package app.smarttap

import android.content.pm.ActivityInfo
import app.smarttap.data.TapCard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeStateTest {
    @Test
    fun openCardUsesLandscapeAndTheListStaysPortrait() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE, walletOrientation(cardOpen = true))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, walletOrientation(cardOpen = false))
    }

    @Test
    fun hasCardOnlyMatchesALoadedCard() {
        val card = TapCard(id = 6, title = "GitHub", destinationUrl = "https://github.com", publicId = "abc")
        val ready = HomeUiState.SignedIn(CardsUiState.Ready(listOf(card)))
        assertTrue(ready.hasCard(6))
        assertFalse(ready.hasCard(7))
        assertFalse(HomeUiState.SignedIn(CardsUiState.Loading).hasCard(6))
    }
}
