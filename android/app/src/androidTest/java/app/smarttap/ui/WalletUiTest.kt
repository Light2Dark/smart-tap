package app.smarttap.ui

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import app.smarttap.CardWrite
import app.smarttap.CardsUiState
import app.smarttap.HomePane
import app.smarttap.HomeUiState
import app.smarttap.PendingWrite
import app.smarttap.data.TapCard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class WalletUiTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun tappingACardOpensItAndEditStaysSeparate() {
        var opened: Long? = null
        var edited: Long? = null
        compose.setContent {
            HomeScreen(
                state = sampleList(),
                onRefresh = {},
                onOpenCard = { opened = it },
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = { edited = it },
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = {},
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("NFC card").assertIsDisplayed()
        compose.onNodeWithText("Another phone taps this card to open your link.").assertIsDisplayed()
        compose.onNodeWithContentDescription("Edit").performClick()
        assertEquals(6L, edited)
        assertNull(opened)
        compose.onNodeWithText("GitHub").performClick()
        assertEquals(6L, opened)
    }

    @Test
    fun openCardHasNoEditor() {
        compose.setContent {
            HomeScreen(
                state = sampleList().copy(openCardId = 6),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = {},
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("NFC card").assertIsDisplayed()
        compose.onNodeWithText("GitHub").assertIsDisplayed()
        compose.onAllNodesWithText("Destination").assertCountEquals(0)
        compose.onAllNodesWithText("Delete this card").assertCountEquals(0)
    }

    @Test
    fun addFormSavesTheDraft() {
        var saved: Pair<String, String>? = null
        compose.setContent {
            HomeScreen(
                state = sampleList().copy(pane = HomePane.Add),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { title, destination -> saved = title to destination },
                onTrashCard = {},
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        val fields = compose.onAllNodes(hasSetTextAction())
        compose.onNodeWithText("Save").assertIsNotEnabled()
        compose.onAllNodesWithText("Unsaved changes").assertCountEquals(0)
        fields[0].performTextReplacement("Calendar")
        fields[1].performTextReplacement("https://calendar.google.com")
        compose.onNodeWithText("Unsaved changes").assertIsDisplayed()
        compose.onNodeWithText("Save").assertIsEnabled()
        compose.onNodeWithText("Save").performClick()
        assertEquals("Calendar" to "https://calendar.google.com", saved)
    }

    @Test
    fun trashRestoresACard() {
        var restored: Long? = null
        compose.setContent {
            HomeScreen(
                state =
                    sampleList().copy(
                        pane = HomePane.Trash,
                        trashed = listOf(sampleCard().copy(id = 9, title = "Old")),
                    ),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = {},
                onRestoreCard = { restored = it },
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("Old").assertIsDisplayed()
        compose.onNodeWithText("Restore").performClick()
        assertEquals(9L, restored)
    }

    @Test
    fun editScreenCanTrashTheCard() {
        var trashed = false
        compose.setContent {
            HomeScreen(
                state = sampleList().copy(pane = HomePane.Edit, editingCardId = 6),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = { trashed = true },
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("Delete this card").performClick()
        assertEquals(true, trashed)
    }

    @Test
    fun editSaveStaysOffUntilTheDestinationChanges() {
        compose.setContent {
            HomeScreen(
                state = sampleList().copy(pane = HomePane.Edit, editingCardId = 6),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = {},
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("Save").assertIsNotEnabled()
        compose.onAllNodesWithText("Unsaved changes").assertCountEquals(0)
        compose.onNode(hasSetTextAction()).performTextReplacement("https://example.com")
        compose.onNodeWithText("Unsaved changes").assertIsDisplayed()
        compose.onNodeWithText("Save").assertIsEnabled()
        compose
            .onNode(hasSetTextAction())
            .performTextReplacement("https://github.com/Light2Dark")
        compose.onNodeWithText("Save").assertIsNotEnabled()
        compose.onAllNodesWithText("Unsaved changes").assertCountEquals(0)
    }

    @Test
    fun saveShowsALoadingLabel() {
        compose.setContent {
            HomeScreen(
                state =
                    sampleList().copy(
                        pane = HomePane.Edit,
                        editingCardId = 6,
                        pending = PendingWrite(CardWrite.Save, 6),
                    ),
                onRefresh = {},
                onOpenCard = {},
                onCloseCard = {},
                onShowAdd = {},
                onShowEdit = {},
                onShowList = {},
                onShowTrash = {},
                onCreateCard = { _, _ -> },
                onTrashCard = {},
                onRestoreCard = {},
                onSaveDestination = { _, _ -> },
            )
        }

        compose.onNodeWithText("Saving").assertIsDisplayed()
        compose.onNodeWithText("Delete this card").assertIsNotEnabled()
    }
}

private fun sampleCard() =
    TapCard(
        id = 6,
        title = "GitHub",
        destinationUrl = "https://github.com/Light2Dark",
        publicId = "400c6b7b4660b7a09dcb8aae",
    )

private fun sampleList() =
    HomeUiState.SignedIn(
        cards = CardsUiState.Ready(listOf(sampleCard())),
    )
