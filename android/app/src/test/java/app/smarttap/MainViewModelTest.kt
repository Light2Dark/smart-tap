package app.smarttap

import app.smarttap.data.CardsClient
import app.smarttap.data.CardsResult
import app.smarttap.data.TapCard
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

private val github = TapCard(id = 1, title = "GitHub", destinationUrl = "https://github.com", publicId = "a1")
private val calendar =
    TapCard(id = 2, title = "Calendar", destinationUrl = "https://calendar.google.com", publicId = "b2")
private val notes = TapCard(id = 3, title = "Notes", destinationUrl = "https://notes.example.com", publicId = "c3")

private class FakeCardsClient : CardsClient {
    var active: CardsResult = CardsResult.Ready(listOf(github, calendar))
    var trashed: CardsResult = CardsResult.Ready(listOf(notes))
    var writeError: String? = null
    var gate: CompletableDeferred<Unit>? = null
    var listCalls = 0
    val writes = mutableListOf<String>()

    override suspend fun list(trashed: Boolean): CardsResult {
        listCalls++
        gate?.await()
        return if (trashed) this.trashed else active
    }

    override suspend fun create(
        title: String,
        destinationUrl: String,
    ): String? = write("create $title $destinationUrl")

    override suspend fun updateDestination(
        id: Long,
        destinationUrl: String,
    ): String? = write("update $id $destinationUrl")

    override suspend fun setDeleted(
        id: Long,
        trash: Boolean,
    ): String? = write(if (trash) "trash $id" else "restore $id")

    private suspend fun write(call: String): String? {
        writes += call
        gate?.await()
        return writeError
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val client = FakeCardsClient()
    private val session = MutableStateFlow<Session>(Session.Starting)
    private var blocked = false

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun TestScope.signedIn(): MainViewModel {
        val viewModel = MainViewModel(client, session) { blocked }
        session.value = Session.SignedIn("user_1")
        advanceUntilIdle()
        return viewModel
    }

    private fun MainViewModel.signedInState() = uiState.value as HomeUiState.SignedIn

    private fun MainViewModel.cards() = (signedInState().cards as CardsUiState.Ready).cards

    @Test
    fun followsTheSession() =
        runTest(dispatcher) {
            val viewModel = MainViewModel(client, session)
            advanceUntilIdle()
            assertEquals(HomeUiState.Loading, viewModel.uiState.value)

            session.value = Session.SignedOut
            advanceUntilIdle()
            assertEquals(HomeUiState.SignedOut, viewModel.uiState.value)

            session.value = Session.SignedIn("user_1")
            advanceUntilIdle()
            assertEquals(listOf(github, calendar), viewModel.cards())
            assertEquals(listOf(notes), viewModel.signedInState().trashed)
        }

    @Test
    fun theSameUserDoesNotReload() =
        runTest(dispatcher) {
            signedIn()
            val calls = client.listCalls
            session.value = Session.SignedIn("user_1")
            advanceUntilIdle()
            assertEquals(calls, client.listCalls)
        }

    @Test
    fun aFailedTrashListStillShowsTheCards() =
        runTest(dispatcher) {
            client.trashed = CardsResult.Failed("Trash is down.")
            val viewModel = signedIn()
            assertEquals(listOf(github, calendar), viewModel.cards())
            assertEquals(emptyList<TapCard>(), viewModel.signedInState().trashed)
        }

    @Test
    fun aFailedRefreshKeepsTheListAndSaysWhy() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            client.active = CardsResult.Failed("No connection.")
            viewModel.refresh()
            assertTrue(viewModel.signedInState().refreshing)
            advanceUntilIdle()

            val state = viewModel.signedInState()
            assertFalse(state.refreshing)
            assertEquals("Couldn't refresh. No connection.", state.refreshError)
            assertEquals(listOf(github, calendar), viewModel.cards())
        }

    @Test
    fun aSuccessfulRefreshClearsTheEarlierError() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            client.active = CardsResult.Failed("No connection.")
            viewModel.refresh()
            advanceUntilIdle()

            client.active = CardsResult.Ready(listOf(github))
            viewModel.refresh()
            advanceUntilIdle()
            assertNull(viewModel.signedInState().refreshError)
            assertEquals(listOf(github), viewModel.cards())
        }

    @Test
    fun refreshRetriesAFailedFirstLoad() =
        runTest(dispatcher) {
            client.active = CardsResult.Failed("No connection.")
            val viewModel = signedIn()
            assertEquals(CardsUiState.Failed("No connection."), viewModel.signedInState().cards)

            client.active = CardsResult.Ready(listOf(github))
            viewModel.refresh()
            assertEquals(CardsUiState.Loading, viewModel.signedInState().cards)
            advanceUntilIdle()
            assertEquals(listOf(github), viewModel.cards())
        }

    @Test
    fun refreshWaitsForAPendingWrite() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            client.gate = CompletableDeferred()
            viewModel.trashCard(1)
            advanceUntilIdle()
            val calls = client.listCalls

            viewModel.refresh()
            assertFalse(viewModel.signedInState().refreshing)
            assertEquals(calls, client.listCalls)
            client.gate?.complete(Unit)
            advanceUntilIdle()
        }

    @Test
    fun anInvalidCardNeverReachesTheServer() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            viewModel.createCard("Notes", "http://example.com")
            assertEquals("The destination has to be an https link.", viewModel.signedInState().actionError)
            assertEquals(emptyList<String>(), client.writes)
        }

    @Test
    fun aSavedCardReloadsTheListAndReturnsToIt() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            viewModel.showAdd()
            client.gate = CompletableDeferred()
            viewModel.createCard("  Notes ", " https://notes.example.com ")
            assertEquals(PendingWrite(CardWrite.Save), viewModel.signedInState().pending)

            client.active = CardsResult.Ready(listOf(github, calendar, notes))
            client.gate?.complete(Unit)
            advanceUntilIdle()

            val state = viewModel.signedInState()
            assertEquals(listOf("create   Notes  https://notes.example.com"), client.writes)
            assertNull(state.pending)
            assertEquals(HomePane.List, state.pane)
            assertEquals(listOf(github, calendar, notes), viewModel.cards())
        }

    @Test
    fun aFailedWriteShowsTheServerMessage() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            client.writeError = "That card is gone."
            viewModel.saveDestination(1, "https://example.com")
            advanceUntilIdle()
            val state = viewModel.signedInState()
            assertNull(state.pending)
            assertEquals("That card is gone.", state.actionError)
        }

    @Test
    fun aBlankServerErrorFallsBackToAGeneralMessage() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            client.writeError = ""
            viewModel.restoreCard(3)
            advanceUntilIdle()
            assertEquals("Could not restore that card.", viewModel.signedInState().actionError)
        }

    @Test
    fun onlyLoadedCardsCanBeOpenedOrEdited() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            viewModel.openCard(99)
            assertNull(viewModel.signedInState().openCardId)
            viewModel.showEdit(99)
            assertEquals(HomePane.List, viewModel.signedInState().pane)

            viewModel.showEdit(2)
            assertEquals(HomePane.Edit, viewModel.signedInState().pane)
            assertEquals(2L, viewModel.signedInState().editingCardId)
            viewModel.openCard(1)
            assertEquals(1L, viewModel.signedInState().openCardId)
        }

    @Test
    fun anOpenCardClosesWhenItLeavesTheList() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            viewModel.openCard(1)
            client.active = CardsResult.Ready(listOf(calendar))
            viewModel.refresh()
            advanceUntilIdle()
            assertNull(viewModel.signedInState().openCardId)
        }

    @Test
    fun comingBackToTheAppRefreshesOnlyAfterLeaving() =
        runTest(dispatcher) {
            val viewModel = signedIn()
            val calls = client.listCalls
            viewModel.onAppShown()
            advanceUntilIdle()
            assertEquals(calls, client.listCalls)

            viewModel.onAppHidden()
            viewModel.onAppShown()
            advanceUntilIdle()
            assertEquals(calls + 2, client.listCalls)
        }

    @Test
    fun aBlockedLocalNetworkExplainsInsteadOfCalling() =
        runTest(dispatcher) {
            blocked = true
            val viewModel = signedIn()
            assertEquals(CardsUiState.Failed(LOCAL_NETWORK_NEEDED), viewModel.signedInState().cards)
            assertEquals(0, client.listCalls)
        }
}
