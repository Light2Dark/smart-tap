package app.smarttap.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import app.smarttap.CardWrite
import app.smarttap.CardsUiState
import app.smarttap.HomePane
import app.smarttap.HomeUiState
import com.clerk.ui.auth.AuthView

@Composable
fun HomeScreen(
    state: HomeUiState,
    onRefresh: () -> Unit,
    onOpenCard: (Long) -> Unit,
    onCloseCard: () -> Unit,
    onShowAdd: () -> Unit,
    onShowEdit: (Long) -> Unit,
    onShowList: () -> Unit,
    onShowTrash: () -> Unit,
    onCreateCard: (String, String) -> Unit,
    onTrashCard: (Long) -> Unit,
    onRestoreCard: (Long) -> Unit,
    onSaveDestination: (Long, String) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (state) {
        HomeUiState.Loading -> {
            Column(
                modifier = modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator()
            }
        }

        HomeUiState.SignedOut -> {
            AuthView(modifier = modifier.fillMaxSize())
        }

        is HomeUiState.SignedIn -> {
            val ready = state.cards as? CardsUiState.Ready
            val openCard = ready?.cards?.firstOrNull { it.id == state.openCardId }
            val editingCard =
                if (state.pane == HomePane.Edit) {
                    ready?.cards?.firstOrNull { it.id == state.editingCardId }
                } else {
                    null
                }
            when {
                openCard != null -> {
                    CardScreen(
                        card = openCard,
                        onClose = onCloseCard,
                        modifier = modifier,
                    )
                }

                state.pane == HomePane.Add -> {
                    AddCardForm(
                        error = state.actionError,
                        saving = state.pending?.kind == CardWrite.Save,
                        onBack = onShowList,
                        onSave = onCreateCard,
                        modifier = modifier,
                    )
                }

                editingCard != null -> {
                    EditCardForm(
                        card = editingCard,
                        error = state.actionError,
                        saving = state.pending?.kind == CardWrite.Save,
                        deleting = state.pending?.kind == CardWrite.Delete,
                        onBack = onShowList,
                        onSave = { onSaveDestination(editingCard.id, it) },
                        onTrash = { onTrashCard(editingCard.id) },
                        modifier = modifier,
                    )
                }

                state.pane == HomePane.Trash -> {
                    TrashList(
                        cards = state.trashed,
                        restoringId =
                            state.pending
                                ?.takeIf { it.kind == CardWrite.Restore }
                                ?.cardId,
                        onBack = onShowList,
                        onRestore = onRestoreCard,
                        modifier = modifier,
                    )
                }

                else -> {
                    CardList(
                        cards = state.cards,
                        refreshing = state.refreshing,
                        refreshError = state.refreshError,
                        onRefresh = onRefresh,
                        onOpenCard = onOpenCard,
                        onShowAdd = onShowAdd,
                        onShowEdit = onShowEdit,
                        onShowTrash = onShowTrash,
                        modifier = modifier,
                    )
                }
            }
        }
    }
}
