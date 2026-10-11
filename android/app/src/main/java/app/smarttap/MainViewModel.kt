package app.smarttap

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import app.smarttap.data.CardsClient
import app.smarttap.data.CardsResult
import app.smarttap.data.HttpCardsClient
import app.smarttap.data.TapCard
import app.smarttap.data.cardDraftError
import app.smarttap.data.destinationError
import app.smarttap.data.httpsDestination
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

internal const val LOCAL_NETWORK_NEEDED = "Allow local network access so this phone can reach the card list."

class MainViewModel(
    private val cardsClient: CardsClient,
    session: Flow<Session>,
    private val localNetworkBlocked: () -> Boolean = { false },
) : ViewModel() {
    private val uiStateFlow = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState = uiStateFlow.asStateFlow()
    private var loadedUserId: String? = null
    private var hidden = false

    init {
        session
            .onEach { current ->
                when (current) {
                    Session.Starting -> {
                        uiStateFlow.value = HomeUiState.Loading
                    }

                    Session.SignedOut -> {
                        loadedUserId = null
                        uiStateFlow.value = HomeUiState.SignedOut
                    }

                    is Session.SignedIn -> {
                        if (loadedUserId != current.userId) {
                            loadedUserId = current.userId
                            uiStateFlow.value = HomeUiState.SignedIn(CardsUiState.Loading)
                            loadCards()
                        }
                    }
                }
            }.launchIn(viewModelScope)
    }

    fun onAppHidden() {
        hidden = true
    }

    fun onAppShown() {
        if (!hidden) {
            return
        }
        hidden = false
        if (!needsLocalNetworkConsent()) {
            refresh()
        }
    }

    fun refresh() {
        val current = uiStateFlow.value as? HomeUiState.SignedIn
        if (loadedUserId == null || current?.cards is CardsUiState.Loading) {
            return
        }
        if (current?.cards is CardsUiState.Ready && (current.refreshing || current.pending != null)) {
            return
        }
        uiStateFlow.value =
            if (current?.cards is CardsUiState.Ready) {
                current.copy(refreshing = true)
            } else {
                current?.copy(cards = CardsUiState.Loading) ?: HomeUiState.SignedIn(CardsUiState.Loading)
            }
        loadCards()
    }

    fun openCard(id: Long) {
        updateSignedIn { signedIn ->
            if (signedIn.hasCard(id)) {
                signedIn.copy(openCardId = id, editingCardId = null, actionError = null)
            } else {
                signedIn
            }
        }
    }

    fun closeCard() {
        updateSignedIn { it.copy(openCardId = null, actionError = null) }
    }

    fun showAdd() {
        updateSignedIn {
            it.copy(pane = HomePane.Add, openCardId = null, editingCardId = null, actionError = null)
        }
    }

    fun showEdit(id: Long) {
        updateSignedIn { signedIn ->
            if (signedIn.hasCard(id)) {
                signedIn.copy(pane = HomePane.Edit, editingCardId = id, openCardId = null, actionError = null)
            } else {
                signedIn
            }
        }
    }

    fun showList() {
        updateSignedIn { it.copy(pane = HomePane.List, editingCardId = null, actionError = null) }
    }

    fun showTrash() {
        updateSignedIn {
            it.copy(pane = HomePane.Trash, openCardId = null, editingCardId = null, actionError = null)
        }
    }

    fun createCard(
        title: String,
        destination: String,
    ) {
        val error = cardDraftError(title, destination)
        if (error != null) {
            updateSignedIn { it.copy(actionError = error) }
            return
        }
        mutate("Could not add that card.", PendingWrite(CardWrite.Save)) {
            cardsClient.create(title, httpsDestination(destination).orEmpty())
        }
    }

    fun saveDestination(
        id: Long,
        destination: String,
    ) {
        val error = destinationError(destination)
        if (error != null) {
            updateSignedIn { it.copy(actionError = error) }
            return
        }
        mutate("Could not update that destination.", PendingWrite(CardWrite.Save, id)) {
            cardsClient.updateDestination(id, httpsDestination(destination).orEmpty())
        }
    }

    fun trashCard(id: Long) {
        mutate("Could not delete that card.", PendingWrite(CardWrite.Delete, id)) {
            cardsClient.setDeleted(id, trash = true)
        }
    }

    fun restoreCard(id: Long) {
        mutate("Could not restore that card.", PendingWrite(CardWrite.Restore, id)) {
            cardsClient.setDeleted(id, trash = false)
        }
    }

    fun needsLocalNetworkConsent(): Boolean = localNetworkBlocked()

    private fun mutate(
        failure: String,
        pending: PendingWrite,
        action: suspend () -> String?,
    ) {
        val current = uiStateFlow.value as? HomeUiState.SignedIn ?: return
        if (current.pending != null) {
            return
        }
        if (needsLocalNetworkConsent()) {
            updateSignedIn {
                it.copy(actionError = LOCAL_NETWORK_NEEDED)
            }
            return
        }
        updateSignedIn { it.copy(pending = pending, actionError = null) }
        viewModelScope.launch {
            val error = action() ?: return@launch loadCards(afterMutation = true)
            updateSignedIn { it.copy(pending = null, actionError = error.ifBlank { failure }) }
        }
    }

    private fun loadCards(afterMutation: Boolean = false) {
        viewModelScope.launch {
            val loaded = fetchCards()
            val current = uiStateFlow.value as? HomeUiState.SignedIn
            val refreshFailed = current?.refreshing == true && loaded.active is CardsUiState.Failed
            if (refreshFailed && current.cards is CardsUiState.Ready) {
                uiStateFlow.value =
                    current.copy(
                        refreshing = false,
                        refreshError = "Couldn't refresh. ${loaded.active.message}",
                    )
                return@launch
            }
            val openCardId = current?.openCardId
            val stillOpen =
                openCardId != null &&
                    loaded.active is CardsUiState.Ready &&
                    loaded.active.cards.any { it.id == openCardId }
            uiStateFlow.value =
                HomeUiState.SignedIn(
                    cards = loaded.active,
                    trashed = loaded.trashed,
                    openCardId = openCardId.takeIf { stillOpen },
                    editingCardId = if (afterMutation) null else current?.editingCardId,
                    pane = if (afterMutation) HomePane.List else current?.pane ?: HomePane.List,
                    actionError = if (afterMutation) null else current?.actionError,
                    pending = if (afterMutation) null else current?.pending,
                )
        }
    }

    private suspend fun fetchCards(): LoadedCards {
        if (needsLocalNetworkConsent()) {
            return LoadedCards(
                CardsUiState.Failed(LOCAL_NETWORK_NEEDED),
                emptyList(),
            )
        }
        return coroutineScope {
            val active = async { cardsClient.list(trashed = false) }
            val trashed = async { cardsClient.list(trashed = true) }
            val activeResult = active.await()
            val trashedResult = trashed.await()
            if (activeResult is CardsResult.Failed) {
                return@coroutineScope LoadedCards(CardsUiState.Failed(activeResult.message), emptyList())
            }
            val cards = (activeResult as CardsResult.Ready).cards
            val trash =
                when (trashedResult) {
                    is CardsResult.Ready -> trashedResult.cards
                    is CardsResult.Failed -> emptyList()
                }
            LoadedCards(CardsUiState.Ready(cards), trash)
        }
    }

    private fun updateSignedIn(block: (HomeUiState.SignedIn) -> HomeUiState.SignedIn) {
        val current = uiStateFlow.value as? HomeUiState.SignedIn ?: return
        uiStateFlow.value = block(current)
    }

    companion object {
        val Factory =
            viewModelFactory {
                initializer {
                    val app = checkNotNull(this[APPLICATION_KEY])
                    MainViewModel(
                        cardsClient = HttpCardsClient(BuildConfig.API_BASE_URL, ::clerkToken),
                        session = clerkSession(),
                        localNetworkBlocked = { localNetworkBlocked(app) },
                    )
                }
            }
    }
}

private data class LoadedCards(
    val active: CardsUiState,
    val trashed: List<TapCard>,
)
