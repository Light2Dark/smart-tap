package app.smarttap

import app.smarttap.data.TapCard

enum class HomePane {
    List,
    Add,
    Edit,
    Trash,
}

enum class CardWrite {
    Save,
    Delete,
    Restore,
}

data class PendingWrite(
    val kind: CardWrite,
    val cardId: Long? = null,
)

sealed interface HomeUiState {
    data object Loading : HomeUiState

    data object SignedOut : HomeUiState

    data class SignedIn(
        val cards: CardsUiState,
        val trashed: List<TapCard> = emptyList(),
        val openCardId: Long? = null,
        val editingCardId: Long? = null,
        val pane: HomePane = HomePane.List,
        val actionError: String? = null,
        val pending: PendingWrite? = null,
        val refreshing: Boolean = false,
        val refreshError: String? = null,
    ) : HomeUiState {
        fun hasCard(id: Long) = (cards as? CardsUiState.Ready)?.cards?.any { it.id == id } == true
    }
}

sealed interface CardsUiState {
    data object Loading : CardsUiState

    data class Ready(
        val cards: List<TapCard>,
    ) : CardsUiState

    data class Failed(
        val message: String,
    ) : CardsUiState
}
